
/**
 * Converts a USD dollar amount to cents and validates it against Paystack's minimum.
 * @param amount The amount in USD dollars.
 * @returns The amount in cents as a clean integer.
 * @throws {Error} If the amount is less than the $1.00 (100 cents) minimum.
 */
export function convertToCents(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid input: amount must be a number.');
  }

  const cents = Math.round(amount * 100);

  if (cents < 100) {
    throw new Error('Amount must be at least $1.00.');
  }

  return cents;
}
