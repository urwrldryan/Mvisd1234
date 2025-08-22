
export type UploadStatus = 'pending' | 'approved';

export interface UploadItem {
  id: number;
  title: string;
  url: string;
  description?: string;
  status: UploadStatus;
  submittedBy: string; // username
}

export type Tab = 'main' | 'community' | 'chat' | 'admin' | 'profile';

export type AlertType = 'success' | 'error' | 'info';

export interface AlertMessage {
    message: string;
    type: AlertType;
}

export type UserRole = 'owner' | 'co-owner' | 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: number;
  adminUsername: string;
  action: 'approved' | 'rejected';
  uploadId: number;
  uploadTitle: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: number;
  username: string;
  text: string;
  timestamp: Date;
}