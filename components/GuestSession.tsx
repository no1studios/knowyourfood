import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Diet } from '@/components/ui';

type SourceKey = 'ig' | 'yt' | 'web' | 'wa' | 'note' | 'book';

type GuestSessionValue = {
  diets: Record<Diet, boolean>;
  sources: Record<SourceKey, boolean>;
  hasRecipes: boolean;
  toggleDiet: (diet: Diet) => void;
  toggleSource: (key: SourceKey) => void;
  setHasRecipes: (value: boolean) => void;
};

const GuestSessionContext = createContext<GuestSessionValue | null>(null);

const DEFAULT_DIETS: Record<Diet, boolean> = {
  veg: true,
  jain: false,
  egg: false,
  nonveg: false,
  vegan: false,
};

const DEFAULT_SOURCES: Record<SourceKey, boolean> = {
  ig: true,
  yt: false,
  web: false,
  wa: false,
  note: false,
  book: false,
};

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [diets, setDiets] = useState(DEFAULT_DIETS);
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [hasRecipes, setHasRecipes] = useState(false);

  const value = useMemo<GuestSessionValue>(
    () => ({
      diets,
      sources,
      hasRecipes,
      toggleDiet: (diet) => setDiets((prev) => ({ ...prev, [diet]: !prev[diet] })),
      toggleSource: (key) => setSources((prev) => ({ ...prev, [key]: !prev[key] })),
      setHasRecipes,
    }),
    [diets, sources, hasRecipes],
  );

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext);
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider');
  return ctx;
}
