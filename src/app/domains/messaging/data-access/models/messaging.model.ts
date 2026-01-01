// Message Types
export type MessageType = 'secure' | 'internal' | 'system' | 'alert';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageStatus = 'draft' | 'sent' | 'delivered' | 'read' | 'archived';
export type MessageCategory = 'general' | 'clinical' | 'billing' | 'scheduling' | 'lab-results' | 'prescription' | 'referral';

// Participant Types
export type ParticipantType = 'patient' | 'provider' | 'staff' | 'department' | 'external';

export interface Participant {
  id: string;
  type: ParticipantType;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  department?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

// Message Thread
export interface MessageThread {
  id: string;
  subject: string;
  type: MessageType;
  category: MessageCategory;
  priority: MessagePriority;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  isStarred: boolean;
  isPinned: boolean;
  labels: string[];
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Individual Message
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: ParticipantType;
  senderAvatar?: string;
  content: string;
  htmlContent?: string;
  status: MessageStatus;
  priority: MessagePriority;
  attachments: Attachment[];
  replyTo?: string;
  readBy: ReadReceipt[];
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ReadReceipt {
  participantId: string;
  participantName: string;
  readAt: Date;
}

// Message Draft
export interface MessageDraft {
  id: string;
  threadId?: string;
  recipients: Participant[];
  subject: string;
  content: string;
  attachments: Attachment[];
  priority: MessagePriority;
  category: MessageCategory;
  savedAt: Date;
}

// Quick Reply Template
export interface QuickReply {
  id: string;
  name: string;
  content: string;
  category: MessageCategory;
  createdBy: string;
  isShared: boolean;
}

// Message Folder
export interface MessageFolder {
  id: string;
  name: string;
  icon: string;
  count: number;
  unreadCount: number;
  color?: string;
  isSystem: boolean;
  parentId?: string;
}

// Task Types
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'deferred';
export type TaskCategory = 'clinical' | 'administrative' | 'billing' | 'follow-up' | 'documentation' | 'referral' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: Participant;
  assignedBy: Participant;
  dueDate?: Date;
  completedAt?: Date;
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  linkedMessageId?: string;
  tags: string[];
  comments: TaskComment[];
  attachments: Attachment[];
  reminders: TaskReminder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  isTriggered: boolean;
  method: 'email' | 'in-app' | 'both';
}

// Task Filter
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignedTo?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  patientId?: string;
  search?: string;
}

// Notification Types
export type NotificationType = 
  | 'message' 
  | 'task' 
  | 'appointment' 
  | 'lab-result' 
  | 'prescription' 
  | 'alert' 
  | 'system' 
  | 'billing'
  | 'document'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Notification Settings
export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    allowCritical: boolean;
  };
}

// Patient Portal Message
export interface PatientMessage {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  subject: string;
  content: string;
  type: 'question' | 'prescription-refill' | 'appointment-request' | 'billing-question' | 'test-result-question' | 'other';
  status: 'new' | 'pending' | 'responded' | 'closed';
  responseRequired: boolean;
  responseDeadline?: Date;
  assignedTo?: string;
  responses: PatientMessageResponse[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientMessageResponse {
  id: string;
  messageId: string;
  responderId: string;
  responderName: string;
  responderRole: string;
  content: string;
  isPatientVisible: boolean;
  createdAt: Date;
}

// Broadcast Message
export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'alert' | 'policy-update' | 'maintenance';
  priority: MessagePriority;
  targetAudience: {
    roles?: string[];
    departments?: string[];
    locations?: string[];
    all?: boolean;
  };
  scheduledFor?: Date;
  expiresAt?: Date;
  sentAt?: Date;
  sentBy: string;
  readBy: string[];
  createdAt: Date;
}

// Message Statistics
export interface MessagingStats {
  totalMessages: number;
  unreadMessages: number;
  sentToday: number;
  avgResponseTime: number;
  patientMessages: {
    total: number;
    pending: number;
    avgResponseTime: number;
  };
  taskStats: {
    total: number;
    pending: number;
    overdue: number;
    completedToday: number;
  };
}

// Search Result
export interface MessageSearchResult {
  type: 'thread' | 'message' | 'task' | 'patient-message';
  id: string;
  title: string;
  excerpt: string;
  participants?: string[];
  date: Date;
  matchedFields: string[];
}

// Presence Status
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  statusMessage?: string;
  lastActivity: Date;
  currentLocation?: string;
}

// Typing Indicator
export interface TypingIndicator {
  threadId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}
