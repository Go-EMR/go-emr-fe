import { Injectable, signal, computed } from '@angular/core';
import {
  AppointmentSlot,
  AppointmentRequest,
  UpcomingAppointment,
  PatientStatement,
  PaymentMethod,
  PaymentPlan,
  PaymentRecord,
  PatientForm,
  HealthRecordSummary,
  EncounterSummary,
  MedicationRecord,
  LabResultSummary,
  LabResultDetail,
  ImmunizationRecord,
  DocumentRecord,
  AllergyRecord,
  VitalRecord,
  MessageThread,
  SecureMessage,
  PortalPreferences
} from '../models/portal.model';

@Injectable({
  providedIn: 'root'
})
export class PortalService {
  // Current patient ID (would come from auth in real app)
  private readonly currentPatientId = 'PAT-001';

  // State signals
  private _upcomingAppointments = signal<UpcomingAppointment[]>(this.generateMockUpcomingAppointments());
  private _appointmentRequests = signal<AppointmentRequest[]>(this.generateMockAppointmentRequests());
  private _statements = signal<PatientStatement[]>(this.generateMockStatements());
  private _paymentMethods = signal<PaymentMethod[]>(this.generateMockPaymentMethods());
  private _paymentPlan = signal<PaymentPlan | null>(this.generateMockPaymentPlan());
  private _paymentHistory = signal<PaymentRecord[]>(this.generateMockPaymentHistory());
  private _forms = signal<PatientForm[]>(this.generateMockForms());
  private _encounters = signal<EncounterSummary[]>(this.generateMockEncounters());
  private _medications = signal<MedicationRecord[]>(this.generateMockMedications());
  private _labResults = signal<LabResultSummary[]>(this.generateMockLabResults());
  private _immunizations = signal<ImmunizationRecord[]>(this.generateMockImmunizations());
  private _documents = signal<DocumentRecord[]>(this.generateMockDocuments());
  private _allergies = signal<AllergyRecord[]>(this.generateMockAllergies());
  private _vitals = signal<VitalRecord[]>(this.generateMockVitals());
  private _messageThreads = signal<MessageThread[]>(this.generateMockMessageThreads());
  private _preferences = signal<PortalPreferences>(this.generateMockPreferences());
  private _isLoading = signal(false);

  // Public readonly signals
  readonly upcomingAppointments = this._upcomingAppointments.asReadonly();
  readonly appointmentRequests = this._appointmentRequests.asReadonly();
  readonly statements = this._statements.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly paymentPlan = this._paymentPlan.asReadonly();
  readonly paymentHistory = this._paymentHistory.asReadonly();
  readonly forms = this._forms.asReadonly();
  readonly encounters = this._encounters.asReadonly();
  readonly medications = this._medications.asReadonly();
  readonly labResults = this._labResults.asReadonly();
  readonly immunizations = this._immunizations.asReadonly();
  readonly documents = this._documents.asReadonly();
  readonly allergies = this._allergies.asReadonly();
  readonly vitals = this._vitals.asReadonly();
  readonly messageThreads = this._messageThreads.asReadonly();
  readonly preferences = this._preferences.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed values
  readonly healthSummary = computed<HealthRecordSummary>(() => {
    const appointments = this._upcomingAppointments();
    const nextAppt = appointments.find(a => a.status === 'scheduled' || a.status === 'confirmed');
    
    return {
      patientId: this.currentPatientId,
      lastVisitDate: this._encounters()[0]?.date,
      upcomingAppointment: nextAppt ? {
        date: nextAppt.date,
        providerName: nextAppt.providerName,
        type: nextAppt.appointmentType
      } : undefined,
      activeMedications: this._medications().filter(m => m.status === 'active').length,
      allergies: this._allergies().filter(a => a.status === 'active').map(a => a.allergen),
      recentLabResults: this._labResults().filter(l => l.isNew).length,
      unreadMessages: this._messageThreads().reduce((sum, t) => sum + t.unreadCount, 0),
      pendingForms: this._forms().filter(f => f.status === 'pending' || f.status === 'in_progress').length,
      outstandingBalance: this._statements().reduce((sum, s) => sum + s.balanceDue, 0)
    };
  });

  readonly outstandingBalance = computed(() => 
    this._statements().reduce((sum, s) => s.status !== 'paid' ? sum + s.balanceDue : sum, 0)
  );

  readonly pendingForms = computed(() => 
    this._forms().filter(f => f.status === 'pending' || f.status === 'in_progress')
  );

  readonly activeMedications = computed(() => 
    this._medications().filter(m => m.status === 'active')
  );

  readonly unreadMessageCount = computed(() => 
    this._messageThreads().reduce((sum, t) => sum + t.unreadCount, 0)
  );

  // Appointment methods
  getAvailableSlots(providerId: string, startDate: Date, endDate: Date): AppointmentSlot[] {
    // Mock implementation - would call API
    const slots: AppointmentSlot[] = [];
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        times.forEach((time, idx) => {
          if (Math.random() > 0.3) {
            slots.push({
              id: `SLOT-${d.toISOString().split('T')[0]}-${idx}`,
              providerId,
              providerName: 'Dr. Sarah Johnson',
              providerSpecialty: 'Internal Medicine',
              locationId: 'LOC-001',
              locationName: 'Main Clinic',
              date: new Date(d),
              startTime: time,
              endTime: this.addMinutes(time, 30),
              duration: 30,
              status: 'available',
              appointmentType: 'Office Visit'
            });
          }
        });
      }
    }
    return slots;
  }

  bookAppointment(slotId: string, reason: string): void {
    console.log('Booking appointment:', slotId, reason);
  }

  requestAppointment(request: Partial<AppointmentRequest>): void {
    const newRequest: AppointmentRequest = {
      id: `REQ-${Date.now()}`,
      patientId: this.currentPatientId,
      appointmentType: request.appointmentType || 'Office Visit',
      preferredDates: request.preferredDates || [],
      preferredTimeOfDay: request.preferredTimeOfDay || 'any',
      reason: request.reason || '',
      urgency: request.urgency || 'routine',
      notes: request.notes,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this._appointmentRequests.update(reqs => [...reqs, newRequest]);
  }

  cancelAppointment(appointmentId: string): void {
    this._upcomingAppointments.update(appts => 
      appts.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a)
    );
  }

  confirmAppointment(appointmentId: string): void {
    this._upcomingAppointments.update(appts => 
      appts.map(a => a.id === appointmentId ? { ...a, status: 'confirmed' as const, confirmationRequired: false } : a)
    );
  }

  // Payment methods
  makePayment(amount: number, paymentMethodId: string, applyTo: string): PaymentRecord {
    const payment: PaymentRecord = {
      id: `PMT-${Date.now()}`,
      patientId: this.currentPatientId,
      amount,
      date: new Date(),
      method: 'credit_card',
      last4: this._paymentMethods().find(m => m.id === paymentMethodId)?.last4,
      confirmationNumber: `CNF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'completed',
      appliedTo: applyTo
    };
    this._paymentHistory.update(history => [payment, ...history]);
    return payment;
  }

  addPaymentMethod(method: Partial<PaymentMethod>): void {
    const newMethod: PaymentMethod = {
      id: `PM-${Date.now()}`,
      patientId: this.currentPatientId,
      type: method.type || 'credit_card',
      last4: method.last4 || '0000',
      brand: method.brand,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      isDefault: method.isDefault || false,
      nickname: method.nickname,
      createdAt: new Date()
    };
    this._paymentMethods.update(methods => [...methods, newMethod]);
  }

  removePaymentMethod(methodId: string): void {
    this._paymentMethods.update(methods => methods.filter(m => m.id !== methodId));
  }

  setDefaultPaymentMethod(methodId: string): void {
    this._paymentMethods.update(methods => 
      methods.map(m => ({ ...m, isDefault: m.id === methodId }))
    );
  }

  // Form methods
  updateFormProgress(formId: string, sectionId: string, fieldValues: Record<string, any>): void {
    this._forms.update(forms => forms.map(f => {
      if (f.id !== formId) return f;
      
      const updatedSections = f.sections.map(s => {
        if (s.id !== sectionId) return s;
        
        const updatedFields = s.fields.map(field => ({
          ...field,
          value: fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.value
        }));
        
        const allRequiredFilled = updatedFields
          .filter(field => field.required)
          .every(field => field.value !== undefined && field.value !== '');
        
        return { ...s, fields: updatedFields, completed: allRequiredFilled };
      });
      
      const completedSections = updatedSections.filter(s => s.completed).length;
      const progress = Math.round((completedSections / updatedSections.length) * 100);
      
      return { ...f, sections: updatedSections, progress };
    }));
  }

  submitForm(formId: string): void {
    this._forms.update(forms => forms.map(f => 
      f.id === formId ? { ...f, status: 'completed' as const, completedAt: new Date() } : f
    ));
  }

  signForm(formId: string): void {
    this._forms.update(forms => forms.map(f => 
      f.id === formId ? { ...f, signedAt: new Date() } : f
    ));
  }

  // Health records methods
  getLabResultDetail(resultId: string): LabResultDetail | null {
    // Mock implementation
    const summary = this._labResults().find(r => r.id === resultId);
    if (!summary) return null;

    return {
      id: summary.id,
      orderId: summary.orderId,
      testName: summary.testName,
      category: 'Chemistry',
      orderDate: summary.orderDate,
      collectionDate: new Date(summary.orderDate.getTime() + 86400000),
      resultDate: summary.resultDate,
      orderedBy: summary.orderedBy,
      status: summary.status,
      components: [
        { name: 'Glucose', value: '95', unit: 'mg/dL', referenceRange: '70-100', flag: 'normal' },
        { name: 'BUN', value: '18', unit: 'mg/dL', referenceRange: '7-20', flag: 'normal' },
        { name: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.7-1.3', flag: 'normal' },
        { name: 'Sodium', value: '142', unit: 'mEq/L', referenceRange: '136-145', flag: 'normal' },
        { name: 'Potassium', value: '4.2', unit: 'mEq/L', referenceRange: '3.5-5.0', flag: 'normal' }
      ],
      interpretation: 'All values within normal limits.',
      comments: 'Patient fasting for 12 hours prior to collection.'
    };
  }

  requestRefill(medicationId: string, pharmacyNotes?: string): void {
    console.log('Requesting refill:', medicationId, pharmacyNotes);
  }

  // Messaging methods
  getThreadMessages(threadId: string): SecureMessage[] {
    // Mock implementation
    return [
      {
        id: 'MSG-001',
        threadId,
        patientId: this.currentPatientId,
        senderId: this.currentPatientId,
        senderName: 'John Smith',
        senderType: 'patient',
        recipientId: 'PROV-001',
        recipientName: 'Dr. Sarah Johnson',
        subject: 'Question about medication',
        body: 'I have been experiencing some side effects from the new medication. Is this normal?',
        sentAt: new Date(Date.now() - 2 * 86400000),
        isUrgent: false,
        attachments: []
      },
      {
        id: 'MSG-002',
        threadId,
        patientId: this.currentPatientId,
        senderId: 'PROV-001',
        senderName: 'Dr. Sarah Johnson',
        senderType: 'provider',
        recipientId: this.currentPatientId,
        recipientName: 'John Smith',
        subject: 'Re: Question about medication',
        body: 'Some mild side effects are normal in the first week. Please let me know if they persist or worsen.',
        sentAt: new Date(Date.now() - 86400000),
        readAt: new Date(),
        isUrgent: false,
        attachments: [],
        replyToId: 'MSG-001'
      }
    ];
  }

  sendMessage(threadId: string | null, recipientId: string, subject: string, body: string, attachments: File[] = []): void {
    console.log('Sending message:', { threadId, recipientId, subject, body, attachments });
  }

  markThreadAsRead(threadId: string): void {
    this._messageThreads.update(threads => 
      threads.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t)
    );
  }

  // Preferences methods
  updatePreferences(updates: Partial<PortalPreferences>): void {
    this._preferences.update(prefs => ({ ...prefs, ...updates }));
  }

  // Helper methods
  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  // Mock data generators
  private generateMockUpcomingAppointments(): UpcomingAppointment[] {
    return [
      {
        id: 'APPT-001',
        providerId: 'PROV-001',
        providerName: 'Dr. Sarah Johnson',
        providerSpecialty: 'Internal Medicine',
        locationId: 'LOC-001',
        locationName: 'Main Clinic',
        locationAddress: '123 Medical Center Dr, Suite 200',
        date: new Date(Date.now() + 3 * 86400000),
        startTime: '10:00',
        endTime: '10:30',
        appointmentType: 'Follow-up Visit',
        status: 'scheduled',
        confirmationRequired: true,
        canCancel: true,
        canReschedule: true,
        telehealth: false,
        preVisitInstructions: 'Please bring your medication list and any recent lab results.',
        formsRequired: ['Health History Update']
      },
      {
        id: 'APPT-002',
        providerId: 'PROV-002',
        providerName: 'Dr. Michael Chen',
        providerSpecialty: 'Cardiology',
        locationId: 'LOC-001',
        locationName: 'Main Clinic',
        locationAddress: '123 Medical Center Dr, Suite 300',
        date: new Date(Date.now() + 14 * 86400000),
        startTime: '14:00',
        endTime: '14:45',
        appointmentType: 'Annual Physical',
        status: 'confirmed',
        confirmationRequired: false,
        canCancel: true,
        canReschedule: true,
        telehealth: false,
        preVisitInstructions: 'Fast for 12 hours before appointment. Lab work will be done.',
        formsRequired: []
      },
      {
        id: 'APPT-003',
        providerId: 'PROV-003',
        providerName: 'Dr. Emily Davis',
        providerSpecialty: 'Dermatology',
        locationId: 'LOC-002',
        locationName: 'Telehealth',
        locationAddress: '',
        date: new Date(Date.now() + 7 * 86400000),
        startTime: '11:00',
        endTime: '11:20',
        appointmentType: 'Telehealth Visit',
        status: 'scheduled',
        confirmationRequired: false,
        canCancel: true,
        canReschedule: true,
        telehealth: true,
        telehealthUrl: 'https://telehealth.example.com/join/abc123',
        formsRequired: []
      }
    ];
  }

  private generateMockAppointmentRequests(): AppointmentRequest[] {
    return [];
  }

  private generateMockStatements(): PatientStatement[] {
    return [
      {
        id: 'STMT-001',
        statementNumber: 'S2024-12-001',
        statementDate: new Date(Date.now() - 15 * 86400000),
        dueDate: new Date(Date.now() + 15 * 86400000),
        patientId: this.currentPatientId,
        totalCharges: 450.00,
        insurancePayments: 320.00,
        adjustments: 55.00,
        patientPayments: 0,
        balanceDue: 75.00,
        status: 'pending',
        previousBalance: 0,
        newCharges: 75.00,
        lineItems: [
          {
            id: 'LI-001',
            serviceDate: new Date(Date.now() - 30 * 86400000),
            description: 'Office Visit - Established Patient',
            providerName: 'Dr. Sarah Johnson',
            cptCode: '99213',
            charges: 250.00,
            insurancePaid: 200.00,
            adjustments: 25.00,
            patientResponsibility: 25.00
          },
          {
            id: 'LI-002',
            serviceDate: new Date(Date.now() - 30 * 86400000),
            description: 'Basic Metabolic Panel',
            providerName: 'Dr. Sarah Johnson',
            cptCode: '80048',
            charges: 200.00,
            insurancePaid: 120.00,
            adjustments: 30.00,
            patientResponsibility: 50.00
          }
        ]
      }
    ];
  }

  private generateMockPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'PM-001',
        patientId: this.currentPatientId,
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
        nickname: 'Personal Visa',
        createdAt: new Date(Date.now() - 180 * 86400000)
      },
      {
        id: 'PM-002',
        patientId: this.currentPatientId,
        type: 'bank_account',
        last4: '6789',
        bankName: 'Chase',
        accountType: 'checking',
        isDefault: false,
        nickname: 'Checking Account',
        createdAt: new Date(Date.now() - 90 * 86400000)
      }
    ];
  }

  private generateMockPaymentPlan(): PaymentPlan | null {
    return null;
  }

  private generateMockPaymentHistory(): PaymentRecord[] {
    return [
      {
        id: 'PMT-001',
        patientId: this.currentPatientId,
        amount: 50.00,
        date: new Date(Date.now() - 45 * 86400000),
        method: 'credit_card',
        last4: '4242',
        confirmationNumber: 'CNF-ABC123',
        status: 'completed',
        appliedTo: 'Statement S2024-11-001'
      },
      {
        id: 'PMT-002',
        patientId: this.currentPatientId,
        amount: 25.00,
        date: new Date(Date.now() - 75 * 86400000),
        method: 'credit_card',
        last4: '4242',
        confirmationNumber: 'CNF-DEF456',
        status: 'completed',
        appliedTo: 'Statement S2024-10-001'
      }
    ];
  }

  private generateMockForms(): PatientForm[] {
    return [
      {
        id: 'FORM-001',
        formTemplateId: 'TPL-001',
        patientId: this.currentPatientId,
        title: 'Annual Health History Update',
        description: 'Please update your health history before your upcoming appointment.',
        type: 'medical_history',
        status: 'pending',
        dueDate: new Date(Date.now() + 3 * 86400000),
        signatureRequired: true,
        appointmentId: 'APPT-001',
        appointmentDate: new Date(Date.now() + 3 * 86400000),
        progress: 0,
        sections: [
          {
            id: 'SEC-001',
            title: 'Personal Information',
            order: 1,
            completed: false,
            fields: [
              { id: 'F-001', label: 'Address', type: 'text', required: true, order: 1 },
              { id: 'F-002', label: 'Phone', type: 'text', required: true, order: 2 },
              { id: 'F-003', label: 'Emergency Contact', type: 'text', required: true, order: 3 }
            ]
          },
          {
            id: 'SEC-002',
            title: 'Medical History',
            order: 2,
            completed: false,
            fields: [
              { id: 'F-004', label: 'Current Medications', type: 'textarea', required: false, order: 1 },
              { id: 'F-005', label: 'Allergies', type: 'textarea', required: false, order: 2 },
              { id: 'F-006', label: 'Previous Surgeries', type: 'textarea', required: false, order: 3 }
            ]
          }
        ]
      },
      {
        id: 'FORM-002',
        formTemplateId: 'TPL-002',
        patientId: this.currentPatientId,
        title: 'HIPAA Acknowledgement',
        description: 'Annual HIPAA privacy practices acknowledgement.',
        type: 'hipaa',
        status: 'pending',
        signatureRequired: true,
        progress: 0,
        sections: [
          {
            id: 'SEC-003',
            title: 'Acknowledgement',
            order: 1,
            completed: false,
            fields: [
              { id: 'F-007', label: 'I acknowledge that I have received the Notice of Privacy Practices', type: 'checkbox', required: true, order: 1 }
            ]
          }
        ]
      }
    ];
  }

  private generateMockEncounters(): EncounterSummary[] {
    return [
      {
        id: 'ENC-001',
        date: new Date(Date.now() - 30 * 86400000),
        providerName: 'Dr. Sarah Johnson',
        providerSpecialty: 'Internal Medicine',
        visitType: 'Office Visit',
        chiefComplaint: 'Annual wellness exam',
        diagnoses: ['Essential hypertension', 'Type 2 diabetes mellitus'],
        hasLabResults: true,
        hasDocuments: true,
        canViewNotes: true
      },
      {
        id: 'ENC-002',
        date: new Date(Date.now() - 90 * 86400000),
        providerName: 'Dr. Sarah Johnson',
        providerSpecialty: 'Internal Medicine',
        visitType: 'Follow-up Visit',
        chiefComplaint: 'Blood pressure follow-up',
        diagnoses: ['Essential hypertension'],
        hasLabResults: false,
        hasDocuments: false,
        canViewNotes: true
      },
      {
        id: 'ENC-003',
        date: new Date(Date.now() - 180 * 86400000),
        providerName: 'Dr. Michael Chen',
        providerSpecialty: 'Cardiology',
        visitType: 'Consultation',
        chiefComplaint: 'Cardiology consultation',
        diagnoses: ['Essential hypertension', 'Palpitations'],
        hasLabResults: true,
        hasDocuments: true,
        canViewNotes: true
      }
    ];
  }

  private generateMockMedications(): MedicationRecord[] {
    return [
      {
        id: 'MED-001',
        medicationName: 'Lisinopril',
        genericName: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
        route: 'Oral',
        prescribedDate: new Date(Date.now() - 365 * 86400000),
        prescribedBy: 'Dr. Sarah Johnson',
        startDate: new Date(Date.now() - 365 * 86400000),
        status: 'active',
        refillsRemaining: 3,
        refillsTotal: 6,
        lastFilledDate: new Date(Date.now() - 30 * 86400000),
        pharmacy: 'CVS Pharmacy - Main St',
        instructions: 'Take one tablet by mouth once daily in the morning.',
        isControlled: false,
        canRequestRefill: true
      },
      {
        id: 'MED-002',
        medicationName: 'Metformin',
        genericName: 'Metformin HCl',
        dosage: '500 mg',
        frequency: 'Twice daily',
        route: 'Oral',
        prescribedDate: new Date(Date.now() - 180 * 86400000),
        prescribedBy: 'Dr. Sarah Johnson',
        startDate: new Date(Date.now() - 180 * 86400000),
        status: 'active',
        refillsRemaining: 5,
        refillsTotal: 6,
        lastFilledDate: new Date(Date.now() - 15 * 86400000),
        pharmacy: 'CVS Pharmacy - Main St',
        instructions: 'Take one tablet by mouth twice daily with meals.',
        isControlled: false,
        canRequestRefill: true
      },
      {
        id: 'MED-003',
        medicationName: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        dosage: '20 mg',
        frequency: 'Once daily at bedtime',
        route: 'Oral',
        prescribedDate: new Date(Date.now() - 90 * 86400000),
        prescribedBy: 'Dr. Sarah Johnson',
        startDate: new Date(Date.now() - 90 * 86400000),
        status: 'active',
        refillsRemaining: 4,
        refillsTotal: 6,
        lastFilledDate: new Date(Date.now() - 30 * 86400000),
        pharmacy: 'CVS Pharmacy - Main St',
        instructions: 'Take one tablet by mouth at bedtime.',
        isControlled: false,
        canRequestRefill: true
      }
    ];
  }

  private generateMockLabResults(): LabResultSummary[] {
    return [
      {
        id: 'LAB-001',
        orderId: 'ORD-001',
        testName: 'Comprehensive Metabolic Panel',
        orderDate: new Date(Date.now() - 30 * 86400000),
        resultDate: new Date(Date.now() - 28 * 86400000),
        orderedBy: 'Dr. Sarah Johnson',
        status: 'resulted',
        hasAbnormal: false,
        isNew: true
      },
      {
        id: 'LAB-002',
        orderId: 'ORD-002',
        testName: 'Lipid Panel',
        orderDate: new Date(Date.now() - 30 * 86400000),
        resultDate: new Date(Date.now() - 28 * 86400000),
        orderedBy: 'Dr. Sarah Johnson',
        status: 'resulted',
        hasAbnormal: true,
        isNew: true
      },
      {
        id: 'LAB-003',
        orderId: 'ORD-003',
        testName: 'Hemoglobin A1c',
        orderDate: new Date(Date.now() - 30 * 86400000),
        resultDate: new Date(Date.now() - 28 * 86400000),
        orderedBy: 'Dr. Sarah Johnson',
        status: 'resulted',
        hasAbnormal: false,
        isNew: false
      }
    ];
  }

  private generateMockImmunizations(): ImmunizationRecord[] {
    return [
      {
        id: 'IMM-001',
        vaccineName: 'Influenza Vaccine',
        vaccineCode: 'FLU-2024',
        administeredDate: new Date(Date.now() - 60 * 86400000),
        administeredBy: 'RN Mary Wilson',
        location: 'Main Clinic',
        lotNumber: 'LOT123456',
        manufacturer: 'Sanofi Pasteur',
        site: 'Left Deltoid',
        route: 'Intramuscular',
        seriesComplete: true,
        notes: '2024-2025 season flu vaccine'
      },
      {
        id: 'IMM-002',
        vaccineName: 'Tdap (Tetanus, Diphtheria, Pertussis)',
        vaccineCode: 'TDAP',
        administeredDate: new Date(Date.now() - 365 * 3 * 86400000),
        administeredBy: 'RN Mary Wilson',
        location: 'Main Clinic',
        lotNumber: 'LOT789012',
        manufacturer: 'GlaxoSmithKline',
        site: 'Right Deltoid',
        route: 'Intramuscular',
        seriesComplete: true,
        nextDoseDate: new Date(Date.now() + 365 * 7 * 86400000)
      },
      {
        id: 'IMM-003',
        vaccineName: 'COVID-19 Vaccine (Pfizer-BioNTech)',
        vaccineCode: 'COVID-PFZ',
        administeredDate: new Date(Date.now() - 180 * 86400000),
        administeredBy: 'RN Mary Wilson',
        location: 'Main Clinic',
        lotNumber: 'LOT456789',
        manufacturer: 'Pfizer',
        site: 'Left Deltoid',
        route: 'Intramuscular',
        doseNumber: 4,
        seriesComplete: true,
        notes: 'Updated bivalent booster'
      }
    ];
  }

  private generateMockDocuments(): DocumentRecord[] {
    return [
      {
        id: 'DOC-001',
        title: 'After Visit Summary - Dec 2024',
        documentType: 'visit_summary',
        date: new Date(Date.now() - 30 * 86400000),
        provider: 'Dr. Sarah Johnson',
        category: 'Visit Summaries',
        fileSize: 156000,
        fileType: 'application/pdf',
        downloadUrl: '/documents/DOC-001.pdf',
        isNew: true
      },
      {
        id: 'DOC-002',
        title: 'Lab Results - Comprehensive Metabolic Panel',
        documentType: 'lab_report',
        date: new Date(Date.now() - 28 * 86400000),
        category: 'Lab Reports',
        fileSize: 89000,
        fileType: 'application/pdf',
        downloadUrl: '/documents/DOC-002.pdf',
        isNew: true
      },
      {
        id: 'DOC-003',
        title: 'Referral Letter - Cardiology',
        documentType: 'referral',
        date: new Date(Date.now() - 180 * 86400000),
        provider: 'Dr. Sarah Johnson',
        category: 'Referrals',
        fileSize: 45000,
        fileType: 'application/pdf',
        downloadUrl: '/documents/DOC-003.pdf',
        isNew: false
      }
    ];
  }

  private generateMockAllergies(): AllergyRecord[] {
    return [
      {
        id: 'ALG-001',
        allergen: 'Penicillin',
        type: 'drug',
        reaction: 'Rash, hives',
        severity: 'moderate',
        onsetDate: new Date(2015, 5, 15),
        status: 'active',
        notes: 'Confirmed allergic reaction in 2015'
      },
      {
        id: 'ALG-002',
        allergen: 'Peanuts',
        type: 'food',
        reaction: 'Throat swelling, difficulty breathing',
        severity: 'severe',
        onsetDate: new Date(2000, 0, 1),
        status: 'active',
        notes: 'Carries EpiPen'
      },
      {
        id: 'ALG-003',
        allergen: 'Latex',
        type: 'environmental',
        reaction: 'Contact dermatitis',
        severity: 'mild',
        status: 'active'
      }
    ];
  }

  private generateMockVitals(): VitalRecord[] {
    return [
      {
        id: 'VIT-001',
        date: new Date(Date.now() - 30 * 86400000),
        height: { value: 70, unit: 'in' },
        weight: { value: 185, unit: 'lbs' },
        bmi: 26.5,
        bloodPressure: { systolic: 128, diastolic: 82 },
        heartRate: 72,
        temperature: { value: 98.6, unit: '°F' },
        respiratoryRate: 16,
        oxygenSaturation: 98
      },
      {
        id: 'VIT-002',
        date: new Date(Date.now() - 90 * 86400000),
        height: { value: 70, unit: 'in' },
        weight: { value: 188, unit: 'lbs' },
        bmi: 27.0,
        bloodPressure: { systolic: 132, diastolic: 84 },
        heartRate: 76,
        temperature: { value: 98.4, unit: '°F' },
        respiratoryRate: 14,
        oxygenSaturation: 97
      }
    ];
  }

  private generateMockMessageThreads(): MessageThread[] {
    return [
      {
        id: 'THR-001',
        patientId: this.currentPatientId,
        subject: 'Question about medication side effects',
        category: 'prescription',
        participants: [
          { id: this.currentPatientId, name: 'John Smith', type: 'patient' },
          { id: 'PROV-001', name: 'Dr. Sarah Johnson', type: 'provider' }
        ],
        lastMessageAt: new Date(Date.now() - 86400000),
        lastMessagePreview: 'Some mild side effects are normal in the first week...',
        unreadCount: 1,
        status: 'open',
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        id: 'THR-002',
        patientId: this.currentPatientId,
        subject: 'Lab results inquiry',
        category: 'lab_results',
        participants: [
          { id: this.currentPatientId, name: 'John Smith', type: 'patient' },
          { id: 'PROV-001', name: 'Dr. Sarah Johnson', type: 'provider' }
        ],
        lastMessageAt: new Date(Date.now() - 7 * 86400000),
        lastMessagePreview: 'Your lab results look good overall...',
        unreadCount: 0,
        status: 'closed',
        createdAt: new Date(Date.now() - 10 * 86400000)
      }
    ];
  }

  private generateMockPreferences(): PortalPreferences {
    return {
      patientId: this.currentPatientId,
      notifications: {
        email: true,
        sms: true,
        appointmentReminders: true,
        labResultsReady: true,
        newMessages: true,
        billingAlerts: true,
        prescriptionReminders: true
      },
      reminderTiming: '24h',
      language: 'en',
      paperlessStatements: true,
      shareDataWithCaregiver: false
    };
  }
}
