/** English chrome strings (MVP scaffold). */
export const en = {
  brand: 'Know Your Food',
  nav: {
    recipes: 'My recipes',
    checklist: 'Checklist',
    profile: 'Profile',
  },
  common: {
    continue: 'Continue',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    notNow: 'Not now',
    signIn: 'Sign in',
    importRecipe: 'Import recipe',
    share: 'Share',
    stub: 'Scaffold stub',
  },
  onboarding: {
    languageTitle: 'Onboarding — language',
    dietTitle: 'Onboarding — diet',
    sourceTitle: 'Onboarding — recipe source → import',
  },
  recipes: {
    homeTitle: 'My recipes — guest, 12 saved',
    emptyTitle: 'My recipes — first launch / empty',
  },
  import: {
    title: 'Import — link found',
  },
  recipe: {
    detailTitle: 'Recipe detail',
    shareTitle: 'Recipe detail + ShareSheet open',
    editorTitle: 'Recipe editor',
  },
  checklist: {
    title: 'Shopping checklist',
  },
  auth: {
    phoneTitle: 'Auth — phone',
    otpTitle: 'Auth — OTP',
    googleTitle: 'Auth — Google in progress',
    appleTitle: 'Auth — Apple (iOS)',
    continueAsGuest: 'Continue as guest',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    mockMode: 'Auth mock mode (no live keys)',
    signOut: 'Sign out',
  },
  accountPrompt: {
    title: 'Account prompt',
    firstSave: 'Account prompt — first save',
    firstImport: 'Account prompt — first import',
    firstShare: 'Account prompt — first share',
    nRecipes: 'Account prompt — after the 12th save',
    unsyncedExit: 'Account prompt — unsynced exit',
    bannerQuiet: 'Banner — quiet',
  },
  merge: {
    title: 'Merge / claim — guest + account data',
    keepAll: 'Merge — keep all',
    collision: 'Merge — collision, keep both',
    skip: 'Merge skipped — guest-only',
    signedIn: 'Signed in — post-merge',
  },
  profile: {
    title: 'Profile / settings',
  },
  shared: {
    title: 'Shared recipe preview — opened from WhatsApp',
  },
  notFound: {
    title: "This screen doesn't exist",
    home: 'Go to home',
  },
} as const;

/** Nested string tree matching `en` shape (values may differ by locale). */
export type TranslationTree = {
  [K in keyof typeof en]: (typeof en)[K] extends string
    ? string
    : { [P in keyof (typeof en)[K]]: string };
};
