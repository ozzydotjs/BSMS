import { AlertTriangle, Download, FileSpreadsheet, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentRequest, Incident, Resident } from '../../types/database';
import { downloadCsv, jsonToCsv } from '../../utils/csv';

interface ReportsTabProps {
  residents: Resident[];
  requests: DocumentRequest[];
  incidents: Incident[];
}

export function ReportsTab({ residents, requests, incidents }: ReportsTabProps) {
  const handleDownloadResidentsCsv = () => {
    const csv = jsonToCsv(residents, [
      { header: 'Resident ID', accessor: (r) => r.id },
      { header: 'First Name', accessor: (r) => r.first_name },
      { header: 'Last Name', accessor: (r) => r.last_name },
      { header: 'Birthdate', accessor: (r) => r.birthdate },
      { header: 'Contact Number', accessor: (r) => r.contact_number },
      { header: 'Purok', accessor: (r) => r.households?.purok ?? '' },
      { header: 'Household Address', accessor: (r) => r.households?.address ?? '' },
    ]);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`barangay-sugcad-residents-${dateStamp}.csv`, csv);
    toast.success(`Exported ${residents.length} resident records to CSV.`);
  };

  const handleDownloadRequestsCsv = () => {
    const csv = jsonToCsv(requests, [
      { header: 'Request ID', accessor: (r) => r.id },
      {
        header: 'Resident Name',
        accessor: (r) =>
          r.residents ? `${r.residents.first_name} ${r.residents.last_name}` : '',
      },
      { header: 'Document Type', accessor: (r) => r.document_types?.name ?? '' },
      { header: 'Fee (PHP)', accessor: (r) => r.document_types?.fee ?? 0 },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Requested At', accessor: (r) => r.requested_at },
    ]);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`barangay-sugcad-document-requests-${dateStamp}.csv`, csv);
    toast.success(`Exported ${requests.length} document requests to CSV.`);
  };

  const handleDownloadIncidentsCsv = () => {
    const csv = jsonToCsv(incidents, [
      { header: 'Incident ID', accessor: (i) => i.id },
      { header: 'Incident Type', accessor: (i) => i.incident_type },
      { header: 'Narrative', accessor: (i) => i.narrative },
      {
        header: 'Complainant',
        accessor: (i) =>
          i.residents ? `${i.residents.first_name} ${i.residents.last_name}` : '',
      },
      { header: 'Respondent', accessor: (i) => i.respondent_name },
      { header: 'Likelihood Score', accessor: (i) => i.likelihood_score },
      { header: 'Consequence Score', accessor: (i) => i.consequence_score },
      { header: 'Risk Score', accessor: (i) => i.risk_score },
      { header: 'System Risk Level', accessor: (i) => i.risk_level },
      { header: 'Official Risk Level', accessor: (i) => i.official_risk_level ?? '' },
      { header: 'Recorded At', accessor: (i) => i.recorded_at },
    ]);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`barangay-sugcad-incident-blotter-${dateStamp}.csv`, csv);
    toast.success(`Exported ${incidents.length} incident blotter cases to CSV.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-base font-semibold text-slate-900">
          Official Barangay Sugcad CSV Reports
        </h2>
        <p className="text-sm text-slate-500">
          Generate clean, spreadsheet-ready CSV exports for municipal audits, DILG submissions, and treasury reconciliation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                {residents.length} records
              </span>
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
              Residents & Household Registry
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Exports full resident names, birthdates, contact numbers, assigned puroks, and complete household addresses.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadResidentsCsv}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#172554] transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Residents CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                {requests.length} records
              </span>
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
              Document Requests & Fee Ledger
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Exports all certificate applications with resident names, document types, applicable fees in PHP, statuses, and timestamps.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadRequestsCsv}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#172554] transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Document Requests CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                {incidents.length} cases
              </span>
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
              Incident Blotter CSV
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Exports all logged incidents with complainant and respondent names, narratives, dates, risk scores, and official overrides.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadIncidentsCsv}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#172554] transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Incident Blotter CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
