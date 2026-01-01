import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { MessageThread, SecureMessage } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="messages-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Messages</h1>
        </div>
        <button class="btn btn-primary" (click)="openComposeModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Message
        </button>
      </header>

      <!-- Messages Layout -->
      <div class="messages-layout">
        <!-- Thread List -->
        <div class="thread-list" [class.collapsed]="selectedThread()">
          <div class="list-header">
            <h2>Inbox</h2>
            @if (portalService.unreadMessageCount() > 0) {
              <span class="unread-count">{{ portalService.unreadMessageCount() }} unread</span>
            }
          </div>
          <div class="threads">
            @for (thread of portalService.messageThreads(); track thread.id) {
              <button 
                class="thread-item"
                [class.selected]="selectedThread()?.id === thread.id"
                [class.unread]="thread.unreadCount > 0"
                (click)="selectThread(thread)"
              >
                <div class="thread-avatar">
                  {{ getInitials(thread.participants[1]?.name || 'Unknown') }}
                </div>
                <div class="thread-content">
                  <div class="thread-header">
                    <span class="thread-sender">{{ thread.participants[1]?.name }}</span>
                    <span class="thread-time">{{ formatTimeAgo(thread.lastMessageAt) }}</span>
                  </div>
                  <p class="thread-subject">{{ thread.subject }}</p>
                  <p class="thread-preview">{{ thread.lastMessagePreview }}</p>
                </div>
                @if (thread.unreadCount > 0) {
                  <span class="unread-badge">{{ thread.unreadCount }}</span>
                }
              </button>
            } @empty {
              <div class="empty-threads">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No messages yet</p>
              </div>
            }
          </div>
        </div>

        <!-- Message Detail -->
        <div class="message-detail" [class.active]="selectedThread()">
          @if (selectedThread()) {
            <div class="detail-header">
              <button class="btn-back" (click)="selectedThread.set(null)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div class="detail-info">
                <h2>{{ selectedThread()!.subject }}</h2>
                <p>{{ selectedParticipantsText() }}</p>
              </div>
              <span class="category-badge" [class]="selectedThread()?.category">
                {{ formatCategory(selectedThread()!.category) }}
              </span>
            </div>
            <div class="messages-scroll">
              @for (message of threadMessages(); track message.id) {
                <div class="message-bubble" [class.sent]="message.senderType === 'patient'">
                  <div class="bubble-header">
                    <span class="sender-name">{{ message.senderName }}</span>
                    <span class="message-time">{{ message.sentAt | date:'MMM d, yyyy h:mm a' }}</span>
                  </div>
                  <div class="bubble-body">
                    {{ message.body }}
                  </div>
                  @if (message.attachments.length > 0) {
                    <div class="attachments">
                      @for (att of message.attachments; track att.id) {
                        <a class="attachment" [href]="att.url">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          {{ att.fileName }}
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            <div class="reply-box">
              <textarea 
                [(ngModel)]="replyText"
                placeholder="Type your reply..."
                rows="3"
              ></textarea>
              <div class="reply-actions">
                <button class="btn btn-secondary btn-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Attach
                </button>
                <button 
                  class="btn btn-primary btn-sm"
                  [disabled]="!canSendReply()"
                  (click)="sendReply()"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send
                </button>
              </div>
            </div>
          } @else {
            <div class="no-selection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>Select a conversation</h3>
              <p>Choose a message thread from the list to view</p>
            </div>
          }
        </div>
      </div>

      <!-- Compose Modal -->
      @if (showComposeModal()) {
        <div class="modal-overlay" (click)="closeComposeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>New Message</h2>
              <button class="btn-close" (click)="closeComposeModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>To</label>
                <select [(ngModel)]="newMessage.recipientId">
                  <option value="">Select a recipient...</option>
                  @for (provider of providers; track provider.id) {
                    <option [value]="provider.id">{{ provider.name }} - {{ provider.specialty }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="newMessage.category">
                  <option value="general">General Question</option>
                  <option value="appointment">Appointment</option>
                  <option value="prescription">Prescription</option>
                  <option value="lab_results">Lab Results</option>
                  <option value="billing">Billing</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div class="form-group">
                <label>Subject</label>
                <input type="text" [(ngModel)]="newMessage.subject" placeholder="Enter subject..." />
              </div>
              <div class="form-group">
                <label>Message</label>
                <textarea 
                  [(ngModel)]="newMessage.body"
                  placeholder="Type your message..."
                  rows="6"
                ></textarea>
              </div>
              <div class="form-group checkbox">
                <input type="checkbox" id="urgent" [(ngModel)]="newMessage.isUrgent" />
                <label for="urgent">Mark as urgent</label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeComposeModal()">Cancel</button>
              <button 
                class="btn btn-primary"
                [disabled]="!canSendMessage()"
                (click)="sendMessage()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Send Message
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .messages-container {
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #64748b;
      text-decoration: none;
      margin-bottom: 0.5rem;
    }

    .back-link:hover { color: #3b82f6; }
    .back-link svg { width: 1rem; height: 1rem; }
    .header-content h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-sm { padding: 0.5rem 0.875rem; font-size: 0.8125rem; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #f1f5f9; }
    .btn svg { width: 1rem; height: 1rem; }

    .btn-back {
      display: none;
      width: 2rem;
      height: 2rem;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.375rem;
    }

    .btn-back:hover { background: #f1f5f9; }
    .btn-back svg { width: 1.25rem; height: 1.25rem; }

    /* Messages Layout */
    .messages-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* Thread List */
    .thread-list {
      width: 360px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .list-header h2 { margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b; }
    .unread-count { font-size: 0.8125rem; color: #3b82f6; }

    .threads {
      flex: 1;
      overflow-y: auto;
    }

    .thread-item {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border: none;
      background: white;
      text-align: left;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }

    .thread-item:hover { background: #f8fafc; }
    .thread-item.selected { background: #eff6ff; border-left: 3px solid #3b82f6; }
    .thread-item.unread { background: #fafbff; }
    .thread-item.unread .thread-subject { font-weight: 600; }

    .thread-avatar {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 50%;
      font-size: 0.8125rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .thread-content { flex: 1; min-width: 0; }

    .thread-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.125rem;
    }

    .thread-sender { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
    .thread-time { font-size: 0.6875rem; color: #94a3b8; }
    .thread-subject { margin: 0; font-size: 0.8125rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread-preview { margin: 0.125rem 0 0; font-size: 0.75rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .unread-badge {
      padding: 0.125rem 0.5rem;
      background: #3b82f6;
      color: white;
      border-radius: 1rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .empty-threads {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #94a3b8;
    }

    .empty-threads svg { width: 3rem; height: 3rem; margin-bottom: 0.75rem; }
    .empty-threads p { margin: 0; font-size: 0.875rem; }

    /* Message Detail */
    .message-detail {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-info { flex: 1; }
    .detail-info h2 { margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b; }
    .detail-info p { margin: 0.125rem 0 0; font-size: 0.8125rem; color: #64748b; }

    .category-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #64748b;
    }

    .category-badge.prescription { background: #dbeafe; color: #1d4ed8; }
    .category-badge.lab_results { background: #dcfce7; color: #16a34a; }
    .category-badge.appointment { background: #f3e8ff; color: #7c3aed; }
    .category-badge.billing { background: #fef3c7; color: #d97706; }

    .messages-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .message-bubble {
      max-width: 80%;
      margin-bottom: 1rem;
    }

    .message-bubble.sent { margin-left: auto; }

    .bubble-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .sender-name { font-size: 0.8125rem; font-weight: 500; color: #1e293b; }
    .message-time { font-size: 0.6875rem; color: #94a3b8; }

    .bubble-body {
      padding: 0.875rem 1rem;
      background: white;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .message-bubble.sent .bubble-body {
      background: #3b82f6;
      color: white;
    }

    .attachments {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .attachment {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .attachment svg { width: 0.875rem; height: 0.875rem; }

    .reply-box {
      padding: 1rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .reply-box textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
      resize: none;
    }

    .reply-box textarea:focus { outline: none; border-color: #3b82f6; }

    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .no-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #94a3b8;
    }

    .no-selection svg { width: 4rem; height: 4rem; margin-bottom: 1rem; }
    .no-selection h3 { margin: 0 0 0.5rem; font-size: 1.125rem; color: #64748b; }
    .no-selection p { margin: 0; font-size: 0.875rem; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #1e293b; }

    .btn-close {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
    }

    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #374151; }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-group.checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group.checkbox input { width: auto; }
    .form-group.checkbox label { margin-bottom: 0; }

    @media (max-width: 768px) {
      .messages-container { height: 100vh; }

      .page-header { padding: 1rem; }

      .thread-list {
        width: 100%;
        position: absolute;
        inset: 0;
        top: auto;
        z-index: 10;
      }

      .thread-list.collapsed { display: none; }

      .message-detail {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 20;
      }

      .message-detail.active { display: flex; }
      .btn-back { display: flex; }
    }
  `]
})
export class PortalMessagesComponent {
  portalService = inject(PortalService);

  selectedThread = signal<MessageThread | null>(null);
  showComposeModal = signal(false);
  replyText = '';

  newMessage = {
    recipientId: '',
    category: 'general',
    subject: '',
    body: '',
    isUrgent: false
  };

  providers = [
    { id: 'PROV-001', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine' },
    { id: 'PROV-002', name: 'Dr. Michael Chen', specialty: 'Cardiology' },
    { id: 'PROV-003', name: 'Dr. Emily Davis', specialty: 'Family Medicine' }
  ];

  threadMessages = computed(() => {
    if (!this.selectedThread()) return [];
    return this.portalService.getThreadMessages(this.selectedThread()!.id);
  });

  selectedParticipantsText = computed(() => {
    const thread = this.selectedThread();
    if (!thread) return '';
    return thread.participants.map(p => p.name).join(', ');
  });

  selectThread(thread: MessageThread): void {
    this.selectedThread.set(thread);
    this.portalService.markThreadAsRead(thread.id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  formatTimeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  }

  formatCategory(category: string): string {
    const labels: Record<string, string> = {
      general: 'General',
      appointment: 'Appointment',
      prescription: 'Prescription',
      lab_results: 'Lab Results',
      billing: 'Billing',
      referral: 'Referral'
    };
    return labels[category] || category;
  }

  canSendReply(): boolean {
    return !!this.replyText.trim() && !!this.selectedThread();
  }

  sendReply(): void {
    if (this.replyText.trim() && this.selectedThread()) {
      this.portalService.sendMessage(
        this.selectedThread()!.id,
        this.selectedThread()!.participants[1].id,
        this.selectedThread()!.subject,
        this.replyText.trim()
      );
      this.replyText = '';
    }
  }

  openComposeModal(): void {
    this.newMessage = {
      recipientId: '',
      category: 'general',
      subject: '',
      body: '',
      isUrgent: false
    };
    this.showComposeModal.set(true);
  }

  closeComposeModal(): void {
    this.showComposeModal.set(false);
  }

  canSendMessage(): boolean {
    return !!(this.newMessage.recipientId && this.newMessage.subject.trim() && this.newMessage.body.trim());
  }

  sendMessage(): void {
    if (this.canSendMessage()) {
      this.portalService.sendMessage(
        null,
        this.newMessage.recipientId,
        this.newMessage.subject,
        this.newMessage.body
      );
      this.closeComposeModal();
    }
  }
}
