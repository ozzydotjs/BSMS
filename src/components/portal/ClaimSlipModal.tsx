import { useEffect } from 'react';
import { Printer, Receipt, X } from 'lucide-react';
import type { DocumentRequest } from '../../types/database';
import { formatCurrencyPhp, formatShortDate } from '../../utils/risk';
import { RequestStatusBadge } from '../StatusBadge';

interface ClaimSlipModalProps {
  request: DocumentRequest | null;
  residentName: string;
  onClose: () => void;
}

export function ClaimSlipModal({
  request,
  residentName,
  onClose,
}: ClaimSlipModalProps) {
  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, onClose]);

  if (!request) return null;

  const docName = request.document_types?.name ?? 'Barangay Certificate';
  const fee = request.document_types?.fee ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-slip-title"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4.5 w-4.5 text-[#1e3a8a]" aria-hidden="true" />
            <h2
              id="claim-slip-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Document Claim Slip
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close claim slip"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="printable-sheet p-6 space-y-5 text-slate-800">
          <div className="border-b border-dashed border-slate-300 pb-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Barangay Sugcad Treasury & Secretariat
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#1e3a8a]">
              Official Claim Slip
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              Ticket ID: {request.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Request ID</dt>
              <dd className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {request.id}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Resident Name</dt>
              <dd className="font-semibold text-slate-900 text-right">
                {residentName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Document Requested</dt>
              <dd className="font-semibold text-slate-900 text-right">{docName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Date Requested</dt>
              <dd className="font-mono text-xs text-slate-700 tabular-nums">
                {formatShortDate(request.requested_at)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Processing Fee</dt>
              <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                {fee === 0 ? 'Free of Charge' : formatCurrencyPhp(fee)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <dt className="text-slate-500">Current Status</dt>
              <dd>
                <RequestStatusBadge status={request.status} />
              </dd>
            </div>
          </dl>

          <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
            Present this slip and one (1) valid government-issued ID at the Barangay Sugcad Hall window to claim your document.
          </p>
        </div>

        <div className="no-print flex items-center justify-end gap-2.5 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#172554] transition-colors"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Claim Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
