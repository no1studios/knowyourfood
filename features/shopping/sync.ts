/**
 * Signed-in shopping checklist cloud sync — push local/pending, pull server,
 * LWW on updatedAt. Guests never hit the network. Failures leave items pending.
 */

import { getAuthPublicConfig } from '@/features/auth/config';
import type { AuthSession } from '@/features/auth/types';
import type { SyncStatus } from '@/lib/api';
import {
  activeShoppingItems,
  type GuestShoppingItem,
  type GuestStoreSnapshot,
} from '@/lib/guest-store';

export type ServerShoppingItem = {
  id: string;
  listId: string;
  ownerUserId: string;
  deviceId: string | null;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ShoppingSyncResult = {
  ok: boolean;
  pushed: number;
  pulled: number;
  skipped: boolean;
  reason?: string;
  error?: string;
  listId?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function apiBase(): string | undefined {
  return getAuthPublicConfig().apiBaseUrl?.replace(/\/$/, '');
}

function canSync(session: AuthSession | null | undefined): {
  ok: boolean;
  reason?: string;
} {
  if (!session || session.isGuest || !session.userId) {
    return { ok: false, reason: 'guest' };
  }
  if (!apiBase()) {
    return { ok: false, reason: 'api_not_configured' };
  }
  if (!session.idToken && !UUID_RE.test(session.userId)) {
    return { ok: false, reason: 'session_incomplete' };
  }
  if (!UUID_RE.test(session.userId)) {
    return { ok: false, reason: 'user_not_persisted' };
  }
  return { ok: true };
}

function authHeaders(session: AuthSession): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = session.idToken || `mock_session_${session.userId}`;
  headers.Authorization = `Bearer ${token}`;
  if (session.userId) {
    headers['X-KYF-User-Id'] = session.userId;
  }
  return headers;
}

function ts(value: string | undefined | null): number {
  if (!value) return 0;
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
}

export function defaultListId(session: AuthSession): string {
  return `list_${session.userId}`;
}

function payloadToGuest(server: ServerShoppingItem): GuestShoppingItem {
  const p = server.payload || {};
  const base = p as Partial<GuestShoppingItem>;
  return {
    id: server.id,
    recipeId: typeof base.recipeId === 'string' ? base.recipeId : undefined,
    name: (typeof base.name === 'string' && base.name) || server.name,
    nameHi: typeof base.nameHi === 'string' ? base.nameHi : undefined,
    qty: typeof base.qty === 'string' ? base.qty : undefined,
    aisle: typeof base.aisle === 'string' ? base.aisle : 'OTHER',
    aisleHi: typeof base.aisleHi === 'string' ? base.aisleHi : undefined,
    recipeTitle: typeof base.recipeTitle === 'string' ? base.recipeTitle : undefined,
    recipeTitleHi:
      typeof base.recipeTitleHi === 'string' ? base.recipeTitleHi : undefined,
    checked: Boolean(base.checked),
    position: typeof base.position === 'number' ? base.position : 0,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    syncStatus: 'synced',
    deletedAt: server.deletedAt,
  };
}

function toUpsertBody(item: GuestShoppingItem, deviceId: string, listId: string) {
  const { syncStatus: _s, ...payload } = item;
  return {
    id: item.id,
    listId,
    name: item.name,
    deviceId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt ?? null,
    payload,
    item: payload,
  };
}

async function fetchServerItems(
  session: AuthSession,
): Promise<{ listId: string; items: ServerShoppingItem[] }> {
  const base = apiBase()!;
  const res = await fetch(`${base}/shopping-lists/items?includeDeleted=1`, {
    method: 'GET',
    headers: authHeaders(session),
  });
  const data = (await res.json().catch(() => ({}))) as {
    listId?: string;
    items?: ServerShoppingItem[];
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || data.error || `list failed (${res.status})`);
  }
  return {
    listId: data.listId || defaultListId(session),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

async function pushItem(
  session: AuthSession,
  item: GuestShoppingItem,
  deviceId: string,
  listId: string,
): Promise<ServerShoppingItem> {
  const base = apiBase()!;
  const res = await fetch(`${base}/shopping-lists/items`, {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(toUpsertBody(item, deviceId, listId)),
  });
  const data = (await res.json().catch(() => ({}))) as {
    item?: ServerShoppingItem;
    error?: string;
    message?: string;
  };
  if (!res.ok || !data.item) {
    throw new Error(data.message || data.error || `push failed (${res.status})`);
  }
  return data.item;
}

/**
 * Merge server rows into local snapshot (LWW on updatedAt).
 */
export function mergeShoppingLww(
  local: GuestShoppingItem[],
  remote: ServerShoppingItem[],
): GuestShoppingItem[] {
  const byId = new Map<string, GuestShoppingItem>();
  for (const item of local) {
    byId.set(item.id, item);
  }

  for (const server of remote) {
    const incoming = payloadToGuest(server);
    const existing = byId.get(server.id);
    if (!existing) {
      byId.set(server.id, incoming);
      continue;
    }
    if (ts(server.updatedAt) >= ts(existing.updatedAt)) {
      byId.set(server.id, {
        ...incoming,
        syncStatus: 'synced',
      });
    } else if (existing.syncStatus === 'synced') {
      byId.set(server.id, { ...existing, syncStatus: 'pending' });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.position - b.position);
}

/**
 * Run a sync pass: pull → merge → push pending/local → mark synced.
 */
export async function syncShoppingWithServer(args: {
  session: AuthSession | null | undefined;
  snapshot: GuestStoreSnapshot;
  applySnapshot: (next: GuestStoreSnapshot) => Promise<GuestStoreSnapshot>;
}): Promise<ShoppingSyncResult> {
  const gate = canSync(args.session);
  if (!gate.ok) {
    return {
      ok: true,
      pushed: 0,
      pulled: 0,
      skipped: true,
      reason: gate.reason,
    };
  }

  const session = args.session!;
  let snap = args.snapshot;

  try {
    const needsPending = snap.shoppingItems.some(
      (i) => !i.deletedAt && (i.syncStatus === 'local' || !i.syncStatus),
    );
    if (needsPending) {
      snap = await args.applySnapshot({
        ...snap,
        shoppingItems: snap.shoppingItems.map((i) =>
          !i.deletedAt && (i.syncStatus === 'local' || !i.syncStatus)
            ? { ...i, syncStatus: 'pending' as SyncStatus }
            : i,
        ),
      });
    }

    const { listId, items: remote } = await fetchServerItems(session);
    const merged = mergeShoppingLww(snap.shoppingItems, remote);
    snap = await args.applySnapshot({ ...snap, shoppingItems: merged });

    let pushed = 0;
    const afterPush: GuestShoppingItem[] = [];

    for (const item of snap.shoppingItems) {
      const status = item.syncStatus || 'local';
      const shouldPush =
        status === 'pending' ||
        status === 'local' ||
        Boolean(item.deletedAt && status !== 'synced');

      if (!shouldPush) {
        afterPush.push(item);
        continue;
      }

      try {
        const server = await pushItem(session, item, snap.deviceId, listId);
        afterPush.push({
          ...payloadToGuest(server),
          ...pickLocalExtras(item),
          syncStatus: 'synced',
          updatedAt: server.updatedAt,
          deletedAt: server.deletedAt,
        });
        pushed += 1;
      } catch (err) {
        console.warn('[shopping-sync] push failed', item.id, err);
        afterPush.push({
          ...item,
          syncStatus: 'pending',
        });
      }
    }

    snap = await args.applySnapshot({
      ...snap,
      shoppingItems: afterPush.sort((a, b) => a.position - b.position),
    });

    return {
      ok: true,
      pushed,
      pulled: remote.length,
      skipped: false,
      listId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sync failed';
    console.warn('[shopping-sync]', message);
    return {
      ok: false,
      pushed: 0,
      pulled: 0,
      skipped: false,
      error: message,
    };
  }
}

function pickLocalExtras(item: GuestShoppingItem): Partial<GuestShoppingItem> {
  return {
    nameHi: item.nameHi,
    qty: item.qty,
    aisle: item.aisle,
    aisleHi: item.aisleHi,
    recipeId: item.recipeId,
    recipeTitle: item.recipeTitle,
    recipeTitleHi: item.recipeTitleHi,
    checked: item.checked,
    position: item.position,
  };
}

export function unsyncedShoppingCount(snap: GuestStoreSnapshot): number {
  return activeShoppingItems(snap).filter((i) => i.syncStatus !== 'synced').length;
}

export function allShoppingSynced(snap: GuestStoreSnapshot): boolean {
  const active = activeShoppingItems(snap);
  if (active.length === 0) return true;
  return active.every((i) => i.syncStatus === 'synced');
}
