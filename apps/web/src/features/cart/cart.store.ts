import { atom } from 'jotai';

export type CartLineItem = {
  id: string;
  listingId: string;
  quantity: number;
};

export const cartLineItemsAtom = atom<CartLineItem[]>([]);
