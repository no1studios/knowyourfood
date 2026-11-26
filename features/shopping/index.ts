/** Shopping checklist — guest-local helpers + signed-in cloud sync. */
export type { GuestShoppingItem } from '@/lib/guest-store';
export {
  activeShoppingItems,
  buildDemoShopping,
  normalizeShoppingItem,
} from '@/lib/guest-store';
export {
  allShoppingSynced,
  defaultListId,
  mergeShoppingLww,
  syncShoppingWithServer,
  unsyncedShoppingCount,
  type ShoppingSyncResult,
  type ServerShoppingItem,
} from './sync';
