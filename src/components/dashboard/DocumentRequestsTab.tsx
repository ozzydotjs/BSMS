import { useMemo, useState, useEffect } from 'react';
import { FileText, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DocumentRequest, DocumentRequestStatus } from '../../types/database';
import { formatCurrencyPhp, formatShortDate } from '../../utils/risk';
import { TableSkeleton } from '../SkeletonLoader';
import { RequestStatusBadge } from '../StatusBadge';
import { PrintableCertificateModal } from './PrintableCertificateModal';

interface DocumentRequestsTabProps {
  loading: boolean;
  requests: DocumentRequest[];
  onUpdateStatus: (requestId: string, nextStatus: DocumentRequestStatus) => Promise<void>;
}

const STATUS_OPTIONS: { value: DocumentRequestStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready' },
  { value: 'claimed', label: 'Claimed' },
];

export function DocumentRequestsTab({
  loading,
  requests,
  onUpdateStatus,
}: DocumentRequestsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [printingRequest, setPrintingRequest] = useState<DocumentRequest | null>(null);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((req) => {
      const name = req.residents
        ? `${req.residents.first_name} ${req.residents.last_name}`.toLowerCase()
        : '';
      return name.includes(q);
    });
  }, [requests, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedRequests = useMemo(() => {
    const from = page * rowsPerPage;
    const to = from + rowsPerPage;
    return filteredRequests.slice(from, to);
  }, [filteredRequests, page, rowsPerPage]);

  const handleStatusChange = async (
    requestId: string,
    nextStatus: DocumentRequestStatus
  ) => {
    setUpdatingId(requestId);
    try {
      await onUpdateStatus(requestId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar: Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resident name..."
            aria-label="Filter requests by resident name"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-slate-300 py-1 pl-2 pr-6 text-slate-700 focus:border-[#1e3a8a] focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm relative">
              {/* Sticky Header */}
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Resident</th>
                  <th scope="col" className="px-5 py-3.5">Document Type</th>
                  <th scope="col" className="px-5 py-3.5">Fee</th>
                  <th scope="col" className="px-5 py-3.5">Requested Date</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Update Status</th>
                  <th scope="col" className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedRequests.map((req) => {
                  const residentName = req.residents
                    ? `${req.residents.first_name} ${req.residents.last_name}`
                    : 'Unknown Resident';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {residentName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {req.document_types?.name ?? 'Barangay Document'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatCurrencyPhp(req.document_types?.fee ?? 0)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatShortDate(req.requested_at)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <RequestStatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <select
                          aria-label={`Update status for ${residentName}`}
                          value={req.status}
                          disabled={updatingId === req.id}
                          onChange={(e) =>
                            handleStatusChange(req.id, e.target.value as DocumentRequestStatus)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPrintingRequest(req)}
                          title="Print Certificate"
                          aria-label={`Print certificate for ${residentName}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-[#1e3a8a] transition-colors"
                        >
                          <Printer className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                        <FileText className="h-8 w-8 text-slate-300" aria-hidden="true" />
                        <p className="text-sm font-medium text-slate-700">No document requests match</p>
                        <p className="text-xs text-slate-500">
                          {searchQuery ? 'Clear or adjust the resident name filter.' : 'Requests submitted from the Resident Portal will appear here.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing <span className="font-medium">{Math.min(page * rowsPerPage + 1, filteredRequests.length)}</span> to{' '}
              <span className="font-medium">{Math.min((page + 1) * rowsPerPage, filteredRequests.length)}</span> of{' '}
              <span className="font-medium">{filteredRequests.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </button>
              <span className="text-xs text-slate-500 font-medium px-2">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      <PrintableCertificateModal
        request={printingRequest}
        onClose={() => setPrintingRequest(null)}
      />
    </div>
  );
}