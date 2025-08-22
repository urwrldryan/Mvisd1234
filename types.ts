
export type UploadStatus = 'pending' | 'approved';

export interface UploadItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  status: UploadStatus;
  submittedBy: string; // username
  timestamp: Date;
}

export type Tab = 'main' | 'community' | 'chat' | 'admin' | 'profile';

export type AlertType = 'success' | 'error' | 'info';

export interface AlertMessage {
    message: string;
    type: AlertType;
}

export type UserRole = 'owner' | 'co-owner' | 'admin' | 'user';

export interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth user ID
  username: string;
  email: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: string;
  adminUsername: string;
  action: 'approved' | 'rejected';
  uploadId: string;
  uploadTitle: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
}
