/**
 * Formats a currency amount into a localized USD string.
 * This utility ensures consistent financial presentation across the SOMA platform.
 * 
 * @param amountInCents The amount in cents (e.g., 100 for $1.00).
 * @returns A formatted string like "$1,234.56".
 */
export function formatCurrency(amountInCents: number): string {
  if (typeof amountInCents !== 'number' || isNaN(amountInCents)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}
