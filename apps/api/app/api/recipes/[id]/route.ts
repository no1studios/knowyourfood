/**
 * GET    /api/recipes/[id]
 * PATCH  /api/recipes/[id] — update (LWW on updated_at)
 * DELETE /api/recipes/[id] — soft-delete
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { AuthHttpError, jsonError } from '@/lib/mock-auth';
import {
  getRecipeForUser,
  softDeleteRecipeForUser,
  upsertRecipeForUser,
  type RecipePayload,
  type RecipeVisibility,
} from '@/lib/recipes';
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const recipe = await getRecipeForUser(user.userId, id);
    if (!recipe || recipe.deletedAt) {
      throw new AuthHttpError(404, 'not_found', 'Recipe not found');
    }
    return withCors(request, Response.json({ recipe }));
  } catch (err) {
    return jsonError(err, request);
  }
}

type PatchBody = {
  title?: string;
  payload?: RecipePayload;
  deviceId?: string | null;
  visibility?: RecipeVisibility;
  importSource?: string | null;
  importRef?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
  recipe?: RecipePayload & {
    title?: string;
    importSource?: string;
    importRef?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as PatchBody;

    const existing = await getRecipeForUser(user.userId, id);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Recipe not found');
    }

    const fromRecipe = body.recipe;
    const title =
      (body.title ?? fromRecipe?.title)?.toString().trim() || existing.title;
    const payload: RecipePayload =
      body.payload ??
      (fromRecipe ? stripSyncFields(fromRecipe) : existing.payload);

    const { row, conflict } = await upsertRecipeForUser(user.userId, {
      id,
      title,
      payload,
      deviceId: body.deviceId !== undefined ? body.deviceId : existing.deviceId,
      visibility: body.visibility ?? existing.visibility,
      importSource:
        body.importSource !== undefined
          ? body.importSource
          : typeof fromRecipe?.importSource === 'string'
            ? fromRecipe.importSource
            : existing.importSource,
      importRef:
        body.importRef !== undefined
          ? body.importRef
          : typeof fromRecipe?.importRef === 'string'
            ? fromRecipe.importRef
            : existing.importRef,
      createdAt: existing.createdAt,
      updatedAt:
        body.updatedAt ??
        (typeof fromRecipe?.updatedAt === 'string'
          ? fromRecipe.updatedAt
          : new Date().toISOString()),
      deletedAt:
        body.deletedAt !== undefined
          ? body.deletedAt
          : typeof fromRecipe?.deletedAt === 'string'
            ? fromRecipe.deletedAt
            : fromRecipe?.deletedAt === null
              ? null
              : existing.deletedAt,
    });

    return withCors(request, Response.json({ recipe: row, conflict }));
  } catch (err) {
    return jsonError(err, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const url = new URL(request.url);
    const updatedAt = url.searchParams.get('updatedAt') ?? undefined;
    const recipe = await softDeleteRecipeForUser(user.userId, id, updatedAt ?? undefined);
    return withCors(request, Response.json({ recipe, deleted: true }));
  } catch (err) {
    return jsonError(err, request);
  }
}

function stripSyncFields(recipe: RecipePayload): RecipePayload {
  const next = { ...recipe };
  delete next.syncStatus;
  return next;
}
