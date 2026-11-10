/**
 * Vercel API client interfaces only — no network calls yet.
 */

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

export interface ApiClient {
  listRecipes(): Promise<RecipeDraft[]>;
  getRecipe(id: string): Promise<RecipeDraft | null>;
  createRecipe(draft: RecipeDraft): Promise<RecipeDraft>;
  importRecipe(payload: { text?: string; url?: string }): Promise<RecipeDraft>;
  mergeGuest(req: GuestMergeRequest): Promise<{ recipeCount: number }>;
  createShare(recipeId: string): Promise<ShareCreateResult>;
  getShared(slug: string): Promise<RecipeDraft | null>;
}

/** Stub — returns empty / throws for writes. */
export const apiClient: ApiClient = {
  async listRecipes() {
    return [];
  },
  async getRecipe() {
    return null;
  },
  async createRecipe() {
    throw new Error('API createRecipe not implemented (scaffold stub)');
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
