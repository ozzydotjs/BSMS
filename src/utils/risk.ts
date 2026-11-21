import type { RiskLevel } from '../types/database';

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function calculateRiskScore(likelihood: number, consequence: number): number {
  return clampScore(likelihood) * clampScore(consequence);
}

export function deriveRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= 15) return 'high';
  if (riskScore >= 7) return 'medium';
  return 'low';
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrencyPhp(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}
