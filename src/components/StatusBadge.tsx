import { AlertTriangle, CheckCircle2, Clock, FileCheck2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { DocumentRequestStatus, RiskLevel } from '../types/database';

const REQUEST_STATUS_CONFIG: Record<
  DocumentRequestStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    Icon: FileCheck2,
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  claimed: {
    label: 'Claimed',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    Icon: CheckCircle2,
  },
};

const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; className: string; Icon: typeof ShieldCheck }
> = {
  low: {
    label: 'Low Risk',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: ShieldCheck,
  },
  medium: {
    label: 'Medium Risk',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: AlertTriangle,
  },
  high: {
    label: 'High Risk',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    Icon: ShieldAlert,
  },
};

export function RequestStatusBadge({ status }: { status: DocumentRequestStatus }) {
  const cfg = REQUEST_STATUS_CONFIG[status] ?? REQUEST_STATUS_CONFIG.pending;
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${cfg.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function RiskLevelBadge({
  level,
  prefix,
}: {
  level: RiskLevel | null;
  prefix?: string;
}) {
  if (!level) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 whitespace-nowrap">
        Not Reviewed
      </span>
    );
  }
  const cfg = RISK_LEVEL_CONFIG[level] ?? RISK_LEVEL_CONFIG.low;
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${cfg.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{prefix ? `${prefix}: ${cfg.label}` : cfg.label}</span>
    </span>
  );
}
