export type UserRole = 'admin' | 'staff' | 'resident';

export type DocumentRequestStatus = 'pending' | 'processing' | 'ready' | 'claimed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
}

export interface Household {
  id: string;
  address: string;
  purok: string;
}

export interface Resident {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  birthdate: string;
  household_id: string;
  contact_number: string;
  households?: Household | null;
}

export interface DocumentType {
  id: string;
  name: string;
  fee: number;
  processing_days: number;
}

export interface DocumentRequest {
  id: string;
  resident_id: string;
  document_type_id: string;
  status: DocumentRequestStatus;
  requested_at: string;
  residents?: Pick<Resident, 'id' | 'first_name' | 'last_name' | 'contact_number'> | null;
  document_types?: DocumentType | null;
}

export interface Incident {
  id: string;
  complainant_id: string;
  respondent_name: string;
  incident_type: string;
  narrative: string;
  likelihood_score: number;
  consequence_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  official_risk_level: RiskLevel | null;
  recorded_at: string;
  residents?: Pick<Resident, 'id' | 'first_name' | 'last_name'> | null;
}

export interface MonthlyRequestAnalytic {
  request_month: string;
  document_type_id: string;
  total_requests: number;
}
