import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessagingService } from '../data-access/services/messaging.service';
import { MessageThread, Message, Participant } from '../data-access/models/messaging.model';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inbox-container">
      <!-- Sidebar - Folders -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button class="btn-icon" (click)="toggleSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <button class="compose-btn" (click)="openCompose()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Compose</span>
        </button>

        <nav class="folder-list">
          @for (folder of messagingService.folders(); track folder.id) {
            <button 
              class="folder-item"
              [class.active]="messagingService.selectedFolder() === folder.id"
              (click)="messagingService.selectFolder(folder.id)"
            >
              <span class="folder-icon" [style.color]="folder.color">
                @switch (folder.icon) {
                  @case ('inbox') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                    </svg>
                  }
                  @case ('send') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  }
                  @case ('star') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  }
                  @case ('archive') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="21 8 21 21 3 21 3 8"/>
                      <rect x="1" y="3" width="22" height="5"/>
                      <line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                  }
                  @case ('user') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  }
                  @case ('building') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                      <path d="M9 22v-4h6v4"/>
                      <line x1="8" y1="6" x2="8" y2="6"/>
                      <line x1="16" y1="6" x2="16" y2="6"/>
                      <line x1="12" y1="6" x2="12" y2="6"/>
                      <line x1="8" y1="10" x2="8" y2="10"/>
                      <line x1="16" y1="10" x2="16" y2="10"/>
                      <line x1="12" y1="10" x2="12" y2="10"/>
                      <line x1="8" y1="14" x2="8" y2="14"/>
                      <line x1="16" y1="14" x2="16" y2="14"/>
                      <line x1="12" y1="14" x2="12" y2="14"/>
                    </svg>
                  }
                }
              </span>
              <span class="folder-name">{{ folder.name }}</span>
              @if (folder.unreadCount > 0) {
                <span class="folder-badge">{{ folder.unreadCount }}</span>
              }
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/messages/tasks" class="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Tasks</span>
            @if (messagingService.pendingTaskCount() > 0) {
              <span class="count-badge">{{ messagingService.pendingTaskCount() }}</span>
            }
          </a>
          <a routerLink="/messages/notifications" class="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Notifications</span>
            @if (messagingService.unreadNotificationCount() > 0) {
              <span class="count-badge">{{ messagingService.unreadNotificationCount() }}</span>
            }
          </a>
        </div>
      </aside>

      <!-- Thread List -->
      <div class="thread-list-panel">
        <div class="thread-list-header">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search messages..."
              [ngModel]="messagingService.searchQuery()"
              (ngModelChange)="messagingService.setSearchQuery($event)"
            />
          </div>
          <div class="header-actions">
            <button class="btn-icon" (click)="refreshMessages()" title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="thread-list">
          @for (thread of messagingService.filteredThreads(); track thread.id) {
            <button 
              class="thread-item"
              [class.selected]="messagingService.selectedThreadId() === thread.id"
              [class.unread]="thread.unreadCount > 0"
              [class.pinned]="thread.isPinned"
              (click)="messagingService.selectThread(thread.id)"
            >
              @if (thread.isPinned) {
                <span class="pin-indicator">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M16 4h2v6l3 3v2h-6v7l-1 1-1-1v-7H7v-2l3-3V4h2"/>
                  </svg>
                </span>
              }
              <div class="thread-avatar" [class]="thread.type">
                @if (thread.patientId) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                }
              </div>
              <div class="thread-content">
                <div class="thread-header">
                  <span class="thread-sender">
                    {{ getOtherParticipants(thread) }}
                  </span>
                  <span class="thread-time">{{ formatTime(thread.updatedAt) }}</span>
                </div>
                <div class="thread-subject">
                  @if (thread.priority === 'high' || thread.priority === 'urgent') {
                    <span class="priority-indicator" [class]="thread.priority">!</span>
                  }
                  {{ thread.subject }}
                </div>
                <div class="thread-preview">
                  {{ thread.lastMessage.content }}
                </div>
                <div class="thread-meta">
                  @if (thread.isStarred) {
                    <span class="star-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </span>
                  }
                  @if (thread.lastMessage.attachments.length > 0) {
                    <span class="attachment-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                    </span>
                  }
                  <span class="category-badge" [class]="thread.category">
                    {{ formatCategory(thread.category) }}
                  </span>
                </div>
              </div>
              @if (thread.unreadCount > 0) {
                <span class="unread-badge">{{ thread.unreadCount }}</span>
              }
            </button>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
              <p>No messages found</p>
            </div>
          }
        </div>
      </div>

      <!-- Message Detail -->
      <div class="message-detail-panel">
        @if (messagingService.selectedThread()) {
          <div class="message-detail">
            <!-- Message Header -->
            <div class="detail-header">
              <div class="header-left">
                <h2>{{ messagingService.selectedThread()!.subject }}</h2>
                <div class="participants">
                  @for (participant of messagingService.selectedThread()!.participants; track participant.id) {
                    <span class="participant-chip">{{ participant.name }}</span>
                  }
                </div>
              </div>
              <div class="header-actions">
                <button 
                  class="btn-icon"
                  [class.active]="messagingService.selectedThread()!.isStarred"
                  (click)="messagingService.toggleStar(messagingService.selectedThread()!.id)"
                  title="Star"
                >
                  <svg viewBox="0 0 24 24" [attr.fill]="messagingService.selectedThread()!.isStarred ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
                <button 
                  class="btn-icon"
                  [class.active]="messagingService.selectedThread()!.isPinned"
                  (click)="messagingService.togglePin(messagingService.selectedThread()!.id)"
                  title="Pin"
                >
                  <svg viewBox="0 0 24 24" [attr.fill]="messagingService.selectedThread()!.isPinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2v6l3 3v2h-6v7l-1 1-1-1v-7H7v-2l3-3V4h2"/>
                  </svg>
                </button>
                <button class="btn-icon" (click)="messagingService.archiveThread(messagingService.selectedThread()!.id)" title="Archive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="21 8 21 21 3 21 3 8"/>
                    <rect x="1" y="3" width="22" height="5"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                </button>
                <button class="btn-icon danger" (click)="confirmDelete()" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
                <div class="dropdown-container">
                  <button class="btn-icon" (click)="toggleMoreMenu()" title="More">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                  @if (showMoreMenu()) {
                    <div class="dropdown-menu">
                      <button (click)="markAsUnread()">Mark as unread</button>
                      <button (click)="addLabel()">Add label</button>
                      <button (click)="createTask()">Create task</button>
                      <button (click)="printThread()">Print</button>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Messages -->
            <div class="messages-container">
              @for (message of messagingService.selectedThreadMessages(); track message.id) {
                <div class="message-bubble" [class.sent]="message.senderId === 'user-1'" [class.received]="message.senderId !== 'user-1'">
                  <div class="message-header">
                    <div class="sender-info">
                      <span class="sender-avatar" [class]="message.senderType">
                        {{ message.senderName.charAt(0) }}
                      </span>
                      <span class="sender-name">{{ message.senderName }}</span>
                      @if (message.senderType !== 'patient') {
                        <span class="sender-role">{{ message.senderType | titlecase }}</span>
                      }
                    </div>
                    <span class="message-time">{{ formatDateTime(message.createdAt) }}</span>
                  </div>
                  <div class="message-body">
                    {{ message.content }}
                  </div>
                  @if (message.attachments.length > 0) {
                    <div class="message-attachments">
                      @for (attachment of message.attachments; track attachment.id) {
                        <div class="attachment-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span class="attachment-name">{{ attachment.name }}</span>
                          <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
                        </div>
                      }
                    </div>
                  }
                  @if (message.readBy.length > 0 && message.senderId === 'user-1') {
                    <div class="read-receipt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Read by {{ getReadByNames(message) }}
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Reply Box -->
            <div class="reply-box">
              <div class="reply-toolbar">
                <button class="btn-icon" title="Attach file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button class="btn-icon" (click)="toggleQuickReplies()" title="Quick replies">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
              @if (showQuickReplies()) {
                <div class="quick-replies-panel">
                  <h4>Quick Replies</h4>
                  @for (reply of messagingService.quickReplies(); track reply.id) {
                    <button class="quick-reply-item" (click)="useQuickReply(reply.content)">
                      <strong>{{ reply.name }}</strong>
                      <span>{{ reply.content }}</span>
                    </button>
                  }
                </div>
              }
              <textarea 
                placeholder="Type your message..."
                [(ngModel)]="replyContent"
                rows="3"
              ></textarea>
              <div class="reply-actions">
                <div class="priority-select">
                  <label>Priority:</label>
                  <select [(ngModel)]="replyPriority">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <button 
                  class="btn btn-primary"
                  (click)="sendReply()"
                  [disabled]="!replyContent.trim()"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send
                </button>
              </div>
            </div>
          </div>
        } @else {
          <div class="no-selection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>Select a message</h3>
            <p>Choose a conversation from the list to view messages</p>
          </div>
        }
      </div>

      <!-- Compose Modal -->
      @if (showComposeModal()) {
        <div class="modal-overlay" (click)="closeCompose()">
          <div class="modal compose-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>New Message</h2>
              <button class="btn-close" (click)="closeCompose()">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>To:</label>
                <input type="text" placeholder="Search recipients..." [(ngModel)]="composeRecipients" />
              </div>
              <div class="form-group">
                <label>Subject:</label>
                <input type="text" placeholder="Enter subject..." [(ngModel)]="composeSubject" />
              </div>
              <div class="form-group">
                <label>Category:</label>
                <select [(ngModel)]="composeCategory">
                  <option value="general">General</option>
                  <option value="clinical">Clinical</option>
                  <option value="billing">Billing</option>
                  <option value="scheduling">Scheduling</option>
                  <option value="lab-results">Lab Results</option>
                  <option value="prescription">Prescription</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div class="form-group">
                <label>Message:</label>
                <textarea placeholder="Type your message..." [(ngModel)]="composeContent" rows="8"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="saveDraft()">Save Draft</button>
              <button class="btn btn-primary" (click)="sendNewMessage()" [disabled]="!composeSubject.trim() || !composeContent.trim()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inbox-container {
      display: grid;
      grid-template-columns: 240px 350px 1fr;
      height: calc(100vh - 64px);
      background: #f8fafc;
    }

    /* Sidebar */
    .sidebar {
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: width 0.2s;
    }

    .sidebar.collapsed {
      width: 64px;
    }

    .sidebar.collapsed .folder-name,
    .sidebar.collapsed .compose-btn span,
    .sidebar.collapsed .sidebar-link span,
    .sidebar.collapsed .folder-badge,
    .sidebar.collapsed .count-badge {
      display: none;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .compose-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 1rem;
      padding: 0.75rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .compose-btn:hover {
      background: #2563eb;
    }

    .compose-btn svg {
      width: 1rem;
      height: 1rem;
    }

    .folder-list {
      flex: 1;
      padding: 0.5rem;
      overflow-y: auto;
    }

    .folder-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      background: transparent;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }

    .folder-item:hover {
      background: #f1f5f9;
    }

    .folder-item.active {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .folder-icon {
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .folder-icon svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .folder-name {
      flex: 1;
      text-align: left;
    }

    .folder-badge {
      background: #3b82f6;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .sidebar-footer {
      padding: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      color: #475569;
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .sidebar-link:hover {
      background: #f1f5f9;
    }

    .sidebar-link svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .count-badge {
      background: #ef4444;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: auto;
    }

    /* Thread List */
    .thread-list-panel {
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .thread-list-header {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .search-box {
      flex: 1;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem;
      height: 1rem;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .header-actions {
      display: flex;
      gap: 0.25rem;
    }

    .thread-list {
      flex: 1;
      overflow-y: auto;
    }

    .thread-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem;
      background: transparent;
      border: none;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }

    .thread-item:hover {
      background: #f8fafc;
    }

    .thread-item.selected {
      background: #dbeafe;
    }

    .thread-item.unread {
      background: #fefce8;
    }

    .thread-item.unread.selected {
      background: #dbeafe;
    }

    .pin-indicator {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      color: #3b82f6;
    }

    .pin-indicator svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .thread-avatar {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .thread-avatar svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .thread-avatar.secure {
      background: #dbeafe;
      color: #3b82f6;
    }

    .thread-avatar.internal {
      background: #f3e8ff;
      color: #8b5cf6;
    }

    .thread-avatar.system {
      background: #f1f5f9;
      color: #64748b;
    }

    .thread-content {
      flex: 1;
      min-width: 0;
    }

    .thread-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.125rem;
    }

    .thread-sender {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .thread-item.unread .thread-sender {
      color: #1e293b;
    }

    .thread-time {
      font-size: 0.75rem;
      color: #64748b;
      flex-shrink: 0;
    }

    .thread-subject {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #475569;
      margin-bottom: 0.125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .priority-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      font-size: 0.625rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    .priority-indicator.high {
      background: #fef3c7;
      color: #d97706;
    }

    .priority-indicator.urgent {
      background: #fee2e2;
      color: #dc2626;
    }

    .thread-preview {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .star-icon {
      color: #f59e0b;
    }

    .star-icon svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .attachment-icon {
      color: #64748b;
    }

    .attachment-icon svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .category-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 500;
    }

    .category-badge.general { background: #f1f5f9; color: #475569; }
    .category-badge.clinical { background: #dbeafe; color: #1d4ed8; }
    .category-badge.billing { background: #dcfce7; color: #16a34a; }
    .category-badge.scheduling { background: #f3e8ff; color: #7c3aed; }
    .category-badge.lab-results { background: #fef3c7; color: #d97706; }
    .category-badge.prescription { background: #fce7f3; color: #db2777; }
    .category-badge.referral { background: #cffafe; color: #0891b2; }

    .unread-badge {
      background: #3b82f6;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #64748b;
    }

    .empty-state svg {
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Message Detail */
    .message-detail-panel {
      display: flex;
      flex-direction: column;
      background: white;
    }

    .message-detail {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-left h2 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .participants {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .participant-chip {
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: #475569;
    }

    .header-actions {
      display: flex;
      gap: 0.25rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    .btn-icon.active {
      color: #f59e0b;
    }

    .btn-icon.danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .dropdown-container {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      min-width: 150px;
      z-index: 100;
    }

    .dropdown-menu button {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
    }

    .dropdown-menu button:hover {
      background: #f1f5f9;
    }

    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-bubble {
      max-width: 80%;
      padding: 1rem;
      border-radius: 0.75rem;
    }

    .message-bubble.sent {
      align-self: flex-end;
      background: #dbeafe;
    }

    .message-bubble.received {
      align-self: flex-start;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .sender-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sender-avatar {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .sender-avatar.provider { background: #3b82f6; }
    .sender-avatar.patient { background: #10b981; }
    .sender-avatar.staff { background: #8b5cf6; }
    .sender-avatar.department { background: #f59e0b; }

    .sender-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .sender-role {
      font-size: 0.75rem;
      color: #64748b;
    }

    .message-time {
      font-size: 0.75rem;
      color: #64748b;
    }

    .message-body {
      font-size: 0.875rem;
      color: #1e293b;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .message-attachments {
      margin-top: 0.75rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.75rem;
    }

    .attachment-item svg {
      width: 1rem;
      height: 1rem;
      color: #64748b;
    }

    .attachment-name {
      color: #1e293b;
    }

    .attachment-size {
      color: #94a3b8;
    }

    .read-receipt {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .read-receipt svg {
      width: 0.875rem;
      height: 0.875rem;
      color: #3b82f6;
    }

    /* Reply Box */
    .reply-box {
      border-top: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
    }

    .reply-toolbar {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .quick-replies-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .quick-replies-panel h4 {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .quick-reply-item {
      display: block;
      width: 100%;
      padding: 0.5rem;
      text-align: left;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      margin-bottom: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-reply-item:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .quick-reply-item strong {
      display: block;
      font-size: 0.8125rem;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }

    .quick-reply-item span {
      font-size: 0.75rem;
      color: #64748b;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .reply-box textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      resize: none;
      font-family: inherit;
    }

    .reply-box textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .reply-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }

    .priority-select {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .priority-select select {
      padding: 0.375rem 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* No Selection */
    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748b;
    }

    .no-selection svg {
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .no-selection h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #475569;
    }

    .no-selection p {
      margin: 0;
      font-size: 0.875rem;
    }

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
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .compose-modal {
      max-width: 600px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

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
      border-radius: 0.375rem;
    }

    .btn-close:hover {
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .inbox-container {
        grid-template-columns: 200px 280px 1fr;
      }
    }

    @media (max-width: 768px) {
      .inbox-container {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: none;
      }

      .message-detail-panel {
        display: none;
      }

      .thread-list-panel {
        border-right: none;
      }
    }
  `]
})
export class InboxComponent {
  messagingService = inject(MessagingService);

  // Local state
  sidebarCollapsed = signal(false);
  showMoreMenu = signal(false);
  showQuickReplies = signal(false);
  showComposeModal = signal(false);

  // Reply state
  replyContent = '';
  replyPriority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  // Compose state
  composeRecipients = '';
  composeSubject = '';
  composeCategory = 'general';
  composeContent = '';

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMoreMenu(): void {
    this.showMoreMenu.update(v => !v);
  }

  toggleQuickReplies(): void {
    this.showQuickReplies.update(v => !v);
  }

  refreshMessages(): void {
    console.log('Refreshing messages...');
  }

  getOtherParticipants(thread: MessageThread): string {
    return thread.participants
      .filter(p => p.id !== 'user-1')
      .map(p => p.name)
      .join(', ');
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days < 1) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatCategory(category: string): string {
    return category.replace('-', ' ');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  useQuickReply(content: string): void {
    this.replyContent = content;
    this.showQuickReplies.set(false);
  }

  sendReply(): void {
    const threadId = this.messagingService.selectedThreadId();
    if (threadId && this.replyContent.trim()) {
      this.messagingService.sendMessage(threadId, this.replyContent.trim());
      this.replyContent = '';
      this.replyPriority = 'normal';
    }
  }

  confirmDelete(): void {
    const thread = this.messagingService.selectedThread();
    if (thread && confirm('Are you sure you want to delete this conversation?')) {
      this.messagingService.deleteThread(thread.id);
    }
  }

  markAsUnread(): void {
    console.log('Mark as unread');
    this.showMoreMenu.set(false);
  }

  addLabel(): void {
    console.log('Add label');
    this.showMoreMenu.set(false);
  }

  createTask(): void {
    console.log('Create task from message');
    this.showMoreMenu.set(false);
  }

  printThread(): void {
    window.print();
    this.showMoreMenu.set(false);
  }

  openCompose(): void {
    this.composeRecipients = '';
    this.composeSubject = '';
    this.composeCategory = 'general';
    this.composeContent = '';
    this.showComposeModal.set(true);
  }

  closeCompose(): void {
    this.showComposeModal.set(false);
  }

  saveDraft(): void {
    console.log('Saving draft...');
    this.closeCompose();
  }

  sendNewMessage(): void {
    if (this.composeSubject.trim() && this.composeContent.trim()) {
      console.log('Sending new message:', {
        recipients: this.composeRecipients,
        subject: this.composeSubject,
        category: this.composeCategory,
        content: this.composeContent
      });
      this.closeCompose();
    }
  }

  getReadByNames(message: any): string {
    return message.readBy.map((r: any) => r.participantName).join(', ');
  }
}
