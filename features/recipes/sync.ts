/**
 * Signed-in recipe cloud sync — push local/pending, pull server, LWW on updatedAt.
 * Guests never hit the network. Failures leave recipes as pending (local-first).
 */

import { getAuthPublicConfig } from '@/features/auth/config';
import type { AuthSession } from '@/features/auth/types';
import type { SyncStatus } from '@/lib/api';
import {
  activeRecipes,
  type GuestRecipe,
  type GuestStoreSnapshot,
} from '@/lib/guest-store';

export type ServerRecipe = {
  id: string;
  ownerUserId: string;
  deviceId: string | null;
  title: string;
  payload: Record<string, unknown>;
  visibility: 'private' | 'link_shared';
  importSource: string | null;
  importRef: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncResult = {
  ok: boolean;
  pushed: number;
  pulled: number;
  skipped: boolean;
  reason?: string;
  error?: string;
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
    // Mock Google without API exchange may lack idToken + UUID — can't auth.
    return { ok: false, reason: 'session_incomplete' };
  }
  // Recipe routes require a Neon UUID user id (Google/phone persist).
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

function payloadToGuest(server: ServerRecipe): GuestRecipe {
  const p = server.payload || {};
  const base = p as Partial<GuestRecipe>;
  return {
    id: server.id,
    title: (typeof base.title === 'string' && base.title) || server.title,
    titleHi: typeof base.titleHi === 'string' ? base.titleHi : undefined,
    description: typeof base.description === 'string' ? base.description : undefined,
    descriptionHi:
      typeof base.descriptionHi === 'string' ? base.descriptionHi : undefined,
    diet: (base.diet as GuestRecipe['diet']) || 'veg',
    art: (base.art as GuestRecipe['art']) || 'bowl',
    tone: (base.tone as GuestRecipe['tone']) || 'haldi',
    tags: Array.isArray(base.tags) ? base.tags : [],
    time: typeof base.time === 'string' ? base.time : undefined,
    timeHi: typeof base.timeHi === 'string' ? base.timeHi : undefined,
    servings: typeof base.servings === 'string' ? base.servings : undefined,
    servingsHi: typeof base.servingsHi === 'string' ? base.servingsHi : undefined,
    spice: typeof base.spice === 'string' ? base.spice : undefined,
    spiceHi: typeof base.spiceHi === 'string' ? base.spiceHi : undefined,
    source: typeof base.source === 'string' ? base.source : undefined,
    sourceHi: typeof base.sourceHi === 'string' ? base.sourceHi : undefined,
    ingredients: Array.isArray(base.ingredients) ? base.ingredients : [],
    steps: Array.isArray(base.steps) ? base.steps : [],
    stepsHi: Array.isArray(base.stepsHi) ? base.stepsHi : undefined,
    importSource:
      (base.importSource as GuestRecipe['importSource']) ||
      (server.importSource as GuestRecipe['importSource']) ||
      'manual',
    importRef:
      (typeof base.importRef === 'string' ? base.importRef : undefined) ||
      server.importRef ||
      undefined,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    syncStatus: 'synced',
    deletedAt: server.deletedAt,
  };
}

function toUpsertBody(recipe: GuestRecipe, deviceId: string) {
  const { syncStatus: _s, ...payload } = recipe;
  return {
    id: recipe.id,
    title: recipe.title,
    deviceId,
    importSource: recipe.importSource,
    importRef: recipe.importRef ?? null,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    deletedAt: recipe.deletedAt ?? null,
    payload,
    recipe: payload,
  };
}

async function fetchServerRecipes(session: AuthSession): Promise<ServerRecipe[]> {
  const base = apiBase()!;
  const res = await fetch(`${base}/recipes?includeDeleted=1`, {
    method: 'GET',
    headers: authHeaders(session),
  });
  const data = (await res.json().catch(() => ({}))) as {
    recipes?: ServerRecipe[];
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || data.error || `list failed (${res.status})`);
  }
  return Array.isArray(data.recipes) ? data.recipes : [];
}

async function pushRecipe(
  session: AuthSession,
  recipe: GuestRecipe,
  deviceId: string,
): Promise<ServerRecipe> {
  const base = apiBase()!;
  const res = await fetch(`${base}/recipes`, {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(toUpsertBody(recipe, deviceId)),
  });
  const data = (await res.json().catch(() => ({}))) as {
    recipe?: ServerRecipe;
    error?: string;
    message?: string;
  };
  if (!res.ok || !data.recipe) {
    throw new Error(data.message || data.error || `push failed (${res.status})`);
  }
  return data.recipe;
}

/**
 * Merge server rows into local snapshot (LWW on updatedAt).
 * Returns next recipe list.
 */
export function mergeRecipesLww(
  local: GuestRecipe[],
  remote: ServerRecipe[],
): GuestRecipe[] {
  const byId = new Map<string, GuestRecipe>();
  for (const r of local) {
    byId.set(r.id, r);
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
        // Prefer richer local fields only when timestamps equal and local has more?
        // Strict LWW: server wins when >= .
        syncStatus: 'synced',
      });
    } else if (existing.syncStatus === 'synced') {
      // Local is newer — keep local but mark pending so we push.
      byId.set(server.id, { ...existing, syncStatus: 'pending' });
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

/**
 * Run a sync pass: pull → merge → push pending/local → mark synced.
 * Mutates via `applySnapshot` callback (GuestSession commit).
 */
export async function syncRecipesWithServer(args: {
  session: AuthSession | null | undefined;
  snapshot: GuestStoreSnapshot;
  applySnapshot: (next: GuestStoreSnapshot) => Promise<GuestStoreSnapshot>;
}): Promise<SyncResult> {
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
    // Mark unsynced actives as pending before network (UI hint).
    const needsPending = snap.recipes.some(
      (r) => !r.deletedAt && (r.syncStatus === 'local' || !r.syncStatus),
    );
    if (needsPending) {
      snap = await args.applySnapshot({
        ...snap,
        recipes: snap.recipes.map((r) =>
          !r.deletedAt && (r.syncStatus === 'local' || !r.syncStatus)
            ? { ...r, syncStatus: 'pending' as SyncStatus }
            : r,
        ),
      });
    }

    const remote = await fetchServerRecipes(session);
    const merged = mergeRecipesLww(snap.recipes, remote);
    snap = await args.applySnapshot({ ...snap, recipes: merged });

    let pushed = 0;
    const afterPush: GuestRecipe[] = [];

    for (const recipe of snap.recipes) {
      const status = recipe.syncStatus || 'local';
      const shouldPush =
        status === 'pending' ||
        status === 'local' ||
        Boolean(recipe.deletedAt && status !== 'synced');

      if (!shouldPush) {
        afterPush.push(recipe);
        continue;
      }

      try {
        const server = await pushRecipe(session, recipe, snap.deviceId);
        afterPush.push({
          ...payloadToGuest(server),
          // Preserve local bilingual extras if server payload was thin
          ...pickLocalExtras(recipe),
          syncStatus: 'synced',
          updatedAt: server.updatedAt,
          deletedAt: server.deletedAt,
        });
        pushed += 1;
      } catch (err) {
        console.warn('[recipe-sync] push failed', recipe.id, err);
        afterPush.push({
          ...recipe,
          syncStatus: 'pending',
        });
      }
    }

    const sorted = afterPush.sort((a, b) => {
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
    snap = await args.applySnapshot({ ...snap, recipes: sorted });

    const stillPending = sorted.some(
      (r) => !r.deletedAt && r.syncStatus !== 'synced',
    );

    return {
      ok: !stillPending,
      pushed,
      pulled: remote.length,
      skipped: false,
      error: stillPending ? 'Some recipes could not be pushed' : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sync failed';
    console.warn('[recipe-sync]', message);
    return {
      ok: false,
      pushed: 0,
      pulled: 0,
      skipped: false,
      error: message,
    };
  }
}

function pickLocalExtras(recipe: GuestRecipe): Partial<GuestRecipe> {
  return {
    titleHi: recipe.titleHi,
    description: recipe.description,
    descriptionHi: recipe.descriptionHi,
    art: recipe.art,
    tone: recipe.tone,
    tags: recipe.tags,
    time: recipe.time,
    timeHi: recipe.timeHi,
    servings: recipe.servings,
    servingsHi: recipe.servingsHi,
    spice: recipe.spice,
    spiceHi: recipe.spiceHi,
    source: recipe.source,
    sourceHi: recipe.sourceHi,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    stepsHi: recipe.stepsHi,
  };
}

/** Count recipes that still need a cloud push/pull. */
export function unsyncedRecipeCount(snap: GuestStoreSnapshot): number {
  return activeRecipes(snap).filter((r) => r.syncStatus !== 'synced').length;
}

export function allRecipesSynced(snap: GuestStoreSnapshot): boolean {
  const active = activeRecipes(snap);
  if (active.length === 0) return true;
  return active.every((r) => r.syncStatus === 'synced');
}
