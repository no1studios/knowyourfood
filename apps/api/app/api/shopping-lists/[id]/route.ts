/**
 * GET    /api/shopping-lists/[id]
 * PATCH  /api/shopping-lists/[id] — update (LWW on updated_at)
 * DELETE /api/shopping-lists/[id] — soft-delete
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { AuthHttpError, jsonError } from '@/lib/mock-auth';
import {
  getListForUser,
  softDeleteListForUser,
  upsertListForUser,
} from '@/lib/shopping';
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
    if (id === 'items') {
      // Reserved for /shopping-lists/items — should not hit this dynamic route.
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
    }
    const list = await getListForUser(user.userId, id);
    if (!list || list.deletedAt) {
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
    }
    return withCors(request, Response.json({ list }));
  } catch (err) {
    return jsonError(err, request);
  }
}

type PatchBody = {
  title?: string;
  deviceId?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (id === 'items') {
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
    }
    const body = (await request.json().catch(() => ({}))) as PatchBody;

    const existing = await getListForUser(user.userId, id);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
    }

    const { row, conflict } = await upsertListForUser(user.userId, {
      id,
      title: body.title ?? existing.title,
      deviceId: body.deviceId !== undefined ? body.deviceId : existing.deviceId,
      createdAt: existing.createdAt,
      updatedAt: body.updatedAt ?? new Date().toISOString(),
      deletedAt:
        body.deletedAt !== undefined ? body.deletedAt : existing.deletedAt,
    });

    return withCors(request, Response.json({ list: row, conflict }));
  } catch (err) {
    return jsonError(err, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (id === 'items') {
      throw new AuthHttpError(404, 'not_found', 'Shopping list not found');
    }
    const url = new URL(request.url);
    const updatedAt = url.searchParams.get('updatedAt') ?? undefined;
    const list = await softDeleteListForUser(
      user.userId,
      id,
      updatedAt ?? undefined,
    );
    return withCors(request, Response.json({ list, deleted: true }));
  } catch (err) {
    return jsonError(err, request);
  }
}
