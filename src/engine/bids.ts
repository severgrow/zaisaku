/** Shared sealed-bid helpers for duels and auctions. */

export const snapBid = (amount: number, min: number, increment: number): number => {
  if (!Number.isInteger(amount) || !Number.isInteger(min) || !Number.isInteger(increment) || increment < 1) return 0;
  if (amount < min) return 0;
  const steps = Math.floor((amount - min) / increment);
  return min + steps * increment;
};

export const maxAffordableBid = (cash: number, min: number, increment: number): number => snapBid(cash, min, increment);
