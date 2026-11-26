/**
 * GET    /api/shopping-lists/items/[id]
 * PATCH  /api/shopping-lists/items/[id] — update (LWW on updated_at)
 * DELETE /api/shopping-lists/items/[id] — soft-delete
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { AuthHttpError, jsonError } from '@/lib/mock-auth';
import {
  getItemForUser,
  softDeleteItemForUser,
  upsertItemForUser,
  type ShoppingPayload,
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
    const item = await getItemForUser(user.userId, id);
    if (!item || item.deletedAt) {
      throw new AuthHttpError(404, 'not_found', 'Shopping item not found');
    }
    return withCors(request, Response.json({ item }));
  } catch (err) {
    return jsonError(err, request);
  }
}

type PatchBody = {
  name?: string;
  listId?: string;
  payload?: ShoppingPayload;
  deviceId?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
  item?: ShoppingPayload & {
    name?: string;
    listId?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as PatchBody;

    const existing = await getItemForUser(user.userId, id);
    if (!existing) {
      throw new AuthHttpError(404, 'not_found', 'Shopping item not found');
    }

    const fromItem = body.item;
    const name =
      (body.name ?? fromItem?.name)?.toString().trim() || existing.name;
    const listId =
      (body.listId ?? fromItem?.listId)?.toString().trim() || existing.listId;
    const payload: ShoppingPayload =
      body.payload ??
      (fromItem ? stripSyncFields(fromItem) : existing.payload);

    const { row, conflict } = await upsertItemForUser(user.userId, {
      id,
      listId,
      name,
      payload,
      deviceId: body.deviceId !== undefined ? body.deviceId : existing.deviceId,
      createdAt: existing.createdAt,
      updatedAt:
        body.updatedAt ??
        (typeof fromItem?.updatedAt === 'string'
          ? fromItem.updatedAt
          : new Date().toISOString()),
      deletedAt:
        body.deletedAt !== undefined
          ? body.deletedAt
          : typeof fromItem?.deletedAt === 'string'
            ? fromItem.deletedAt
            : fromItem?.deletedAt === null
              ? null
              : existing.deletedAt,
    });

    return withCors(request, Response.json({ item: row, conflict }));
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
    const item = await softDeleteItemForUser(
      user.userId,
      id,
      updatedAt ?? undefined,
    );
    return withCors(request, Response.json({ item, deleted: true }));
  } catch (err) {
    return jsonError(err, request);
  }
}

function stripSyncFields(item: ShoppingPayload): ShoppingPayload {
  const next = { ...item };
  delete next.syncStatus;
  return next;
}
