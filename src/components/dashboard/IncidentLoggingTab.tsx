import React, { useState } from 'react';
import { AlertTriangle, Cpu, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Incident, Resident, RiskLevel } from '../../types/database';
import type { NewIncidentInput } from '../../services/barangayData';
import { calculateRiskScore, deriveRiskLevel, formatShortDate } from '../../utils/risk';
import { TableSkeleton } from '../SkeletonLoader';
import { RiskLevelBadge } from '../StatusBadge';

interface IncidentLoggingTabProps {
  loading: boolean;
  incidents: Incident[];
  residents: Resident[];
  onLogIncident: (input: NewIncidentInput) => Promise<void>;
}

const INCIDENT_TYPES = [
  'Boundary & Right-of-Way Dispute',
  'Noise Disturbance',
  'Physical Threat / Altercation',
  'Property Damage / Vandalism',
  'Domestic / Neighborhood Dispute',
  'Streetlight & Traffic Hazard',
  'Public Health / Sanitation Concern',
];

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function IncidentLoggingTab({
  loading,
  incidents,
  residents,
  onLogIncident,
}: IncidentLoggingTabProps) {
  const [complainantId, setComplainantId] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0]);
  const [incidentDate, setIncidentDate] = useState(getTodayDateString);
  const [incidentTime, setIncidentTime] = useState(getCurrentTimeString);
  const [narrative, setNarrative] = useState('');
  const [likelihoodScore, setLikelihoodScore] = useState(3);
  const [consequenceScore, setConsequenceScore] = useState(3);
  const [officialRiskLevel, setOfficialRiskLevel] = useState<string>('');
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedComplainantId = complainantId || (residents[0]?.id ?? '');
  const computedScore = calculateRiskScore(likelihoodScore, consequenceScore);
  const computedRiskLevel = deriveRiskLevel(computedScore);

  const handleAnalyzeWithAi = async () => {
    if (narrative.trim().length < 10) {
      toast.error('Please enter at least 10 characters in the incident narrative first.');
      return;
    }

    setAnalyzingAi(true);
    setAiRationale(null);
    try {
      const res = await fetch('/api/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_type: incidentType,
          narrative: narrative.trim(),
          respondent_name: respondentName.trim(),
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        likelihood_score?: number;
        consequence_score?: number;
        rationale?: string;
      };

      if (!res.ok) {
        toast.error(payload.error || 'AI risk analysis is currently unavailable.');
        return;
      }

      if (payload.likelihood_score) setLikelihoodScore(payload.likelihood_score);
      if (payload.consequence_score) setConsequenceScore(payload.consequence_score);
      if (payload.rationale) setAiRationale(payload.rationale);
      toast.success('AI risk assessment applied to likelihood and consequence scores.');
    } catch {
      toast.error('Unable to reach AI risk analysis service.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplainantId) {
      toast.error('Please select a complainant resident.');
      return;
    }
    if (!respondentName.trim() || !narrative.trim() || !incidentDate || !incidentTime) {
      toast.error('Respondent name, incident date/time, and narrative are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onLogIncident({
        complainant_id: selectedComplainantId,
        respondent_name: respondentName,
        incident_type: incidentType,
        narrative,
        likelihood_score: likelihoodScore,
        consequence_score: consequenceScore,
        official_risk_level: officialRiskLevel !== ''
          ? (officialRiskLevel as RiskLevel)
          : null,
        incident_date: incidentDate,
        incident_time: incidentTime,
      });
      setRespondentName('');
      setNarrative('');
      setIncidentDate(getTodayDateString());
      setIncidentTime(getCurrentTimeString());
      setLikelihoodScore(3);
      setConsequenceScore(3);
      setOfficialRiskLevel('');
      setAiRationale(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Log Incident Form */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Record Barangay Sugcad Incident Blotter
            </h2>
            <p className="text-xs text-slate-500">
              Log complainant details, incident date/time, 5×5 risk matrix score, and optional official risk override.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeWithAi}
            disabled={analyzingAi}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1e3a8a]/30 bg-[#1e3a8a]/5 px-3.5 py-2 text-xs font-semibold text-[#1e3a8a] hover:bg-[#1e3a8a]/10 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{analyzingAi ? 'Analyzing Narrative...' : 'AI Risk Assessment'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="incident-complainant"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Complainant Resident
              </label>
              <select
                id="incident-complainant"
                value={selectedComplainantId}
                onChange={(e) => setComplainantId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                {residents.length === 0 && <option value="">No residents found</option>}
                {residents.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.last_name}, {res.first_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="incident-respondent"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Respondent Name
              </label>
              <input
                id="incident-respondent"
                type="text"
                required
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Full name of respondent"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>

            <div>
              <label
                htmlFor="incident-type"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Incident Classification
              </label>
              <select
                id="incident-type"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                {INCIDENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="incident-date"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Date of Incident
              </label>
              <input
                id="incident-date"
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>

            <div>
              <label
                htmlFor="incident-time"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Time of Incident
              </label>
              <input
                id="incident-time"
                type="time"
                required
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="incident-narrative"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Incident Narrative
            </label>
            <textarea
              id="incident-narrative"
              rows={3}
              required
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Summarize location, sequence of events, witnesses, and immediate actions taken..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
            {aiRationale && (
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">AI Assessment Note:</span>{' '}
                {aiRationale}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="incident-likelihood"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Likelihood (1–5)
              </label>
              <select
                id="incident-likelihood"
                value={likelihoodScore}
                onChange={(e) => setLikelihoodScore(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} — {n === 1 ? 'Rare' : n === 2 ? 'Unlikely' : n === 3 ? 'Possible' : n === 4 ? 'Likely' : 'Almost Certain'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="incident-consequence"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Consequence (1–5)
              </label>
              <select
                id="incident-consequence"
                value={consequenceScore}
                onChange={(e) => setConsequenceScore(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} — {n === 1 ? 'Negligible' : n === 2 ? 'Minor' : n === 3 ? 'Moderate' : n === 4 ? 'Major' : 'Severe'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                System Risk Evaluation
              </span>
              <div className="flex h-[38px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3">
                <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                  Score: {computedScore}
                </span>
                <RiskLevelBadge level={computedRiskLevel} />
              </div>
            </div>

            <div>
              <label
                htmlFor="incident-official-risk"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Official Risk Level (Optional)
              </label>
              <select
                id="incident-official-risk"
                value={officialRiskLevel}
                onChange={(e) => setOfficialRiskLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option value="">None (Save as Pending Review)</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || residents.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#172554] disabled:opacity-50 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Recording Incident...' : 'Log Incident Report'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Logged Incidents Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recorded Incident Blotter
          </h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {incidents.length} total cases
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Incident & Narrative
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Complainant
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Respondent
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Matrix Score
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      System Risk Level
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Official Risk Level
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors align-top">
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="font-medium text-slate-900">{inc.incident_type}</p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {inc.narrative}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                        {inc.residents
                          ? `${inc.residents.first_name} ${inc.residents.last_name}`
                          : 'Resident'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                        {inc.respondent_name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {inc.risk_score} ({inc.likelihood_score}×{inc.consequence_score})
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <RiskLevelBadge level={inc.risk_level} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <RiskLevelBadge level={inc.official_risk_level} />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        <div>{formatShortDate(inc.recorded_at)}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(inc.recorded_at).toLocaleTimeString('en-PH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                          <AlertTriangle className="h-8 w-8 text-slate-300" aria-hidden="true" />
                          <p className="text-sm font-medium text-slate-700">
                            No incidents logged yet
                          </p>
                          <p className="text-xs text-slate-500">
                            Use the form above to record the first Barangay Sugcad blotter entry.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
