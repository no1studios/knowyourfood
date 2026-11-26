import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Diet } from '@/components/ui';
import { useLocale } from '@/components/LocaleProvider';
import { authClient, type AuthSession } from '@/features/auth';
import {
  allRecipesSynced,
  syncRecipesWithServer,
  unsyncedRecipeCount,
  type SyncResult,
} from '@/features/recipes';
import type { SyncStatus } from '@/lib/api';
import { setLocale as setI18nLocale, type AppLocale } from '@/lib/i18n';
import {
  activeRecipes,
  buildDemoRecipes,
  buildDemoShopping,
  buildImportedDal,
  buildSharedPaneer,
  createEmptySnapshot,
  guestStore,
  markPrompt,
  N_RECIPES_PROMPT_AT,
  shouldShowPrompt,
  type AccountPromptKind,
  type GuestRecipe,
  type GuestShoppingItem,
  type GuestStoreSnapshot,
  type SourceKey,
  uid,
  nowIso,
} from '@/lib/guest-store';

type GuestSessionValue = {
  ready: boolean;
  snap: GuestStoreSnapshot;
  recipes: GuestRecipe[];
  shoppingItems: GuestShoppingItem[];
  diets: Record<Diet, boolean>;
  sources: Record<SourceKey, boolean>;
  hasRecipes: boolean;
  recipeCount: number;
  signedIn: boolean;
  authSession: AuthSession | null;
  toast: string | null;
  /** True when signed in and every active recipe is synced. */
  recipesSynced: boolean;
  /** Active recipes still local/pending (0 when guest or all synced). */
  unsyncedCount: number;
  syncing: boolean;
  toggleDiet: (diet: Diet) => void;
  toggleSource: (key: SourceKey) => void;
  setLocalePref: (locale: AppLocale) => void;
  completeOnboarding: () => Promise<void>;
  /** Seeds one recipe when true, clears when false — prefer explicit helpers. */
  setHasRecipes: (value: boolean) => void;
  setSignedIn: (value: boolean) => void;
  /** Persist auth session and mirror signed-in onto the guest store. */
  applyAuthSession: (session: AuthSession) => Promise<void>;
  /**
   * Clear auth session only (SecureStore / AsyncStorage). Keeps local recipes,
   * checklist, locale, and prompt events — not a full guest-store reset.
   */
  signOut: () => Promise<void>;
  showToast: (message: string | null) => void;
  seedDemoData: () => Promise<void>;
  resetGuestData: () => Promise<void>;
  importDemoRecipe: (link?: string) => Promise<{ recipe: GuestRecipe; prompt: AccountPromptKind | null }>;
  saveSharedRecipe: () => Promise<{ recipe: GuestRecipe; prompt: AccountPromptKind | null }>;
  recordShare: (recipeId: string) => Promise<AccountPromptKind | null>;
  getRecipe: (id: string) => GuestRecipe | undefined;
  addIngredientsToList: (recipeId: string) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  addShoppingItem: (name: string) => Promise<void>;
  claimMerge: (strategy: 'keep-all' | 'collision' | 'skip') => Promise<void>;
  /** Push/pull recipes when signed in. No-op for guests. */
  syncRecipes: () => Promise<SyncResult>;
  notePromptShown: (kind: AccountPromptKind) => Promise<void>;
};

const GuestSessionContext = createContext<GuestSessionValue | null>(null);

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  return <GuestSessionInner>{children}</GuestSessionInner>;
}

function initialSyncStatus(signedIn: boolean): SyncStatus {
  return signedIn ? 'pending' : 'local';
}

function GuestSessionInner({ children }: { children: ReactNode }) {
  const { setLocale } = useLocale();
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<GuestStoreSnapshot>(() => createEmptySnapshot());
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncInFlight = useRef(false);
  const authSessionRef = useRef<AuthSession | null>(null);

  const commit = useCallback(async (next: GuestStoreSnapshot, prev?: GuestStoreSnapshot) => {
    // Skip setState when the mutator was a no-op (same JSON). Prevents effect loops
    // when callers depend on callback identity tied to `snap`.
    if (prev && JSON.stringify(prev) === JSON.stringify(next)) {
      return prev;
    }
    setSnap(next);
    await guestStore.save(next);
    return next;
  }, []);

  const mutate = useCallback(
    async (fn: (s: GuestStoreSnapshot) => GuestStoreSnapshot) => {
      const base = await guestStore.load();
      const next = fn(base);
      return commit(next, base);
    },
    [commit],
  );

  const runSync = useCallback(
    async (session: AuthSession | null) => {
      if (syncInFlight.current) {
        return {
          ok: true,
          pushed: 0,
          pulled: 0,
          skipped: true,
          reason: 'in_flight',
        } satisfies SyncResult;
      }
      if (!session || session.isGuest) {
        return {
          ok: true,
          pushed: 0,
          pulled: 0,
          skipped: true,
          reason: 'guest',
        } satisfies SyncResult;
      }
      syncInFlight.current = true;
      setSyncing(true);
      try {
        const current = await guestStore.load();
        return await syncRecipesWithServer({
          session,
          snapshot: current,
          applySnapshot: async (next) => {
            const prev = await guestStore.load();
            return commit(next, prev);
          },
        });
      } finally {
        syncInFlight.current = false;
        setSyncing(false);
      }
    },
    [commit],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const [loaded, session] = await Promise.all([guestStore.load(), authClient.getSession()]);
      if (!alive) return;
      setI18nLocale(loaded.locale);
      setLocale(loaded.locale);
      setAuthSession(session);
      authSessionRef.current = session;

      let next = loaded;
      const signed = Boolean(session && !session.isGuest);
      if (signed !== loaded.signedIn) {
        next = {
          ...loaded,
          signedIn: signed,
          claimedAt: signed ? loaded.claimedAt || nowIso() : null,
        };
        await guestStore.save(next);
      }
      setSnap(next);
      setReady(true);

      if (signed && session) {
        void runSync(session);
      }
    })().catch((err) => {
      console.warn('Guest store load failed', err);
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [setLocale, runSync]);

  const recipes = useMemo(() => activeRecipes(snap), [snap]);
  const recipeCount = recipes.length;
  const signedInFlag = Boolean(snap.signedIn || (authSession && !authSession.isGuest));
  const unsyncedCount = useMemo(
    () => (signedInFlag ? unsyncedRecipeCount(snap) : 0),
    [signedInFlag, snap],
  );
  const recipesSynced = useMemo(
    () => (signedInFlag ? allRecipesSynced(snap) : false),
    [signedInFlag, snap],
  );

  const value = useMemo<GuestSessionValue>(
    () => ({
      ready,
      snap,
      recipes,
      shoppingItems: snap.shoppingItems,
      diets: snap.diets,
      sources: snap.sources,
      hasRecipes: recipeCount > 0,
      recipeCount,
      // Prefer store flag; also treat a non-guest auth session as signed in
      // so Profile/menu can't diverge from the status line after HMR/partial hydration.
      signedIn: signedInFlag,
      authSession,
      toast,
      recipesSynced,
      unsyncedCount,
      syncing,
      toggleDiet: (diet) => {
        void mutate((s) => ({ ...s, diets: { ...s.diets, [diet]: !s.diets[diet] } }));
      },
      toggleSource: (key) => {
        void mutate((s) => ({ ...s, sources: { ...s.sources, [key]: !s.sources[key] } }));
      },
      setLocalePref: (locale) => {
        setI18nLocale(locale);
        setLocale(locale);
        void mutate((s) => ({ ...s, locale }));
      },
      completeOnboarding: async () => {
        await mutate((s) => ({ ...s, onboardingComplete: true }));
      },
      setHasRecipes: (value) => {
        if (value) {
          void mutate((s) => {
            if (activeRecipes(s).length > 0) return s;
            const demo = buildDemoRecipes().slice(0, 1);
            return {
              ...s,
              recipes: [...s.recipes, ...demo],
              shoppingItems:
                s.shoppingItems.length > 0 ? s.shoppingItems : buildDemoShopping(demo),
            };
          });
        } else {
          void mutate((s) => ({
            ...s,
            recipes: [],
            shoppingItems: [],
            seededDemo: false,
          }));
        }
      },
      setSignedIn: (value) => {
        void mutate((s) => ({
          ...s,
          signedIn: value,
          claimedAt: value ? s.claimedAt || nowIso() : null,
        }));
      },
      applyAuthSession: async (session) => {
        setAuthSession(session);
        authSessionRef.current = session;
        if (session.isGuest) {
          await authClient.continueAsGuest();
          await mutate((s) => ({ ...s, signedIn: false }));
          return;
        }
        await mutate((s) => ({
          ...s,
          signedIn: true,
          claimedAt: s.claimedAt || nowIso(),
          // Mark local recipes pending so the next sync push includes them.
          recipes: s.recipes.map((r) =>
            r.syncStatus === 'synced'
              ? r
              : { ...r, syncStatus: 'pending' as SyncStatus },
          ),
        }));
      },
      signOut: async () => {
        await authClient.signOut();
        const guest = await authClient.getSession();
        setAuthSession(guest);
        authSessionRef.current = guest;
        await mutate((s) => ({
          ...s,
          signedIn: false,
        }));
      },
      showToast: setToast,
      seedDemoData: async () => {
        await mutate((s) => {
          const recipesDemo = buildDemoRecipes();
          return {
            ...s,
            onboardingComplete: true,
            recipes: recipesDemo,
            shoppingItems: buildDemoShopping(recipesDemo),
            seededDemo: true,
            signedIn: false,
            claimedAt: null,
          };
        });
      },
      resetGuestData: async () => {
        await authClient.signOut();
        const fresh = await guestStore.clear();
        setI18nLocale(fresh.locale);
        setLocale(fresh.locale);
        setSnap(fresh);
        const guest = await authClient.getSession();
        setAuthSession(guest);
        authSessionRef.current = guest;
        setToast(null);
      },
      importDemoRecipe: async (link) => {
        let prompt: AccountPromptKind | null = null;
        let recipe = buildImportedDal(link);
        let shouldSync = false;
        await mutate((s) => {
          const signed = Boolean(s.signedIn);
          recipe = {
            ...recipe,
            id: recipe.id,
            syncStatus: initialSyncStatus(signed),
          };
          shouldSync = signed;
          let next: GuestStoreSnapshot = {
            ...s,
            recipes: [...s.recipes, recipe],
            onboardingComplete: true,
          };
          const count = activeRecipes(next).length;
          if (shouldShowPrompt(next, 'first-import')) {
            prompt = 'first-import';
            next = markPrompt(next, 'first-import');
          } else if (count >= N_RECIPES_PROMPT_AT && shouldShowPrompt(next, 'n-recipes')) {
            prompt = 'n-recipes';
            next = markPrompt(next, 'n-recipes');
          }
          if (next.shoppingItems.length === 0) {
            next = { ...next, shoppingItems: buildDemoShopping([recipe]) };
          }
          return next;
        });
        if (shouldSync) {
          void runSync(authSessionRef.current);
        }
        return { recipe, prompt };
      },
      saveSharedRecipe: async () => {
        let prompt: AccountPromptKind | null = null;
        let recipe = buildSharedPaneer();
        let shouldSync = false;
        await mutate((s) => {
          const signed = Boolean(s.signedIn);
          recipe = { ...recipe, syncStatus: initialSyncStatus(signed) };
          shouldSync = signed;
          let next: GuestStoreSnapshot = {
            ...s,
            recipes: [...s.recipes, recipe],
            onboardingComplete: true,
          };
          if (shouldShowPrompt(next, 'first-save')) {
            prompt = 'first-save';
            next = markPrompt(next, 'first-save');
          } else if (
            activeRecipes(next).length >= N_RECIPES_PROMPT_AT &&
            shouldShowPrompt(next, 'n-recipes')
          ) {
            prompt = 'n-recipes';
            next = markPrompt(next, 'n-recipes');
          }
          return next;
        });
        if (shouldSync) {
          void runSync(authSessionRef.current);
        }
        return { recipe, prompt };
      },
      recordShare: async () => {
        let prompt: AccountPromptKind | null = null;
        await mutate((s) => {
          if (shouldShowPrompt(s, 'first-share')) {
            prompt = 'first-share';
            return markPrompt(s, 'first-share');
          }
          return s;
        });
        return prompt;
      },
      getRecipe: (id) => recipes.find((r) => r.id === id),
      addIngredientsToList: async (recipeId) => {
        await mutate((s) => {
          const recipe = activeRecipes(s).find((r) => r.id === recipeId);
          if (!recipe) return s;
          const existing = new Set(s.shoppingItems.map((i) => i.name.toLowerCase()));
          const additions: GuestShoppingItem[] = [];
          recipe.ingredients.forEach((ing, idx) => {
            if (existing.has(ing.title.toLowerCase())) return;
            additions.push({
              id: uid('shop'),
              recipeId: recipe.id,
              name: ing.title,
              nameHi: ing.titleHi,
              qty: ing.qty,
              aisle: 'FROM RECIPE',
              aisleHi: 'रेसिपी से',
              recipeTitle: recipe.title,
              recipeTitleHi: recipe.titleHi,
              checked: false,
              position: s.shoppingItems.length + idx,
            });
          });
          return { ...s, shoppingItems: [...s.shoppingItems, ...additions] };
        });
      },
      toggleShoppingItem: async (id) => {
        await mutate((s) => ({
          ...s,
          shoppingItems: s.shoppingItems.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        }));
      },
      addShoppingItem: async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        await mutate((s) => ({
          ...s,
          shoppingItems: [
            ...s.shoppingItems,
            {
              id: uid('shop'),
              name: trimmed,
              aisle: 'OTHER',
              aisleHi: 'अन्य',
              checked: false,
              position: s.shoppingItems.length,
            },
          ],
        }));
      },
      claimMerge: async (_strategy) => {
        await mutate((s) => ({
          ...s,
          signedIn: true,
          claimedAt: nowIso(),
          // Pending until cloud sync confirms — not optimistic "synced".
          recipes: s.recipes.map((r) => ({
            ...r,
            syncStatus: 'pending' as SyncStatus,
          })),
        }));
        await runSync(authSessionRef.current);
      },
      syncRecipes: async () => runSync(authSessionRef.current),
      notePromptShown: async (kind) => {
        await mutate((s) => markPrompt(s, kind));
      },
    }),
    [
      ready,
      snap,
      recipes,
      recipeCount,
      signedInFlag,
      authSession,
      toast,
      recipesSynced,
      unsyncedCount,
      syncing,
      mutate,
      setLocale,
      runSync,
    ],
  );

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext);
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider');
  return ctx;
}
