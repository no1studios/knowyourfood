/**
 * Recipe CRUD against Neon — scoped to owner_user_id.
 * Payload is the full client recipe JSON (GuestRecipe shape minus syncStatus).
 * Conflict resolution: last-write-wins on updated_at.
 */

import { ensureAuthSchema, getSql, type Sql, withDbRetry } from './db';
import { AuthHttpError } from './mock-auth';

export type RecipeVisibility = 'private' | 'link_shared';

export type RecipePayload = Record<string, unknown>;

export type RecipeRow = {
  id: string;
  ownerUserId: string;
  deviceId: string | null;
  title: string;
  payload: RecipePayload;
  visibility: RecipeVisibility;
  importSource: string | null;
  importRef: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type DbRecipe = {
  id: string;
  owner_user_id: string;
  device_id: string | null;
  title: string;
  payload: RecipePayload;
  visibility: string;
  import_source: string | null;
  import_ref: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

let recipesSchemaReady: Promise<void> | null = null;

export async function ensureRecipesSchema(sql: Sql = getSql()!): Promise<void> {
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }
  if (!recipesSchemaReady) {
    recipesSchemaReady = (async () => {
      await ensureAuthSchema(sql);
      await sql`
        CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          device_id TEXT,
          title TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          visibility TEXT NOT NULL DEFAULT 'private'
            CHECK (visibility IN ('private', 'link_shared')),
          import_source TEXT,
          import_ref TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS recipes_owner_updated_idx
          ON recipes (owner_user_id, updated_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS recipes_owner_active_idx
          ON recipes (owner_user_id)
          WHERE deleted_at IS NULL
      `;
    })().catch((err) => {
      recipesSchemaReady = null;
      throw err;
    });
  }
  await recipesSchemaReady;
}

/** Reset schema cache (tests / hot reload). */
export function resetRecipesSchemaCache(): void {
  recipesSchemaReady = null;
}

function mapRow(row: DbRecipe): RecipeRow {
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? row.payload
      : {};
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    deviceId: row.device_id,
    title: row.title,
    payload,
    visibility: (row.visibility === 'link_shared' ? 'link_shared' : 'private') as RecipeVisibility,
    importSource: row.import_source,
    importRef: row.import_ref,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: row.deleted_at ? toIso(row.deleted_at) : null,
  };
}

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function parseIso(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

export type RecipeUpsertInput = {
  id: string;
  title: string;
  payload?: RecipePayload;
  deviceId?: string | null;
  visibility?: RecipeVisibility;
  importSource?: string | null;
  importRef?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export async function listRecipesForUser(
  userId: string,
  opts: { includeDeleted?: boolean } = {},
): Promise<RecipeRow[]> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureRecipesSchema(sql);
    const rows = opts.includeDeleted
      ? ((await sql`
          SELECT
            id, owner_user_id, device_id, title, payload, visibility,
            import_source, import_ref, created_at, updated_at, deleted_at
          FROM recipes
          WHERE owner_user_id = ${userId}::uuid
          ORDER BY updated_at DESC
        `) as DbRecipe[])
      : ((await sql`
          SELECT
            id, owner_user_id, device_id, title, payload, visibility,
            import_source, import_ref, created_at, updated_at, deleted_at
          FROM recipes
          WHERE owner_user_id = ${userId}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC
        `) as DbRecipe[]);
    return rows.map(mapRow);
  });
}

export async function getRecipeForUser(
  userId: string,
  recipeId: string,
): Promise<RecipeRow | null> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureRecipesSchema(sql);
    const rows = (await sql`
      SELECT
        id, owner_user_id, device_id, title, payload, visibility,
        import_source, import_ref, created_at, updated_at, deleted_at
      FROM recipes
      WHERE id = ${recipeId}
        AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `) as DbRecipe[];
    return rows[0] ? mapRow(rows[0]) : null;
  });
}

/**
 * Insert or LWW-update a recipe owned by userId.
 * Returns `{ row, conflict }` — conflict true when server kept a newer row.
 */
export async function upsertRecipeForUser(
  userId: string,
  input: RecipeUpsertInput,
): Promise<{ row: RecipeRow; conflict: boolean }> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  const id = input.id?.trim();
  const title = input.title?.trim();
  if (!id) {
    throw new AuthHttpError(400, 'invalid_recipe', 'id is required');
  }
  if (!title) {
    throw new AuthHttpError(400, 'invalid_recipe', 'title is required');
  }

  const now = new Date().toISOString();
  const createdAt = parseIso(input.createdAt, now);
  const updatedAt = parseIso(input.updatedAt, now);
  const visibility: RecipeVisibility =
    input.visibility === 'link_shared' ? 'link_shared' : 'private';
  const payload = input.payload && typeof input.payload === 'object' ? input.payload : {};
  const payloadJson = JSON.stringify(payload);
  const deletedAt = input.deletedAt ? parseIso(input.deletedAt, now) : null;

  return withDbRetry(async () => {
    await ensureRecipesSchema(sql);

    const existing = (await sql`
      SELECT
        id, owner_user_id, device_id, title, payload, visibility,
        import_source, import_ref, created_at, updated_at, deleted_at
      FROM recipes
      WHERE id = ${id}
      LIMIT 1
    `) as DbRecipe[];

    if (existing[0]) {
      const current = mapRow(existing[0]);
      if (current.ownerUserId !== userId) {
        throw new AuthHttpError(403, 'forbidden', 'Recipe belongs to another user');
      }
      // LWW: keep server row when it is strictly newer.
      if (new Date(current.updatedAt).getTime() > new Date(updatedAt).getTime()) {
        return { row: current, conflict: true };
      }

      const updated = (await sql`
        UPDATE recipes SET
          device_id = ${input.deviceId ?? current.deviceId},
          title = ${title},
          payload = ${payloadJson}::jsonb,
          visibility = ${visibility},
          import_source = ${input.importSource ?? null},
          import_ref = ${input.importRef ?? null},
          updated_at = ${updatedAt}::timestamptz,
          deleted_at = ${deletedAt}::timestamptz
        WHERE id = ${id}
          AND owner_user_id = ${userId}::uuid
        RETURNING
          id, owner_user_id, device_id, title, payload, visibility,
          import_source, import_ref, created_at, updated_at, deleted_at
      `) as DbRecipe[];

      if (!updated[0]) {
        throw new AuthHttpError(500, 'update_failed', 'Failed to update recipe');
      }
      return { row: mapRow(updated[0]), conflict: false };
    }

    const inserted = (await sql`
      INSERT INTO recipes (
        id, owner_user_id, device_id, title, payload, visibility,
        import_source, import_ref, created_at, updated_at, deleted_at
      )
      VALUES (
        ${id},
        ${userId}::uuid,
        ${input.deviceId ?? null},
        ${title},
        ${payloadJson}::jsonb,
        ${visibility},
        ${input.importSource ?? null},
        ${input.importRef ?? null},
        ${createdAt}::timestamptz,
        ${updatedAt}::timestamptz,
        ${deletedAt}::timestamptz
      )
      RETURNING
        id, owner_user_id, device_id, title, payload, visibility,
        import_source, import_ref, created_at, updated_at, deleted_at
    `) as DbRecipe[];

    if (!inserted[0]) {
      throw new AuthHttpError(500, 'create_failed', 'Failed to create recipe');
    }
    return { row: mapRow(inserted[0]), conflict: false };
  });
}

/** Soft-delete with LWW on updated_at. */
export async function softDeleteRecipeForUser(
  userId: string,
  recipeId: string,
  updatedAt?: string,
): Promise<RecipeRow> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  const now = new Date().toISOString();
  const stamp = parseIso(updatedAt, now);

  return withDbRetry(async () => {
    await ensureRecipesSchema(sql);
    const existing = await getRecipeForUser(userId, recipeId);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Recipe not found');
    }
    if (
      existing.deletedAt &&
      new Date(existing.updatedAt).getTime() >= new Date(stamp).getTime()
    ) {
      return existing;
    }
    if (new Date(existing.updatedAt).getTime() > new Date(stamp).getTime()) {
      return existing;
    }

    const updated = (await sql`
      UPDATE recipes SET
        deleted_at = ${stamp}::timestamptz,
        updated_at = ${stamp}::timestamptz
      WHERE id = ${recipeId}
        AND owner_user_id = ${userId}::uuid
      RETURNING
        id, owner_user_id, device_id, title, payload, visibility,
        import_source, import_ref, created_at, updated_at, deleted_at
    `) as DbRecipe[];

    if (!updated[0]) {
      throw new AuthHttpError(500, 'delete_failed', 'Failed to delete recipe');
    }
    return mapRow(updated[0]);
  });
}
