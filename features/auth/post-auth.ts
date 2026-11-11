/**
 * After a successful non-guest sign-in, route into the existing merge stub.
 * Collision / skip variants stay demo-selectable; default keep-all.
 */

export type MergeVariant = 'keep-all' | 'collision' | 'skip';

export function mergeHrefAfterAuth(variant: MergeVariant = 'keep-all'): string {
  return `/merge?variant=${variant}`;
}
