export type Role = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type ClientStatus = 
  | 'New' 
  | 'Contacted1' 
  | 'Contacted2' 
  | 'Contacted3' 
  | 'Deposit' 
  | 'Sold' 
  | 'Cancelled';

export interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  projects: string[]; // Multi-select
  unitNumber?: string; // New
  purchaseType?: 'Cash' | 'Finance'; // New
  
  status: ClientStatus;
  source?: string;
  assignedTo?: string; // User Name
  dateAdded: string;
  addedBy: string;
  notes?: Record<string, Note>;
  tasks?: Record<string, Task>;
}

export const STATUS_LIST: { key: ClientStatus; label: string; color: string }[] = [
  { key: 'New', label: 'عميل جديد', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'Contacted1', label: 'تم التواصل 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'Contacted2', label: 'تم التواصل 2', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'Contacted3', label: 'تم التواصل 3', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { key: 'Deposit', label: 'دفع عربون', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'Sold', label: 'تم البيع', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'Cancelled', label: 'ملغي', color: 'bg-red-50 text-red-700 border-red-200' },
];

// Updated Sources
export const CLIENT_SOURCES = ["مباشر", "عقار", "اعلانات رقمية", "توصية صديق"];

// Available Projects for Multi-select
export const PROJECT_LIST = ["مشروع العارض", "مشروع النرجس", "بيوتكم 1", "بيوتكم 2", "فلل الياسمين", "أراضي الخير"];

export const PURCHASE_TYPES = [
  { id: 'Cash', label: 'كاش' },
  { id: 'Finance', label: 'تمويل بنكي' }
];