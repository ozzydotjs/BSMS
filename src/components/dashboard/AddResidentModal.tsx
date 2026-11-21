import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Household, Resident } from '../../types/database';
import type { ResidentInput } from '../../services/barangayData';

interface AddResidentModalProps {
  open: boolean;
  households: Household[];
  editingResident?: Resident | null;
  onClose: () => void;
  onSubmit: (input: ResidentInput, editingId?: string) => Promise<void>;
}

export function AddResidentModal({
  open,
  households,
  editingResident = null,
  onClose,
  onSubmit,
}: AddResidentModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (editingResident) {
      setFirstName(editingResident.first_name);
      setLastName(editingResident.last_name);
      setBirthdate(editingResident.birthdate ? editingResident.birthdate.slice(0, 10) : '');
      setHouseholdId(editingResident.household_id || (households[0]?.id ?? ''));
      setContactNumber(editingResident.contact_number);
    } else {
      setFirstName('');
      setLastName('');
      setBirthdate('');
      setHouseholdId(households[0]?.id ?? '');
      setContactNumber('');
    }
  }, [open, editingResident, households]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isEditing = Boolean(editingResident);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !birthdate || !householdId || !contactNumber.trim()) {
      setFormError('Please fill in all required resident fields.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          first_name: firstName,
          last_name: lastName,
          birthdate,
          household_id: householdId,
          contact_number: contactNumber,
        },
        editingResident?.id
      );
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save resident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-resident-modal-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="add-resident-modal-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              {isEditing ? 'Edit Resident Record' : 'Add New Resident'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update resident details and household assignment in Barangay Sugcad.'
                : 'Register a resident record and link it to a Barangay Sugcad household.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="resident-first-name"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                First Name
              </label>
              <input
                id="resident-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>

            <div>
              <label
                htmlFor="resident-last-name"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Last Name
              </label>
              <input
                id="resident-last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="resident-birthdate"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Birthdate
              </label>
              <input
                id="resident-birthdate"
                type="date"
                required
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>

            <div>
              <label
                htmlFor="resident-contact"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Contact Number
              </label>
              <input
                id="resident-contact"
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="0917-123-4567"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="resident-household"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Household Address & Purok
            </label>
            <select
              id="resident-household"
              required
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            >
              {households.length === 0 && (
                <option value="">No households available</option>
              )}
              {households.map((hh) => (
                <option key={hh.id} value={hh.id}>
                  {hh.purok} — {hh.address}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || households.length === 0}
              className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#172554] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Resident' : 'Save Resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
