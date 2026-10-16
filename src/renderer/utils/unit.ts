import { UnitEntity } from '@shared/types';

const FRENCH_UNIT_NAMES: Record<string, string> = {
  pcs: 'Pièce',
  carton: 'Carton',
  kg: 'Kilogramme',
  m: 'Mètre',
  box: 'Boîte',
  pack: 'Pack',
  g: 'Gramme',
  l: 'Litre',
  ml: 'Millilitre',
};

export function formatUnitDisplayName(u: Partial<UnitEntity> | null | undefined): string {
  if (!u) return '';
  const code = (u.code || '').toLowerCase();
  const fr = FRENCH_UNIT_NAMES[code] || u.name_en || code;
  const ar = u.name_ar ? u.name_ar.trim() : '';
  const symbol = u.symbol ? `(${u.symbol})` : '';

  if (ar) {
    return `${fr} - ${ar} ${symbol}`.trim();
  }
  return `${fr} ${symbol}`.trim();
}
