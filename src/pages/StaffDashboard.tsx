import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { LayoutShell, type SidebarNavItem } from '../components/LayoutShell';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { ResidentsTab } from '../components/dashboard/ResidentsTab';
import { DocumentRequestsTab } from '../components/dashboard/DocumentRequestsTab';
import { IncidentLoggingTab } from '../components/dashboard/IncidentLoggingTab';
import { AnalyticsTab } from '../components/dashboard/AnalyticsTab';
import { ReportsTab } from '../components/dashboard/ReportsTab';
import { useAuth } from '../context/AuthContext';
import {
  createIncident,
  createResident,
  deleteResident,
  fetchDocumentRequests,
  fetchDocumentTypes,
  fetchHouseholds,
  fetchIncidents,
  fetchMonthlyAnalytics,
  fetchResidents,
  updateDocumentRequestStatus,
  updateResident,
  type NewIncidentInput,
  type ResidentInput,
} from '../services/barangayData';
import type {
  DocumentRequest,
  DocumentRequestStatus,
  DocumentType,
  Household,
  Incident,
  MonthlyRequestAnalytic,
  Resident,
} from '../types/database';

const STAFF_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'residents', label: 'Residents', icon: Users },
  { id: 'requests', label: 'Document Requests', icon: FileText },
  { id: 'incidents', label: 'Incident Logging', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics & Forecasting', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
];

const TAB_TITLES: Record<string, string> = {
  overview: 'Barangay Sugcad Operations Overview',
  residents: 'Resident Registry & Households',
  requests: 'Document Request Queue',
  incidents: 'Incident Blotter & Risk Assessment',
  analytics: 'Request Volume Analytics & Forecasting',
  reports: 'Official CSV Reports',
};

export function StaffDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyRequestAnalytic[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [hh, res, docTypes, reqs, incs, analytics] = await Promise.all([
        fetchHouseholds(),
        fetchResidents(),
        fetchDocumentTypes(),
        fetchDocumentRequests(),
        fetchIncidents(),
        fetchMonthlyAnalytics(),
      ]);
      setHouseholds(hh);
      setResidents(res);
      setDocumentTypes(docTypes);
      setRequests(reqs);
      setIncidents(incs);
      setMonthlyAnalytics(analytics);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load Barangay Sugcad records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCreateResident = async (input: ResidentInput) => {
    const created = await createResident(input);
    setResidents((prev) => [created, ...prev]);
    toast.success('Resident added successfully');
  };

  const handleUpdateResident = async (residentId: string, input: ResidentInput) => {
    const updated = await updateResident(residentId, input);
    setResidents((prev) =>
      prev.map((item) => (item.id === residentId ? updated : item))
    );
    toast.success('Resident updated');
  };

  const handleDeleteResident = async (residentId: string) => {
    try {
      await deleteResident(residentId);
      setResidents((prev) => prev.filter((item) => item.id !== residentId));
      toast.success('Resident record removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to delete resident.');
      throw err;
    }
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    nextStatus: DocumentRequestStatus
  ) => {
    try {
      const updated = await updateDocumentRequestStatus(requestId, nextStatus);
      setRequests((prev) =>
        prev.map((item) => (item.id === requestId ? updated : item))
      );
      toast.success('Request updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update request status.');
    }
  };

  const handleLogIncident = async (input: NewIncidentInput) => {
    try {
      const created = await createIncident(input);
      setIncidents((prev) => [created, ...prev]);
      toast.success('Incident logged successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to log incident.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <LayoutShell
      brandTitle="Barangay Sugcad"
      sectionTitle={TAB_TITLES[activeTab] ?? 'Staff Dashboard'}
      userEmail={user?.email ?? ''}
      userRoleLabel={user?.role ?? 'staff'}
      navItems={STAFF_NAV_ITEMS}
      activeNavId={activeTab}
      onSelectNav={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'overview' && (
        <OverviewTab
          loading={loading}
          residents={residents}
          requests={requests}
          incidents={incidents}
          onNavigateTab={setActiveTab}
        />
      )}
      {activeTab === 'residents' && (
        <ResidentsTab
          households={households}
          onCreateResident={handleCreateResident}
          onUpdateResident={handleUpdateResident}
          onDeleteResident={handleDeleteResident}
        />
      )}
      {activeTab === 'requests' && (
        <DocumentRequestsTab
          loading={loading}
          requests={requests}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      )}
      {activeTab === 'incidents' && (
        <IncidentLoggingTab
          loading={loading}
          incidents={incidents}
          residents={residents}
          onLogIncident={handleLogIncident}
        />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          loading={loading}
          monthlyAnalytics={monthlyAnalytics}
          documentTypes={documentTypes}
        />
      )}
      {activeTab === 'reports' && (
        <ReportsTab
          residents={residents}
          requests={requests}
          incidents={incidents}
        />
      )}
    </LayoutShell>
  );
}
