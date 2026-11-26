/**
 * GET  /api/recipes — list recipes for the signed-in user
 * POST /api/recipes — create / upsert recipe (LWW on updated_at)
 *
 * Auth: Authorization Bearer + (mock) X-KYF-User-Id — see lib/session.ts
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { jsonError } from '@/lib/mock-auth';
import {
  listRecipesForUser,
  upsertRecipeForUser,
  type RecipePayload,
  type RecipeVisibility,
} from '@/lib/recipes';
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const includeDeleted =
      url.searchParams.get('includeDeleted') === '1' ||
      url.searchParams.get('includeDeleted') === 'true';

    const recipes = await listRecipesForUser(user.userId, { includeDeleted });
    return withCors(
      request,
      Response.json({
        recipes,
        count: recipes.length,
      }),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}

type PostBody = {
  id?: string;
  title?: string;
  payload?: RecipePayload;
  deviceId?: string | null;
  visibility?: RecipeVisibility;
  importSource?: string | null;
  importRef?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  /** Full client recipe object — used when payload omitted. */
  recipe?: RecipePayload & {
    id?: string;
    title?: string;
    importSource?: string;
    importRef?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
};

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as PostBody;

    const fromRecipe = body.recipe;
    const id = (body.id ?? fromRecipe?.id)?.toString().trim();
    const title = (body.title ?? fromRecipe?.title)?.toString().trim();

    const payload: RecipePayload =
      body.payload ??
      (fromRecipe
        ? stripSyncFields(fromRecipe)
        : {});

    const { row, conflict } = await upsertRecipeForUser(user.userId, {
      id: id ?? '',
      title: title ?? '',
      payload,
      deviceId: body.deviceId,
      visibility: body.visibility,
      importSource:
        body.importSource ??
        (typeof fromRecipe?.importSource === 'string'
          ? fromRecipe.importSource
          : null),
      importRef:
        body.importRef ??
        (typeof fromRecipe?.importRef === 'string' ? fromRecipe.importRef : null),
      createdAt:
        body.createdAt ??
        (typeof fromRecipe?.createdAt === 'string' ? fromRecipe.createdAt : undefined),
      updatedAt:
        body.updatedAt ??
        (typeof fromRecipe?.updatedAt === 'string' ? fromRecipe.updatedAt : undefined),
      deletedAt:
        body.deletedAt !== undefined
          ? body.deletedAt
          : typeof fromRecipe?.deletedAt === 'string'
            ? fromRecipe.deletedAt
            : fromRecipe?.deletedAt === null
              ? null
              : undefined,
    });

    return withCors(
      request,
      Response.json(
        { recipe: row, conflict },
        { status: conflict ? 200 : 201 },
      ),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}

function stripSyncFields(recipe: RecipePayload): RecipePayload {
  const next = { ...recipe };
  delete next.syncStatus;
  return next;
}
