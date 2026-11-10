import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Diet } from '@/components/ui';
import { useLocale } from '@/components/LocaleProvider';
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
  toast: string | null;
  toggleDiet: (diet: Diet) => void;
  toggleSource: (key: SourceKey) => void;
  setLocalePref: (locale: AppLocale) => void;
  completeOnboarding: () => Promise<void>;
  /** Seeds one recipe when true, clears when false — prefer explicit helpers. */
  setHasRecipes: (value: boolean) => void;
  setSignedIn: (value: boolean) => void;
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
  notePromptShown: (kind: AccountPromptKind) => Promise<void>;
};

const GuestSessionContext = createContext<GuestSessionValue | null>(null);

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  return <GuestSessionInner>{children}</GuestSessionInner>;
}

function GuestSessionInner({ children }: { children: ReactNode }) {
  const { setLocale } = useLocale();
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<GuestStoreSnapshot>(() => createEmptySnapshot());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await guestStore.load();
      if (!alive) return;
      setI18nLocale(loaded.locale);
      setLocale(loaded.locale);
      setSnap(loaded);
      setReady(true);
    })().catch((err) => {
      console.warn('Guest store load failed', err);
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [setLocale]);

  const commit = useCallback(async (next: GuestStoreSnapshot) => {
    setSnap(next);
    await guestStore.save(next);
    return next;
  }, []);

  const mutate = useCallback(
    async (fn: (s: GuestStoreSnapshot) => GuestStoreSnapshot) => {
      const base = await guestStore.load();
      return commit(fn(base));
    },
    [commit],
  );

  const recipes = useMemo(() => activeRecipes(snap), [snap]);
  const recipeCount = recipes.length;

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
      signedIn: snap.signedIn,
      toast,
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
        const fresh = await guestStore.clear();
        setI18nLocale(fresh.locale);
        setLocale(fresh.locale);
        setSnap(fresh);
        setToast(null);
      },
      importDemoRecipe: async (link) => {
        let prompt: AccountPromptKind | null = null;
        let recipe = buildImportedDal(link);
        await mutate((s) => {
          recipe = { ...recipe, id: recipe.id };
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
        return { recipe, prompt };
      },
      saveSharedRecipe: async () => {
        let prompt: AccountPromptKind | null = null;
        let recipe = buildSharedPaneer();
        await mutate((s) => {
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
          recipes: s.recipes.map((r) => ({
            ...r,
            syncStatus: 'synced' as const,
            updatedAt: nowIso(),
          })),
        }));
      },
      notePromptShown: async (kind) => {
        await mutate((s) => markPrompt(s, kind));
      },
    }),
    [ready, snap, recipes, recipeCount, toast, mutate, setLocale],
  );

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext);
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider');
  return ctx;
}
