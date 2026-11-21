import { useEffect, useState } from 'react';
import { Building2, Printer, X } from 'lucide-react';
import type { DocumentRequest } from '../../types/database';
import { formatCurrencyPhp, formatShortDate } from '../../utils/risk';

interface PrintableCertificateModalProps {
  request: DocumentRequest | null;
  onClose: () => void;
}

export function PrintableCertificateModal({
  request,
  onClose,
}: PrintableCertificateModalProps) {
  const [sealFailed, setSealFailed] = useState(false);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, onClose]);

  if (!request) return null;

  const residentName = request.residents
    ? `${request.residents.first_name} ${request.residents.last_name}`
    : 'Resident';
  const documentName = request.document_types?.name ?? 'Barangay Certification';
  const issueDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-modal-title"
    >
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl">
        {/* Modal Header (non-print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="certificate-modal-title"
            className="font-display text-base font-semibold text-slate-900"
          >
            Official Certificate Preview
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#172554] transition-colors"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close certificate preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Template */}
        <div className="printable-sheet p-8 sm:p-10 text-slate-900">
          <div className="border-2 border-slate-800 p-8 sm:p-10">
            {/* Header with Official Seal */}
            <div className="flex flex-col items-center text-center border-b-2 border-slate-200 pb-6">
              {!sealFailed ? (
                <img
                  src="/src/assets/images/barangay_civic_seal_1795224924120.jpg"
                  alt="Barangay Sugcad Official Seal"
                  referrerPolicy="no-referrer"
                  onError={() => setSealFailed(true)}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1e3a8a] text-[#1e3a8a]">
                  <Building2 className="h-10 w-10" aria-hidden="true" />
                </div>
              )}
              <p className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-500">
                Republic of the Philippines
              </p>
              <h3 className="mt-1 font-display text-lg font-bold tracking-wide text-[#1e3a8a] uppercase">
                Office of the Punong Barangay — Barangay Sugcad
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                Reference No.: {request.id.slice(0, 8).toUpperCase()} · Requested{' '}
                {formatShortDate(request.requested_at)}
              </p>
            </div>

            {/* Document Title */}
            <div className="my-8 text-center">
              <h4 className="font-display text-2xl font-bold tracking-tight text-slate-900 uppercase">
                {documentName}
              </h4>
            </div>

            {/* Certification Body */}
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900 uppercase tracking-wide">
                To Whom It May Concern:
              </p>
              <p>
                This is to certify that{' '}
                <strong className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
                  {residentName}
                </strong>{' '}
                is a bonafide resident of{' '}
                <strong className="font-semibold text-slate-900">Barangay Sugcad</strong>{' '}
                and is known to be of good moral character with no derogatory record on file
                in this Barangay as of the date of issuance.
              </p>
              <p>
                This{' '}
                <strong className="font-semibold text-slate-900">{documentName}</strong> is
                issued upon the request of the above-named resident for whatever legal purpose
                it may serve.
              </p>
              <p className="pt-2">
                Issued this{' '}
                <strong className="font-semibold text-slate-900">{issueDate}</strong> at the
                Barangay Hall of Barangay Sugcad.
              </p>
            </div>

            {/* Footer & Punong Barangay Signature Line */}
            <div className="mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 pt-6 border-t border-slate-200">
              <div className="text-xs text-slate-500 space-y-1 font-mono tabular-nums">
                <p>
                  Official Fee:{' '}
                  <span className="font-semibold text-slate-800">
                    {request.document_types?.fee
                      ? formatCurrencyPhp(request.document_types.fee)
                      : 'Free / Exempt'}
                  </span>
                </p>
                <p>
                  Request Status:{' '}
                  <span className="uppercase font-semibold text-slate-800">
                    {request.status}
                  </span>
                </p>
              </div>

              <div className="text-center sm:w-64">
                <div className="border-b border-slate-800 pb-1 mb-1.5 h-8" />
                <p className="font-display text-sm font-bold uppercase tracking-wide text-slate-900">
                  Punong Barangay
                </p>
                <p className="text-xs text-slate-500">Barangay Sugcad</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
