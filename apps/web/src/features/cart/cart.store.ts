import { atom } from 'jotai';

export type CartLineItem = {
  id: string;
  productId: string;
  quantity: number;
};

export const cartLineItemsAtom = atom<CartLineItem[]>([]);
