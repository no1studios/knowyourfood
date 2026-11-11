/**
 * Local DB / cache interface — SQLite or MMKV to be wired later.
 */

import type { RecipeDraft, SyncStatus } from './api';

export type LocalRecipe = RecipeDraft & {
  id: string;
  updatedAt: string;
  syncStatus: SyncStatus;
};

export interface LocalDb {
  getDeviceId(): Promise<string>;
  listRecipes(): Promise<LocalRecipe[]>;
  upsertRecipe(recipe: LocalRecipe): Promise<void>;
  clearGuestData(): Promise<void>;
}

/** In-memory stub for scaffold. */
const memory: { deviceId: string; recipes: LocalRecipe[] } = {
  deviceId: 'guest-device-stub',
  recipes: [],
};

export const localDb: LocalDb = {
  async getDeviceId() {
    return memory.deviceId;
  },
  async listRecipes() {
    return [...memory.recipes];
  },
  async upsertRecipe(recipe) {
    const idx = memory.recipes.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) memory.recipes[idx] = recipe;
    else memory.recipes.push(recipe);
  },
  async clearGuestData() {
    memory.recipes = [];
  },
};
