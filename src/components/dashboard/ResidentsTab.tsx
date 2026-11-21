import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Household, Resident } from '../../types/database';
import {
  fetchResidentsPaginated,
  RESIDENTS_PAGE_SIZE,
  type ResidentInput,
} from '../../services/barangayData';
import { formatShortDate } from '../../utils/risk';
import { TableSkeleton } from '../SkeletonLoader';
import { AddResidentModal } from './AddResidentModal';

interface ResidentsTabProps {
  households: Household[];
  onCreateResident: (input: ResidentInput) => Promise<void>;
  onUpdateResident: (residentId: string, input: ResidentInput) => Promise<void>;
  onDeleteResident: (residentId: string) => Promise<void>;
}

export function ResidentsTab({
  households,
  onCreateResident,
  onUpdateResident,
  onDeleteResident,
}: ResidentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Resident[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchResidentsPaginated(page, debouncedSearch, RESIDENTS_PAGE_SIZE);
      setRows(result.rows);
      setTotalCount(result.totalCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load residents.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / RESIDENTS_PAGE_SIZE));
  const startRow = totalCount === 0 ? 0 : page * RESIDENTS_PAGE_SIZE + 1;
  const endRow = Math.min((page + 1) * RESIDENTS_PAGE_SIZE, totalCount);

  const handleOpenAdd = () => {
    setEditingResident(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (resident: Resident) => {
    setEditingResident(resident);
    setModalOpen(true);
  };

  const handleModalSubmit = async (input: ResidentInput, editingId?: string) => {
    if (editingId) {
      await onUpdateResident(editingId, input);
    } else {
      await onCreateResident(input);
    }
    await loadPage();
  };

  const handleConfirmDelete = async (residentId: string) => {
    setDeletingId(residentId);
    try {
      await onDeleteResident(residentId);
      setConfirmDeleteId(null);
      await loadPage();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents by name..."
            aria-label="Search residents by name"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#172554] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Resident</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Resident Name
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Purok
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Household Address
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Birthdate
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Contact Number
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((resident) => {
                  const fullName = `${resident.first_name} ${resident.last_name}`;
                  const isConfirming = confirmDeleteId === resident.id;
                  return (
                    <tr
                      key={resident.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {resident.last_name}, {resident.first_name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {resident.households?.purok ?? 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {resident.households?.address ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-xs tabular-nums whitespace-nowrap">
                        {formatShortDate(resident.birthdate)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-xs tabular-nums whitespace-nowrap">
                        {resident.contact_number}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingId === resident.id}
                              onClick={() => handleConfirmDelete(resident.id)}
                              className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                            >
                              {deletingId === resident.id ? 'Removing...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(resident)}
                              aria-label={`Edit ${fullName}`}
                              title="Edit resident"
                              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-[#1e3a8a] transition-colors"
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(resident.id)}
                              aria-label={`Delete ${fullName}`}
                              title="Delete resident"
                              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                        <Users className="h-8 w-8 text-slate-300" aria-hidden="true" />
                        <p className="text-sm font-medium text-slate-700">
                          No matching residents found
                        </p>
                        <p className="text-xs text-slate-500">
                          {searchQuery
                            ? 'Try adjusting your search query.'
                            : 'Add the first resident record to populate the registry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 50-Row Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600 font-mono tabular-nums">
              Showing {startRow}–{endRow} of {totalCount} residents · Page {page + 1} of{' '}
              {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AddResidentModal
        open={modalOpen}
        households={households}
        editingResident={editingResident}
        onClose={() => {
          setModalOpen(false);
          setEditingResident(null);
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
