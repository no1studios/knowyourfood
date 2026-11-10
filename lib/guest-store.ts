/**
 * Guest-first local store (AsyncStorage).
 * Mirrors data-model DeviceGuest + Recipe + ShoppingItem — no API.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Diet, FoodArt, PastelTone } from '@/components/ui';
import type { AppLocale } from '@/lib/i18n';
import type { SyncStatus } from '@/lib/api';

export type SourceKey = 'ig' | 'yt' | 'web' | 'wa' | 'note' | 'book';

export type AccountPromptKind =
  | 'first-save'
  | 'first-import'
  | 'first-share'
  | 'n-recipes'
  | 'unsynced-exit';

export type GuestIngredient = {
  title: string;
  titleHi?: string;
  qty: string;
};

export type GuestRecipe = {
  id: string;
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  diet: Diet;
  art: FoodArt;
  tone: PastelTone;
  tags: { label: string; labelHi?: string; tone: PastelTone }[];
  time?: string;
  timeHi?: string;
  servings?: string;
  servingsHi?: string;
  spice?: string;
  spiceHi?: string;
  source?: string;
  sourceHi?: string;
  ingredients: GuestIngredient[];
  steps: string[];
  stepsHi?: string[];
  importSource: 'manual' | 'screenshot' | 'text' | 'url';
  importRef?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deletedAt?: string | null;
};

export type GuestShoppingItem = {
  id: string;
  recipeId?: string;
  name: string;
  nameHi?: string;
  qty?: string;
  aisle: string;
  aisleHi?: string;
  recipeTitle?: string;
  recipeTitleHi?: string;
  checked: boolean;
  position: number;
};

export type GuestStoreSnapshot = {
  version: 1;
  deviceId: string;
  locale: AppLocale;
  onboardingComplete: boolean;
  diets: Record<Diet, boolean>;
  sources: Record<SourceKey, boolean>;
  recipes: GuestRecipe[];
  shoppingItems: GuestShoppingItem[];
  accountPromptEvents: AccountPromptKind[];
  signedIn: boolean;
  claimedAt: string | null;
  seededDemo: boolean;
};

export const N_RECIPES_PROMPT_AT = 12;
const STORAGE_KEY = 'kyf.guest.v1';

export const DEFAULT_DIETS: Record<Diet, boolean> = {
  veg: true,
  jain: false,
  egg: false,
  nonveg: false,
  vegan: false,
};

export const DEFAULT_SOURCES: Record<SourceKey, boolean> = {
  ig: true,
  yt: false,
  web: false,
  wa: false,
  note: false,
  book: false,
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function createEmptySnapshot(locale: AppLocale = 'en'): GuestStoreSnapshot {
  return {
    version: 1,
    deviceId: uid('dev'),
    locale,
    onboardingComplete: false,
    diets: { ...DEFAULT_DIETS },
    sources: { ...DEFAULT_SOURCES },
    recipes: [],
    shoppingItems: [],
    accountPromptEvents: [],
    signedIn: false,
    claimedAt: null,
    seededDemo: false,
  };
}

export function activeRecipes(snap: GuestStoreSnapshot) {
  return snap.recipes.filter((r) => !r.deletedAt);
}

export function buildDemoRecipes(): GuestRecipe[] {
  const t = nowIso();
  return [
    {
      id: 'recipe_dal_makhani',
      title: 'Dal makhani',
      titleHi: 'दाल मखनी',
      description: 'Slow-cooked, creamy and smoky — the Sunday kind.',
      descriptionHi: 'धीमी आँच पर पकी, मलाईदार — रविवार वाली दाल।',
      diet: 'veg',
      art: 'bowl',
      tone: 'haldi',
      tags: [
        { label: 'Dinner', labelHi: 'रात का खाना', tone: 'haldi' },
        { label: 'Punjabi', labelHi: 'पंजाबी', tone: 'mint' },
      ],
      time: '50 min',
      timeHi: '50 मिनट',
      servings: '4 servings',
      servingsHi: '4 लोगों के लिए',
      spice: 'Medium',
      spiceHi: 'मध्यम',
      source: 'From @rasoi.with.ritu on Instagram',
      sourceHi: 'Instagram पर @rasoi.with.ritu से',
      ingredients: [
        { title: 'Whole urad dal', titleHi: 'साबुत उड़द दाल', qty: '1 cup' },
        { title: 'Rajma', titleHi: 'राजमा', qty: '¼ cup' },
        { title: 'Butter', titleHi: 'मक्खन', qty: '3 tbsp' },
        { title: 'Tomato purée', titleHi: 'टमाटर प्यूरी', qty: '1 cup' },
        { title: 'Fresh cream', titleHi: 'मलाई', qty: '½ cup' },
        { title: 'Kasuri methi', titleHi: 'कसूरी मेथी', qty: '1 tsp' },
      ],
      steps: [
        'Soak urad dal and rajma overnight. Pressure cook with salt for 6–7 whistles.',
        'Heat butter, add ginger-garlic paste and cook for 1 minute.',
        'Add tomato purée and cook until the butter separates.',
      ],
      stepsHi: [
        'उड़द दाल और राजमा को रात भर भिगोएँ। नमक डालकर 6–7 सीटी तक प्रेशर कुक करें।',
        'मक्खन गरम करें, अदरक-लहसुन का पेस्ट डालें और 1 मिनट पकाएँ।',
        'टमाटर प्यूरी डालें और मक्खन अलग होने तक पकाएँ।',
      ],
      importSource: 'url',
      importRef: 'instagram.com/reel/C8xK2pL…',
      createdAt: t,
      updatedAt: t,
      syncStatus: 'local',
    },
    {
      id: 'recipe_aloo_paratha',
      title: 'Aloo paratha',
      titleHi: 'आलू पराठा',
      diet: 'veg',
      art: 'roti',
      tone: 'peach',
      tags: [{ label: 'Breakfast', labelHi: 'नाश्ता', tone: 'peach' }],
      time: '35 min',
      timeHi: '35 मिनट',
      servings: '4',
      ingredients: [
        { title: 'Potato', titleHi: 'आलू', qty: '5' },
        { title: 'Atta', titleHi: 'आटा', qty: '2 cups' },
        { title: 'Butter', titleHi: 'मक्खन', qty: '2 tbsp' },
      ],
      steps: ['Mash spiced potatoes.', 'Roll and cook on tawa with ghee.'],
      importSource: 'manual',
      createdAt: t,
      updatedAt: t,
      syncStatus: 'local',
    },
    {
      id: 'recipe_masala_chai',
      title: 'Masala chai',
      titleHi: 'मसाला चाय',
      diet: 'veg',
      art: 'glass',
      tone: 'sky',
      tags: [{ label: 'Drinks', labelHi: 'पेय', tone: 'sky' }],
      time: '10 min',
      timeHi: '10 मिनट',
      servings: '2',
      ingredients: [
        { title: 'Ginger', titleHi: 'अदरक', qty: '1 inch' },
        { title: 'Tea leaves', titleHi: 'चाय पत्ती', qty: '2 tsp' },
      ],
      steps: ['Boil spices with water, add tea and milk.'],
      importSource: 'manual',
      createdAt: t,
      updatedAt: t,
      syncStatus: 'local',
    },
    {
      id: 'recipe_anda_curry',
      title: 'Anda curry, dhaba style',
      titleHi: 'ढाबा स्टाइल अंडा करी',
      diet: 'egg',
      art: 'bowl',
      tone: 'rose',
      tags: [{ label: 'Dinner', labelHi: 'रात का खाना', tone: 'rose' }],
      time: '40 min',
      timeHi: '40 मिनट',
      servings: '4',
      ingredients: [{ title: 'Eggs', titleHi: 'अंडे', qty: '4' }],
      steps: ['Fry eggs, simmer in masala gravy.'],
      importSource: 'manual',
      createdAt: t,
      updatedAt: t,
      syncStatus: 'local',
    },
    {
      id: 'recipe_kadhi_pakora',
      title: 'Kadhi pakora',
      titleHi: 'कढ़ी पकौड़ा',
      diet: 'veg',
      art: 'bowl',
      tone: 'pista',
      tags: [{ label: 'Dinner', labelHi: 'रात का खाना', tone: 'mint' }],
      time: '45 min',
      timeHi: '45 मिनट',
      servings: '4',
      ingredients: [{ title: 'Besan', titleHi: 'बेसन', qty: '1 cup' }],
      steps: ['Fry pakoras, simmer in kadhi.'],
      importSource: 'manual',
      createdAt: t,
      updatedAt: t,
      syncStatus: 'local',
    },
  ];
}

export function buildDemoShopping(recipes: GuestRecipe[]): GuestShoppingItem[] {
  const dal = recipes.find((r) => r.id === 'recipe_dal_makhani');
  const paratha = recipes.find((r) => r.id === 'recipe_aloo_paratha');
  const rows: Omit<GuestShoppingItem, 'position'>[] = [
    {
      id: 'shop_onion',
      recipeId: dal?.id,
      name: 'Onion',
      nameHi: 'प्याज़',
      qty: '3',
      aisle: 'VEGETABLES',
      aisleHi: 'सब्ज़ी',
      recipeTitle: 'Dal makhani',
      recipeTitleHi: 'दाल मखनी',
      checked: false,
    },
    {
      id: 'shop_tomato',
      recipeId: dal?.id,
      name: 'Tomato',
      nameHi: 'टमाटर',
      qty: '4',
      aisle: 'VEGETABLES',
      aisleHi: 'सब्ज़ी',
      recipeTitle: 'Dal makhani',
      recipeTitleHi: 'दाल मखनी',
      checked: false,
    },
    {
      id: 'shop_ginger',
      recipeId: dal?.id,
      name: 'Ginger',
      nameHi: 'अदरक',
      qty: '2 inch',
      aisle: 'VEGETABLES',
      aisleHi: 'सब्ज़ी',
      recipeTitle: 'Masala chai, Dal makhani',
      recipeTitleHi: 'मसाला चाय, दाल मखनी',
      checked: true,
    },
    {
      id: 'shop_potato',
      recipeId: paratha?.id,
      name: 'Potato',
      nameHi: 'आलू',
      qty: '5',
      aisle: 'VEGETABLES',
      aisleHi: 'सब्ज़ी',
      recipeTitle: 'Aloo paratha',
      recipeTitleHi: 'आलू पराठा',
      checked: false,
    },
    {
      id: 'shop_urad',
      recipeId: dal?.id,
      name: 'Whole urad dal',
      nameHi: 'साबुत उड़द दाल',
      qty: '1 cup',
      aisle: 'DAL & ATTA',
      aisleHi: 'दाल और आटा',
      recipeTitle: 'Dal makhani',
      recipeTitleHi: 'दाल मखनी',
      checked: false,
    },
    {
      id: 'shop_atta',
      recipeId: paratha?.id,
      name: 'Atta',
      nameHi: 'आटा',
      qty: '2 cups',
      aisle: 'DAL & ATTA',
      aisleHi: 'दाल और आटा',
      recipeTitle: 'Aloo paratha',
      recipeTitleHi: 'आलू पराठा',
      checked: true,
    },
    {
      id: 'shop_butter',
      recipeId: dal?.id,
      name: 'Butter',
      nameHi: 'मक्खन',
      qty: '100 g',
      aisle: 'DAIRY',
      aisleHi: 'डेयरी',
      recipeTitle: 'Dal makhani, Aloo paratha',
      recipeTitleHi: 'दाल मखनी, आलू पराठा',
      checked: false,
    },
    {
      id: 'shop_cream',
      recipeId: dal?.id,
      name: 'Fresh cream',
      nameHi: 'मलाई',
      qty: '200 ml',
      aisle: 'DAIRY',
      aisleHi: 'डेयरी',
      recipeTitle: 'Dal makhani',
      recipeTitleHi: 'दाल मखनी',
      checked: false,
    },
  ];
  return rows.map((r, i) => ({ ...r, position: i }));
}

export function buildImportedDal(link?: string): GuestRecipe {
  const base = buildDemoRecipes()[0];
  return {
    ...base,
    id: uid('recipe'),
    importSource: 'url',
    importRef: link || base.importRef,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    syncStatus: 'local',
  };
}

export function buildSharedPaneer(): GuestRecipe {
  const t = nowIso();
  return {
    id: uid('recipe'),
    title: 'Paneer butter masala',
    titleHi: 'पनीर बटर मसाला',
    description: 'Restaurant-style gravy saved from a shared link.',
    diet: 'veg',
    art: 'bowl',
    tone: 'peach',
    tags: [{ label: 'Dinner', labelHi: 'रात का खाना', tone: 'haldi' }],
    time: '40 min',
    timeHi: '40 मिनट',
    servings: '4',
    ingredients: [
      { title: 'Paneer', titleHi: 'पनीर', qty: '200 g' },
      { title: 'Tomato', titleHi: 'टमाटर', qty: '4' },
    ],
    steps: ['Blend gravy.', 'Add paneer and simmer.'],
    importSource: 'url',
    importRef: 'shared',
    createdAt: t,
    updatedAt: t,
    syncStatus: 'local',
  };
}

async function readRaw(): Promise<GuestStoreSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestStoreSnapshot;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeRaw(snap: GuestStoreSnapshot) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
}

export const guestStore = {
  async load(): Promise<GuestStoreSnapshot> {
    const existing = await readRaw();
    if (existing) return existing;
    const fresh = createEmptySnapshot();
    await writeRaw(fresh);
    return fresh;
  },

  async save(snap: GuestStoreSnapshot) {
    await writeRaw(snap);
  },

  async update(mutator: (snap: GuestStoreSnapshot) => GuestStoreSnapshot) {
    const current = await guestStore.load();
    const next = mutator(current);
    await writeRaw(next);
    return next;
  },

  async clear() {
    const fresh = createEmptySnapshot();
    await writeRaw(fresh);
    return fresh;
  },
};

export function markPrompt(
  snap: GuestStoreSnapshot,
  kind: AccountPromptKind,
): GuestStoreSnapshot {
  if (snap.accountPromptEvents.includes(kind)) return snap;
  return {
    ...snap,
    accountPromptEvents: [...snap.accountPromptEvents, kind],
  };
}

export function shouldShowPrompt(snap: GuestStoreSnapshot, kind: AccountPromptKind) {
  if (snap.signedIn) return false;
  return !snap.accountPromptEvents.includes(kind);
}

export { uid, nowIso, STORAGE_KEY };
