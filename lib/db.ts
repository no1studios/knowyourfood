/**
 * Local DB facade over the guest AsyncStorage store.
 */

import {
  activeRecipes,
  guestStore,
  type GuestRecipe,
  type GuestStoreSnapshot,
} from '@/lib/guest-store';
import type { SyncStatus } from '@/lib/api';

export type LocalRecipe = GuestRecipe;

export interface LocalDb {
  getDeviceId(): Promise<string>;
  listRecipes(): Promise<LocalRecipe[]>;
  upsertRecipe(recipe: LocalRecipe): Promise<void>;
  clearGuestData(): Promise<void>;
  loadSnapshot(): Promise<GuestStoreSnapshot>;
}

export const localDb: LocalDb = {
  async getDeviceId() {
    const snap = await guestStore.load();
    return snap.deviceId;
  },
  async listRecipes() {
    const snap = await guestStore.load();
    return activeRecipes(snap);
  },
  async upsertRecipe(recipe) {
    await guestStore.update((snap) => {
      const idx = snap.recipes.findIndex((r) => r.id === recipe.id);
      const recipes = [...snap.recipes];
      const next: GuestRecipe = {
        ...recipe,
        syncStatus: (recipe.syncStatus || 'local') as SyncStatus,
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) recipes[idx] = next;
      else recipes.push(next);
      return { ...snap, recipes };
    });
  },
  async clearGuestData() {
    await guestStore.clear();
  },
  async loadSnapshot() {
    return guestStore.load();
  },
};
