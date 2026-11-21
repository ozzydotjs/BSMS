import { supabase } from '../lib/supabase';
import type {
  DocumentRequest,
  DocumentRequestStatus,
  DocumentType,
  Household,
  Incident,
  MonthlyRequestAnalytic,
  Resident,
  RiskLevel,
} from '../types/database';
import { calculateRiskScore, deriveRiskLevel } from '../utils/risk';

export const RESIDENTS_PAGE_SIZE = 50;

export interface ResidentInput {
  first_name: string;
  last_name: string;
  birthdate: string;
  household_id: string;
  contact_number: string;
}

export interface NewIncidentInput {
  complainant_id: string;
  respondent_name: string;
  incident_type: string;
  narrative: string;
  likelihood_score: number;
  consequence_score: number;
  official_risk_level: RiskLevel | null;
  incident_date: string;
  incident_time: string;
}

export interface PaginatedResidentsResult {
  rows: Resident[];
  totalCount: number;
}

export async function fetchHouseholds(): Promise<Household[]> {
  const { data, error } = await supabase
    .from('households')
    .select('id, address, purok')
    .order('purok', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Household[];
}

export async function fetchResidents(): Promise<Resident[]> {
  const { data, error } = await supabase
    .from('residents')
    .select('id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)')
    .order('last_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Resident[];
}

export async function fetchResidentsPaginated(
  page: number,
  searchQuery = '',
  pageSize = RESIDENTS_PAGE_SIZE
): Promise<PaginatedResidentsResult> {
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  const trimmed = searchQuery.trim();

  let query = supabase
    .from('residents')
    .select(
      'id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)',
      { count: 'exact' }
    )
    .order('last_name', { ascending: true })
    .range(from, to);

  if (trimmed) {
    query = query.or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return {
    rows: (data ?? []) as unknown as Resident[],
    totalCount: count ?? 0,
  };
}

export async function createResident(input: ResidentInput): Promise<Resident> {
  const { data, error } = await supabase
    .from('residents')
    .insert({
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      birthdate: input.birthdate,
      household_id: input.household_id,
      contact_number: input.contact_number.trim(),
    })
    .select('id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)')
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Resident;
}

export async function updateResident(residentId: string, input: ResidentInput): Promise<Resident> {
  const { data, error } = await supabase
    .from('residents')
    .update({
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      birthdate: input.birthdate,
      household_id: input.household_id,
      contact_number: input.contact_number.trim(),
    })
    .eq('id', residentId)
    .select('id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)')
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Resident;
}

export async function deleteResident(residentId: string): Promise<void> {
  const { error } = await supabase
    .from('residents')
    .delete()
    .eq('id', residentId);
  if (error) throw new Error(error.message);
}

export async function updateResidentContact(
  residentId: string,
  contactNumber: string
): Promise<Resident> {
  const { data, error } = await supabase
    .from('residents')
    .update({ contact_number: contactNumber.trim() })
    .eq('id', residentId)
    .select('id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)')
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Resident;
}

export async function fetchDocumentTypes(): Promise<DocumentType[]> {
  const { data, error } = await supabase
    .from('document_types')
    .select('id, name, fee, processing_days')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentType[];
}

export async function fetchDocumentRequests(): Promise<DocumentRequest[]> {
  const { data, error } = await supabase
    .from('document_requests')
    .select(
      'id, resident_id, document_type_id, status, requested_at, residents(id, first_name, last_name, contact_number), document_types(id, name, fee, processing_days)'
    )
    .order('requested_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DocumentRequest[];
}

export async function fetchResidentRequestsByProfile(
  profileId: string
): Promise<{ resident: Resident | null; requests: DocumentRequest[] }> {
  const { data: residentData, error: residentErr } = await supabase
    .from('residents')
    .select('id, profile_id, first_name, last_name, birthdate, household_id, contact_number, households(id, address, purok)')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (residentErr) throw new Error(residentErr.message);
  const resident = (residentData as unknown as Resident | null) ?? null;
  if (!resident) return { resident: null, requests: [] };

  const { data: reqData, error: reqErr } = await supabase
    .from('document_requests')
    .select(
      'id, resident_id, document_type_id, status, requested_at, document_types(id, name, fee, processing_days)'
    )
    .eq('resident_id', resident.id)
    .order('requested_at', { ascending: false });

  if (reqErr) throw new Error(reqErr.message);
  return {
    resident,
    requests: (reqData ?? []) as unknown as DocumentRequest[],
  };
}

export async function createDocumentRequest(
  residentId: string,
  documentTypeId: string
): Promise<DocumentRequest> {
  const { data, error } = await supabase
    .from('document_requests')
    .insert({
      resident_id: residentId,
      document_type_id: documentTypeId,
      status: 'pending',
    })
    .select(
      'id, resident_id, document_type_id, status, requested_at, residents(id, first_name, last_name, contact_number), document_types(id, name, fee, processing_days)'
    )
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as DocumentRequest;
}

export async function updateDocumentRequestStatus(
  requestId: string,
  status: DocumentRequestStatus
): Promise<DocumentRequest> {
  const { data, error } = await supabase
    .from('document_requests')
    .update({ status })
    .eq('id', requestId)
    .select(
      'id, resident_id, document_type_id, status, requested_at, residents(id, first_name, last_name, contact_number), document_types(id, name, fee, processing_days)'
    )
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as DocumentRequest;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id, complainant_id, respondent_name, incident_type, narrative, likelihood_score, consequence_score, risk_score, risk_level, official_risk_level, recorded_at, residents(id, first_name, last_name)'
    )
    .order('recorded_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Incident[];
}

export async function createIncident(input: NewIncidentInput): Promise<Incident> {
  const riskScore = calculateRiskScore(input.likelihood_score, input.consequence_score);
  const riskLevel = deriveRiskLevel(riskScore);

  const datePart = input.incident_date || new Date().toISOString().slice(0, 10);
  const timePart = input.incident_time || '00:00';
  const parsedDate = new Date(`${datePart}T${timePart}`);
  const recordedAt = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      complainant_id: input.complainant_id,
      respondent_name: input.respondent_name.trim(),
      incident_type: input.incident_type.trim(),
      narrative: input.narrative.trim(),
      likelihood_score: input.likelihood_score,
      consequence_score: input.consequence_score,
      risk_score: riskScore,
      risk_level: riskLevel,
      official_risk_level: input.official_risk_level ?? null,
      recorded_at: recordedAt,
    })
    .select(
      'id, complainant_id, respondent_name, incident_type, narrative, likelihood_score, consequence_score, risk_score, risk_level, official_risk_level, recorded_at, residents(id, first_name, last_name)'
    )
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as Incident;
}

export async function fetchMonthlyAnalytics(): Promise<MonthlyRequestAnalytic[]> {
  const { data, error } = await supabase
    .from('monthly_request_analytics')
    .select('request_month, document_type_id, total_requests')
    .order('request_month', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MonthlyRequestAnalytic[];
}
