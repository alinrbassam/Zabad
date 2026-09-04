/**
 * Currency formatting utilities for Zabad POS.
 * Formats all user-facing monetary amounts in CFA Francs (FCFA).
 */

export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    currency?: string;
    showSymbol?: boolean;
    useDecimals?: boolean;
  },
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  const safeNum = isNaN(num) ? 0 : num;

  const symbol = options?.currency || 'FCFA';
  const showSymbol = options?.showSymbol !== false;

  let formatted: string;
  if (options?.useDecimals || (options?.useDecimals === undefined && safeNum % 1 !== 0)) {
    formatted = safeNum.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(safeNum).toLocaleString(undefined);
  }

  return showSymbol ? `${formatted} ${symbol}` : formatted;
}
