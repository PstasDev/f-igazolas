// System Message types matching Django backend

export type SystemMessageSeverity = 'info' | 'warning' | 'error';
export type SystemMessageType = 'user' | 'developer' | 'operator' | 'support';

export interface SystemMessage {
  id: number;
  title: string;
  message: string;
  severity: SystemMessageSeverity;
  messageType: SystemMessageType;
  showFrom: string; // ISO datetime string
  showTo: string; // ISO datetime string
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  is_active: boolean;
}
