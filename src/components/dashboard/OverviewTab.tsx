import { AlertTriangle, ArrowUpRight, Clock, FileText, Users, PlusCircle, ShieldAlert, BarChart3 } from 'lucide-react';
import type { DocumentRequest, Incident, Resident } from '../../types/database';
import { formatShortDate } from '../../utils/risk';
import { RequestStatusBadge, RiskLevelBadge } from '../StatusBadge';
import { StatCardsSkeleton } from '../SkeletonLoader';

interface OverviewTabProps {
  loading: boolean;
  residents: Resident[];
  requests: DocumentRequest[];
  incidents: Incident[];
  onNavigateTab: (tabId: string) => void;
}

export function OverviewTab({
  loading,
  residents,
  requests,
  incidents,
  onNavigateTab,
}: OverviewTabProps) {
  if (loading) {
    return <StatCardsSkeleton />;
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const highRiskIncidents = incidents.filter(
    (inc) => (inc.official_risk_level ?? inc.risk_level) === 'high'
  );

  return (
    <div className="space-y-6">
      {/* 3 Primary Stat Cards */}
      <section aria-label="Barangay summary statistics" className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Residents</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {residents.length}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Registered across active puroks</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('residents')}
              className="text-xs font-semibold text-[#1e3a8a] hover:text-[#172554] transition-colors"
            >
              Manage resident registry →
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {pendingRequests.length}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{requests.length} total document filings</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('requests')}
              className="text-xs font-semibold text-[#1e3a8a] hover:text-[#172554] transition-colors"
            >
              Process document queue →
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">High-Risk Incidents</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {highRiskIncidents.length}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-700">
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Out of {incidents.length} recorded blotter cases</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('incidents')}
              className="text-xs font-semibold text-[#1e3a8a] hover:text-[#172554] transition-colors"
            >
              Review incident blotter →
            </button>
          </div>
        </div>
      </section>

      {/* Operational Snapshots (3 Columns to fill space) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Recent Requests */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Recent Filings
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('requests')}
              className="text-xs font-medium text-[#1e3a8a] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {requests.slice(0, 4).map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {req.residents
                      ? `${req.residents.first_name} ${req.residents.last_name}`
                      : 'Resident'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {req.document_types?.name ?? 'Document'} ·{' '}
                    <span className="tabular-nums">{formatShortDate(req.requested_at)}</span>
                  </p>
                </div>
                <RequestStatusBadge status={req.status} />
              </div>
            ))}
            {requests.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No requests recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Latest Incidents */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Latest Incidents
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('incidents')}
              className="text-xs font-medium text-[#1e3a8a] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {incidents.slice(0, 4).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {inc.incident_type}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {inc.respondent_name} ·{' '}
                    <span className="tabular-nums">{formatShortDate(inc.recorded_at)}</span>
                  </p>
                </div>
                <RiskLevelBadge level={inc.official_risk_level ?? inc.risk_level} />
              </div>
            ))}
            {incidents.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No incidents logged yet.
              </p>
            )}
          </div>
        </div>

        {/* NEW: Quick Actions Card */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-5 flex flex-col gap-3 flex-1 justify-center">
            <button
              onClick={() => onNavigateTab('residents')}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#1e3a8a]/30 hover:shadow-sm transition-all text-left group"
            >
              <div className="bg-blue-100 text-[#1e3a8a] p-2 rounded-md group-hover:scale-110 transition-transform">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Add New Resident</p>
                <p className="text-xs text-slate-500">Register a new profile</p>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('incidents')}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-rose-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="bg-rose-100 text-rose-700 p-2 rounded-md group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Log Incident</p>
                <p className="text-xs text-slate-500">Record a new blotter case</p>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('analytics')}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="bg-emerald-100 text-emerald-700 p-2 rounded-md group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">View Analytics</p>
                <p className="text-xs text-slate-500">Check request forecasts</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}