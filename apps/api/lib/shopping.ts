/**
 * Shopping list + items CRUD against Neon — scoped to owner_user_id.
 * Items carry a JSONB payload (GuestShoppingItem shape minus syncStatus).
 * Conflict resolution: last-write-wins on updated_at (per item).
 */

import { ensureAuthSchema, getSql, type Sql, withDbRetry } from './db';
import { AuthHttpError } from './mock-auth';

export type ShoppingPayload = Record<string, unknown>;

export type ShoppingListRow = {
  id: string;
  ownerUserId: string;
  deviceId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ShoppingItemRow = {
  id: string;
  listId: string;
  ownerUserId: string;
  deviceId: string | null;
  name: string;
  payload: ShoppingPayload;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type DbList = {
  id: string;
  owner_user_id: string;
  device_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type DbItem = {
  id: string;
  list_id: string;
  owner_user_id: string;
  device_id: string | null;
  name: string;
  payload: ShoppingPayload;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

let shoppingSchemaReady: Promise<void> | null = null;

/** Deterministic default list id for a Neon user (unique globally). */
export function defaultListIdForUser(userId: string): string {
  return `list_${userId}`;
}

export async function ensureShoppingSchema(sql: Sql = getSql()!): Promise<void> {
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }
  if (!shoppingSchemaReady) {
    shoppingSchemaReady = (async () => {
      await ensureAuthSchema(sql);
      await sql`
        CREATE TABLE IF NOT EXISTS shopping_lists (
          id TEXT PRIMARY KEY,
          owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          device_id TEXT,
          title TEXT NOT NULL DEFAULT 'Shopping',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS shopping_lists_owner_updated_idx
          ON shopping_lists (owner_user_id, updated_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS shopping_items (
          id TEXT PRIMARY KEY,
          list_id TEXT NOT NULL REFERENCES shopping_lists (id) ON DELETE CASCADE,
          owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          device_id TEXT,
          name TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS shopping_items_owner_updated_idx
          ON shopping_items (owner_user_id, updated_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS shopping_items_list_active_idx
          ON shopping_items (list_id)
          WHERE deleted_at IS NULL
      `;
    })().catch((err) => {
      shoppingSchemaReady = null;
      throw err;
    });
  }
  await shoppingSchemaReady;
}

/** Reset schema cache (tests / hot reload). */
export function resetShoppingSchemaCache(): void {
  shoppingSchemaReady = null;
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

function mapList(row: DbList): ShoppingListRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    deviceId: row.device_id,
    title: row.title,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: row.deleted_at ? toIso(row.deleted_at) : null,
  };
}

function mapItem(row: DbItem): ShoppingItemRow {
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? row.payload
      : {};
  return {
    id: row.id,
    listId: row.list_id,
    ownerUserId: row.owner_user_id,
    deviceId: row.device_id,
    name: row.name,
    payload,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: row.deleted_at ? toIso(row.deleted_at) : null,
  };
}

export type ShoppingListUpsertInput = {
  id: string;
  title?: string;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ShoppingItemUpsertInput = {
  id: string;
  listId: string;
  name: string;
  payload?: ShoppingPayload;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

/** Ensure the user's default shopping list exists; return it. */
export async function ensureDefaultListForUser(
  userId: string,
  opts: { deviceId?: string | null; title?: string } = {},
): Promise<ShoppingListRow> {
  const id = defaultListIdForUser(userId);
  const existing = await getListForUser(userId, id);
  if (existing && !existing.deletedAt) return existing;
  const { row } = await upsertListForUser(userId, {
    id,
    title: opts.title || 'Shopping',
    deviceId: opts.deviceId ?? null,
    updatedAt: new Date().toISOString(),
  });
  return row;
}

export async function listListsForUser(
  userId: string,
  opts: { includeDeleted?: boolean } = {},
): Promise<ShoppingListRow[]> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);
    const rows = opts.includeDeleted
      ? ((await sql`
          SELECT id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
          FROM shopping_lists
          WHERE owner_user_id = ${userId}::uuid
          ORDER BY updated_at DESC
        `) as DbList[])
      : ((await sql`
          SELECT id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
          FROM shopping_lists
          WHERE owner_user_id = ${userId}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC
        `) as DbList[]);
    return rows.map(mapList);
  });
}

export async function getListForUser(
  userId: string,
  listId: string,
): Promise<ShoppingListRow | null> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);
    const rows = (await sql`
      SELECT id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
      FROM shopping_lists
      WHERE id = ${listId}
        AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `) as DbList[];
    return rows[0] ? mapList(rows[0]) : null;
  });
}

export async function upsertListForUser(
  userId: string,
  input: ShoppingListUpsertInput,
): Promise<{ row: ShoppingListRow; conflict: boolean }> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  const id = input.id?.trim();
  if (!id) {
    throw new AuthHttpError(400, 'invalid_list', 'id is required');
  }
  const title = (input.title?.trim() || 'Shopping').slice(0, 200);
  const now = new Date().toISOString();
  const createdAt = parseIso(input.createdAt, now);
  const updatedAt = parseIso(input.updatedAt, now);
  const deletedAt = input.deletedAt ? parseIso(input.deletedAt, now) : null;

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);

    const existing = (await sql`
      SELECT id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
      FROM shopping_lists
      WHERE id = ${id}
      LIMIT 1
    `) as DbList[];

    if (existing[0]) {
      const current = mapList(existing[0]);
      if (current.ownerUserId !== userId) {
        throw new AuthHttpError(403, 'forbidden', 'List belongs to another user');
      }
      if (new Date(current.updatedAt).getTime() > new Date(updatedAt).getTime()) {
        return { row: current, conflict: true };
      }

      const updated = (await sql`
        UPDATE shopping_lists SET
          device_id = ${input.deviceId ?? current.deviceId},
          title = ${title},
          updated_at = ${updatedAt}::timestamptz,
          deleted_at = ${deletedAt}::timestamptz
        WHERE id = ${id}
          AND owner_user_id = ${userId}::uuid
        RETURNING id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
      `) as DbList[];

      if (!updated[0]) {
        throw new AuthHttpError(500, 'update_failed', 'Failed to update list');
      }
      return { row: mapList(updated[0]), conflict: false };
    }

    const inserted = (await sql`
      INSERT INTO shopping_lists (
        id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
      )
      VALUES (
        ${id},
        ${userId}::uuid,
        ${input.deviceId ?? null},
        ${title},
        ${createdAt}::timestamptz,
        ${updatedAt}::timestamptz,
        ${deletedAt}::timestamptz
      )
      RETURNING id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
    `) as DbList[];

    if (!inserted[0]) {
      throw new AuthHttpError(500, 'create_failed', 'Failed to create list');
    }
    return { row: mapList(inserted[0]), conflict: false };
  });
}

export async function softDeleteListForUser(
  userId: string,
  listId: string,
  updatedAt?: string,
): Promise<ShoppingListRow> {
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
    await ensureShoppingSchema(sql);
    const existing = await getListForUser(userId, listId);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
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
      UPDATE shopping_lists SET
        deleted_at = ${stamp}::timestamptz,
        updated_at = ${stamp}::timestamptz
      WHERE id = ${listId}
        AND owner_user_id = ${userId}::uuid
      RETURNING id, owner_user_id, device_id, title, created_at, updated_at, deleted_at
    `) as DbList[];

    if (!updated[0]) {
      throw new AuthHttpError(500, 'delete_failed', 'Failed to delete list');
    }
    return mapList(updated[0]);
  });
}

export async function listItemsForUser(
  userId: string,
  opts: { listId?: string; includeDeleted?: boolean } = {},
): Promise<ShoppingItemRow[]> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);
    const listId = opts.listId;
    if (listId) {
      const rows = opts.includeDeleted
        ? ((await sql`
            SELECT
              id, list_id, owner_user_id, device_id, name, payload,
              created_at, updated_at, deleted_at
            FROM shopping_items
            WHERE owner_user_id = ${userId}::uuid
              AND list_id = ${listId}
            ORDER BY updated_at DESC
          `) as DbItem[])
        : ((await sql`
            SELECT
              id, list_id, owner_user_id, device_id, name, payload,
              created_at, updated_at, deleted_at
            FROM shopping_items
            WHERE owner_user_id = ${userId}::uuid
              AND list_id = ${listId}
              AND deleted_at IS NULL
            ORDER BY updated_at DESC
          `) as DbItem[]);
      return rows.map(mapItem);
    }

    const rows = opts.includeDeleted
      ? ((await sql`
          SELECT
            id, list_id, owner_user_id, device_id, name, payload,
            created_at, updated_at, deleted_at
          FROM shopping_items
          WHERE owner_user_id = ${userId}::uuid
          ORDER BY updated_at DESC
        `) as DbItem[])
      : ((await sql`
          SELECT
            id, list_id, owner_user_id, device_id, name, payload,
            created_at, updated_at, deleted_at
          FROM shopping_items
          WHERE owner_user_id = ${userId}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC
        `) as DbItem[]);
    return rows.map(mapItem);
  });
}

export async function getItemForUser(
  userId: string,
  itemId: string,
): Promise<ShoppingItemRow | null> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);
    const rows = (await sql`
      SELECT
        id, list_id, owner_user_id, device_id, name, payload,
        created_at, updated_at, deleted_at
      FROM shopping_items
      WHERE id = ${itemId}
        AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `) as DbItem[];
    return rows[0] ? mapItem(rows[0]) : null;
  });
}

/**
 * Insert or LWW-update a shopping item. Ensures the parent list exists
 * (creates the default list when listId matches the user's default).
 */
export async function upsertItemForUser(
  userId: string,
  input: ShoppingItemUpsertInput,
): Promise<{ row: ShoppingItemRow; conflict: boolean }> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  const id = input.id?.trim();
  const name = input.name?.trim();
  const listId = input.listId?.trim();
  if (!id) {
    throw new AuthHttpError(400, 'invalid_item', 'id is required');
  }
  if (!name) {
    throw new AuthHttpError(400, 'invalid_item', 'name is required');
  }
  if (!listId) {
    throw new AuthHttpError(400, 'invalid_item', 'listId is required');
  }

  const now = new Date().toISOString();
  const createdAt = parseIso(input.createdAt, now);
  const updatedAt = parseIso(input.updatedAt, now);
  const payload =
    input.payload && typeof input.payload === 'object' ? input.payload : {};
  const payloadJson = JSON.stringify(payload);
  const deletedAt = input.deletedAt ? parseIso(input.deletedAt, now) : null;

  return withDbRetry(async () => {
    await ensureShoppingSchema(sql);

    let list = await getListForUser(userId, listId);
    if (!list) {
      // Auto-create when targeting the deterministic default, or when first item lands.
      if (listId === defaultListIdForUser(userId) || listId.startsWith('list_')) {
        const created = await upsertListForUser(userId, {
          id: listId,
          title: 'Shopping',
          deviceId: input.deviceId ?? null,
          updatedAt: now,
        });
        list = created.row;
      } else {
        throw new AuthHttpError(404, 'list_not_found', 'Shopping list not found');
      }
    }
    if (list.ownerUserId !== userId) {
      throw new AuthHttpError(403, 'forbidden', 'List belongs to another user');
    }

    const existing = (await sql`
      SELECT
        id, list_id, owner_user_id, device_id, name, payload,
        created_at, updated_at, deleted_at
      FROM shopping_items
      WHERE id = ${id}
      LIMIT 1
    `) as DbItem[];

    if (existing[0]) {
      const current = mapItem(existing[0]);
      if (current.ownerUserId !== userId) {
        throw new AuthHttpError(403, 'forbidden', 'Item belongs to another user');
      }
      if (new Date(current.updatedAt).getTime() > new Date(updatedAt).getTime()) {
        return { row: current, conflict: true };
      }

      const updated = (await sql`
        UPDATE shopping_items SET
          list_id = ${listId},
          device_id = ${input.deviceId ?? current.deviceId},
          name = ${name},
          payload = ${payloadJson}::jsonb,
          updated_at = ${updatedAt}::timestamptz,
          deleted_at = ${deletedAt}::timestamptz
        WHERE id = ${id}
          AND owner_user_id = ${userId}::uuid
        RETURNING
          id, list_id, owner_user_id, device_id, name, payload,
          created_at, updated_at, deleted_at
      `) as DbItem[];

      if (!updated[0]) {
        throw new AuthHttpError(500, 'update_failed', 'Failed to update item');
      }
      return { row: mapItem(updated[0]), conflict: false };
    }

    const inserted = (await sql`
      INSERT INTO shopping_items (
        id, list_id, owner_user_id, device_id, name, payload,
        created_at, updated_at, deleted_at
      )
      VALUES (
        ${id},
        ${listId},
        ${userId}::uuid,
        ${input.deviceId ?? null},
        ${name},
        ${payloadJson}::jsonb,
        ${createdAt}::timestamptz,
        ${updatedAt}::timestamptz,
        ${deletedAt}::timestamptz
      )
      RETURNING
        id, list_id, owner_user_id, device_id, name, payload,
        created_at, updated_at, deleted_at
    `) as DbItem[];

    if (!inserted[0]) {
      throw new AuthHttpError(500, 'create_failed', 'Failed to create item');
    }
    return { row: mapItem(inserted[0]), conflict: false };
  });
}

/** Soft-delete with LWW on updated_at. */
export async function softDeleteItemForUser(
  userId: string,
  itemId: string,
  updatedAt?: string,
): Promise<ShoppingItemRow> {
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
    await ensureShoppingSchema(sql);
    const existing = await getItemForUser(userId, itemId);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Shopping item not found');
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
      UPDATE shopping_items SET
        deleted_at = ${stamp}::timestamptz,
        updated_at = ${stamp}::timestamptz
      WHERE id = ${itemId}
        AND owner_user_id = ${userId}::uuid
      RETURNING
        id, list_id, owner_user_id, device_id, name, payload,
        created_at, updated_at, deleted_at
    `) as DbItem[];

    if (!updated[0]) {
      throw new AuthHttpError(500, 'delete_failed', 'Failed to delete item');
    }
    return mapItem(updated[0]);
  });
}
