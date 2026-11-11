/**
 * PostHog analytics interface only — no SDK yet.
 */

export type AnalyticsEvent =
  | 'onboarding_complete'
  | 'recipe_created'
  | 'recipe_imported'
  | 'share_wa'
  | 'share_system'
  | 'checklist_add'
  | 'account_prompt_shown'
  | 'account_prompt_accepted'
  | 'merge_complete'
  | 'locale_set';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsClient {
  identify(distinctId: string, props?: AnalyticsProps): void;
  capture(event: AnalyticsEvent, props?: AnalyticsProps): void;
  reset(): void;
}

/** No-op stub. */
export const analytics: AnalyticsClient = {
  identify() {},
  capture() {},
  reset() {},
};
