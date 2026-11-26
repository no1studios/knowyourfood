/**
 * Vercel API client — recipes + shopping sync when signed in; share/merge stubs remain.
 */

import { getAuthPublicConfig } from '@/features/auth/config';
import type { AuthSession } from '@/features/auth/types';
import type { GuestRecipe, GuestShoppingItem } from '@/lib/guest-store';

export type SyncStatus = 'local' | 'pending' | 'synced';

export type RecipeDraft = {
  id?: string;
  title: string;
  importSource?: 'screenshot' | 'text' | 'url' | null;
  syncStatus?: SyncStatus;
};

export type GuestMergeRequest = {
  strategy: 'keep-all' | 'keep-both' | 'guest-only';
};

export type ShareCreateResult = { url: string; slug: string };

export type CloudRecipe = {
  id: string;
  ownerUserId: string;
  title: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CloudShoppingItem = {
  id: string;
  listId: string;
  ownerUserId: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface ApiClient {
  listRecipes(session: AuthSession): Promise<CloudRecipe[]>;
  getRecipe(session: AuthSession, id: string): Promise<CloudRecipe | null>;
  upsertRecipe(
    session: AuthSession,
    recipe: GuestRecipe,
    deviceId: string,
  ): Promise<CloudRecipe>;
  deleteRecipe(
    session: AuthSession,
    id: string,
    updatedAt?: string,
  ): Promise<CloudRecipe>;
  listShoppingItems(
    session: AuthSession,
  ): Promise<{ listId: string; items: CloudShoppingItem[] }>;
  upsertShoppingItem(
    session: AuthSession,
    item: GuestShoppingItem,
    deviceId: string,
    listId: string,
  ): Promise<CloudShoppingItem>;
  deleteShoppingItem(
    session: AuthSession,
    id: string,
    updatedAt?: string,
  ): Promise<CloudShoppingItem>;
  importRecipe(payload: { text?: string; url?: string }): Promise<RecipeDraft>;
  mergeGuest(req: GuestMergeRequest): Promise<{ recipeCount: number }>;
  createShare(recipeId: string): Promise<ShareCreateResult>;
  getShared(slug: string): Promise<RecipeDraft | null>;
}

function baseUrl(): string {
  const url = getAuthPublicConfig().apiBaseUrl?.replace(/\/$/, '');
  if (!url) throw new Error('EXPO_PUBLIC_AUTH_API_URL is not set');
  return url;
}

function headers(session: AuthSession): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = session.idToken || `mock_session_${session.userId}`;
  h.Authorization = `Bearer ${token}`;
  if (session.userId) h['X-KYF-User-Id'] = session.userId;
  return h;
}

export const apiClient: ApiClient = {
  async listRecipes(session) {
    const res = await fetch(`${baseUrl()}/recipes?includeDeleted=1`, {
      headers: headers(session),
    });
    const data = (await res.json().catch(() => ({}))) as {
      recipes?: CloudRecipe[];
      message?: string;
    };
    if (!res.ok) throw new Error(data.message || `listRecipes ${res.status}`);
    return data.recipes ?? [];
  },

  async getRecipe(session, id) {
    const res = await fetch(`${baseUrl()}/recipes/${encodeURIComponent(id)}`, {
      headers: headers(session),
    });
    if (res.status === 404) return null;
    const data = (await res.json().catch(() => ({}))) as {
      recipe?: CloudRecipe;
      message?: string;
    };
    if (!res.ok) throw new Error(data.message || `getRecipe ${res.status}`);
    return data.recipe ?? null;
  },

  async upsertRecipe(session, recipe, deviceId) {
    const { syncStatus: _s, ...payload } = recipe;
    const res = await fetch(`${baseUrl()}/recipes`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({
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
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      recipe?: CloudRecipe;
      message?: string;
    };
    if (!res.ok || !data.recipe) {
      throw new Error(data.message || `upsertRecipe ${res.status}`);
    }
    return data.recipe;
  },

  async deleteRecipe(session, id, updatedAt) {
    const q = updatedAt ? `?updatedAt=${encodeURIComponent(updatedAt)}` : '';
    const res = await fetch(
      `${baseUrl()}/recipes/${encodeURIComponent(id)}${q}`,
      {
        method: 'DELETE',
        headers: headers(session),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      recipe?: CloudRecipe;
      message?: string;
    };
    if (!res.ok || !data.recipe) {
      throw new Error(data.message || `deleteRecipe ${res.status}`);
    }
    return data.recipe;
  },

  async listShoppingItems(session) {
    const res = await fetch(`${baseUrl()}/shopping-lists/items?includeDeleted=1`, {
      headers: headers(session),
    });
    const data = (await res.json().catch(() => ({}))) as {
      listId?: string;
      items?: CloudShoppingItem[];
      message?: string;
    };
    if (!res.ok) throw new Error(data.message || `listShoppingItems ${res.status}`);
    return { listId: data.listId || `list_${session.userId}`, items: data.items ?? [] };
  },

  async upsertShoppingItem(session, item, deviceId, listId) {
    const { syncStatus: _s, ...payload } = item;
    const res = await fetch(`${baseUrl()}/shopping-lists/items`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({
        id: item.id,
        listId,
        name: item.name,
        deviceId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt ?? null,
        payload,
        item: payload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      item?: CloudShoppingItem;
      message?: string;
    };
    if (!res.ok || !data.item) {
      throw new Error(data.message || `upsertShoppingItem ${res.status}`);
    }
    return data.item;
  },

  async deleteShoppingItem(session, id, updatedAt) {
    const q = updatedAt ? `?updatedAt=${encodeURIComponent(updatedAt)}` : '';
    const res = await fetch(
      `${baseUrl()}/shopping-lists/items/${encodeURIComponent(id)}${q}`,
      {
        method: 'DELETE',
        headers: headers(session),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      item?: CloudShoppingItem;
      message?: string;
    };
    if (!res.ok || !data.item) {
      throw new Error(data.message || `deleteShoppingItem ${res.status}`);
    }
    return data.item;
  },

  async importRecipe() {
    throw new Error('API importRecipe not implemented (scaffold stub)');
  },
  async mergeGuest() {
    throw new Error('API mergeGuest not implemented (scaffold stub)');
  },
  async createShare() {
    throw new Error('API createShare not implemented (scaffold stub)');
  },
  async getShared() {
    return null;
  },
};
