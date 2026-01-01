import { Injectable, signal, computed } from '@angular/core';
import { 
  User, UserProfile, UserStatus, UserType, Role, Permission, PermissionCategory,
  SystemSettings, AuditLog, AuditFilter, AuditSummary, AuditAction, AuditSeverity,
  SystemHealth, ServiceHealth, SystemMetrics, BackupConfig, LicenseInfo
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // State signals
  private _users = signal<User[]>(this.generateMockUsers());
  private _roles = signal<Role[]>(this.generateMockRoles());
  private _permissions = signal<Permission[]>(this.generateMockPermissions());
  private _auditLogs = signal<AuditLog[]>(this.generateMockAuditLogs());
  private _systemSettings = signal<SystemSettings>(this.generateMockSettings());
  private _systemHealth = signal<SystemHealth>(this.generateMockHealth());
  private _isLoading = signal<boolean>(false);

  // Public readonly signals
  readonly users = this._users.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly auditLogs = this._auditLogs.asReadonly();
  readonly systemSettings = this._systemSettings.asReadonly();
  readonly systemHealth = this._systemHealth.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed values
  readonly activeUsers = computed(() => 
    this._users().filter(u => u.status === 'active').length
  );

  readonly totalUsers = computed(() => this._users().length);

  readonly usersByType = computed(() => {
    const users = this._users();
    return {
      providers: users.filter(u => u.type === 'provider').length,
      staff: users.filter(u => u.type === 'staff').length,
      admin: users.filter(u => u.type === 'admin').length,
      patients: users.filter(u => u.type === 'patient').length
    };
  });

  readonly usersByStatus = computed(() => {
    const users = this._users();
    return {
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      pending: users.filter(u => u.status === 'pending').length,
      locked: users.filter(u => u.status === 'locked').length
    };
  });

  readonly auditSummary = computed<AuditSummary>(() => {
    const logs = this._auditLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byAction = this.groupBy(logs, 'action');
    const bySeverity = this.groupBy(logs, 'severity');
    const byModule = this.groupBy(logs, 'module');

    const byUser: { userId: string; userName: string; count: number }[] = [];
    const userCounts = new Map<string, { name: string; count: number }>();
    logs.forEach(log => {
      const existing = userCounts.get(log.userId);
      if (existing) {
        existing.count++;
      } else {
        userCounts.set(log.userId, { name: log.userName, count: 1 });
      }
    });
    userCounts.forEach((value, key) => {
      byUser.push({ userId: key, userName: value.name, count: value.count });
    });
    byUser.sort((a, b) => b.count - a.count);

    return {
      totalEvents: logs.length,
      byAction: Object.entries(byAction).map(([action, items]) => ({ 
        action: action as AuditAction, 
        count: items.length 
      })),
      bySeverity: Object.entries(bySeverity).map(([severity, items]) => ({ 
        severity: severity as AuditSeverity, 
        count: items.length 
      })),
      byModule: Object.entries(byModule).map(([module, items]) => ({ 
        module, 
        count: items.length 
      })),
      byUser: byUser.slice(0, 10),
      failedEvents: logs.filter(l => !l.success).length,
      securityEvents: logs.filter(l => l.action === 'security' || l.severity === 'critical').length,
      recentActivity: logs.slice(0, 10)
    };
  });

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  // User operations
  getUser(id: string): User | undefined {
    return this._users().find(u => u.id === id);
  }

  createUser(user: Partial<User>): void {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName} ${user.lastName}`,
      type: user.type || 'staff',
      status: 'pending',
      roles: user.roles || [],
      mfaEnabled: false,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      ...user
    };
    this._users.update(users => [...users, newUser]);
  }

  updateUser(id: string, updates: Partial<User>): void {
    this._users.update(users => 
      users.map(u => u.id === id ? { ...u, ...updates, updatedAt: new Date() } : u)
    );
  }

  deleteUser(id: string): void {
    this._users.update(users => users.filter(u => u.id !== id));
  }

  updateUserStatus(id: string, status: UserStatus): void {
    this.updateUser(id, { status });
  }

  resetPassword(userId: string): void {
    console.log('Password reset initiated for user:', userId);
  }

  unlockUser(userId: string): void {
    this.updateUser(userId, { status: 'active', loginAttempts: 0, lockedUntil: undefined });
  }

  // Role operations
  getRole(id: string): Role | undefined {
    return this._roles().find(r => r.id === id);
  }

  createRole(role: Partial<Role>): void {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: role.name || '',
      description: role.description || '',
      type: 'custom',
      permissions: role.permissions || [],
      userCount: 0,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      ...role
    };
    this._roles.update(roles => [...roles, newRole]);
  }

  updateRole(id: string, updates: Partial<Role>): void {
    this._roles.update(roles => 
      roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r)
    );
  }

  deleteRole(id: string): void {
    const role = this.getRole(id);
    if (role?.type === 'system') {
      console.error('Cannot delete system role');
      return;
    }
    this._roles.update(roles => roles.filter(r => r.id !== id));
  }

  // Settings operations
  updateSettings(section: keyof SystemSettings, updates: any): void {
    this._systemSettings.update(settings => ({
      ...settings,
      [section]: { ...settings[section], ...updates }
    }));
  }

  // Audit operations
  filterAuditLogs(filter: AuditFilter): AuditLog[] {
    let logs = this._auditLogs();

    if (filter.startDate) {
      logs = logs.filter(l => l.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      logs = logs.filter(l => l.timestamp <= filter.endDate!);
    }
    if (filter.userId) {
      logs = logs.filter(l => l.userId === filter.userId);
    }
    if (filter.action?.length) {
      logs = logs.filter(l => filter.action!.includes(l.action));
    }
    if (filter.severity?.length) {
      logs = logs.filter(l => filter.severity!.includes(l.severity));
    }
    if (filter.module?.length) {
      logs = logs.filter(l => filter.module!.includes(l.module));
    }
    if (filter.success !== undefined) {
      logs = logs.filter(l => l.success === filter.success);
    }
    if (filter.search) {
      const query = filter.search.toLowerCase();
      logs = logs.filter(l => 
        l.description.toLowerCase().includes(query) ||
        l.userName.toLowerCase().includes(query) ||
        l.resource.toLowerCase().includes(query)
      );
    }

    return logs;
  }

  // Mock data generators
  private generateMockUsers(): User[] {
    const now = new Date();

    return [
      {
        id: 'user-1',
        username: 'sjohnson',
        email: 'sarah.johnson@clinic.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Dr. Sarah Johnson',
        type: 'provider',
        status: 'active',
        roles: ['physician', 'provider'],
        department: 'Internal Medicine',
        location: 'Main Campus',
        title: 'Physician',
        phone: '555-0101',
        npi: '1234567890',
        specialty: 'Internal Medicine',
        licenseNumber: 'MD12345',
        licenseState: 'CA',
        credentials: ['MD', 'FACP'],
        lastLogin: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        mfaEnabled: true,
        mfaMethod: 'totp',
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-2',
        username: 'mchen',
        email: 'michael.chen@clinic.com',
        firstName: 'Michael',
        lastName: 'Chen',
        fullName: 'Dr. Michael Chen',
        type: 'provider',
        status: 'active',
        roles: ['physician', 'provider'],
        department: 'Cardiology',
        location: 'Main Campus',
        title: 'Cardiologist',
        phone: '555-0102',
        npi: '2345678901',
        specialty: 'Cardiology',
        licenseNumber: 'MD23456',
        licenseState: 'CA',
        credentials: ['MD', 'FACC'],
        lastLogin: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        mfaEnabled: true,
        mfaMethod: 'totp',
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-3',
        username: 'mwilson',
        email: 'mary.wilson@clinic.com',
        firstName: 'Mary',
        lastName: 'Wilson',
        fullName: 'Mary Wilson',
        type: 'staff',
        status: 'active',
        roles: ['office-manager', 'scheduler'],
        department: 'Administration',
        location: 'Main Campus',
        title: 'Office Manager',
        phone: '555-0103',
        lastLogin: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        mfaEnabled: true,
        mfaMethod: 'email',
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 500 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-4',
        username: 'jlee',
        email: 'jennifer.lee@clinic.com',
        firstName: 'Jennifer',
        lastName: 'Lee',
        fullName: 'Jennifer Lee, RN',
        type: 'staff',
        status: 'active',
        roles: ['nurse', 'clinical-staff'],
        department: 'Nursing',
        location: 'Main Campus',
        title: 'Registered Nurse',
        phone: '555-0104',
        licenseNumber: 'RN98765',
        licenseState: 'CA',
        credentials: ['RN', 'BSN'],
        supervisorId: 'user-1',
        supervisorName: 'Dr. Sarah Johnson',
        lastLogin: new Date(now.getTime() - 30 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        mfaEnabled: false,
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-5',
        username: 'admin',
        email: 'admin@clinic.com',
        firstName: 'System',
        lastName: 'Administrator',
        fullName: 'System Administrator',
        type: 'admin',
        status: 'active',
        roles: ['super-admin'],
        department: 'IT',
        location: 'Main Campus',
        title: 'System Administrator',
        phone: '555-0100',
        lastLogin: new Date(now.getTime() - 15 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        mfaEnabled: true,
        mfaMethod: 'totp',
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'user-6',
        username: 'rthompson',
        email: 'robert.thompson@clinic.com',
        firstName: 'Robert',
        lastName: 'Thompson',
        fullName: 'Robert Thompson',
        type: 'staff',
        status: 'inactive',
        roles: ['billing-clerk'],
        department: 'Billing',
        location: 'Main Campus',
        title: 'Billing Specialist',
        phone: '555-0105',
        lastLogin: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        mfaEnabled: false,
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-7',
        username: 'agarcia',
        email: 'ana.garcia@clinic.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        fullName: 'Ana Garcia',
        type: 'staff',
        status: 'locked',
        roles: ['receptionist'],
        department: 'Front Desk',
        location: 'Main Campus',
        title: 'Receptionist',
        phone: '555-0106',
        lastLogin: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        passwordChangedAt: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        mfaEnabled: false,
        loginAttempts: 5,
        lockedUntil: new Date(now.getTime() + 30 * 60 * 1000),
        createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      },
      {
        id: 'user-8',
        username: 'dpatel',
        email: 'david.patel@clinic.com',
        firstName: 'David',
        lastName: 'Patel',
        fullName: 'David Patel, PA-C',
        type: 'provider',
        status: 'pending',
        roles: ['physician-assistant', 'provider'],
        department: 'Internal Medicine',
        location: 'Main Campus',
        title: 'Physician Assistant',
        phone: '555-0107',
        npi: '3456789012',
        licenseNumber: 'PA34567',
        licenseState: 'CA',
        credentials: ['PA-C'],
        supervisorId: 'user-1',
        supervisorName: 'Dr. Sarah Johnson',
        mfaEnabled: false,
        loginAttempts: 0,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdBy: 'user-3'
      }
    ];
  }

  private generateMockRoles(): Role[] {
    const now = new Date();

    return [
      {
        id: 'role-1',
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        type: 'system',
        permissions: [],
        userCount: 1,
        isDefault: false,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-2',
        name: 'Physician',
        description: 'Full clinical access for licensed physicians',
        type: 'system',
        permissions: [],
        userCount: 2,
        isDefault: false,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-3',
        name: 'Nurse',
        description: 'Clinical access for nursing staff',
        type: 'system',
        permissions: [],
        userCount: 1,
        isDefault: false,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-4',
        name: 'Office Manager',
        description: 'Administrative and scheduling access',
        type: 'system',
        permissions: [],
        userCount: 1,
        isDefault: false,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-5',
        name: 'Billing Clerk',
        description: 'Billing and payment processing access',
        type: 'system',
        permissions: [],
        userCount: 1,
        isDefault: false,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-6',
        name: 'Receptionist',
        description: 'Front desk and scheduling access',
        type: 'system',
        permissions: [],
        userCount: 1,
        isDefault: true,
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        createdBy: 'system'
      },
      {
        id: 'role-7',
        name: 'Lab Technician',
        description: 'Custom role for lab access only',
        type: 'custom',
        permissions: [],
        userCount: 0,
        isDefault: false,
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      }
    ];
  }

  private generateMockPermissions(): Permission[] {
    return [
      // Patient permissions
      { id: 'perm-1', code: 'patients.view', name: 'View Patients', description: 'View patient records', module: 'patients', category: 'patients', actions: ['read'] },
      { id: 'perm-2', code: 'patients.create', name: 'Create Patients', description: 'Create new patient records', module: 'patients', category: 'patients', actions: ['create'] },
      { id: 'perm-3', code: 'patients.edit', name: 'Edit Patients', description: 'Edit patient records', module: 'patients', category: 'patients', actions: ['update'] },
      { id: 'perm-4', code: 'patients.delete', name: 'Delete Patients', description: 'Delete patient records', module: 'patients', category: 'patients', actions: ['delete'] },
      
      // Appointment permissions
      { id: 'perm-5', code: 'appointments.view', name: 'View Appointments', description: 'View appointment schedule', module: 'appointments', category: 'appointments', actions: ['read'] },
      { id: 'perm-6', code: 'appointments.create', name: 'Create Appointments', description: 'Schedule appointments', module: 'appointments', category: 'appointments', actions: ['create'] },
      { id: 'perm-7', code: 'appointments.edit', name: 'Edit Appointments', description: 'Modify appointments', module: 'appointments', category: 'appointments', actions: ['update'] },
      
      // Encounter permissions
      { id: 'perm-8', code: 'encounters.view', name: 'View Encounters', description: 'View clinical encounters', module: 'encounters', category: 'encounters', actions: ['read'] },
      { id: 'perm-9', code: 'encounters.create', name: 'Create Encounters', description: 'Create clinical encounters', module: 'encounters', category: 'encounters', actions: ['create'] },
      { id: 'perm-10', code: 'encounters.sign', name: 'Sign Encounters', description: 'Sign and finalize encounters', module: 'encounters', category: 'encounters', actions: ['sign'] },
      
      // Billing permissions
      { id: 'perm-11', code: 'billing.view', name: 'View Billing', description: 'View billing information', module: 'billing', category: 'billing', actions: ['read'] },
      { id: 'perm-12', code: 'billing.create', name: 'Create Claims', description: 'Create billing claims', module: 'billing', category: 'billing', actions: ['create'] },
      { id: 'perm-13', code: 'billing.payments', name: 'Post Payments', description: 'Post and manage payments', module: 'billing', category: 'billing', actions: ['create', 'update'] },
      
      // Admin permissions
      { id: 'perm-14', code: 'admin.users', name: 'Manage Users', description: 'Create and manage user accounts', module: 'admin', category: 'admin', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'perm-15', code: 'admin.roles', name: 'Manage Roles', description: 'Create and manage roles', module: 'admin', category: 'admin', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'perm-16', code: 'admin.settings', name: 'System Settings', description: 'Manage system settings', module: 'admin', category: 'admin', actions: ['read', 'update'] },
      { id: 'perm-17', code: 'admin.audit', name: 'View Audit Logs', description: 'View system audit logs', module: 'admin', category: 'admin', actions: ['read'] }
    ];
  }

  private generateMockAuditLogs(): AuditLog[] {
    const now = new Date();
    const logs: AuditLog[] = [];

    const actions: { action: AuditAction; severity: AuditSeverity; module: string; resource: string; description: string }[] = [
      { action: 'login', severity: 'low', module: 'auth', resource: 'session', description: 'User logged in successfully' },
      { action: 'logout', severity: 'low', module: 'auth', resource: 'session', description: 'User logged out' },
      { action: 'read', severity: 'low', module: 'patients', resource: 'patient', description: 'Viewed patient record' },
      { action: 'update', severity: 'medium', module: 'patients', resource: 'patient', description: 'Updated patient demographics' },
      { action: 'create', severity: 'medium', module: 'encounters', resource: 'encounter', description: 'Created new encounter' },
      { action: 'sign', severity: 'high', module: 'encounters', resource: 'encounter', description: 'Signed encounter note' },
      { action: 'create', severity: 'medium', module: 'prescriptions', resource: 'prescription', description: 'Prescribed medication' },
      { action: 'export', severity: 'high', module: 'reports', resource: 'report', description: 'Exported patient data' },
      { action: 'security', severity: 'critical', module: 'auth', resource: 'session', description: 'Failed login attempt' },
      { action: 'update', severity: 'high', module: 'admin', resource: 'user', description: 'Modified user permissions' }
    ];

    const users = [
      { id: 'user-1', name: 'Dr. Sarah Johnson', type: 'provider' as UserType },
      { id: 'user-3', name: 'Mary Wilson', type: 'staff' as UserType },
      { id: 'user-4', name: 'Jennifer Lee, RN', type: 'staff' as UserType },
      { id: 'user-5', name: 'System Administrator', type: 'admin' as UserType }
    ];

    // Generate 50 audit logs
    for (let i = 0; i < 50; i++) {
      const actionData = actions[Math.floor(Math.random() * actions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const hoursAgo = Math.floor(Math.random() * 168); // Last week

      logs.push({
        id: `audit-${i + 1}`,
        timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
        userId: user.id,
        userName: user.name,
        userType: user.type,
        action: actionData.action,
        severity: actionData.severity,
        module: actionData.module,
        resource: actionData.resource,
        resourceId: `${actionData.resource}-${Math.floor(Math.random() * 1000)}`,
        description: actionData.description,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        sessionId: `session-${Math.floor(Math.random() * 10000)}`,
        success: Math.random() > 0.05
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateMockSettings(): SystemSettings {
    return {
      general: {
        practiceName: 'OpenEMR Medical Group',
        practiceAddress: '123 Healthcare Ave, Suite 100, Medical City, CA 90210',
        practicePhone: '(555) 123-4567',
        practiceFax: '(555) 123-4568',
        practiceEmail: 'info@openemr-clinic.com',
        practiceWebsite: 'https://openemr-clinic.com',
        practiceNpi: '1234567890',
        practiceTaxId: '12-3456789',
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        defaultLanguage: 'en'
      },
      security: {
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expirationDays: 90,
          historyCount: 5
        },
        sessionPolicy: {
          maxIdleMinutes: 30,
          maxSessionHours: 12,
          singleSessionOnly: false,
          requireMfa: false
        },
        loginPolicy: {
          maxAttempts: 5,
          lockoutMinutes: 30,
          allowRememberMe: true,
          ipWhitelist: []
        },
        auditPolicy: {
          enabled: true,
          retentionDays: 365,
          logLevel: 'standard'
        }
      },
      email: {
        smtpHost: 'smtp.clinic.com',
        smtpPort: 587,
        smtpUsername: 'noreply@clinic.com',
        smtpPassword: '********',
        smtpEncryption: 'tls',
        fromAddress: 'noreply@clinic.com',
        fromName: 'OpenEMR Medical Group',
        replyToAddress: 'support@clinic.com',
        templatesPath: '/templates/email'
      },
      scheduling: {
        defaultSlotDuration: 30,
        minAdvanceBookingHours: 24,
        maxAdvanceBookingDays: 90,
        allowDoubleBooking: false,
        allowWaitlist: true,
        reminderLeadTimeDays: 2,
        confirmationRequired: true,
        cancellationPolicyHours: 24,
        workingHours: {
          monday: { start: '08:00', end: '17:00', enabled: true },
          tuesday: { start: '08:00', end: '17:00', enabled: true },
          wednesday: { start: '08:00', end: '17:00', enabled: true },
          thursday: { start: '08:00', end: '17:00', enabled: true },
          friday: { start: '08:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '13:00', enabled: false },
          sunday: { start: '09:00', end: '13:00', enabled: false }
        },
        holidays: ['2024-01-01', '2024-07-04', '2024-12-25']
      },
      billing: {
        defaultFeeSchedule: 'standard',
        claimSubmissionMethod: 'electronic',
        clearinghouseId: 'CH12345',
        autoPostPayments: true,
        statementFrequency: 'monthly',
        collectionThresholdDays: 90,
        collectionThresholdAmount: 100,
        paymentMethods: ['cash', 'check', 'credit', 'ach'],
        taxRate: 0
      },
      clinical: {
        defaultChartTemplate: 'soap',
        requireSignature: true,
        autoSaveInterval: 60,
        prescriptionDefaults: {
          defaultPharmacy: '',
          defaultQuantity: 30,
          defaultRefills: 0,
          requireEpcs: true
        },
        labDefaults: {
          defaultLab: '',
          autoNotifyResults: true
        },
        vitalsSigns: {
          units: 'imperial',
          alertThresholds: {
            systolic: { low: 90, high: 140 },
            diastolic: { low: 60, high: 90 },
            pulse: { low: 60, high: 100 },
            temperature: { low: 97, high: 99.5 }
          }
        }
      },
      integrations: {
        hl7: {
          enabled: true,
          version: '2.5.1',
          receivingFacility: 'OPENEMR',
          sendingFacility: 'OPENEMR'
        },
        fhir: {
          enabled: true,
          serverUrl: 'https://fhir.clinic.com',
          version: 'R4'
        },
        immunizationRegistry: {
          enabled: false,
          registryUrl: '',
          submissionFrequency: 'daily'
        },
        prescriptionNetwork: {
          enabled: true,
          networkId: 'SURESCRIPT'
        },
        labInterfaces: [
          { id: 'lab-1', name: 'Quest Diagnostics', enabled: true, endpoint: 'https://api.quest.com' },
          { id: 'lab-2', name: 'LabCorp', enabled: false, endpoint: 'https://api.labcorp.com' }
        ]
      }
    };
  }

  private generateMockHealth(): SystemHealth {
    return {
      status: 'healthy',
      uptime: 864000, // 10 days in seconds
      lastChecked: new Date(),
      services: [
        { name: 'Database', status: 'up', responseTime: 15, lastChecked: new Date() },
        { name: 'API Server', status: 'up', responseTime: 45, lastChecked: new Date() },
        { name: 'Cache', status: 'up', responseTime: 2, lastChecked: new Date() },
        { name: 'Email Service', status: 'up', responseTime: 120, lastChecked: new Date() },
        { name: 'File Storage', status: 'up', responseTime: 35, lastChecked: new Date() }
      ],
      metrics: {
        cpu: { usage: 35, cores: 8 },
        memory: { used: 6.2, total: 16, percentage: 39 },
        disk: { used: 245, total: 500, percentage: 49 },
        database: { connections: 45, maxConnections: 200, queryTime: 12 },
        requests: { total: 125000, perSecond: 45, avgResponseTime: 85 },
        errors: { total: 23, rate: 0.02 },
        activeUsers: 12,
        activeSessions: 15
      }
    };
  }
}
