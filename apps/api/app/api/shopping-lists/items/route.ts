/**
 * GET  /api/shopping-lists/items — list checklist items for the signed-in user
 * POST /api/shopping-lists/items — create / upsert item (LWW on updated_at)
 *
 * Items attach to the user's default list (`list_<userId>`) unless listId is set.
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { jsonError } from '@/lib/mock-auth';
import {
  defaultListIdForUser,
  ensureDefaultListForUser,
  listItemsForUser,
  upsertItemForUser,
  type ShoppingPayload,
} from '@/lib/shopping';
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
    const listIdParam = url.searchParams.get('listId')?.trim() || undefined;

    const list = await ensureDefaultListForUser(user.userId);
    const listId = listIdParam || list.id;

    const items = await listItemsForUser(user.userId, {
      listId,
      includeDeleted,
    });

    return withCors(
      request,
      Response.json({
        listId,
        items,
        count: items.length,
      }),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}

type PostBody = {
  id?: string;
  listId?: string;
  name?: string;
  payload?: ShoppingPayload;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  /** Full client item object — used when payload omitted. */
  item?: ShoppingPayload & {
    id?: string;
    name?: string;
    listId?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
};

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as PostBody;

    const fromItem = body.item;
    const id = (body.id ?? fromItem?.id)?.toString().trim();
    const name = (body.name ?? fromItem?.name)?.toString().trim();
    const listId =
      (body.listId ?? fromItem?.listId)?.toString().trim() ||
      defaultListIdForUser(user.userId);

    await ensureDefaultListForUser(user.userId);

    const payload: ShoppingPayload =
      body.payload ?? (fromItem ? stripSyncFields(fromItem) : {});

    const { row, conflict } = await upsertItemForUser(user.userId, {
      id: id ?? '',
      listId,
      name: name ?? '',
      payload,
      deviceId: body.deviceId,
      createdAt:
        body.createdAt ??
        (typeof fromItem?.createdAt === 'string' ? fromItem.createdAt : undefined),
      updatedAt:
        body.updatedAt ??
        (typeof fromItem?.updatedAt === 'string' ? fromItem.updatedAt : undefined),
      deletedAt:
        body.deletedAt !== undefined
          ? body.deletedAt
          : typeof fromItem?.deletedAt === 'string'
            ? fromItem.deletedAt
            : fromItem?.deletedAt === null
              ? null
              : undefined,
    });

    return withCors(
      request,
      Response.json({ item: row, conflict }, { status: conflict ? 200 : 201 }),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}

function stripSyncFields(item: ShoppingPayload): ShoppingPayload {
  const next = { ...item };
  delete next.syncStatus;
  return next;
}
