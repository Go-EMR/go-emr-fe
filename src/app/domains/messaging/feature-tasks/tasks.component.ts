import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessagingService } from '../data-access/services/messaging.service';
import { Task, TaskStatus, TaskPriority, TaskCategory, Participant } from '../data-access/models/messaging.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tasks-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <a routerLink="/messaging" class="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </a>
            <div>
              <h1>Tasks</h1>
              <p class="subtitle">Manage your clinical and administrative tasks</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Task
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingTasks() }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon in-progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ inProgressTasks() }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon overdue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ overdueTasks() }}</span>
            <span class="stat-label">Overdue</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ completedTodayTasks() }}</span>
            <span class="stat-label">Completed Today</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search tasks..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>
        <div class="filter-group">
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select [ngModel]="priorityFilter()" (ngModelChange)="priorityFilter.set($event)">
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
            <option value="all">All Categories</option>
            <option value="clinical">Clinical</option>
            <option value="administrative">Administrative</option>
            <option value="billing">Billing</option>
            <option value="follow-up">Follow-up</option>
            <option value="documentation">Documentation</option>
            <option value="referral">Referral</option>
          </select>
        </div>
        <div class="view-toggle">
          <button 
            class="toggle-btn"
            [class.active]="viewMode() === 'list'"
            (click)="viewMode.set('list')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button 
            class="toggle-btn"
            [class.active]="viewMode() === 'board'"
            (click)="viewMode.set('board')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- List View -->
      @if (viewMode() === 'list') {
        <div class="tasks-list">
          @for (task of filteredTasks(); track task.id) {
            <div 
              class="task-card"
              [class.overdue]="isOverdue(task)"
              [class.completed]="task.status === 'completed'"
            >
              <div class="task-checkbox">
                <button 
                  class="checkbox"
                  [class.checked]="task.status === 'completed'"
                  (click)="toggleComplete(task)"
                >
                  @if (task.status === 'completed') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  }
                </button>
              </div>
              <div class="task-content" (click)="openTaskDetail(task)">
                <div class="task-header">
                  <span class="priority-badge" [class]="task.priority">
                    {{ task.priority | titlecase }}
                  </span>
                  <span class="category-badge" [class]="task.category">
                    {{ formatCategory(task.category) }}
                  </span>
                  @if (task.patientName) {
                    <span class="patient-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {{ task.patientName }}
                    </span>
                  }
                </div>
                <h3 class="task-title">{{ task.title }}</h3>
                <p class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <span class="assigned-by">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ task.assignedBy.name }}
                  </span>
                  @if (task.dueDate) {
                    <span class="due-date" [class.overdue]="isOverdue(task)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDueDate(task.dueDate) }}
                    </span>
                  }
                  @if (task.tags.length > 0) {
                    <div class="task-tags">
                      @for (tag of task.tags.slice(0, 2); track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                      @if (task.tags.length > 2) {
                        <span class="tag more">+{{ task.tags.length - 2 }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="task-actions">
                <span class="status-badge" [class]="task.status">
                  {{ formatStatus(task.status) }}
                </span>
                <div class="action-buttons">
                  <button class="btn-icon" (click)="editTask(task)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon danger" (click)="deleteTask(task)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <h3>No tasks found</h3>
              <p>Create a new task or adjust your filters</p>
              <button class="btn btn-primary" (click)="openCreateModal()">Create Task</button>
            </div>
          }
        </div>
      }

      <!-- Board View -->
      @if (viewMode() === 'board') {
        <div class="tasks-board">
          <div class="board-column">
            <div class="column-header pending">
              <h3>Pending</h3>
              <span class="count">{{ tasksByStatus('pending').length }}</span>
            </div>
            <div class="column-tasks">
              @for (task of tasksByStatus('pending'); track task.id) {
                <div class="board-card" [class.overdue]="isOverdue(task)" (click)="openTaskDetail(task)">
                  <div class="card-header">
                    <span class="priority-indicator" [class]="task.priority"></span>
                    <span class="category-badge small" [class]="task.category">
                      {{ formatCategory(task.category) }}
                    </span>
                  </div>
                  <h4>{{ task.title }}</h4>
                  @if (task.patientName) {
                    <span class="patient-name">{{ task.patientName }}</span>
                  }
                  @if (task.dueDate) {
                    <span class="due-date" [class.overdue]="isOverdue(task)">
                      {{ formatDueDate(task.dueDate) }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="board-column">
            <div class="column-header in-progress">
              <h3>In Progress</h3>
              <span class="count">{{ tasksByStatus('in-progress').length }}</span>
            </div>
            <div class="column-tasks">
              @for (task of tasksByStatus('in-progress'); track task.id) {
                <div class="board-card" (click)="openTaskDetail(task)">
                  <div class="card-header">
                    <span class="priority-indicator" [class]="task.priority"></span>
                    <span class="category-badge small" [class]="task.category">
                      {{ formatCategory(task.category) }}
                    </span>
                  </div>
                  <h4>{{ task.title }}</h4>
                  @if (task.patientName) {
                    <span class="patient-name">{{ task.patientName }}</span>
                  }
                  @if (task.dueDate) {
                    <span class="due-date" [class.overdue]="isOverdue(task)">
                      {{ formatDueDate(task.dueDate) }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="board-column">
            <div class="column-header completed">
              <h3>Completed</h3>
              <span class="count">{{ tasksByStatus('completed').length }}</span>
            </div>
            <div class="column-tasks">
              @for (task of tasksByStatus('completed'); track task.id) {
                <div class="board-card completed" (click)="openTaskDetail(task)">
                  <div class="card-header">
                    <span class="priority-indicator" [class]="task.priority"></span>
                    <span class="category-badge small" [class]="task.category">
                      {{ formatCategory(task.category) }}
                    </span>
                  </div>
                  <h4>{{ task.title }}</h4>
                  @if (task.patientName) {
                    <span class="patient-name">{{ task.patientName }}</span>
                  }
                  @if (task.completedAt) {
                    <span class="completed-date">
                      Completed {{ formatDueDate(task.completedAt) }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showTaskModal()) {
        <div class="modal-overlay" (click)="closeTaskModal()">
          <div class="modal task-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingTask() ? 'Edit Task' : 'Create Task' }}</h2>
              <button class="btn-close" (click)="closeTaskModal()">×</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="taskForm">
                <div class="form-group">
                  <label for="title">Title *</label>
                  <input id="title" type="text" formControlName="title" placeholder="Enter task title" />
                </div>

                <div class="form-group">
                  <label for="description">Description</label>
                  <textarea id="description" formControlName="description" placeholder="Enter description" rows="3"></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="category">Category *</label>
                    <select id="category" formControlName="category">
                      <option value="clinical">Clinical</option>
                      <option value="administrative">Administrative</option>
                      <option value="billing">Billing</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="documentation">Documentation</option>
                      <option value="referral">Referral</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="priority">Priority *</label>
                    <select id="priority" formControlName="priority">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="dueDate">Due Date</label>
                    <input id="dueDate" type="datetime-local" formControlName="dueDate" />
                  </div>
                  <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" formControlName="status">
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="patientName">Patient (Optional)</label>
                  <input id="patientName" type="text" formControlName="patientName" placeholder="Search patient..." />
                </div>

                <div class="form-group">
                  <label for="tags">Tags</label>
                  <input id="tags" type="text" formControlName="tags" placeholder="Enter tags separated by commas" />
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeTaskModal()">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="saveTask()"
                [disabled]="taskForm.invalid"
              >
                {{ editingTask() ? 'Update' : 'Create' }} Task
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Task Detail Modal -->
      @if (showDetailModal()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="header-badges">
                <span class="priority-badge" [class]="selectedTask()!.priority">
                  {{ selectedTask()!.priority | titlecase }}
                </span>
                <span class="category-badge" [class]="selectedTask()!.category">
                  {{ formatCategory(selectedTask()!.category) }}
                </span>
                <span class="status-badge" [class]="selectedTask()!.status">
                  {{ formatStatus(selectedTask()!.status) }}
                </span>
              </div>
              <button class="btn-close" (click)="closeDetailModal()">×</button>
            </div>
            <div class="modal-body">
              <h2 class="detail-title">{{ selectedTask()!.title }}</h2>
              
              @if (selectedTask()!.description) {
                <p class="detail-description">{{ selectedTask()!.description }}</p>
              }

              <div class="detail-grid">
                <div class="detail-item">
                  <label>Assigned By</label>
                  <span>{{ selectedTask()!.assignedBy.name }}</span>
                </div>
                <div class="detail-item">
                  <label>Assigned To</label>
                  <span>{{ selectedTask()!.assignedTo.name }}</span>
                </div>
                @if (selectedTask()!.patientName) {
                  <div class="detail-item">
                    <label>Patient</label>
                    <a class="patient-link-detail">{{ selectedTask()!.patientName }}</a>
                  </div>
                }
                @if (selectedTask()!.dueDate) {
                  <div class="detail-item">
                    <label>Due Date</label>
                    <span [class.overdue]="isOverdue(selectedTask()!)">
                      @if (selectedTask()?.dueDate; as dueDate) {
                        {{ formatDateTime(dueDate) }}
                      }
                    </span>
                  </div>
                }
                <div class="detail-item">
                  <label>Created</label>
                  <span>{{ formatDateTime(selectedTask()!.createdAt) }}</span>
                </div>
                @if (selectedTask()!.completedAt) {
                  <div class="detail-item">
                    <label>Completed</label>
                    <span>
                    @if (selectedTask()?.completedAt; as completedAt) {
                      {{ formatDateTime(completedAt) }}
                    }
                    </span>
                  </div>
                }
              </div>

              @if (selectedTask()!.tags.length > 0) {
                <div class="detail-tags">
                  <label>Tags</label>
                  <div class="tags-list">
                    @for (tag of selectedTask()!.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Status Actions -->
              <div class="status-actions">
                <label>Update Status</label>
                <div class="status-buttons">
                  @if (selectedTask()!.status !== 'pending') {
                    <button class="status-btn pending" (click)="updateStatus('pending')">
                      Mark Pending
                    </button>
                  }
                  @if (selectedTask()!.status !== 'in-progress') {
                    <button class="status-btn in-progress" (click)="updateStatus('in-progress')">
                      Start Progress
                    </button>
                  }
                  @if (selectedTask()!.status !== 'completed') {
                    <button class="status-btn completed" (click)="updateStatus('completed')">
                      Mark Complete
                    </button>
                  }
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="editTask(selectedTask()!)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button class="btn btn-danger" (click)="deleteTask(selectedTask()!)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tasks-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .back-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      color: #64748b;
      transition: all 0.2s;
    }

    .back-link:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    .back-link svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

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

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-danger:hover {
      background: #fecaca;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
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

    .btn-icon.danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Stats Cards */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
    }

    .stat-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .stat-icon.pending { background: #fef3c7; color: #d97706; }
    .stat-icon.in-progress { background: #dbeafe; color: #3b82f6; }
    .stat-icon.overdue { background: #fee2e2; color: #dc2626; }
    .stat-icon.completed { background: #dcfce7; color: #16a34a; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 200px;
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

    .filter-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-group select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
    }

    .view-toggle {
      display: flex;
      background: #f1f5f9;
      border-radius: 0.5rem;
      padding: 0.25rem;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-btn.active {
      background: white;
      color: #3b82f6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .toggle-btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* List View */
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      transition: all 0.2s;
    }

    .task-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .task-card.overdue {
      border-left: 3px solid #dc2626;
    }

    .task-card.completed {
      opacity: 0.7;
    }

    .task-checkbox {
      flex-shrink: 0;
      padding-top: 0.25rem;
    }

    .checkbox {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #e2e8f0;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .checkbox:hover {
      border-color: #3b82f6;
    }

    .checkbox.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .checkbox svg {
      width: 1rem;
      height: 1rem;
      color: white;
    }

    .task-content {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .task-header {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .priority-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .priority-badge.critical { background: #fee2e2; color: #dc2626; }
    .priority-badge.high { background: #fef3c7; color: #d97706; }
    .priority-badge.normal { background: #dbeafe; color: #3b82f6; }
    .priority-badge.low { background: #f1f5f9; color: #64748b; }

    .category-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .category-badge.clinical { background: #dbeafe; color: #1d4ed8; }
    .category-badge.administrative { background: #f3e8ff; color: #7c3aed; }
    .category-badge.billing { background: #dcfce7; color: #16a34a; }
    .category-badge.follow-up { background: #fef3c7; color: #d97706; }
    .category-badge.documentation { background: #e0e7ff; color: #4f46e5; }
    .category-badge.referral { background: #cffafe; color: #0891b2; }
    .category-badge.other { background: #f1f5f9; color: #475569; }

    .category-badge.small {
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
    }

    .patient-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #3b82f6;
    }

    .patient-link svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .task-title {
      margin: 0 0 0.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .task-card.completed .task-title {
      text-decoration: line-through;
      color: #64748b;
    }

    .task-description {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .assigned-by, .due-date {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .assigned-by svg, .due-date svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .due-date.overdue {
      color: #dc2626;
      font-weight: 500;
    }

    .task-tags {
      display: flex;
      gap: 0.25rem;
    }

    .tag {
      padding: 0.125rem 0.375rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      color: #64748b;
    }

    .tag.more {
      background: #e2e8f0;
    }

    .task-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.in-progress { background: #dbeafe; color: #3b82f6; }
    .status-badge.completed { background: #dcfce7; color: #16a34a; }
    .status-badge.cancelled { background: #f1f5f9; color: #64748b; }
    .status-badge.deferred { background: #f3e8ff; color: #7c3aed; }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    /* Board View */
    .tasks-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      min-height: 400px;
    }

    .board-column {
      background: #f8fafc;
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
    }

    .column-header.pending { background: #fef3c7; }
    .column-header.in-progress { background: #dbeafe; }
    .column-header.completed { background: #dcfce7; }

    .column-header h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .column-header .count {
      background: white;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
    }

    .column-tasks {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }

    .board-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .board-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .board-card.overdue {
      border-left: 3px solid #dc2626;
    }

    .board-card.completed {
      opacity: 0.7;
    }

    .board-card .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .priority-indicator {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }

    .priority-indicator.critical { background: #dc2626; }
    .priority-indicator.high { background: #d97706; }
    .priority-indicator.normal { background: #3b82f6; }
    .priority-indicator.low { background: #64748b; }

    .board-card h4 {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
    }

    .board-card .patient-name {
      display: block;
      font-size: 0.75rem;
      color: #3b82f6;
      margin-bottom: 0.25rem;
    }

    .board-card .due-date,
    .board-card .completed-date {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      text-align: center;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Modals */
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

    .task-modal {
      max-width: 500px;
    }

    .detail-modal {
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

    .header-badges {
      display: flex;
      gap: 0.5rem;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    .form-group textarea {
      resize: vertical;
    }

    /* Detail Modal */
    .detail-title {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .detail-description {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item span {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .detail-item span.overdue {
      color: #dc2626;
      font-weight: 500;
    }

    .patient-link-detail {
      color: #3b82f6;
      cursor: pointer;
    }

    .patient-link-detail:hover {
      text-decoration: underline;
    }

    .detail-tags {
      margin-bottom: 1.5rem;
    }

    .detail-tags label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .status-actions {
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .status-actions label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .status-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .status-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .status-btn.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-btn.pending:hover {
      background: #fde68a;
    }

    .status-btn.in-progress {
      background: #dbeafe;
      color: #3b82f6;
    }

    .status-btn.in-progress:hover {
      background: #bfdbfe;
    }

    .status-btn.completed {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-btn.completed:hover {
      background: #bbf7d0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-bar {
        flex-direction: column;
      }

      .tasks-board {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TasksComponent {
  private messagingService = inject(MessagingService);
  private fb = inject(FormBuilder);

  // State
  searchQuery = signal('');
  statusFilter = signal<'all' | TaskStatus>('all');
  priorityFilter = signal<'all' | TaskPriority>('all');
  categoryFilter = signal<'all' | TaskCategory>('all');
  viewMode = signal<'list' | 'board'>('list');

  // Modal state
  showTaskModal = signal(false);
  showDetailModal = signal(false);
  editingTask = signal<Task | null>(null);
  selectedTask = signal<Task | null>(null);

  // Form
  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['clinical', Validators.required],
    priority: ['normal', Validators.required],
    status: ['pending'],
    dueDate: [''],
    patientName: [''],
    tags: ['']
  });

  // Computed values
  filteredTasks = computed(() => {
    let tasks = this.messagingService.tasks();
    
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.patientName?.toLowerCase().includes(query)
      );
    }
    
    if (this.statusFilter() !== 'all') {
      tasks = tasks.filter(t => t.status === this.statusFilter());
    }
    
    if (this.priorityFilter() !== 'all') {
      tasks = tasks.filter(t => t.priority === this.priorityFilter());
    }
    
    if (this.categoryFilter() !== 'all') {
      tasks = tasks.filter(t => t.category === this.categoryFilter());
    }
    
    return tasks.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  });

  pendingTasks = computed(() => 
    this.messagingService.tasks().filter(t => t.status === 'pending').length
  );

  inProgressTasks = computed(() => 
    this.messagingService.tasks().filter(t => t.status === 'in-progress').length
  );

  overdueTasks = computed(() => {
    const now = new Date();
    return this.messagingService.tasks().filter(t => 
      t.dueDate && 
      t.dueDate < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    ).length;
  });

  completedTodayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.messagingService.tasks().filter(t => 
      t.completedAt && t.completedAt >= today
    ).length;
  });

  tasksByStatus(status: TaskStatus): Task[] {
    return this.filteredTasks().filter(t => t.status === status);
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    return task.dueDate < new Date();
  }

  formatCategory(category: string): string {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatStatus(status: string): string {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDueDate(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else if (days < 7) {
      return `Due in ${days} days`;
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

  toggleComplete(task: Task): void {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.messagingService.updateTaskStatus(task.id, newStatus);
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      category: 'clinical',
      priority: 'normal',
      status: 'pending'
    });
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? this.formatDateForInput(task.dueDate) : '',
      patientName: task.patientName || '',
      tags: task.tags.join(', ')
    });
    this.showDetailModal.set(false);
    this.showTaskModal.set(true);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  saveTask(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const taskData: Partial<Task> = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        priority: formValue.priority,
        status: formValue.status,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        patientName: formValue.patientName || undefined,
        tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
      };

      if (this.editingTask()) {
        console.log('Updating task:', this.editingTask()!.id, taskData);
      } else {
        this.messagingService.createTask(taskData);
      }

      this.closeTaskModal();
    }
  }

  deleteTask(task: Task): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.messagingService.deleteTask(task.id);
      this.closeDetailModal();
    }
  }

  openTaskDetail(task: Task): void {
    this.selectedTask.set(task);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedTask.set(null);
  }

  updateStatus(status: TaskStatus): void {
    if (this.selectedTask()) {
      this.messagingService.updateTaskStatus(this.selectedTask()!.id, status);
      this.selectedTask.set({
        ...this.selectedTask()!,
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      });
    }
  }
}
