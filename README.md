# GoEMR - Modern Healthcare Management

A modern, HIPAA/GDPR/CCPA compliant Electronic Medical Records system built with Angular 19+, following clean architecture principles and designed for scalability.

## 🏗️ Architecture Overview

This project follows the **Feature-Based Architecture** pattern inspired by Nx monorepo best practices with clear separation of concerns:

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   ├── shared/                  # Shared components, directives, pipes
│   ├── domains/                 # Feature domains (bounded contexts)
│   │   ├── patients/           # Patient management domain
│   │   ├── appointments/       # Scheduling domain
│   │   ├── encounters/         # Clinical encounters domain
│   │   ├── billing/            # Billing & claims domain
│   │   ├── prescriptions/      # E-prescribing domain
│   │   ├── labs/               # Lab orders & results domain
│   │   ├── portal/             # Patient portal domain
│   │   ├── reports/            # Reporting & analytics domain
│   │   ├── admin/              # Administration domain
│   │   └── messaging/          # Secure messaging domain
│   └── shell/                   # Application shell & layout
├── assets/
├── environments/
└── styles/
```

## 📁 Domain Structure (Feature-Based)

Each domain follows this structure:
```
domain-name/
├── feature-xxx/               # Smart components (routed)
│   ├── xxx.component.ts
│   ├── xxx.component.html
│   └── xxx.component.scss
├── ui/                        # Dumb/Presentational components
│   ├── component-name/
│   └── ...
├── data-access/              # Services, state management
│   ├── services/
│   ├── store/
│   └── models/
├── utils/                    # Domain-specific utilities
├── guards/                   # Route guards
└── routes.ts                 # Domain routes
```

## 🔐 Compliance Features

### HIPAA Compliance
- End-to-end encryption for PHI
- Audit logging for all data access
- Role-based access control (RBAC)
- Automatic session timeout
- Secure authentication with MFA
- Data encryption at rest and in transit

### GDPR Compliance
- Consent management
- Data portability (export functionality)
- Right to be forgotten
- Privacy by design
- Data processing agreements tracking

### CCPA Compliance
- Consumer data access requests
- Opt-out mechanisms
- Data sale disclosure

## 🛠️ Technology Stack

- **Framework**: Angular 19+ (Standalone Components)
- **UI Library**: Angular Material 19+ with Custom Theme
- **State Management**: NgRx Signal Store
- **HTTP Client**: Angular HttpClient with interceptors
- **Forms**: Reactive Forms with custom validators
- **Animations**: Angular Animations
- **Charts**: ng2-charts / Chart.js
- **Testing**: Jest + Cypress
- **Styling**: SCSS with BEM methodology
- **Icons**: Material Icons + Custom SVG sprites

## 🎨 Design System

### Theme
- Modern Material Design 3 principles
- Healthcare-optimized color palette
- Accessible (WCAG 2.1 AA compliant)
- Dark/Light mode support
- High contrast mode for accessibility

### Components
- Consistent spacing (8px grid)
- Responsive breakpoints
- Touch-friendly targets (48px minimum)
- Skeleton loading states
- Micro-animations for feedback

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build:prod
```

## 📱 Mobile Support

This frontend is designed with mobile-first principles and will share:
- API contracts with Flutter mobile app
- Design tokens
- Business logic models
- Validation rules

## 🔄 Backend Integration Points

Designed to integrate with:
- **Go Backend API** (REST + gRPC)
- **NATS** for real-time messaging
- **Vault** for secrets management
- **PostgreSQL** via SQLC
- **Redis** for caching
- **Grafana** for monitoring metrics

## 📊 Key Features

1. **Dashboard** - Customizable provider dashboard
2. **Patient Management** - Full patient lifecycle
3. **Scheduling** - Advanced appointment booking
4. **Clinical Encounters** - SOAP notes, assessments
5. **E-Prescribing** - EPCS compliant
6. **Lab Integration** - Orders and results
7. **Billing** - Claims management
8. **Patient Portal** - Patient self-service
9. **Telehealth** - Video consultations
10. **Reports** - Clinical and financial analytics
