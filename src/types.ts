import { Timestamp } from 'firebase/firestore';
import { MedicationInfo } from './services/geminiService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface MedicationItem extends MedicationInfo {
  id: string;
}

export interface MedicationPouch {
  id: string;
  userId: string;
  pouchName: string;
  prescriptionDate: string;
  medications: MedicationItem[];
  hospitalName?: string;
  pharmacyName?: string;
  takenToday: boolean;
  createdAt: Timestamp | string;
  status: 'pending_approval' | 'approved';
  imageUrl?: string;
  timesPerDay: number;
  dosageDays: number;
  remainingPouches: number;
  instructions: string; // Overall instructions
  schedule: string[]; // Overall schedule for the pouch
}

export interface UserProfile {
  role: 'senior' | 'guardian' | 'solo';
  name: string;
  groupCode?: string;
}

export interface Group {
  adminId: string;
  groupCode: string;
  memberIds: string[];
}

export enum View {
  LOGIN_ROLE = 'login_role',
  MAIN = 'main',
  TODAY = 'today',
  ADD = 'add',
  GUARDIAN = 'guardian',
  SENIOR_DETAIL = 'senior_detail',
  EDIT_MED = 'edit_med',
  REVIEW_MED = 'review_med',
  REGISTRATION = 'registration'
}
