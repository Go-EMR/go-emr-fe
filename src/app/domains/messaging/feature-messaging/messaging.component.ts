import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';

// PrimeNG Imports
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Menu } from 'primeng/menu';
import { Tooltip } from 'primeng/tooltip';
import { Divider } from 'primeng/divider';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { AutoComplete } from 'primeng/autocomplete';
import { Chip } from 'primeng/chip';
import { OverlayBadge } from 'primeng/overlaybadge';
import { Ripple } from 'primeng/ripple';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

import { ThemeService } from '../../../core/services/theme.service';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: Attachment[];
  type: 'text' | 'image' | 'file' | 'system';
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  category?: 'patient' | 'staff' | 'department';
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    Avatar,
    AvatarGroup,
    Badge,
    Button,
    InputText,
    Textarea,
    Menu,
    Tooltip,
    Divider,
    Skeleton,
    Tag,
    Dialog,
    Select,
    AutoComplete,
    Chip,
    Ripple,
    IconField,
    InputIcon,
    Toast,
  ],
  providers: [MessageService],
  animations: [
    // Conversation list animation
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Message animation
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    // Slide in animation
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ]),
    // Fade animation
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    // Bounce animation for typing indicator
    trigger('bounce', [
      transition(':enter', [
        animate('600ms ease-in-out', keyframes([
          style({ transform: 'translateY(0)', offset: 0 }),
          style({ transform: 'translateY(-5px)', offset: 0.5 }),
          style({ transform: 'translateY(0)', offset: 1 })
        ]))
      ])
    ]),
    // Scale animation for buttons
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="messaging-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />
      
      <!-- Sidebar - Conversations List -->
      <aside class="conversations-sidebar" [class.mobile-hidden]="selectedConversation()">
        <!-- Sidebar Header -->
        <header class="sidebar-header">
          <h1>Messages</h1>
          <div class="header-actions">
            <p-button
              icon="pi pi-pencil"
              [rounded]="true"
              [text]="true"
              pTooltip="New Message"
              tooltipPosition="bottom"
              (onClick)="showNewMessageDialog = true"
            />
            <p-button
              icon="pi pi-ellipsis-v"
              [rounded]="true"
              [text]="true"
              (onClick)="conversationMenu.toggle($event)"
            />
            <p-menu #conversationMenu [model]="sidebarMenuItems" [popup]="true" />
          </div>
        </header>

        <!-- Search -->
        <div class="search-box">
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search messages..."
              class="search-input"
              (input)="filterConversations()"
            />
          </p-iconfield>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            *ngFor="let filter of filterOptions"
            class="filter-tab"
            [class.active]="activeFilter === filter.value"
            (click)="setFilter(filter.value)"
            pRipple
          >
            <i [class]="filter.icon"></i>
            <span>{{ filter.label }}</span>
            @if (filter.count && filter.count > 0) {
              <span class="filter-badge">{{ filter.count }}</span>
            }
          </button>
        </div>

        <!-- Conversations List -->
        <div class="conversations-list" [@listAnimation]="filteredConversations().length">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <div class="conversation-skeleton">
                <p-skeleton shape="circle" size="48px" />
                <div class="skeleton-content">
                  <p-skeleton width="60%" height="16px" />
                  <p-skeleton width="80%" height="14px" />
                </div>
              </div>
            }
          } @else {
            @for (conv of filteredConversations(); track conv.id) {
              <div
                class="conversation-item"
                [class.active]="selectedConversation()?.id === conv.id"
                [class.unread]="conv.unreadCount > 0"
                [class.pinned]="conv.isPinned"
                (click)="selectConversation(conv)"
                pRipple
              >
                @if (conv.isPinned) {
                  <i class="pin-icon pi pi-thumbtack"></i>
                }
                <div class="avatar-container">
                  <p-avatar
                    [label]="getInitials(conv.name)"
                    [image]="conv.avatar || ''"
                    [style]="getAvatarStyle(conv)"
                    size="large"
                    shape="circle"
                  />
                  @if (conv.isOnline) {
                    <span class="online-indicator"></span>
                  }
                </div>
                <div class="conversation-info">
                  <div class="conv-header">
                    <span class="conv-name">{{ conv.name }}</span>
                    <span class="conv-time">{{ formatTime(conv.lastMessage?.timestamp) }}</span>
                  </div>
                  <div class="conv-preview">
                    <span class="preview-text">
                      @if (conv.lastMessage?.senderId === currentUserId) {
                        <i class="pi pi-check-circle sent-icon"></i>
                      }
                      {{ conv.lastMessage?.content || 'No messages yet' }}
                    </span>
                    @if (conv.unreadCount > 0) {
                      <span class="unread-badge">{{ conv.unreadCount }}</span>
                    }
                    @if (conv.isMuted) {
                      <i class="pi pi-volume-off muted-icon"></i>
                    }
                  </div>
                </div>
              </div>
            }
            @if (filteredConversations().length === 0) {
              <div class="no-conversations" @fadeIn>
                <i class="pi pi-inbox"></i>
                <p>No conversations found</p>
              </div>
            }
          }
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-area" [class.has-conversation]="selectedConversation()">
        @if (selectedConversation()) {
          <!-- Chat Header -->
          <header class="chat-header" @slideIn>
            <p-button
              icon="pi pi-arrow-left"
              [rounded]="true"
              [text]="true"
              class="mobile-back"
              (onClick)="clearSelection()"
            />
            <div class="chat-user-info" (click)="showConversationDetails = true">
              <p-avatar
                [label]="getInitials(selectedConversation()!.name)"
                [image]="selectedConversation()!.avatar || ''"
                [style]="getAvatarStyle(selectedConversation()!)"
                size="large"
                shape="circle"
              />
              <div class="user-details">
                <h2>{{ selectedConversation()!.name }}</h2>
                <span class="user-status" [class.online]="selectedConversation()!.isOnline">
                  @if (isTyping()) {
                    <span class="typing-text">typing...</span>
                  } @else if (selectedConversation()!.isOnline) {
                    Online
                  } @else {
                    Last seen {{ getLastSeen() }}
                  }
                </span>
              </div>
            </div>
            <div class="chat-actions">
              <p-button
                icon="pi pi-phone"
                [rounded]="true"
                [text]="true"
                pTooltip="Voice Call"
                tooltipPosition="bottom"
              />
              <p-button
                icon="pi pi-video"
                [rounded]="true"
                [text]="true"
                pTooltip="Video Call"
                tooltipPosition="bottom"
              />
              <p-button
                icon="pi pi-ellipsis-v"
                [rounded]="true"
                [text]="true"
                (onClick)="chatMenu.toggle($event)"
              />
              <p-menu #chatMenu [model]="chatMenuItems" [popup]="true" />
            </div>
          </header>

          <!-- Messages Container -->
          <div class="messages-container" #messagesContainer>
            <div class="messages-wrapper">
              <!-- Date Separator -->
              @for (group of groupedMessages(); track group.date) {
                <div class="date-separator" @fadeIn>
                  <span>{{ group.date }}</span>
                </div>
                @for (message of group.messages; track message.id) {
                  <div
                    class="message-row"
                    [class.sent]="message.senderId === currentUserId"
                    [class.received]="message.senderId !== currentUserId"
                    [@messageAnimation]
                  >
                    @if (message.senderId !== currentUserId) {
                      <p-avatar
                        [label]="getInitials(message.senderName)"
                        [image]="message.senderAvatar || ''"
                        size="normal"
                        shape="circle"
                        class="message-avatar"
                      />
                    }
                    <div class="message-bubble" [class.has-attachment]="message.attachments?.length">
                      @if (message.type === 'system') {
                        <div class="system-message">
                          <i class="pi pi-info-circle"></i>
                          {{ message.content }}
                        </div>
                      } @else {
                        @if (message.attachments?.length) {
                          <div class="attachments">
                            @for (att of message.attachments; track att.id) {
                              <div class="attachment-item">
                                @if (att.type.startsWith('image')) {
                                  <img [src]="att.url" [alt]="att.name" class="attachment-image" />
                                } @else {
                                  <div class="file-attachment">
                                    <i class="pi pi-file"></i>
                                    <span class="file-name">{{ att.name }}</span>
                                    <span class="file-size">{{ formatFileSize(att.size) }}</span>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                        <p class="message-text">{{ message.content }}</p>
                        <div class="message-meta">
                          <span class="message-time">{{ message.timestamp | date:'shortTime' }}</span>
                          @if (message.senderId === currentUserId) {
                            <i
                              class="read-status"
                              [class.pi-check]="!message.read"
                              [class.pi-check-circle]="message.read"
                              [class.read]="message.read"
                            ></i>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Typing Indicator -->
              @if (isTyping()) {
                <div class="message-row received" @fadeIn>
                  <p-avatar
                    [label]="getInitials(selectedConversation()!.name)"
                    size="normal"
                    shape="circle"
                    class="message-avatar"
                  />
                  <div class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Message Input -->
          <footer class="message-input-area">
            <div class="input-actions-left">
              <p-button
                icon="pi pi-paperclip"
                [rounded]="true"
                [text]="true"
                pTooltip="Attach file"
                tooltipPosition="top"
                (onClick)="attachMenu.toggle($event)"
              />
              <p-menu #attachMenu [model]="attachMenuItems" [popup]="true" />
            </div>
            <div class="message-input-wrapper">
              <textarea
                pTextarea
                [(ngModel)]="newMessage"
                placeholder="Type a message..."
                [rows]="1"
                [autoResize]="true"
                class="message-input"
                (keydown.enter)="onEnterKey($event)"
              ></textarea>
            </div>
            <div class="input-actions-right">
              <p-button
                icon="pi pi-face-smile"
                [rounded]="true"
                [text]="true"
                pTooltip="Emoji"
                tooltipPosition="top"
              />
              @if (newMessage.trim()) {
                <p-button
                  icon="pi pi-send"
                  [rounded]="true"
                  severity="primary"
                  pTooltip="Send"
                  tooltipPosition="top"
                  (onClick)="sendMessage()"
                  [@scaleIn]
                />
              } @else {
                <p-button
                  icon="pi pi-microphone"
                  [rounded]="true"
                  [text]="true"
                  pTooltip="Voice message"
                  tooltipPosition="top"
                />
              }
            </div>
          </footer>
        } @else {
          <!-- Empty State -->
          <div class="empty-state" @fadeIn>
            <div class="empty-icon">
              <i class="pi pi-comments"></i>
            </div>
            <h2>Welcome to Messages</h2>
            <p>Select a conversation or start a new one</p>
            <p-button
              label="New Message"
              icon="pi pi-plus"
              (onClick)="showNewMessageDialog = true"
            />
          </div>
        }
      </main>

      <!-- New Message Dialog -->
      <p-dialog
        header="New Message"
        [(visible)]="showNewMessageDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
        styleClass="new-message-dialog"
      >
        <div class="new-message-form">
          <div class="field">
            <label>To</label>
            <p-autoComplete
              [(ngModel)]="selectedRecipients"
              [suggestions]="recipientSuggestions"
              (completeMethod)="searchRecipients($event)"
              [multiple]="true"
              field="name"
              placeholder="Search people..."
              styleClass="w-full"
            >
              <ng-template let-recipient pTemplate="item">
                <div class="recipient-suggestion">
                  <p-avatar
                    [label]="getInitials(recipient.name)"
                    [image]="recipient.avatar || ''"
                    size="normal"
                    shape="circle"
                  />
                  <div class="recipient-info">
                    <span class="recipient-name">{{ recipient.name }}</span>
                    <span class="recipient-role">{{ recipient.role }}</span>
                  </div>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>
          <div class="field">
            <label>Message</label>
            <textarea
              pTextarea
              [(ngModel)]="newConversationMessage"
              [rows]="4"
              placeholder="Type your message..."
              class="w-full"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (onClick)="showNewMessageDialog = false"
          />
          <p-button
            label="Send"
            icon="pi pi-send"
            [disabled]="!selectedRecipients.length || !newConversationMessage.trim()"
            (onClick)="startNewConversation()"
          />
        </ng-template>
      </p-dialog>

      <!-- Conversation Details Dialog -->
      <p-dialog
        header="Conversation Details"
        [(visible)]="showConversationDetails"
        [modal]="true"
        [style]="{ width: '400px' }"
        [draggable]="false"
        styleClass="conversation-details-dialog"
      >
        @if (selectedConversation()) {
          <div class="details-content">
            <div class="details-avatar">
              <p-avatar
                [label]="getInitials(selectedConversation()!.name)"
                [image]="selectedConversation()!.avatar || ''"
                [style]="getAvatarStyle(selectedConversation()!)"
                size="xlarge"
                shape="circle"
              />
              <h3>{{ selectedConversation()!.name }}</h3>
              @if (selectedConversation()!.category) {
                <p-tag
                  [value]="selectedConversation()!.category | titlecase"
                  [severity]="getCategorySeverity(selectedConversation()!.category!)"
                />
              }
            </div>
            <p-divider />
            <div class="details-actions">
              <button class="detail-action" pRipple>
                <i class="pi pi-bell"></i>
                <span>{{ selectedConversation()!.isMuted ? 'Unmute' : 'Mute' }} notifications</span>
              </button>
              <button class="detail-action" pRipple>
                <i class="pi pi-thumbtack"></i>
                <span>{{ selectedConversation()!.isPinned ? 'Unpin' : 'Pin' }} conversation</span>
              </button>
              <button class="detail-action" pRipple>
                <i class="pi pi-search"></i>
                <span>Search in conversation</span>
              </button>
              <button class="detail-action danger" pRipple>
                <i class="pi pi-trash"></i>
                <span>Delete conversation</span>
              </button>
            </div>
            @if (selectedConversation()!.type === 'group') {
              <p-divider />
              <h4>Participants ({{ selectedConversation()!.participants.length }})</h4>
              <div class="participants-list">
                @for (p of selectedConversation()!.participants; track p.id) {
                  <div class="participant-item">
                    <p-avatar
                      [label]="getInitials(p.name)"
                      [image]="p.avatar || ''"
                      size="normal"
                      shape="circle"
                    />
                    <div class="participant-info">
                      <span class="participant-name">{{ p.name }}</span>
                      <span class="participant-role">{{ p.role }}</span>
                    </div>
                    @if (p.isOnline) {
                      <span class="online-dot"></span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    .messaging-container {
      display: flex;
      height: calc(100vh - 64px);
      background: #f1f5f9;
      overflow: hidden;
    }

    .dark.messaging-container {
      background: #0f172a;
    }

    /* Sidebar */
    .conversations-sidebar {
      width: 360px;
      min-width: 360px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .dark .conversations-sidebar {
      background: #1e293b;
      border-right-color: #334155;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .sidebar-header {
      border-bottom-color: #334155;
    }

    .sidebar-header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .dark .sidebar-header h1 {
      color: #f1f5f9;
    }

    .header-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* Search */
    .search-box {
      padding: 0.75rem 1rem;
    }

    .search-box :host ::ng-deep .p-inputtext {
      width: 100%;
      border-radius: 2rem;
      padding-left: 2.5rem;
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0 1rem 0.75rem;
      overflow-x: auto;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border: none;
      background: #f1f5f9;
      border-radius: 2rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .dark .filter-tab {
      background: #334155;
      color: #94a3b8;
    }

    .filter-tab:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .dark .filter-tab:hover {
      background: #475569;
      color: #f1f5f9;
    }

    .filter-tab.active {
      background: #3b82f6;
      color: white;
    }

    .filter-tab i {
      font-size: 0.875rem;
    }

    .filter-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
    }

    .filter-tab.active .filter-badge {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Conversations List */
    .conversations-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .conversation-item:hover {
      background: #f1f5f9;
    }

    .dark .conversation-item:hover {
      background: #334155;
    }

    .conversation-item.active {
      background: #dbeafe;
    }

    .dark .conversation-item.active {
      background: #1e3a5f;
    }

    .conversation-item.unread {
      background: #fef3c7;
    }

    .dark .conversation-item.unread {
      background: #422006;
    }

    .conversation-item.pinned::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #f59e0b;
      border-radius: 0 2px 2px 0;
    }

    .pin-icon {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.75rem;
      color: #f59e0b;
      transform: rotate(45deg);
    }

    .avatar-container {
      position: relative;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #22c55e;
      border: 2px solid white;
      border-radius: 50%;
    }

    .dark .online-indicator {
      border-color: #1e293b;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .conv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .conv-name {
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark .conv-name {
      color: #f1f5f9;
    }

    .conv-time {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .conv-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-text {
      flex: 1;
      font-size: 0.875rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .dark .preview-text {
      color: #94a3b8;
    }

    .sent-icon {
      font-size: 0.75rem;
      color: #3b82f6;
    }

    .unread-badge {
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      min-width: 20px;
      text-align: center;
    }

    .muted-icon {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .conversation-skeleton {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .no-conversations {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #94a3b8;
    }

    .no-conversations i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Chat Area */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .dark .chat-area {
      background: #0f172a;
    }

    /* Chat Header */
    .chat-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .chat-header {
      background: #1e293b;
      border-bottom-color: #334155;
    }

    .mobile-back {
      display: none;
    }

    .chat-user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      cursor: pointer;
    }

    .user-details h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .user-details h2 {
      color: #f1f5f9;
    }

    .user-status {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .user-status.online {
      color: #22c55e;
    }

    .typing-text {
      color: #3b82f6;
      font-style: italic;
    }

    .chat-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .messages-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 0;
    }

    .date-separator span {
      background: #e2e8f0;
      color: #64748b;
      font-size: 0.75rem;
      padding: 0.375rem 0.875rem;
      border-radius: 1rem;
    }

    .dark .date-separator span {
      background: #334155;
      color: #94a3b8;
    }

    /* Message Row */
    .message-row {
      display: flex;
      gap: 0.5rem;
      max-width: 75%;
      animation: messageSlideIn 0.3s ease-out;
    }

    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-row.sent {
      margin-left: auto;
      flex-direction: row-reverse;
    }

    .message-row.received {
      margin-right: auto;
    }

    .message-avatar {
      flex-shrink: 0;
      align-self: flex-end;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 1.25rem;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .dark .message-bubble {
      background: #334155;
    }

    .message-row.sent .message-bubble {
      background: #3b82f6;
      border-bottom-right-radius: 0.25rem;
    }

    .message-row.received .message-bubble {
      border-bottom-left-radius: 0.25rem;
    }

    .system-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
      font-style: italic;
    }

    .message-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: #1e293b;
      word-break: break-word;
    }

    .dark .message-text {
      color: #f1f5f9;
    }

    .message-row.sent .message-text {
      color: white;
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.375rem;
      margin-top: 0.25rem;
    }

    .message-time {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .message-row.sent .message-time {
      color: rgba(255, 255, 255, 0.7);
    }

    .read-status {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .read-status.read {
      color: #4ade80;
    }

    /* Attachments */
    .attachments {
      margin-bottom: 0.5rem;
    }

    .attachment-image {
      max-width: 100%;
      border-radius: 0.75rem;
      max-height: 300px;
      object-fit: cover;
    }

    .file-attachment {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 0.5rem;
    }

    .dark .file-attachment {
      background: rgba(255, 255, 255, 0.1);
    }

    .file-attachment i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .file-name {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .file-size {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      background: white;
      border-radius: 1.25rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .dark .typing-indicator {
      background: #334155;
    }

    .typing-indicator .dot {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out both;
    }

    .typing-indicator .dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .typing-indicator .dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typingBounce {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Message Input */
    .message-input-area {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .dark .message-input-area {
      background: #1e293b;
      border-top-color: #334155;
    }

    .message-input-wrapper {
      flex: 1;
    }

    .message-input {
      width: 100%;
      border-radius: 1.5rem !important;
      padding: 0.75rem 1rem !important;
      max-height: 120px;
      resize: none;
    }

    .input-actions-left,
    .input-actions-right {
      display: flex;
      gap: 0.25rem;
    }

    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .dark .empty-icon {
      background: linear-gradient(135deg, #1e3a5f 0%, #312e81 100%);
    }

    .empty-icon i {
      font-size: 3rem;
      color: #3b82f6;
    }

    .empty-state h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .empty-state h2 {
      color: #f1f5f9;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: #64748b;
    }

    /* Dialogs */
    .new-message-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .new-message-form .field label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .dark .new-message-form .field label {
      color: #e2e8f0;
    }

    .w-full {
      width: 100%;
    }

    .recipient-suggestion {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem;
    }

    .recipient-info {
      display: flex;
      flex-direction: column;
    }

    .recipient-name {
      font-weight: 500;
    }

    .recipient-role {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Details Dialog */
    .details-content {
      display: flex;
      flex-direction: column;
    }

    .details-avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 0;
    }

    .details-avatar h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .dark .details-avatar h3 {
      color: #f1f5f9;
    }

    .details-actions {
      display: flex;
      flex-direction: column;
    }

    .detail-action {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.9375rem;
      color: #374151;
      cursor: pointer;
      transition: background 0.2s;
    }

    .dark .detail-action {
      color: #e2e8f0;
    }

    .detail-action:hover {
      background: #f1f5f9;
    }

    .dark .detail-action:hover {
      background: #334155;
    }

    .detail-action.danger {
      color: #ef4444;
    }

    .detail-action i {
      font-size: 1.125rem;
      width: 24px;
    }

    .participants-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .participant-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .participant-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .participant-name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .participant-name {
      color: #f1f5f9;
    }

    .participant-role {
      font-size: 0.75rem;
      color: #64748b;
    }

    .online-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .conversations-sidebar {
        width: 100%;
        min-width: 100%;
      }

      .conversations-sidebar.mobile-hidden {
        display: none;
      }

      .chat-area {
        display: none;
      }

      .chat-area.has-conversation {
        display: flex;
      }

      .mobile-back {
        display: flex;
      }

      .message-row {
        max-width: 85%;
      }
    }
  `]
})
export class MessagingComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  themeService = inject(ThemeService);
  private messageService = inject(MessageService);

  // State
  loading = signal(false);
  searchQuery = '';
  activeFilter = 'all';
  newMessage = '';
  showNewMessageDialog = false;
  showConversationDetails = false;
  selectedRecipients: Participant[] = [];
  newConversationMessage = '';
  recipientSuggestions: Participant[] = [];

  currentUserId = 'user-1';

  // Signals
  selectedConversation = signal<Conversation | null>(null);
  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  isTyping = signal(false);

  // Filter options
  filterOptions = [
    { label: 'All', value: 'all', icon: 'pi pi-inbox', count: 0 },
    { label: 'Unread', value: 'unread', icon: 'pi pi-envelope', count: 3 },
    { label: 'Patients', value: 'patient', icon: 'pi pi-users', count: 0 },
    { label: 'Staff', value: 'staff', icon: 'pi pi-briefcase', count: 0 },
  ];

  // Menus
  sidebarMenuItems: MenuItem[] = [
    { label: 'Mark all as read', icon: 'pi pi-check' },
    { label: 'Archived chats', icon: 'pi pi-folder' },
    { separator: true },
    { label: 'Settings', icon: 'pi pi-cog' },
  ];

  chatMenuItems: MenuItem[] = [
    { label: 'View profile', icon: 'pi pi-user' },
    { label: 'Search in conversation', icon: 'pi pi-search' },
    { label: 'Mute notifications', icon: 'pi pi-volume-off' },
    { separator: true },
    { label: 'Clear chat', icon: 'pi pi-trash', styleClass: 'text-danger' },
  ];

  attachMenuItems: MenuItem[] = [
    { label: 'Photo', icon: 'pi pi-image' },
    { label: 'Document', icon: 'pi pi-file' },
    { label: 'Camera', icon: 'pi pi-camera' },
  ];

  // Mock contacts
  allContacts: Participant[] = [
    { id: 'c1', name: 'Dr. Sarah Wilson', role: 'Cardiologist', isOnline: true },
    { id: 'c2', name: 'Nurse John Smith', role: 'RN - Emergency', isOnline: true },
    { id: 'c3', name: 'Emily Rodriguez', role: 'Patient', isOnline: false },
    { id: 'c4', name: 'Dr. Michael Chen', role: 'General Practice', isOnline: true },
    { id: 'c5', name: 'Lab Department', role: 'Department', isOnline: true },
  ];

  private shouldScroll = false;

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadConversations(): void {
    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.conversations.set([
        {
          id: 'conv-1',
          type: 'direct',
          name: 'Dr. Sarah Wilson',
          participants: [{ id: 'p1', name: 'Dr. Sarah Wilson', role: 'Cardiologist', isOnline: true }],
          lastMessage: {
            id: 'm1',
            conversationId: 'conv-1',
            senderId: 'p1',
            senderName: 'Dr. Sarah Wilson',
            content: 'The patient\'s ECG results look normal. No signs of arrhythmia.',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            read: false,
            type: 'text'
          },
          unreadCount: 2,
          isOnline: true,
          isPinned: true,
          category: 'staff'
        },
        {
          id: 'conv-2',
          type: 'direct',
          name: 'Emily Rodriguez',
          participants: [{ id: 'p2', name: 'Emily Rodriguez', role: 'Patient', isOnline: false }],
          lastMessage: {
            id: 'm2',
            conversationId: 'conv-2',
            senderId: 'user-1',
            senderName: 'You',
            content: 'Your prescription has been sent to the pharmacy.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: true,
            type: 'text'
          },
          unreadCount: 0,
          isOnline: false,
          category: 'patient'
        },
        {
          id: 'conv-3',
          type: 'group',
          name: 'Cardiology Team',
          participants: [
            { id: 'p1', name: 'Dr. Sarah Wilson', role: 'Cardiologist', isOnline: true },
            { id: 'p3', name: 'Dr. James Lee', role: 'Cardiologist', isOnline: false },
            { id: 'p4', name: 'Nurse Mary Johnson', role: 'RN', isOnline: true },
          ],
          lastMessage: {
            id: 'm3',
            conversationId: 'conv-3',
            senderId: 'p3',
            senderName: 'Dr. James Lee',
            content: 'Team meeting tomorrow at 9 AM to discuss the new protocol.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            read: true,
            type: 'text'
          },
          unreadCount: 0,
          category: 'staff'
        },
        {
          id: 'conv-4',
          type: 'direct',
          name: 'Lab Department',
          participants: [{ id: 'p5', name: 'Lab Department', role: 'Department', isOnline: true }],
          lastMessage: {
            id: 'm4',
            conversationId: 'conv-4',
            senderId: 'p5',
            senderName: 'Lab Department',
            content: 'Lab results for patient MRN-003 are ready for review.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: false,
            type: 'text'
          },
          unreadCount: 1,
          isOnline: true,
          isMuted: true,
          category: 'department'
        },
        {
          id: 'conv-5',
          type: 'direct',
          name: 'John Martinez',
          participants: [{ id: 'p6', name: 'John Martinez', role: 'Patient', isOnline: true }],
          lastMessage: {
            id: 'm5',
            conversationId: 'conv-5',
            senderId: 'p6',
            senderName: 'John Martinez',
            content: 'Thank you for the follow-up appointment reminder!',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            read: true,
            type: 'text'
          },
          unreadCount: 0,
          isOnline: true,
          category: 'patient'
        },
      ]);
      this.loading.set(false);
      this.updateFilterCounts();
    }, 500);
  }

  filteredConversations = computed(() => {
    let convs = this.conversations();
    
    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      convs = convs.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.lastMessage?.content.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (this.activeFilter !== 'all') {
      if (this.activeFilter === 'unread') {
        convs = convs.filter(c => c.unreadCount > 0);
      } else {
        convs = convs.filter(c => c.category === this.activeFilter);
      }
    }

    // Sort: pinned first, then by last message time
    return convs.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.timestamp?.getTime() || 0;
      const bTime = b.lastMessage?.timestamp?.getTime() || 0;
      return bTime - aTime;
    });
  });

  groupedMessages = computed(() => {
    const msgs = this.messages();
    const groups: { date: string; messages: Message[] }[] = [];
    
    let currentDate = '';
    let currentGroup: Message[] = [];
    
    msgs.forEach(msg => {
      const date = this.formatDate(msg.timestamp);
      if (date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = date;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  });

  selectConversation(conv: Conversation): void {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.id);
    
    // Mark as read
    if (conv.unreadCount > 0) {
      const updated = { ...conv, unreadCount: 0 };
      this.conversations.update(convs => 
        convs.map(c => c.id === conv.id ? updated : c)
      );
      this.updateFilterCounts();
    }
  }

  loadMessages(conversationId: string): void {
    // Simulate loading messages
    const mockMessages: Message[] = [
      {
        id: 'm1',
        conversationId,
        senderId: 'other',
        senderName: this.selectedConversation()!.name,
        content: 'Good morning! I wanted to discuss the patient we saw yesterday.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: true,
        type: 'text'
      },
      {
        id: 'm2',
        conversationId,
        senderId: 'user-1',
        senderName: 'You',
        content: 'Good morning! Yes, I reviewed the case notes. The vital signs look stable.',
        timestamp: new Date(Date.now() - 55 * 60 * 1000),
        read: true,
        type: 'text'
      },
      {
        id: 'm3',
        conversationId,
        senderId: 'other',
        senderName: this.selectedConversation()!.name,
        content: 'Great. I\'m thinking we should schedule a follow-up appointment for next week.',
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        read: true,
        type: 'text'
      },
      {
        id: 'm4',
        conversationId,
        senderId: 'user-1',
        senderName: 'You',
        content: 'Agreed. I\'ll coordinate with the front desk to find an available slot.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: true,
        type: 'text'
      },
      {
        id: 'm5',
        conversationId,
        senderId: 'other',
        senderName: this.selectedConversation()!.name,
        content: 'The patient\'s ECG results look normal. No signs of arrhythmia.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: true,
        type: 'text'
      },
    ];
    
    this.messages.set(mockMessages);
    this.shouldScroll = true;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation()) return;

    const message: Message = {
      id: `m-${Date.now()}`,
      conversationId: this.selectedConversation()!.id,
      senderId: this.currentUserId,
      senderName: 'You',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false,
      type: 'text'
    };

    this.messages.update(msgs => [...msgs, message]);
    this.newMessage = '';
    this.shouldScroll = true;

    // Update conversation's last message
    this.conversations.update(convs =>
      convs.map(c => c.id === this.selectedConversation()!.id
        ? { ...c, lastMessage: message }
        : c
      )
    );

    // Simulate typing response
    setTimeout(() => {
      this.isTyping.set(true);
      this.shouldScroll = true;
      
      setTimeout(() => {
        this.isTyping.set(false);
        const response: Message = {
          id: `m-${Date.now()}`,
          conversationId: this.selectedConversation()!.id,
          senderId: 'other',
          senderName: this.selectedConversation()!.name,
          content: 'Thanks for the update! I\'ll review this shortly.',
          timestamp: new Date(),
          read: true,
          type: 'text'
        };
        this.messages.update(msgs => [...msgs, response]);
        this.shouldScroll = true;
        
        this.messageService.add({
          severity: 'info',
          summary: this.selectedConversation()!.name,
          detail: response.content,
          life: 3000
        });
      }, 2000);
    }, 1000);
  }

  onEnterKey(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  clearSelection(): void {
    this.selectedConversation.set(null);
    this.messages.set([]);
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  filterConversations(): void {
    // Triggers computed to recompute
  }

  updateFilterCounts(): void {
    const convs = this.conversations();
    this.filterOptions[1].count = convs.filter(c => c.unreadCount > 0).length;
  }

  searchRecipients(event: any): void {
    const query = event.query.toLowerCase();
    this.recipientSuggestions = this.allContacts.filter(c =>
      c.name.toLowerCase().includes(query) &&
      !this.selectedRecipients.find(r => r.id === c.id)
    );
  }

  startNewConversation(): void {
    if (!this.selectedRecipients.length || !this.newConversationMessage.trim()) return;

    // Create new conversation
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      type: this.selectedRecipients.length > 1 ? 'group' : 'direct',
      name: this.selectedRecipients.map(r => r.name).join(', '),
      participants: this.selectedRecipients,
      unreadCount: 0,
      isOnline: this.selectedRecipients.some(r => r.isOnline),
      category: this.selectedRecipients[0].role === 'Patient' ? 'patient' : 'staff'
    };

    this.conversations.update(convs => [newConv, ...convs]);
    this.selectConversation(newConv);

    // Send first message
    this.newMessage = this.newConversationMessage;
    this.sendMessage();

    // Reset dialog
    this.showNewMessageDialog = false;
    this.selectedRecipients = [];
    this.newConversationMessage = '';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarStyle(conv: Conversation): object {
    const colors: { [key: string]: string } = {
      'patient': '#3b82f6',
      'staff': '#10b981',
      'department': '#8b5cf6',
    };
    return {
      'background-color': colors[conv.category || 'staff'] || '#64748b',
      'color': 'white',
      'font-size': '1rem'
    };
  }

  getCategorySeverity(category: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    const map: { [key: string]: "success" | "secondary" | "info" | "warn" | "danger" | "contrast" } = {
      'patient': 'info',
      'staff': 'success',
      'department': 'warn',
    };
    return map[category] || 'secondary';
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getLastSeen(): string {
    return '2 hours ago';
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
