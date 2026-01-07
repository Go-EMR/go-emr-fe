import { Component, inject, signal, input, OnInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PatientService } from '../../data-access/services/patient.service';
import { Patient, FamilyRelation, FamilyRelationType, PatientSearchParams } from '../../data-access/models/patient.model';
import { ThemeService } from '../../../../core/services/theme.service';

interface RelationshipOption {
  label: string;
  value: FamilyRelationType;
  icon: string;
  color: string;
  reverseLabel?: string;
}

@Component({
  selector: 'app-family-relations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    DialogModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    AutoCompleteModule,
    SelectModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    RippleModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="family-relations" [class.dark]="themeService.isDarkMode()">
      <div class="section-header">
        <h3>
          <i class="pi pi-users"></i>
          Family Relations
        </h3>
        <p-button 
          icon="pi pi-plus" 
          label="Add Relation"
          size="small"
          [outlined]="true"
          (onClick)="showAddDialog.set(true)"
        />
      </div>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading family relations...</span>
        </div>
      } @else if (relations().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-users"></i>
          </div>
          <h4>No Family Relations</h4>
          <p>Link family members to see related patients and shared medical history</p>
          <p-button 
            label="Add Family Member" 
            icon="pi pi-plus"
            (onClick)="showAddDialog.set(true)"
          />
        </div>
      } @else {
        <!-- Family Tree Visualization -->
        <div class="family-tree">
          @for (relation of groupedRelations(); track relation.type) {
            <div class="relation-group">
              <div class="group-header">
                <i [class]="'pi ' + getRelationIcon(relation.type)"></i>
                <span>{{ getRelationLabel(relation.type) }}</span>
                <span class="count">({{ relation.members.length }})</span>
              </div>
              <div class="group-members">
                @for (member of relation.members; track member.id) {
                  <div 
                    class="family-member" 
                    [routerLink]="['/patients', member.relatedPatientId]"
                    pRipple
                  >
                    <p-avatar 
                      [label]="getInitials(member.relatedPatientName)"
                      shape="circle"
                      size="large"
                      [style]="{ 'background-color': getRelationColor(relation.type), 'color': 'white' }"
                    />
                    <div class="member-info">
                      <span class="member-name">{{ member.relatedPatientName }}</span>
                      <span class="member-mrn">{{ member.relatedPatientMrn }}</span>
                      @if (member.verified) {
                        <p-tag value="Verified" severity="success" [rounded]="true" />
                      } @else {
                        <p-tag value="Pending" severity="warn" [rounded]="true" />
                      }
                    </div>
                    <div class="member-actions">
                      <p-button 
                        icon="pi pi-external-link"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        pTooltip="View Patient"
                      />
                      <p-button 
                        icon="pi pi-trash"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        severity="danger"
                        pTooltip="Remove"
                        (onClick)="confirmRemove($event, member)"
                      />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Family Summary Card -->
        <div class="family-summary">
          <div class="summary-header">
            <i class="pi pi-info-circle"></i>
            <span>Family Health Summary</span>
          </div>
          <div class="summary-content">
            <div class="summary-item">
              <span class="label">Total Family Members</span>
              <span class="value">{{ relations().length }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Shared Conditions</span>
              <span class="value clickable" (click)="showSharedConditions()">
                {{ sharedConditions().length }} conditions
                <i class="pi pi-chevron-right"></i>
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Family Allergies</span>
              <span class="value clickable" (click)="showFamilyAllergies()">
                {{ familyAllergies().length }} allergies
                <i class="pi pi-chevron-right"></i>
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Add Relation Dialog -->
      <p-dialog 
        header="Add Family Relation" 
        [(visible)]="showAddDialog"
        [modal]="true"
        [style]="{ width: '550px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="add-relation-form">
          <!-- Search Patient -->
          <div class="form-field">
            <label>Search Patient</label>
            <p-autoComplete
              [(ngModel)]="searchQuery"
              [suggestions]="searchResults()"
              (completeMethod)="searchPatients($event)"
              (onSelect)="onPatientSelect($event)"
              [dropdown]="true"
              field="displayName"
              placeholder="Search by name, MRN, or phone..."
              styleClass="w-full"
            >
              <ng-template let-patient pTemplate="item">
                <div class="patient-option">
                  <p-avatar 
                    [label]="getInitials(patient.firstName + ' ' + patient.lastName)"
                    shape="circle"
                    size="normal"
                  />
                  <div class="patient-details">
                    <span class="name">{{ patient.firstName }} {{ patient.lastName }}</span>
                    <span class="meta">{{ patient.mrn }} | {{ formatAge(patient) }}</span>
                  </div>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>

          @if (selectedPatient()) {
            <div class="selected-patient">
              <p-avatar 
                [label]="getInitials(selectedPatient()!.firstName + ' ' + selectedPatient()!.lastName)"
                shape="circle"
                size="xlarge"
                [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
              />
              <div class="patient-info">
                <span class="name">{{ selectedPatient()!.firstName }} {{ selectedPatient()!.lastName }}</span>
                <span class="mrn">{{ selectedPatient()!.mrn }}</span>
                <span class="dob">DOB: {{ selectedPatient()!.dateOfBirth | date:'mediumDate' }}</span>
              </div>
            </div>

            <p-divider />

            <!-- Relationship Selection -->
            <div class="form-field">
              <label>Relationship to {{ patientName() }}</label>
              <div class="relationship-options">
                @for (rel of relationshipOptions; track rel.value) {
                  <div 
                    class="relationship-card"
                    [class.selected]="selectedRelationship() === rel.value"
                    (click)="selectedRelationship.set(rel.value)"
                  >
                    <div class="rel-icon" [style.background-color]="rel.color">
                      <i [class]="'pi ' + rel.icon"></i>
                    </div>
                    <div class="rel-info">
                      <span class="rel-label">{{ rel.label }}</span>
                      <span class="rel-desc">{{ rel.reverseLabel }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            @if (selectedRelationship()) {
              <div class="relationship-preview">
                <div class="preview-item">
                  <span class="patient-name">{{ patientName() }}</span>
                  <i class="pi pi-arrow-right"></i>
                  <p-tag [value]="getRelationLabel(selectedRelationship()!)" [style]="{ 'background-color': getRelationColor(selectedRelationship()!) }" />
                  <i class="pi pi-arrow-right"></i>
                  <span class="patient-name">{{ selectedPatient()!.firstName }} {{ selectedPatient()!.lastName }}</span>
                </div>
              </div>
            }
          }
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [text]="true"
            severity="secondary"
            (onClick)="closeDialog()"
          />
          <p-button 
            label="Add Relation" 
            icon="pi pi-check"
            (onClick)="addRelation()"
            [disabled]="!selectedPatient() || !selectedRelationship()"
            [loading]="saving()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .family-relations {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-header h3 i {
      color: #3b82f6;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 2rem;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .empty-icon i {
      font-size: 2rem;
      color: #94a3b8;
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      color: #1e293b;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #64748b;
    }

    /* Family Tree */
    .family-tree {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .relation-group {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .group-header i {
      color: #3b82f6;
    }

    .group-header .count {
      color: #94a3b8;
      font-weight: 400;
    }

    .group-members {
      display: flex;
      flex-direction: column;
    }

    .family-member {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
    }

    .family-member:last-child {
      border-bottom: none;
    }

    .family-member:hover {
      background: #f8fafc;
    }

    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .member-name {
      font-weight: 500;
      color: #1e293b;
    }

    .member-mrn {
      font-size: 0.75rem;
      color: #64748b;
    }

    .member-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .family-member:hover .member-actions {
      opacity: 1;
    }

    /* Family Summary */
    .family-summary {
      margin-top: 1.5rem;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #eff6ff;
      font-weight: 500;
      color: #1e40af;
      font-size: 0.875rem;
    }

    .summary-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-item .label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .summary-item .value {
      font-weight: 500;
      color: #1e293b;
    }

    .summary-item .value.clickable {
      color: #3b82f6;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .summary-item .value.clickable:hover {
      text-decoration: underline;
    }

    /* Add Dialog */
    .add-relation-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .patient-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
    }

    .patient-details .name {
      font-weight: 500;
      color: #1e293b;
    }

    .patient-details .meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .selected-patient {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #eff6ff;
      border-radius: 10px;
      border: 1px solid #bfdbfe;
    }

    .selected-patient .patient-info {
      display: flex;
      flex-direction: column;
    }

    .selected-patient .name {
      font-weight: 600;
      font-size: 1.125rem;
      color: #1e40af;
    }

    .selected-patient .mrn {
      color: #3b82f6;
      font-size: 0.875rem;
    }

    .selected-patient .dob {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Relationship Options */
    .relationship-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .relationship-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      background: #f8fafc;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .relationship-card:hover {
      border-color: #93c5fd;
      background: #eff6ff;
    }

    .relationship-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .rel-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
    }

    .rel-info {
      display: flex;
      flex-direction: column;
    }

    .rel-label {
      font-weight: 500;
      color: #1e293b;
    }

    .rel-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Relationship Preview */
    .relationship-preview {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
    }

    .preview-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .preview-item .patient-name {
      font-weight: 500;
      color: #1e293b;
    }

    .preview-item i {
      color: #94a3b8;
    }

    /* Dark Mode */
    .family-relations.dark {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .section-header h3 {
      color: #f1f5f9;
    }

    .dark .relation-group {
      border-color: #334155;
    }

    .dark .group-header {
      background: #0f172a;
      color: #e2e8f0;
    }

    .dark .family-member:hover {
      background: #334155;
    }

    .dark .member-name {
      color: #f1f5f9;
    }

    .dark .family-summary {
      background: #0f172a;
      border-color: #334155;
    }

    .dark .summary-header {
      background: #1e3a5f;
      color: #93c5fd;
    }

    .dark .summary-item .value {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .relationship-options {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FamilyRelationsComponent implements OnInit, OnDestroy {
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  patientId = input.required<string>();
  patientName = input.required<string>();

  // Outputs
  relationAdded = output<FamilyRelation>();
  relationRemoved = output<string>();

  // Signals
  relations = signal<FamilyRelation[]>([]);
  loading = signal(false);
  saving = signal(false);
  showAddDialog = signal(false);
  searchResults = signal<Patient[]>([]);
  selectedPatient = signal<Patient | null>(null);
  selectedRelationship = signal<FamilyRelationType | null>(null);
  sharedConditions = signal<string[]>([]);
  familyAllergies = signal<string[]>([]);
  searchQuery = '';

  // Relationship options
  relationshipOptions: RelationshipOption[] = [
    { label: 'Spouse', value: 'spouse', icon: 'pi-heart', color: '#ec4899', reverseLabel: 'Husband/Wife' },
    { label: 'Parent', value: 'parent', icon: 'pi-user', color: '#8b5cf6', reverseLabel: 'Father/Mother' },
    { label: 'Child', value: 'child', icon: 'pi-user', color: '#10b981', reverseLabel: 'Son/Daughter' },
    { label: 'Sibling', value: 'sibling', icon: 'pi-users', color: '#3b82f6', reverseLabel: 'Brother/Sister' },
    { label: 'Guardian', value: 'guardian', icon: 'pi-shield', color: '#f59e0b', reverseLabel: 'Legal Guardian' },
    { label: 'Other', value: 'other', icon: 'pi-ellipsis-h', color: '#64748b', reverseLabel: 'Other Relation' },
  ];

  // Computed
  groupedRelations = signal<{ type: FamilyRelationType; members: FamilyRelation[] }[]>([]);

  ngOnInit(): void {
    this.loadRelations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRelations(): void {
    this.loading.set(true);
    
    // Mock data - replace with actual service call
    setTimeout(() => {
      const mockRelations: FamilyRelation[] = [
        {
          id: '1',
          relatedPatientId: 'patient-2',
          relatedPatientName: 'Sarah Smith',
          relatedPatientMrn: 'MRN-2024-042',
          relationship: 'spouse',
          verified: true,
          verifiedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          relatedPatientId: 'patient-3',
          relatedPatientName: 'Michael Smith Jr.',
          relatedPatientMrn: 'MRN-2024-078',
          relationship: 'child',
          verified: true,
          verifiedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '3',
          relatedPatientId: 'patient-4',
          relatedPatientName: 'Emily Smith',
          relatedPatientMrn: 'MRN-2024-102',
          relationship: 'child',
          verified: false,
          createdAt: new Date(),
        },
      ];

      this.relations.set(mockRelations);
      this.updateGroupedRelations();
      this.sharedConditions.set(['Hypertension', 'Diabetes Type 2']);
      this.familyAllergies.set(['Penicillin', 'Peanuts']);
      this.loading.set(false);
    }, 500);
  }

  private updateGroupedRelations(): void {
    const grouped = new Map<FamilyRelationType, FamilyRelation[]>();
    
    for (const relation of this.relations()) {
      const existing = grouped.get(relation.relationship) || [];
      existing.push(relation);
      grouped.set(relation.relationship, existing);
    }

    const result = Array.from(grouped.entries()).map(([type, members]) => ({
      type,
      members,
    }));

    this.groupedRelations.set(result);
  }

  searchPatients(event: any): void {
    const query = event.query;
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    const params: PatientSearchParams = {
      query,
      pageSize: 10,
    };

    this.patientService.searchPatients(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        // Filter out current patient and already related patients
        const relatedIds = new Set([
          this.patientId(),
          ...this.relations().map(r => r.relatedPatientId)
        ]);
        
        const filtered = result.patients
          .filter(p => !relatedIds.has(p.id))
          .map(p => ({
            ...p,
            displayName: `${p.firstName} ${p.lastName} (${p.mrn})`
          }));
        
        this.searchResults.set(filtered);
      }
    });
  }

  onPatientSelect(event: any): void {
    this.selectedPatient.set(event);
    this.searchQuery = '';
  }

  addRelation(): void {
    const patient = this.selectedPatient();
    const relationship = this.selectedRelationship();
    
    if (!patient || !relationship) return;

    this.saving.set(true);

    // Mock save - replace with actual service call
    setTimeout(() => {
      const newRelation: FamilyRelation = {
        id: `rel-${Date.now()}`,
        relatedPatientId: patient.id,
        relatedPatientName: `${patient.firstName} ${patient.lastName}`,
        relatedPatientMrn: patient.mrn,
        relationship,
        verified: false,
        createdAt: new Date(),
      };

      this.relations.update(rels => [...rels, newRelation]);
      this.updateGroupedRelations();
      this.relationAdded.emit(newRelation);

      this.messageService.add({
        severity: 'success',
        summary: 'Relation Added',
        detail: `${patient.firstName} ${patient.lastName} has been added as ${relationship}`,
      });

      this.closeDialog();
      this.saving.set(false);
    }, 500);
  }

  confirmRemove(event: Event, relation: FamilyRelation): void {
    event.stopPropagation();
    
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Remove ${relation.relatedPatientName} as ${relation.relationship}?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.removeRelation(relation);
      }
    });
  }

  private removeRelation(relation: FamilyRelation): void {
    this.relations.update(rels => rels.filter(r => r.id !== relation.id));
    this.updateGroupedRelations();
    this.relationRemoved.emit(relation.id);

    this.messageService.add({
      severity: 'info',
      summary: 'Relation Removed',
      detail: `${relation.relatedPatientName} has been removed`,
    });
  }

  closeDialog(): void {
    this.showAddDialog.set(false);
    this.selectedPatient.set(null);
    this.selectedRelationship.set(null);
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getRelationIcon(type: FamilyRelationType): string {
    const option = this.relationshipOptions.find(o => o.value === type);
    return option?.icon || 'pi-user';
  }

  getRelationLabel(type: FamilyRelationType): string {
    const option = this.relationshipOptions.find(o => o.value === type);
    return option?.label || type;
  }

  getRelationColor(type: FamilyRelationType): string {
    const option = this.relationshipOptions.find(o => o.value === type);
    return option?.color || '#64748b';
  }

  formatAge(patient: Patient): string {
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} yrs, ${patient.gender}`;
  }

  showSharedConditions(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Shared Family Conditions',
      detail: this.sharedConditions().join(', '),
      life: 5000,
    });
  }

  showFamilyAllergies(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Family Allergies',
      detail: this.familyAllergies().join(', '),
      life: 5000,
    });
  }
}
