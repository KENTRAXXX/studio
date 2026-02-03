/**
 * Converts a USD dollar amount to cents and validates it against Paystack's minimum.
 * Ensures the result is a strict, positive integer.
 * 
 * @param amount The amount in USD dollars.
 * @returns The amount in cents as a clean integer.
 * @throws {Error} If the amount is invalid or less than the $1.00 (100 cents) minimum.
 */
export function convertToCents(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new Error('Invalid input: amount must be a finite number.');
  }

  // We use Math.round first to handle floating point precision, 
  // then Math.trunc to ensure a clean integer result.
  const cents = Math.trunc(Math.round(amount * 100));

  if (cents < 100) {
    throw new Error('Amount must be at least $1.00 (100 cents).');
  }

  return cents;
}
