import { Injectable, signal, computed } from '@angular/core';
import { 
  MessageThread, Message, Task, Notification, Participant,
  MessageFolder, MessageDraft, QuickReply, PatientMessage,
  MessagingStats, MessageSearchResult, UserPresence,
  MessageType, MessageStatus, MessagePriority, MessageCategory,
  TaskStatus, TaskPriority, TaskCategory,
  NotificationType, PresenceStatus
} from '../models/messaging.model';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  // Current user
  private currentUser: Participant = {
    id: 'user-1',
    type: 'provider',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    role: 'Physician',
    department: 'Internal Medicine',
    isOnline: true
  };

  // State signals
  private _threads = signal<MessageThread[]>(this.generateMockThreads());
  private _messages = signal<Map<string, Message[]>>(this.generateMockMessages());
  private _tasks = signal<Task[]>(this.generateMockTasks());
  private _notifications = signal<Notification[]>(this.generateMockNotifications());
  private _patientMessages = signal<PatientMessage[]>(this.generateMockPatientMessages());
  private _folders = signal<MessageFolder[]>(this.generateMockFolders());
  private _drafts = signal<MessageDraft[]>([]);
  private _quickReplies = signal<QuickReply[]>(this.generateMockQuickReplies());
  private _presence = signal<Map<string, UserPresence>>(new Map());
  
  private _selectedThreadId = signal<string | null>(null);
  private _selectedFolder = signal<string>('inbox');
  private _searchQuery = signal<string>('');
  private _isLoading = signal<boolean>(false);

  // Public readonly signals
  readonly threads = this._threads.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly patientMessages = this._patientMessages.asReadonly();
  readonly folders = this._folders.asReadonly();
  readonly drafts = this._drafts.asReadonly();
  readonly quickReplies = this._quickReplies.asReadonly();
  readonly selectedThreadId = this._selectedThreadId.asReadonly();
  readonly selectedFolder = this._selectedFolder.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed values
  readonly selectedThread = computed(() => {
    const id = this._selectedThreadId();
    return id ? this._threads().find(t => t.id === id) : null;
  });

  readonly selectedThreadMessages = computed(() => {
    const id = this._selectedThreadId();
    return id ? this._messages().get(id) || [] : [];
  });

  readonly filteredThreads = computed(() => {
    const folder = this._selectedFolder();
    const query = this._searchQuery().toLowerCase();
    let threads = this._threads();

    // Filter by folder
    switch (folder) {
      case 'inbox':
        threads = threads.filter(t => t.type !== 'system');
        break;
      case 'sent':
        threads = threads.filter(t => t.lastMessage.senderId === this.currentUser.id);
        break;
      case 'starred':
        threads = threads.filter(t => t.isStarred);
        break;
      case 'archived':
        threads = threads.filter(t => t.lastMessage.status === 'archived');
        break;
      case 'patient':
        threads = threads.filter(t => t.type === 'secure' && t.patientId);
        break;
      case 'internal':
        threads = threads.filter(t => t.type === 'internal');
        break;
    }

    // Search filter
    if (query) {
      threads = threads.filter(t => 
        t.subject.toLowerCase().includes(query) ||
        t.participants.some(p => p.name.toLowerCase().includes(query)) ||
        t.lastMessage.content.toLowerCase().includes(query)
      );
    }

    return threads.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  });

  readonly unreadCount = computed(() => 
    this._threads().reduce((sum, t) => sum + t.unreadCount, 0)
  );

  readonly unreadNotificationCount = computed(() => 
    this._notifications().filter(n => !n.isRead && !n.isDismissed).length
  );

  readonly pendingTaskCount = computed(() => 
    this._tasks().filter(t => t.status === 'pending' || t.status === 'in-progress').length
  );

  readonly overdueTaskCount = computed(() => {
    const now = new Date();
    return this._tasks().filter(t => 
      t.dueDate && 
      t.dueDate < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    ).length;
  });

  readonly stats = computed<MessagingStats>(() => ({
    totalMessages: this._threads().reduce((sum, t) => sum + 1, 0),
    unreadMessages: this.unreadCount(),
    sentToday: this._threads().filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return t.lastMessage.createdAt >= today && t.lastMessage.senderId === this.currentUser.id;
    }).length,
    avgResponseTime: 45, // minutes
    patientMessages: {
      total: this._patientMessages().length,
      pending: this._patientMessages().filter(m => m.status === 'new' || m.status === 'pending').length,
      avgResponseTime: 120
    },
    taskStats: {
      total: this._tasks().length,
      pending: this.pendingTaskCount(),
      overdue: this.overdueTaskCount(),
      completedToday: this._tasks().filter(t => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return t.completedAt && t.completedAt >= today;
      }).length
    }
  }));

  // Thread operations
  selectThread(threadId: string): void {
    this._selectedThreadId.set(threadId);
    this.markThreadAsRead(threadId);
  }

  selectFolder(folder: string): void {
    this._selectedFolder.set(folder);
    this._selectedThreadId.set(null);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  toggleStar(threadId: string): void {
    this._threads.update(threads => 
      threads.map(t => 
        t.id === threadId ? { ...t, isStarred: !t.isStarred } : t
      )
    );
  }

  togglePin(threadId: string): void {
    this._threads.update(threads => 
      threads.map(t => 
        t.id === threadId ? { ...t, isPinned: !t.isPinned } : t
      )
    );
  }

  archiveThread(threadId: string): void {
    this._threads.update(threads => 
      threads.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessage: { ...t.lastMessage, status: 'archived' as MessageStatus }
          };
        }
        return t;
      })
    );
  }

  deleteThread(threadId: string): void {
    this._threads.update(threads => threads.filter(t => t.id !== threadId));
    this._messages.update(map => {
      const newMap = new Map(map);
      newMap.delete(threadId);
      return newMap;
    });
  }

  markThreadAsRead(threadId: string): void {
    this._threads.update(threads => 
      threads.map(t => 
        t.id === threadId ? { ...t, unreadCount: 0 } : t
      )
    );
  }

  // Message operations
  sendMessage(threadId: string, content: string, attachments: any[] = []): void {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderType: this.currentUser.type,
      content,
      status: 'sent',
      priority: 'normal',
      attachments: [],
      readBy: [],
      createdAt: new Date()
    };

    this._messages.update(map => {
      const newMap = new Map(map);
      const messages = newMap.get(threadId) || [];
      newMap.set(threadId, [...messages, newMessage]);
      return newMap;
    });

    // Update thread
    this._threads.update(threads => 
      threads.map(t => 
        t.id === threadId 
          ? { ...t, lastMessage: newMessage, updatedAt: new Date() }
          : t
      )
    );
  }

  createThread(subject: string, recipients: Participant[], content: string, options: Partial<MessageThread> = {}): string {
    const threadId = `thread-${Date.now()}`;
    const now = new Date();

    const firstMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderType: this.currentUser.type,
      content,
      status: 'sent',
      priority: options.priority || 'normal',
      attachments: [],
      readBy: [],
      createdAt: now
    };

    const newThread: MessageThread = {
      id: threadId,
      subject,
      type: options.type || 'internal',
      category: options.category || 'general',
      priority: options.priority || 'normal',
      participants: [this.currentUser, ...recipients],
      lastMessage: firstMessage,
      unreadCount: 0,
      isStarred: false,
      isPinned: false,
      labels: [],
      createdAt: now,
      updatedAt: now,
      ...options
    };

    this._threads.update(threads => [newThread, ...threads]);
    this._messages.update(map => {
      const newMap = new Map(map);
      newMap.set(threadId, [firstMessage]);
      return newMap;
    });

    return threadId;
  }

  // Task operations
  createTask(task: Partial<Task>): void {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: task.title || 'New Task',
      description: task.description || '',
      category: task.category || 'other',
      priority: task.priority || 'normal',
      status: 'pending',
      assignedTo: task.assignedTo || this.currentUser,
      assignedBy: this.currentUser,
      tags: task.tags || [],
      comments: [],
      attachments: [],
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...task
    };

    this._tasks.update(tasks => [newTask, ...tasks]);
  }

  updateTaskStatus(taskId: string, status: TaskStatus): void {
    this._tasks.update(tasks => 
      tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completedAt: status === 'completed' ? new Date() : undefined,
            updatedAt: new Date()
          };
        }
        return t;
      })
    );
  }

  deleteTask(taskId: string): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== taskId));
  }

  // Notification operations
  markNotificationAsRead(notificationId: string): void {
    this._notifications.update(notifications => 
      notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }

  dismissNotification(notificationId: string): void {
    this._notifications.update(notifications => 
      notifications.map(n => 
        n.id === notificationId ? { ...n, isDismissed: true } : n
      )
    );
  }

  markAllNotificationsAsRead(): void {
    this._notifications.update(notifications => 
      notifications.map(n => ({ ...n, isRead: true }))
    );
  }

  clearAllNotifications(): void {
    this._notifications.update(notifications => 
      notifications.map(n => ({ ...n, isDismissed: true }))
    );
  }

  // Search
  search(query: string): MessageSearchResult[] {
    const results: MessageSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search threads
    this._threads().forEach(thread => {
      if (thread.subject.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'thread',
          id: thread.id,
          title: thread.subject,
          excerpt: thread.lastMessage.content.substring(0, 100),
          participants: thread.participants.map(p => p.name),
          date: thread.updatedAt,
          matchedFields: ['subject']
        });
      }
    });

    // Search tasks
    this._tasks().forEach(task => {
      if (task.title.toLowerCase().includes(lowerQuery) || 
          task.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          excerpt: task.description.substring(0, 100),
          date: task.createdAt,
          matchedFields: ['title', 'description']
        });
      }
    });

    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Mock data generators
  private generateMockThreads(): MessageThread[] {
    const now = new Date();
    
    return [
      {
        id: 'thread-1',
        subject: 'Follow-up on lab results',
        type: 'secure',
        category: 'lab-results',
        priority: 'high',
        participants: [
          this.currentUser,
          { id: 'patient-1', type: 'patient', name: 'John Smith', email: 'john.smith@email.com' }
        ],
        lastMessage: {
          id: 'msg-1',
          threadId: 'thread-1',
          senderId: 'patient-1',
          senderName: 'John Smith',
          senderType: 'patient',
          content: 'I received my lab results but I\'m not sure what some of the values mean. Can you help explain?',
          status: 'delivered',
          priority: 'high',
          attachments: [],
          readBy: [],
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        },
        unreadCount: 1,
        isStarred: true,
        isPinned: false,
        labels: ['urgent'],
        patientId: 'patient-1',
        patientName: 'John Smith',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'thread-2',
        subject: 'Schedule change for next week',
        type: 'internal',
        category: 'scheduling',
        priority: 'normal',
        participants: [
          this.currentUser,
          { id: 'staff-1', type: 'staff', name: 'Mary Wilson', role: 'Office Manager' }
        ],
        lastMessage: {
          id: 'msg-2',
          threadId: 'thread-2',
          senderId: 'staff-1',
          senderName: 'Mary Wilson',
          senderType: 'staff',
          content: 'Dr. Johnson, we need to reschedule your Tuesday afternoon appointments due to the staff meeting.',
          status: 'delivered',
          priority: 'normal',
          attachments: [],
          readBy: [],
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
        },
        unreadCount: 1,
        isStarred: false,
        isPinned: false,
        labels: [],
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'thread-3',
        subject: 'Prescription refill request',
        type: 'secure',
        category: 'prescription',
        priority: 'normal',
        participants: [
          this.currentUser,
          { id: 'patient-2', type: 'patient', name: 'Emily Davis', email: 'emily.davis@email.com' }
        ],
        lastMessage: {
          id: 'msg-3',
          threadId: 'thread-3',
          senderId: this.currentUser.id,
          senderName: this.currentUser.name,
          senderType: 'provider',
          content: 'I have approved your refill request. You should be able to pick it up at your pharmacy tomorrow.',
          status: 'read',
          priority: 'normal',
          attachments: [],
          readBy: [{ participantId: 'patient-2', participantName: 'Emily Davis', readAt: new Date() }],
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
        },
        unreadCount: 0,
        isStarred: false,
        isPinned: false,
        labels: [],
        patientId: 'patient-2',
        patientName: 'Emily Davis',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'thread-4',
        subject: 'Referral to Cardiology',
        type: 'internal',
        category: 'referral',
        priority: 'high',
        participants: [
          this.currentUser,
          { id: 'provider-2', type: 'provider', name: 'Dr. Michael Chen', role: 'Cardiologist', department: 'Cardiology' }
        ],
        lastMessage: {
          id: 'msg-4',
          threadId: 'thread-4',
          senderId: 'provider-2',
          senderName: 'Dr. Michael Chen',
          senderType: 'provider',
          content: 'I reviewed the patient\'s records. Can you send over the most recent ECG results?',
          status: 'delivered',
          priority: 'high',
          attachments: [],
          readBy: [],
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
        },
        unreadCount: 1,
        isStarred: true,
        isPinned: true,
        labels: ['referral', 'pending'],
        patientId: 'patient-3',
        patientName: 'Robert Johnson',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'thread-5',
        subject: 'Billing question about recent visit',
        type: 'secure',
        category: 'billing',
        priority: 'low',
        participants: [
          this.currentUser,
          { id: 'patient-4', type: 'patient', name: 'Sarah Brown', email: 'sarah.brown@email.com' }
        ],
        lastMessage: {
          id: 'msg-5',
          threadId: 'thread-5',
          senderId: 'patient-4',
          senderName: 'Sarah Brown',
          senderType: 'patient',
          content: 'I received a bill but I thought my insurance should have covered this. Can you look into it?',
          status: 'delivered',
          priority: 'low',
          attachments: [],
          readBy: [],
          createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
        },
        unreadCount: 1,
        isStarred: false,
        isPinned: false,
        labels: ['billing'],
        patientId: 'patient-4',
        patientName: 'Sarah Brown',
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
      },
      {
        id: 'thread-6',
        subject: 'New EHR training next month',
        type: 'internal',
        category: 'general',
        priority: 'normal',
        participants: [
          this.currentUser,
          { id: 'dept-1', type: 'department', name: 'IT Department' }
        ],
        lastMessage: {
          id: 'msg-6',
          threadId: 'thread-6',
          senderId: 'dept-1',
          senderName: 'IT Department',
          senderType: 'department',
          content: 'Please sign up for one of the EHR training sessions scheduled for next month. Registration link attached.',
          status: 'delivered',
          priority: 'normal',
          attachments: [
            { id: 'att-1', name: 'Training_Schedule.pdf', type: 'application/pdf', size: 125000, url: '#', uploadedBy: 'IT Department', uploadedAt: new Date() }
          ],
          readBy: [],
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        unreadCount: 0,
        isStarred: false,
        isPinned: false,
        labels: ['training'],
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private generateMockMessages(): Map<string, Message[]> {
    const map = new Map<string, Message[]>();
    const now = new Date();

    // Thread 1 messages
    map.set('thread-1', [
      {
        id: 'msg-1-1',
        threadId: 'thread-1',
        senderId: 'patient-1',
        senderName: 'John Smith',
        senderType: 'patient',
        content: 'Dr. Johnson, I just got my lab results back from the portal. I see some values are flagged but I\'m not sure what they mean.',
        status: 'read',
        priority: 'normal',
        attachments: [],
        readBy: [{ participantId: this.currentUser.id, participantName: this.currentUser.name, readAt: new Date() }],
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'msg-1-2',
        threadId: 'thread-1',
        senderId: this.currentUser.id,
        senderName: this.currentUser.name,
        senderType: 'provider',
        content: 'Hello John, I\'d be happy to explain your results. Which specific values are you concerned about?',
        status: 'read',
        priority: 'normal',
        attachments: [],
        readBy: [{ participantId: 'patient-1', participantName: 'John Smith', readAt: new Date() }],
        createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
      },
      {
        id: 'msg-1-3',
        threadId: 'thread-1',
        senderId: 'patient-1',
        senderName: 'John Smith',
        senderType: 'patient',
        content: 'I received my lab results but I\'m not sure what some of the values mean. Can you help explain?',
        status: 'delivered',
        priority: 'high',
        attachments: [],
        readBy: [],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }
    ]);

    // Thread 4 messages
    map.set('thread-4', [
      {
        id: 'msg-4-1',
        threadId: 'thread-4',
        senderId: this.currentUser.id,
        senderName: this.currentUser.name,
        senderType: 'provider',
        content: 'Dr. Chen, I\'m referring a patient to you for cardiac evaluation. He\'s been experiencing chest pain and shortness of breath.',
        status: 'read',
        priority: 'high',
        attachments: [],
        readBy: [{ participantId: 'provider-2', participantName: 'Dr. Michael Chen', readAt: new Date() }],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'msg-4-2',
        threadId: 'thread-4',
        senderId: 'provider-2',
        senderName: 'Dr. Michael Chen',
        senderType: 'provider',
        content: 'Thank you for the referral. I reviewed the initial notes. When did symptoms first start?',
        status: 'read',
        priority: 'normal',
        attachments: [],
        readBy: [{ participantId: this.currentUser.id, participantName: this.currentUser.name, readAt: new Date() }],
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'msg-4-3',
        threadId: 'thread-4',
        senderId: this.currentUser.id,
        senderName: this.currentUser.name,
        senderType: 'provider',
        content: 'About 2 weeks ago. He also has a family history of heart disease. I\'ve attached his recent vitals and history.',
        status: 'read',
        priority: 'normal',
        attachments: [
          { id: 'att-2', name: 'Patient_History.pdf', type: 'application/pdf', size: 245000, url: '#', uploadedBy: this.currentUser.name, uploadedAt: new Date() }
        ],
        readBy: [{ participantId: 'provider-2', participantName: 'Dr. Michael Chen', readAt: new Date() }],
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        id: 'msg-4-4',
        threadId: 'thread-4',
        senderId: 'provider-2',
        senderName: 'Dr. Michael Chen',
        senderType: 'provider',
        content: 'I reviewed the patient\'s records. Can you send over the most recent ECG results?',
        status: 'delivered',
        priority: 'high',
        attachments: [],
        readBy: [],
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }
    ]);

    return map;
  }

  private generateMockTasks(): Task[] {
    const now = new Date();

    return [
      {
        id: 'task-1',
        title: 'Review and sign lab results for John Smith',
        description: 'Abnormal lipid panel results need review and patient communication',
        category: 'clinical',
        priority: 'high',
        status: 'pending',
        assignedTo: this.currentUser,
        assignedBy: { id: 'staff-1', type: 'staff', name: 'Mary Wilson', role: 'Office Manager' },
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        patientId: 'patient-1',
        patientName: 'John Smith',
        tags: ['labs', 'urgent'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'task-2',
        title: 'Complete annual training modules',
        description: 'HIPAA and compliance training due by end of month',
        category: 'administrative',
        priority: 'normal',
        status: 'in-progress',
        assignedTo: this.currentUser,
        assignedBy: { id: 'dept-1', type: 'department', name: 'HR Department' },
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        tags: ['training', 'compliance'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'task-3',
        title: 'Follow up with Emily Davis',
        description: 'Check on medication effectiveness after 2 weeks',
        category: 'follow-up',
        priority: 'normal',
        status: 'pending',
        assignedTo: this.currentUser,
        assignedBy: this.currentUser,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        patientId: 'patient-2',
        patientName: 'Emily Davis',
        tags: ['follow-up', 'medication'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'task-4',
        title: 'Submit prior authorization for MRI',
        description: 'Prior auth needed for Robert Johnson\'s cardiac MRI',
        category: 'documentation',
        priority: 'high',
        status: 'pending',
        assignedTo: this.currentUser,
        assignedBy: { id: 'staff-2', type: 'staff', name: 'Jennifer Lee', role: 'Nurse' },
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Overdue
        patientId: 'patient-3',
        patientName: 'Robert Johnson',
        tags: ['prior-auth', 'imaging'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'task-5',
        title: 'Review billing discrepancy',
        description: 'Sarah Brown reported insurance coverage issue',
        category: 'billing',
        priority: 'low',
        status: 'pending',
        assignedTo: this.currentUser,
        assignedBy: { id: 'staff-3', type: 'staff', name: 'Billing Department' },
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        patientId: 'patient-4',
        patientName: 'Sarah Brown',
        linkedMessageId: 'thread-5',
        tags: ['billing'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
      },
      {
        id: 'task-6',
        title: 'Prepare referral documentation',
        description: 'Complete referral package for cardiology consult',
        category: 'referral',
        priority: 'high',
        status: 'completed',
        assignedTo: this.currentUser,
        assignedBy: this.currentUser,
        completedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        patientId: 'patient-3',
        patientName: 'Robert Johnson',
        linkedMessageId: 'thread-4',
        tags: ['referral', 'cardiology'],
        comments: [],
        attachments: [],
        reminders: [],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ];
  }

  private generateMockNotifications(): Notification[] {
    const now = new Date();

    return [
      {
        id: 'notif-1',
        type: 'lab-result',
        priority: 'high',
        title: 'Critical Lab Result',
        message: 'John Smith has a critical lab value that requires immediate review.',
        actionUrl: '/patients/patient-1/labs',
        actionLabel: 'View Results',
        relatedId: 'patient-1',
        relatedType: 'patient',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000)
      },
      {
        id: 'notif-2',
        type: 'message',
        priority: 'normal',
        title: 'New Message',
        message: 'You have 3 unread messages from patients.',
        actionUrl: '/messaging',
        actionLabel: 'View Messages',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'notif-3',
        type: 'task',
        priority: 'high',
        title: 'Overdue Task',
        message: 'Prior authorization for Robert Johnson is overdue.',
        actionUrl: '/messaging/tasks',
        actionLabel: 'View Task',
        relatedId: 'task-4',
        relatedType: 'task',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      },
      {
        id: 'notif-4',
        type: 'appointment',
        priority: 'normal',
        title: 'Upcoming Appointment',
        message: 'You have an appointment with Emily Davis in 30 minutes.',
        actionUrl: '/appointments',
        actionLabel: 'View Schedule',
        isRead: true,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'notif-5',
        type: 'prescription',
        priority: 'normal',
        title: 'Refill Request',
        message: 'New prescription refill request from Emily Davis.',
        actionUrl: '/prescriptions',
        actionLabel: 'Review Request',
        relatedId: 'patient-2',
        relatedType: 'patient',
        isRead: true,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'notif-6',
        type: 'system',
        priority: 'low',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight from 2 AM - 4 AM.',
        isRead: true,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      },
      {
        id: 'notif-7',
        type: 'reminder',
        priority: 'normal',
        title: 'Training Reminder',
        message: 'HIPAA training due in 7 days.',
        actionUrl: '/training',
        actionLabel: 'Start Training',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    ];
  }

  private generateMockPatientMessages(): PatientMessage[] {
    const now = new Date();

    return [
      {
        id: 'pmsg-1',
        patientId: 'patient-1',
        patientName: 'John Smith',
        providerId: this.currentUser.id,
        providerName: this.currentUser.name,
        subject: 'Question about lab results',
        content: 'I received my lab results but I\'m confused about some of the values. Can you explain?',
        type: 'test-result-question',
        status: 'pending',
        responseRequired: true,
        responseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        responses: [],
        attachments: [],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'pmsg-2',
        patientId: 'patient-2',
        patientName: 'Emily Davis',
        providerId: this.currentUser.id,
        providerName: this.currentUser.name,
        subject: 'Prescription refill needed',
        content: 'I need a refill on my blood pressure medication. I have about 5 days left.',
        type: 'prescription-refill',
        status: 'responded',
        responseRequired: false,
        responses: [
          {
            id: 'resp-1',
            messageId: 'pmsg-2',
            responderId: this.currentUser.id,
            responderName: this.currentUser.name,
            responderRole: 'Physician',
            content: 'I have approved your refill. You can pick it up at your pharmacy tomorrow.',
            isPatientVisible: true,
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
          }
        ],
        attachments: [],
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'pmsg-3',
        patientId: 'patient-4',
        patientName: 'Sarah Brown',
        providerId: this.currentUser.id,
        providerName: this.currentUser.name,
        subject: 'Insurance billing question',
        content: 'I received a bill but thought my insurance covered this visit. Can someone look into this?',
        type: 'billing-question',
        status: 'new',
        responseRequired: true,
        responseDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        responses: [],
        attachments: [],
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
      }
    ];
  }

  private generateMockFolders(): MessageFolder[] {
    return [
      { id: 'inbox', name: 'Inbox', icon: 'inbox', count: 6, unreadCount: 4, isSystem: true },
      { id: 'sent', name: 'Sent', icon: 'send', count: 15, unreadCount: 0, isSystem: true },
      { id: 'starred', name: 'Starred', icon: 'star', count: 2, unreadCount: 2, isSystem: true },
      { id: 'archived', name: 'Archived', icon: 'archive', count: 25, unreadCount: 0, isSystem: true },
      { id: 'patient', name: 'Patient Messages', icon: 'user', count: 3, unreadCount: 2, color: '#3b82f6', isSystem: true },
      { id: 'internal', name: 'Internal', icon: 'building', count: 3, unreadCount: 2, color: '#8b5cf6', isSystem: true }
    ];
  }

  private generateMockQuickReplies(): QuickReply[] {
    return [
      {
        id: 'qr-1',
        name: 'Lab Results Available',
        content: 'Your lab results are now available in the patient portal. If you have any questions, please don\'t hesitate to ask.',
        category: 'lab-results',
        createdBy: this.currentUser.id,
        isShared: true
      },
      {
        id: 'qr-2',
        name: 'Prescription Approved',
        content: 'I have approved your prescription request. It should be available at your pharmacy within 24 hours.',
        category: 'prescription',
        createdBy: this.currentUser.id,
        isShared: true
      },
      {
        id: 'qr-3',
        name: 'Schedule Appointment',
        content: 'Based on your message, I recommend scheduling a follow-up appointment. Please contact our office or use the patient portal to book a time that works for you.',
        category: 'scheduling',
        createdBy: this.currentUser.id,
        isShared: false
      },
      {
        id: 'qr-4',
        name: 'Billing Inquiry Response',
        content: 'Thank you for reaching out about your billing question. I\'ve forwarded this to our billing department, and they will contact you within 2 business days.',
        category: 'billing',
        createdBy: this.currentUser.id,
        isShared: true
      }
    ];
  }
}
