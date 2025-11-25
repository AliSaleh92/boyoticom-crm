export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'employee';
  allowedApps?: string[];
  permissions?: {
    crm_access?: boolean;
    crm_role?: 'none' | 'employee' | 'supervisor';
    crm_reports?: boolean;
    crm_delete?: boolean;
    crm_export?: boolean;
    att_access?: boolean;
    att_role?: 'none' | 'employee' | 'supervisor';
    att_reports?: boolean;
    att_zones?: boolean;
    [key: string]: any;
  };
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  projects?: string[];
  status: string;
  assignedTo?: string;
  addedBy?: string;
  dateAdded?: string;
  nextFollowUp?: string;
  source?: string;
  unitNumber?: string;
  notes?: Record<string, Note> | Note[];
  history?: Record<string, HistoryLog> | HistoryLog[];
}

export interface Note {
  text: string;
  date: string;
  author: string;
}

export interface HistoryLog {
  action: string;
  user: string;
  date: string;
}

export interface Zone {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  lat: number;
  lng: number;
  radius: number;
  assignedUsers?: string[];
}

export interface AttendanceLog {
  id: string;
  uid: string;
  type: 'IN' | 'OUT';
  timestamp: string;
  locationStatus: string;
}

export interface PermissionRequest {
  id: string;
  uid: string;
  userName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  date: string;
}