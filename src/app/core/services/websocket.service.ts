import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subject, Observable, timer, BehaviorSubject, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry, tap, switchMap, takeUntil, catchError, share, filter } from 'rxjs/operators';

// Event types for different real-time updates
export type WebSocketEventType = 
  | 'queue:update'
  | 'queue:patient_added'
  | 'queue:patient_called'
  | 'queue:patient_completed'
  | 'queue:patient_removed'
  | 'appointment:status_change'
  | 'appointment:check_in'
  | 'appointment:new'
  | 'bed:status_change'
  | 'bed:admission'
  | 'bed:discharge'
  | 'bed:transfer'
  | 'lab:order_update'
  | 'lab:result_ready'
  | 'alert:new'
  | 'alert:dismissed'
  | 'notification:new'
  | 'user:presence';

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: Date;
  source?: string;
  correlationId?: string;
}

export interface QueueUpdatePayload {
  queueId: string;
  departmentId: string;
  patients: QueuePatient[];
  stats: QueueStats;
}

export interface QueuePatient {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  priority: 'normal' | 'urgent' | 'emergency';
  status: 'waiting' | 'called' | 'in-consultation' | 'completed' | 'no-show';
  appointmentTime?: Date;
  checkInTime: Date;
  waitTime: number; // minutes
  provider?: string;
  room?: string;
}

export interface QueueStats {
  totalWaiting: number;
  avgWaitTime: number;
  longestWait: number;
  inConsultation: number;
  completed: number;
  noShow: number;
}

export interface BedUpdatePayload {
  wardId: string;
  bedId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  patientId?: string;
  patientName?: string;
  admissionDate?: Date;
}

export interface AppointmentUpdatePayload {
  appointmentId: string;
  patientId: string;
  patientName: string;
  status: string;
  providerId: string;
  providerName: string;
  time: Date;
}

export interface AlertPayload {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  actionRequired?: boolean;
  expiresAt?: Date;
}

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<WebSocketMessage> | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly reconnectInterval = 5000;
  private readonly maxReconnectAttempts = 10;

  // Connection state
  private readonly connectionState$ = new BehaviorSubject<ConnectionState>({
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0
  });

  // Message streams by type
  private readonly messages$ = new Subject<WebSocketMessage>();

  // Signals for reactive state
  readonly isConnected = signal(false);
  readonly isReconnecting = signal(false);
  readonly connectionError = signal<string | null>(null);

  // Queue state
  readonly queueUpdates = signal<Map<string, QueueUpdatePayload>>(new Map());
  readonly currentQueue = signal<QueuePatient[]>([]);
  readonly queueStats = signal<QueueStats>({
    totalWaiting: 0,
    avgWaitTime: 0,
    longestWait: 0,
    inConsultation: 0,
    completed: 0,
    noShow: 0
  });

  // Bed state
  readonly bedUpdates = signal<Map<string, BedUpdatePayload>>(new Map());

  // Alerts
  readonly alerts = signal<AlertPayload[]>([]);

  // Computed values
  readonly connectionStatus = computed(() => {
    if (this.isConnected()) return 'connected';
    if (this.isReconnecting()) return 'reconnecting';
    return 'disconnected';
  });

  constructor() {
    this.setupMessageHandlers();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string = 'wss://api.example.com/ws'): void {
    if (this.socket$) {
      return; // Already connected
    }

    this.socket$ = webSocket<WebSocketMessage>({
      url,
      openObserver: {
        next: () => {
          console.log('[WebSocket] Connected');
          this.isConnected.set(true);
          this.isReconnecting.set(false);
          this.connectionError.set(null);
          this.connectionState$.next({
            connected: true,
            reconnecting: false,
            lastConnected: new Date(),
            reconnectAttempts: 0
          });

          // Subscribe to relevant channels
          this.subscribe(['queue', 'appointments', 'beds', 'alerts']);
        }
      },
      closeObserver: {
        next: (event) => {
          console.log('[WebSocket] Disconnected', event);
          this.isConnected.set(false);
          this.handleDisconnect();
        }
      }
    });

    this.socket$.pipe(
      tap(message => this.messages$.next(message)),
      retry({
        count: this.maxReconnectAttempts,
        delay: (error, retryCount) => {
          console.log(`[WebSocket] Reconnect attempt ${retryCount}`);
          this.isReconnecting.set(true);
          this.connectionState$.next({
            connected: false,
            reconnecting: true,
            reconnectAttempts: retryCount
          });
          return timer(this.reconnectInterval * retryCount);
        }
      }),
      catchError(error => {
        console.error('[WebSocket] Connection error', error);
        this.connectionError.set(error.message || 'Connection failed');
        this.isReconnecting.set(false);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
      this.isConnected.set(false);
      this.isReconnecting.set(false);
    }
  }

  /**
   * Subscribe to specific channels
   */
  subscribe(channels: string[]): void {
    if (!this.socket$) return;

    this.send({
      type: 'queue:update' as WebSocketEventType,
      payload: {
        action: 'subscribe',
        channels
      },
      timestamp: new Date()
    });
  }

  /**
   * Unsubscribe from channels
   */
  unsubscribe(channels: string[]): void {
    if (!this.socket$) return;

    this.send({
      type: 'queue:update' as WebSocketEventType,
      payload: {
        action: 'unsubscribe',
        channels
      },
      timestamp: new Date()
    });
  }

  /**
   * Send a message to the server
   */
  send(message: WebSocketMessage): void {
    if (this.socket$ && this.isConnected()) {
      this.socket$.next(message);
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Get observable for specific message types
   */
  on<T>(type: WebSocketEventType): Observable<WebSocketMessage<T>> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      share()
    );
  }

  /**
   * Get all messages observable
   */
  getAllMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }

  /**
   * Setup handlers for different message types
   */
  private setupMessageHandlers(): void {
    // Queue updates
    this.on<QueueUpdatePayload>('queue:update').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.queueUpdates.update(map => {
        map.set(msg.payload.queueId, msg.payload);
        return new Map(map);
      });
      this.currentQueue.set(msg.payload.patients);
      this.queueStats.set(msg.payload.stats);
    });

    // Patient added to queue
    this.on<QueuePatient>('queue:patient_added').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.currentQueue.update(queue => [...queue, msg.payload]);
      this.updateQueueStats();
    });

    // Patient called
    this.on<{ patientId: string; room: string }>('queue:patient_called').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.currentQueue.update(queue => 
        queue.map(p => 
          p.patientId === msg.payload.patientId 
            ? { ...p, status: 'called' as const, room: msg.payload.room }
            : p
        )
      );
    });

    // Patient completed
    this.on<{ patientId: string }>('queue:patient_completed').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.currentQueue.update(queue => 
        queue.map(p => 
          p.patientId === msg.payload.patientId 
            ? { ...p, status: 'completed' as const }
            : p
        )
      );
      this.updateQueueStats();
    });

    // Bed updates
    this.on<BedUpdatePayload>('bed:status_change').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.bedUpdates.update(map => {
        map.set(msg.payload.bedId, msg.payload);
        return new Map(map);
      });
    });

    // Alerts
    this.on<AlertPayload>('alert:new').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.alerts.update(alerts => [msg.payload, ...alerts]);
    });

    // Alert dismissed
    this.on<{ id: string }>('alert:dismissed').pipe(
      takeUntil(this.destroy$)
    ).subscribe(msg => {
      this.alerts.update(alerts => alerts.filter(a => a.id !== msg.payload.id));
    });
  }

  /**
   * Update queue statistics
   */
  private updateQueueStats(): void {
    const queue = this.currentQueue();
    const waiting = queue.filter(p => p.status === 'waiting');
    const inConsultation = queue.filter(p => p.status === 'in-consultation');
    const completed = queue.filter(p => p.status === 'completed');
    const noShow = queue.filter(p => p.status === 'no-show');

    const waitTimes = waiting.map(p => p.waitTime);
    const avgWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
      : 0;
    const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    this.queueStats.set({
      totalWaiting: waiting.length,
      avgWaitTime: Math.round(avgWaitTime),
      longestWait,
      inConsultation: inConsultation.length,
      completed: completed.length,
      noShow: noShow.length
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.connectionState$.next({
      connected: false,
      reconnecting: true,
      reconnectAttempts: 0
    });
  }

  // =====================
  // Queue-specific methods
  // =====================

  /**
   * Call next patient in queue
   */
  callNextPatient(departmentId: string, room: string): void {
    this.send({
      type: 'queue:patient_called',
      payload: { departmentId, room },
      timestamp: new Date()
    });
  }

  /**
   * Complete patient visit
   */
  completePatient(patientId: string): void {
    this.send({
      type: 'queue:patient_completed',
      payload: { patientId },
      timestamp: new Date()
    });
  }

  /**
   * Mark patient as no-show
   */
  markNoShow(patientId: string): void {
    this.send({
      type: 'queue:patient_removed',
      payload: { patientId, reason: 'no-show' },
      timestamp: new Date()
    });
  }

  /**
   * Add patient to queue
   */
  addToQueue(patient: Omit<QueuePatient, 'waitTime'>): void {
    this.send({
      type: 'queue:patient_added',
      payload: patient,
      timestamp: new Date()
    });
  }

  // =====================
  // Bed-specific methods
  // =====================

  /**
   * Update bed status
   */
  updateBedStatus(wardId: string, bedId: string, status: BedUpdatePayload['status'], patientId?: string): void {
    this.send({
      type: 'bed:status_change',
      payload: { wardId, bedId, status, patientId },
      timestamp: new Date()
    });
  }

  /**
   * Process bed admission
   */
  admitToBed(wardId: string, bedId: string, patientId: string, patientName: string): void {
    this.send({
      type: 'bed:admission',
      payload: { wardId, bedId, patientId, patientName, admissionDate: new Date() },
      timestamp: new Date()
    });
  }

  /**
   * Process discharge
   */
  dischargeFromBed(wardId: string, bedId: string): void {
    this.send({
      type: 'bed:discharge',
      payload: { wardId, bedId },
      timestamp: new Date()
    });
  }

  // =====================
  // Alert methods
  // =====================

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    this.send({
      type: 'alert:dismissed',
      payload: { id: alertId },
      timestamp: new Date()
    });
    this.alerts.update(alerts => alerts.filter(a => a.id !== alertId));
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<AlertPayload, 'id'>): void {
    const newAlert: AlertPayload = {
      ...alert,
      id: `alert-${Date.now()}`
    };
    this.send({
      type: 'alert:new',
      payload: newAlert,
      timestamp: new Date()
    });
  }
}

/**
 * Mock WebSocket service for development/testing
 * Simulates real-time updates without a server
 */
@Injectable()
export class MockWebSocketService extends WebSocketService {
  private mockInterval: any;

  override connect(url?: string): void {
    console.log('[MockWebSocket] Simulating connection');
    this.isConnected.set(true);
    this.startMockUpdates();
  }

  override disconnect(): void {
    console.log('[MockWebSocket] Disconnecting');
    this.isConnected.set(false);
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }

  private startMockUpdates(): void {
    // Simulate queue updates every 10 seconds
    this.mockInterval = setInterval(() => {
      this.simulateQueueUpdate();
    }, 10000);

    // Initial data
    this.simulateQueueUpdate();
  }

  private simulateQueueUpdate(): void {
    const mockPatients: QueuePatient[] = [
      { id: '1', patientId: 'pt1', patientName: 'John Smith', tokenNumber: 'A001', priority: 'normal', status: 'waiting', checkInTime: new Date(Date.now() - 1800000), waitTime: 30 },
      { id: '2', patientId: 'pt2', patientName: 'Sarah Johnson', tokenNumber: 'A002', priority: 'urgent', status: 'waiting', checkInTime: new Date(Date.now() - 900000), waitTime: 15 },
      { id: '3', patientId: 'pt3', patientName: 'Mike Williams', tokenNumber: 'A003', priority: 'normal', status: 'in-consultation', checkInTime: new Date(Date.now() - 2400000), waitTime: 40, room: 'Room 3' },
      { id: '4', patientId: 'pt4', patientName: 'Emily Davis', tokenNumber: 'A004', priority: 'emergency', status: 'waiting', checkInTime: new Date(Date.now() - 300000), waitTime: 5 },
    ];

    this.currentQueue.set(mockPatients);
    this.queueStats.set({
      totalWaiting: 3,
      avgWaitTime: 17,
      longestWait: 30,
      inConsultation: 1,
      completed: 12,
      noShow: 2
    });
  }
}
