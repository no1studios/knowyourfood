/**
 * GET  /api/shopping-lists — list shopping lists (ensures default list)
 * POST /api/shopping-lists — create / upsert list (LWW on updated_at)
 *
 * Auth: Authorization Bearer + (mock) X-KYF-User-Id — see lib/session.ts
 */

import { corsPreflight, withCors } from '@/lib/cors';
import { jsonError } from '@/lib/mock-auth';
import {
  ensureDefaultListForUser,
  listListsForUser,
  upsertListForUser,
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
    const ensureDefault =
      url.searchParams.get('ensureDefault') !== '0' &&
      url.searchParams.get('ensureDefault') !== 'false';

    if (ensureDefault && !includeDeleted) {
      await ensureDefaultListForUser(user.userId);
    }

    const lists = await listListsForUser(user.userId, { includeDeleted });
    return withCors(
      request,
      Response.json({
        lists,
        count: lists.length,
        defaultListId: lists[0]?.id ?? `list_${user.userId}`,
      }),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}

type PostBody = {
  id?: string;
  title?: string;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as PostBody;

    const id = (body.id ?? `list_${user.userId}`).toString().trim();
    const { row, conflict } = await upsertListForUser(user.userId, {
      id,
      title: body.title,
      deviceId: body.deviceId,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
      deletedAt: body.deletedAt,
    });

    return withCors(
      request,
      Response.json({ list: row, conflict }, { status: conflict ? 200 : 201 }),
    );
  } catch (err) {
    return jsonError(err, request);
  }
}
