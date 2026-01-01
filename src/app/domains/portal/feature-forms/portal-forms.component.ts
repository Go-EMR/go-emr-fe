import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { PatientForm, FormSection, FormField } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-forms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forms-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Forms & Documents</h1>
        </div>
      </header>

      <!-- Pending Forms Alert -->
      @if (pendingForms().length > 0) {
        <div class="pending-alert">
          <div class="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="alert-content">
            <strong>{{ pendingForms().length }} form(s) require your attention</strong>
            <p>Please complete the following forms before your upcoming appointment</p>
          </div>
        </div>
      }

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'pending'"
          (click)="activeTab.set('pending')"
        >
          Pending
          @if (pendingForms().length > 0) {
            <span class="badge">{{ pendingForms().length }}</span>
          }
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'completed'"
          (click)="activeTab.set('completed')"
        >
          Completed
        </button>
      </div>

      <!-- Pending Forms -->
      @if (activeTab() === 'pending') {
        <div class="forms-list">
          @for (form of pendingForms(); track form.id) {
            <div class="form-card" [class.in-progress]="form.status === 'in_progress'">
              <div class="form-header">
                <div class="form-icon" [class]="form.type">
                  @if (form.type === 'intake' || form.type === 'medical_history') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                  } @else if (form.type === 'consent' || form.type === 'hipaa') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  }
                </div>
                <div class="form-info">
                  <h3>{{ form.title }}</h3>
                  <p class="form-description">{{ form.description }}</p>
                  @if (form.appointmentDate) {
                    <p class="form-appointment">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Due before appointment on {{ form.appointmentDate | date:'MMM d, yyyy' }}
                    </p>
                  }
                </div>
                <div class="form-meta">
                  @if (form.signatureRequired) {
                    <span class="signature-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Signature Required
                    </span>
                  }
                </div>
              </div>

              @if (form.status === 'in_progress') {
                <div class="form-progress">
                  <div class="progress-header">
                    <span>Progress</span>
                    <span>{{ form.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="form.progress"></div>
                  </div>
                </div>
              }

              <div class="form-actions">
                <button class="btn btn-primary" (click)="openForm(form)">
                  @if (form.status === 'in_progress') {
                    Continue
                  } @else {
                    Start Form
                  }
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3>All Caught Up!</h3>
              <p>You don't have any pending forms to complete</p>
            </div>
          }
        </div>
      }

      <!-- Completed Forms -->
      @if (activeTab() === 'completed') {
        <div class="forms-list">
          @for (form of completedForms(); track form.id) {
            <div class="form-card completed">
              <div class="form-header">
                <div class="form-icon completed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="form-info">
                  <h3>{{ form.title }}</h3>
                  <p class="form-completed-date">
                    Completed on {{ form.completedAt | date:'MMM d, yyyy' }}
                  </p>
                </div>
                <div class="form-meta">
                  @if (form.signedAt) {
                    <span class="signed-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Signed
                    </span>
                  }
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="viewForm(form)">
                  View Form
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>No Completed Forms</h3>
              <p>Your completed forms will appear here</p>
            </div>
          }
        </div>
      }

      <!-- Form Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay">
          <div class="modal form-modal">
            <div class="modal-header">
              <div class="modal-title">
                <h2>{{ selectedForm()?.title }}</h2>
                <p>{{ selectedForm()?.description }}</p>
              </div>
              <button class="btn-close" (click)="closeFormModal()">×</button>
            </div>

            <!-- Progress Steps -->
            <div class="form-steps">
              @for (section of selectedForm()?.sections; track section.id; let i = $index) {
                <button 
                  class="step"
                  [class.active]="currentSectionIndex() === i"
                  [class.completed]="section.completed"
                  (click)="goToSection(i)"
                >
                  <span class="step-number">
                    @if (section.completed) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    } @else {
                      {{ i + 1 }}
                    }
                  </span>
                  <span class="step-title">{{ section.title }}</span>
                </button>
              }
            </div>

            <div class="modal-body">
              @if (currentSection()) {
                <div class="section-content">
                  <h3>{{ currentSection()?.title }}</h3>
                  @if (currentSection()?.description) {
                    <p class="section-description">{{ currentSection()?.description }}</p>
                  }

                  <div class="form-fields">
                    @for (field of currentSection()?.fields; track field.id) {
                      <div class="form-field" [class.required]="field.required">
                        <label [for]="field.id">
                          {{ field.label }}
                          @if (field.required) {
                            <span class="required-marker">*</span>
                          }
                        </label>

                        @switch (field.type) {
                          @case ('text') {
                            <input 
                              type="text" 
                              [id]="field.id"
                              [placeholder]="field.placeholder || ''"
                              [(ngModel)]="fieldValues()[field.id]"
                              (ngModelChange)="updateFieldValue(field.id, $event)"
                            />
                          }
                          @case ('textarea') {
                            <textarea 
                              [id]="field.id"
                              [placeholder]="field.placeholder || ''"
                              rows="4"
                              [(ngModel)]="fieldValues()[field.id]"
                              (ngModelChange)="updateFieldValue(field.id, $event)"
                            ></textarea>
                          }
                          @case ('number') {
                            <input 
                              type="number" 
                              [id]="field.id"
                              [placeholder]="field.placeholder || ''"
                              [(ngModel)]="fieldValues()[field.id]"
                              (ngModelChange)="updateFieldValue(field.id, $event)"
                            />
                          }
                          @case ('date') {
                            <input 
                              type="date" 
                              [id]="field.id"
                              [(ngModel)]="fieldValues()[field.id]"
                              (ngModelChange)="updateFieldValue(field.id, $event)"
                            />
                          }
                          @case ('select') {
                            <select 
                              [id]="field.id"
                              [(ngModel)]="fieldValues()[field.id]"
                              (ngModelChange)="updateFieldValue(field.id, $event)"
                            >
                              <option value="">Select...</option>
                              @for (option of field.options; track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                          }
                          @case ('checkbox') {
                            <label class="checkbox-field">
                              <input 
                                type="checkbox"
                                [id]="field.id"
                                [(ngModel)]="fieldValues()[field.id]"
                                (ngModelChange)="updateFieldValue(field.id, $event)"
                              />
                              <span class="checkbox-label">{{ field.placeholder || 'Yes' }}</span>
                            </label>
                          }
                          @case ('radio') {
                            <div class="radio-group">
                              @for (option of field.options; track option.value) {
                                <label class="radio-field">
                                  <input 
                                    type="radio"
                                    [name]="field.id"
                                    [value]="option.value"
                                    [(ngModel)]="fieldValues()[field.id]"
                                    (ngModelChange)="updateFieldValue(field.id, $event)"
                                  />
                                  <span class="radio-label">{{ option.label }}</span>
                                </label>
                              }
                            </div>
                          }
                          @case ('signature') {
                            <div class="signature-field">
                              @if (fieldValues()[field.id]) {
                                <div class="signature-preview">
                                  <span class="signature-text">{{ fieldValues()[field.id] }}</span>
                                  <button class="btn btn-link" (click)="clearSignature(field.id)">Clear</button>
                                </div>
                              } @else {
                                <div class="signature-input">
                                  <input 
                                    type="text"
                                    [id]="field.id"
                                    placeholder="Type your full legal name to sign"
                                    [(ngModel)]="signatureInput"
                                  />
                                  <button 
                                    class="btn btn-secondary"
                                    [disabled]="!signatureInput"
                                    (click)="applySignature(field.id)"
                                  >
                                    Sign
                                  </button>
                                </div>
                                <p class="signature-disclaimer">
                                  By signing, I acknowledge that this electronic signature is legally binding.
                                </p>
                              }
                            </div>
                          }
                        }

                        @if (field.helpText) {
                          <p class="field-help">{{ field.helpText }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="saveAndExit()">
                Save & Exit
              </button>
              <div class="footer-nav">
                @if (currentSectionIndex() > 0) {
                  <button class="btn btn-secondary" (click)="previousSection()">
                    Previous
                  </button>
                }
                @if (currentSectionIndex() < (selectedForm()?.sections?.length || 0) - 1) {
                  <button class="btn btn-primary" (click)="nextSection()">
                    Next
                  </button>
                } @else {
                  <button 
                    class="btn btn-primary" 
                    (click)="submitForm()"
                    [disabled]="!canSubmit()"
                  >
                    Submit Form
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .forms-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
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

    .back-link:hover {
      color: #3b82f6;
    }

    .back-link svg {
      width: 1rem;
      height: 1rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Pending Alert */
    .pending-alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .alert-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      color: #d97706;
      flex-shrink: 0;
    }

    .alert-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .alert-content strong {
      display: block;
      font-size: 0.9375rem;
      color: #92400e;
    }

    .alert-content p {
      margin: 0.25rem 0 0;
      font-size: 0.8125rem;
      color: #a16207;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-btn .badge {
      padding: 0.125rem 0.5rem;
      background: #f59e0b;
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
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
      text-decoration: none;
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
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f1f5f9;
    }

    .btn-link {
      background: transparent;
      color: #3b82f6;
      padding: 0.25rem 0.5rem;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    /* Form Cards */
    .forms-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .form-card.in-progress {
      border-color: #3b82f6;
      border-left-width: 4px;
    }

    .form-card.completed {
      opacity: 0.8;
    }

    .form-header {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
    }

    .form-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      flex-shrink: 0;
    }

    .form-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .form-icon.intake,
    .form-icon.medical_history { background: #dbeafe; color: #3b82f6; }
    .form-icon.consent,
    .form-icon.hipaa { background: #fef3c7; color: #d97706; }
    .form-icon.questionnaire,
    .form-icon.custom { background: #f3e8ff; color: #9333ea; }
    .form-icon.financial { background: #dcfce7; color: #16a34a; }
    .form-icon.completed { background: #dcfce7; color: #16a34a; }

    .form-info {
      flex: 1;
    }

    .form-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .form-description {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .form-appointment {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin: 0.5rem 0 0;
      padding: 0.375rem 0.5rem;
      background: #fef3c7;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #92400e;
      width: fit-content;
    }

    .form-appointment svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .form-completed-date {
      margin: 0;
      font-size: 0.875rem;
      color: #16a34a;
    }

    .form-meta {
      display: flex;
      align-items: flex-start;
    }

    .signature-badge,
    .signed-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .signature-badge svg,
    .signed-badge svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .signed-badge {
      background: #dcfce7;
      color: #16a34a;
    }

    .form-progress {
      padding: 0 1.25rem 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.375rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .progress-bar {
      height: 0.375rem;
      background: #e2e8f0;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 0.25rem;
      transition: width 0.3s;
    }

    .form-actions {
      padding: 0.75rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #16a34a;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
      color: #64748b;
      font-size: 0.9375rem;
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

    .form-modal {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .modal-title p {
      margin: 0.25rem 0 0;
      font-size: 0.8125rem;
      color: #64748b;
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

    /* Form Steps */
    .form-steps {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      overflow-x: auto;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 2rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .step:hover {
      border-color: #3b82f6;
    }

    .step.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .step.completed {
      background: #dcfce7;
      border-color: #86efac;
      color: #16a34a;
    }

    .step-number {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .step.active .step-number {
      background: white;
      color: #3b82f6;
    }

    .step.completed .step-number {
      background: #16a34a;
      color: white;
    }

    .step-number svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .step-title {
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .modal-body {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .section-content h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .section-description {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Form Fields */
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .required-marker {
      color: #dc2626;
      margin-left: 0.25rem;
    }

    .form-field input[type="text"],
    .form-field input[type="number"],
    .form-field input[type="date"],
    .form-field select,
    .form-field textarea {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-field textarea {
      resize: vertical;
      min-height: 100px;
    }

    .checkbox-field,
    .radio-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-field input,
    .radio-field input {
      width: 1.125rem;
      height: 1.125rem;
    }

    .checkbox-label,
    .radio-label {
      font-size: 0.875rem;
      color: #475569;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-help {
      margin: 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Signature Field */
    .signature-field {
      padding: 1rem;
      border: 1px dashed #e2e8f0;
      border-radius: 0.5rem;
      background: #f8fafc;
    }

    .signature-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .signature-text {
      font-family: 'Brush Script MT', cursive;
      font-size: 1.5rem;
      color: #1e293b;
    }

    .signature-input {
      display: flex;
      gap: 0.5rem;
    }

    .signature-input input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .signature-disclaimer {
      margin: 0.75rem 0 0;
      font-size: 0.75rem;
      color: #64748b;
      font-style: italic;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .footer-nav {
      display: flex;
      gap: 0.75rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-header {
        flex-direction: column;
      }

      .form-meta {
        margin-top: 0.5rem;
      }

      .form-steps {
        padding: 0.75rem 1rem;
      }

      .step {
        padding: 0.375rem 0.75rem;
      }

      .step-title {
        display: none;
      }

      .modal-footer {
        flex-direction: column;
        gap: 0.75rem;
      }

      .modal-footer .btn-secondary:first-child {
        width: 100%;
      }

      .footer-nav {
        width: 100%;
      }

      .footer-nav .btn {
        flex: 1;
      }
    }
  `]
})
export class PortalFormsComponent {
  portalService = inject(PortalService);

  activeTab = signal<'pending' | 'completed'>('pending');
  showFormModal = signal(false);
  selectedForm = signal<PatientForm | null>(null);
  currentSectionIndex = signal(0);
  fieldValues = signal<Record<string, any>>({});
  signatureInput = '';

  pendingForms = computed(() => 
    this.portalService.forms().filter(f => f.status === 'pending' || f.status === 'in_progress')
  );

  completedForms = computed(() => 
    this.portalService.forms().filter(f => f.status === 'completed')
  );

  currentSection = computed(() => {
    const form = this.selectedForm();
    if (!form) return null;
    return form.sections[this.currentSectionIndex()];
  });

  canSubmit = computed(() => {
    const form = this.selectedForm();
    if (!form) return false;
    
    // Check all required fields are filled
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const value = this.fieldValues()[field.id];
          if (value === undefined || value === '' || value === null) {
            return false;
          }
        }
      }
    }
    return true;
  });

  openForm(form: PatientForm): void {
    this.selectedForm.set(form);
    this.currentSectionIndex.set(0);
    
    // Initialize field values from form
    const values: Record<string, any> = {};
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        values[field.id] = field.value;
      });
    });
    this.fieldValues.set(values);
    
    this.showFormModal.set(true);
  }

  viewForm(form: PatientForm): void {
    // For viewing completed forms
    this.openForm(form);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedForm.set(null);
  }

  goToSection(index: number): void {
    this.currentSectionIndex.set(index);
  }

  previousSection(): void {
    if (this.currentSectionIndex() > 0) {
      this.currentSectionIndex.update(i => i - 1);
    }
  }

  nextSection(): void {
    const form = this.selectedForm();
    if (form && this.currentSectionIndex() < form.sections.length - 1) {
      this.saveCurrentSection();
      this.currentSectionIndex.update(i => i + 1);
    }
  }

  updateFieldValue(fieldId: string, value: any): void {
    this.fieldValues.update(values => ({
      ...values,
      [fieldId]: value
    }));
  }

  applySignature(fieldId: string): void {
    if (this.signatureInput) {
      this.updateFieldValue(fieldId, this.signatureInput);
      this.signatureInput = '';
    }
  }

  clearSignature(fieldId: string): void {
    this.updateFieldValue(fieldId, null);
  }

  saveCurrentSection(): void {
    const form = this.selectedForm();
    const section = this.currentSection();
    if (form && section) {
      this.portalService.updateFormProgress(form.id, section.id, this.fieldValues());
    }
  }

  saveAndExit(): void {
    this.saveCurrentSection();
    this.closeFormModal();
  }

  submitForm(): void {
    const form = this.selectedForm();
    if (form && this.canSubmit()) {
      this.saveCurrentSection();
      this.portalService.submitForm(form.id);
      this.closeFormModal();
    }
  }
}
