import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileCheck2,
  FilePlus2,
  FileText,
  Home,
  Info,
  Phone,
  Receipt,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { LayoutShell, type SidebarNavItem } from '../components/LayoutShell';
import { PortalCardsSkeleton, StatCardsSkeleton } from '../components/SkeletonLoader';
import { RequestStatusBadge } from '../components/StatusBadge';
import { ClaimSlipModal } from '../components/portal/ClaimSlipModal';
import { useAuth } from '../context/AuthContext';
import {
  createDocumentRequest,
  fetchDocumentTypes,
  fetchResidentRequestsByProfile,
  updateResidentContact,
} from '../services/barangayData';
import type {
  DocumentRequest,
  DocumentRequestStatus,
  DocumentType,
  Resident,
} from '../types/database';
import { formatCurrencyPhp, formatShortDate } from '../utils/risk';

const RESIDENT_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'requests', label: 'Document Services', icon: Home },
  { id: 'profile', label: 'My Profile', icon: User },
];

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Barangay Assembly on Nov 30',
    date: 'Nov 30, 2026 · 8:30 AM',
    body: 'All Barangay Sugcad household heads are invited to the Covered Court for the Q4 community budget and peace & order briefing.',
  },
  {
    id: 'ann-2',
    title: 'Free Anti-Rabies Vaccination',
    date: 'Dec 4, 2026 · 9:00 AM – 3:00 PM',
    body: 'Bring your pets to the Barangay Sugcad Plaza for complimentary anti-rabies shots and municipal pet registration.',
  },
  {
    id: 'ann-3',
    title: 'Senior Citizen & PWD Aid Claiming',
    date: 'Every Wednesday · 1:00 PM',
    body: 'Present your OSCA or PWD ID at Window 2 of the Barangay Hall for scheduled social assistance verification.',
  },
];

const EMERGENCY_HOTLINES = [
  {
    id: 'hotline-1',
    label: 'Barangay Sugcad Hall',
    number: '(052) 481-2094 / 0917-842-1102',
    hours: 'Mon–Sat · 8:00 AM – 5:00 PM',
  },
  {
    id: 'hotline-2',
    label: 'Barangay Health Center',
    number: '(052) 481-3318 / 0918-654-7720',
    hours: '24/7 Triage & Maternal Care',
  },
  {
    id: 'hotline-3',
    label: 'Municipal Police Station',
    number: '911 / (052) 481-1166',
    hours: '24/7 Emergency Response',
  },
];

const TICKET_STEPS: { key: DocumentRequestStatus; label: string }[] = [
  { key: 'pending', label: 'Requested' },
  { key: 'processing', label: 'Processing' },
  { key: 'ready', label: 'Ready' },
  { key: 'claimed', label: 'Claimed' },
];

function getDocumentRequirements(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes('indigency')) {
    return `${docName}: Requires 1 Valid ID and a brief statement of purpose (medical, scholarship, or legal assistance).`;
  }
  if (lower.includes('residency')) {
    return `${docName}: Requires 1 Valid ID and proof of current Barangay Sugcad residence (utility bill or purok endorsement).`;
  }
  if (lower.includes('business')) {
    return `${docName}: Requires DTI/SEC registration, lease/land title copy, and business location sketch within Barangay Sugcad.`;
  }
  if (lower.includes('jobseeker')) {
    return `${docName}: Requires 1 Valid ID and signed Oath of Undertaking under RA 11261 (First-Time Jobseekers Assistance Act).`;
  }
  return `${docName}: Requires 1 Valid ID and 1 month proof of residency in Barangay Sugcad.`;
}

function getStepIndex(status: DocumentRequestStatus): number {
  const idx = TICKET_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function ResidentPortal() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState<'requests' | 'profile'>('requests');
  const [loading, setLoading] = useState(true);
  const [resident, setResident] = useState<Resident | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [contactInput, setContactInput] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [claimSlipRequest, setClaimSlipRequest] = useState<DocumentRequest | null>(null);

  const loadPortalData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [types, resData] = await Promise.all([
        fetchDocumentTypes(),
        fetchResidentRequestsByProfile(user.id),
      ]);
      setDocumentTypes(types);
      if (types.length > 0) {
        setSelectedDocTypeId((prev) => prev || types[0].id);
      }
      setResident(resData.resident);
      setContactInput(resData.resident?.contact_number ?? '');
      setRequests(resData.requests);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load resident portal.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const selectedDocType = documentTypes.find((d) => d.id === selectedDocTypeId) ?? null;

  const activeCount = requests.filter(
    (r) => r.status === 'pending' || r.status === 'processing'
  ).length;
  const readyCount = requests.filter((r) => r.status === 'ready').length;
  const completedCount = requests.filter((r) => r.status === 'claimed').length;

  const residentFullName = resident
    ? `${resident.first_name} ${resident.last_name}`
    : user?.fullName ?? 'Resident';

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resident) {
      toast.error(
        'Your profile is not linked to a Barangay Sugcad resident record yet. Please contact the barangay secretary.'
      );
      return;
    }
    if (!selectedDocTypeId) {
      toast.error('Please select a document type.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDocumentRequest(resident.id, selectedDocTypeId);
      setRequests((prev) => [created, ...prev]);
      toast.success('Request submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit document request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resident) {
      toast.error('No linked resident record found.');
      return;
    }
    if (!contactInput.trim()) {
      toast.error('Please enter a valid contact number.');
      return;
    }
    setSavingContact(true);
    try {
      const updated = await updateResidentContact(resident.id, contactInput);
      setResident(updated);
      toast.success('Contact number updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update contact number.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <LayoutShell
      brandTitle="Barangay Sugcad"
      sectionTitle={activeNav === 'profile' ? 'My Resident Profile' : 'Resident e-Services Portal'}
      userEmail={user?.email ?? ''}
      userRoleLabel="resident"
      navItems={RESIDENT_NAV_ITEMS}
      activeNavId={activeNav}
      onSelectNav={(id) => setActiveNav(id as 'requests' | 'profile')}
      onLogout={handleLogout}
    >
      {activeNav === 'profile' ? (
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Resident Profile — Barangay Sugcad
              </h2>
              <p className="text-sm text-slate-500">
                Verify your household details and keep your contact number up to date for SMS pickup alerts.
              </p>
            </div>

            {loading ? (
              <PortalCardsSkeleton />
            ) : !resident ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Your account is not linked to a resident profile yet. Please visit Barangay Sugcad Hall for linking.
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-y border-slate-100 py-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Full Name</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {resident.first_name} {resident.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Birthdate</dt>
                    <dd className="mt-1 font-mono text-slate-800 tabular-nums">
                      {formatShortDate(resident.birthdate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Purok</dt>
                    <dd className="mt-1 text-slate-800">
                      {resident.households?.purok ?? 'Unassigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Household Address</dt>
                    <dd className="mt-1 text-slate-800">
                      {resident.households?.address ?? '—'}
                    </dd>
                  </div>
                </dl>

                <form onSubmit={handleSaveContact} className="space-y-4">
                  <div>
                    <label
                      htmlFor="profile-contact-number"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Contact Number
                    </label>
                    <input
                      id="profile-contact-number"
                      type="tel"
                      required
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="0917-123-4567"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingContact}
                      className="rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#172554] disabled:opacity-50 transition-colors"
                    >
                      {savingContact ? 'Saving...' : 'Save Contact Number'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Summary Stats (3 cards) */}
          {loading ? (
            <StatCardsSkeleton />
          ) : (
            <section
              aria-label="My request summary"
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Active Requests</p>
                  <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                    {activeCount}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Ready for Pickup</p>
                  <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                    {readyCount}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Completed</p>
                  <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                    {completedCount}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </section>
          )}

          {/* 2-Column Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column (Wider): Submit Request + My Requests Tickets */}
            <div className="lg:col-span-8 space-y-6">
              {/* Submit Request Form */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
                    <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900">
                      Request a Barangay Sugcad Document
                    </h2>
                    <p className="text-xs text-slate-500">
                      Welcome, {residentFullName}
                      {resident?.households
                        ? ` · ${resident.households.purok}`
                        : ''}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label
                      htmlFor="resident-doc-type"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Document Type
                    </label>
                    <select
                      id="resident-doc-type"
                      value={selectedDocTypeId}
                      onChange={(e) => setSelectedDocTypeId(e.target.value)}
                      required
                      disabled={loading || documentTypes.length === 0}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    >
                      {documentTypes.length === 0 && (
                        <option value="">Loading available documents...</option>
                      )}
                      {documentTypes.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.fee === 0 ? 'Free' : formatCurrencyPhp(doc.fee)} · {doc.processing_days} day{doc.processing_days > 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDocType && (
                    <>
                      <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/70 px-3.5 py-3 text-xs text-slate-700">
                        <Info
                          className="h-4 w-4 shrink-0 text-[#1e3a8a] mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">Document Requirements</p>
                          <p className="mt-0.5 leading-relaxed">
                            {getDocumentRequirements(selectedDocType.name)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                        <span>
                          Standard Fee:{' '}
                          <strong className="font-mono text-slate-900 tabular-nums">
                            {selectedDocType.fee === 0
                              ? 'Free of Charge'
                              : formatCurrencyPhp(selectedDocType.fee)}
                          </strong>
                        </span>
                        <span>
                          Estimated Processing:{' '}
                          <strong className="font-mono text-slate-900 tabular-nums">
                            {selectedDocType.processing_days} working day
                            {selectedDocType.processing_days > 1 ? 's' : ''}
                          </strong>
                        </span>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || loading || !selectedDocTypeId}
                    className="w-full rounded-lg bg-[#1e3a8a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#172554] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Submitting Request...' : 'Submit Document Request'}
                  </button>
                </form>
              </section>

              {/* My Requests (Ticket Cards with Visual Progress Bar) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    My Request Tickets
                  </h2>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {requests.length} total
                  </span>
                </div>

                {loading ? (
                  <PortalCardsSkeleton />
                ) : requests.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <FileText className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      You have not submitted any requests yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Select a document above to submit your first application.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((req) => {
                      const activeStep = getStepIndex(req.status);
                      const canViewSlip =
                        req.status === 'ready' || req.status === 'claimed';

                      return (
                        <article
                          key={req.id}
                          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md space-y-4"
                        >
                          {/* Ticket Top Row */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums">
                                  #{req.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span aria-hidden="true" className="text-slate-300">
                                  ·
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                  <span>{formatShortDate(req.requested_at)}</span>
                                </span>
                              </div>
                              <h3 className="font-display text-base font-semibold text-slate-900">
                                {req.document_types?.name ?? 'Barangay Certificate'}
                              </h3>
                              <p className="text-xs text-slate-500 font-mono tabular-nums">
                                Fee:{' '}
                                {req.document_types?.fee
                                  ? formatCurrencyPhp(req.document_types.fee)
                                  : 'Free'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-start">
                              <RequestStatusBadge status={req.status} />
                            </div>
                          </div>

                          {/* Visual Horizontal Progress Bar */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-4 gap-2">
                              {TICKET_STEPS.map((step, idx) => {
                                const completed = idx <= activeStep;
                                const isCurrent = idx === activeStep;
                                return (
                                  <div key={step.key} className="space-y-1.5">
                                    <div
                                      className={`h-1.5 w-full rounded-full transition-colors ${
                                        completed
                                          ? req.status === 'claimed' || req.status === 'ready'
                                            ? 'bg-emerald-600'
                                            : 'bg-[#1e3a8a]'
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                    <p
                                      className={`text-[11px] font-medium truncate ${
                                        isCurrent
                                          ? 'text-slate-900 font-semibold'
                                          : completed
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                      }`}
                                    >
                                      {step.label}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Claim Slip Button when Ready or Claimed */}
                          {canViewSlip && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setClaimSlipRequest(req)}
                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                              >
                                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>View Claim Slip</span>
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column (Narrower): Announcements & Emergency Hotlines */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Barangay Announcements */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Barangay Announcements
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {ANNOUNCEMENTS.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-xs font-medium text-[#1e3a8a] tabular-nums">
                        {item.date}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Emergency Hotlines */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Emergency Hotlines
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {EMERGENCY_HOTLINES.map((hotline) => (
                    <div key={hotline.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <Phone
                        className="h-4 w-4 shrink-0 text-slate-400 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {hotline.label}
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-medium text-[#1e3a8a] tabular-nums">
                          {hotline.number}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {hotline.hours}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}

      <ClaimSlipModal
        request={claimSlipRequest}
        residentName={residentFullName}
        onClose={() => setClaimSlipRequest(null)}
      />
    </LayoutShell>
  );
}
