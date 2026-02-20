export type TimelineDomain =
  | 'encounter'
  | 'lab'
  | 'imaging'
  | 'prescription'
  | 'note'
  | 'vital'
  | 'procedure'
  | 'referral'
  | 'external';

export interface TimelineEvent {
  id: string;
  patientId: string;
  domain: TimelineDomain;
  timestamp: string;
  title: string;
  description: string;

  // Visual
  icon: string;
  color: string;

  // Source reference
  sourceId: string;
  sourceType: string;
  route?: string;

  // Clinical data
  provider?: string;
  location?: string;
  status?: string;

  // Lab-specific
  labValue?: string;
  labUnit?: string;
  labTrend?: 'increasing' | 'decreasing' | 'stable';
  isAbnormal?: boolean;
  isCritical?: boolean;

  // Grouping
  problemCodes?: string[];
  problemNames?: string[];
  tags?: string[];
}

export interface TimelineFilter {
  domains: TimelineDomain[];
  dateRange: { start?: string; end?: string };
  problemFilter?: string;
  searchTerm?: string;
  showAbnormalOnly?: boolean;
}

export const DOMAIN_CONFIG: Record<
  TimelineDomain,
  { label: string; icon: string; color: string; darkColor: string }
> = {
  encounter: {
    label: 'Encounters',
    icon: 'pi pi-calendar',
    color: '#3b82f6',
    darkColor: '#60a5fa',
  },
  lab: {
    label: 'Labs',
    icon: 'pi pi-chart-bar',
    color: '#8b5cf6',
    darkColor: '#a78bfa',
  },
  imaging: {
    label: 'Imaging',
    icon: 'pi pi-image',
    color: '#ec4899',
    darkColor: '#f472b6',
  },
  prescription: {
    label: 'Medications',
    icon: 'pi pi-list',
    color: '#10b981',
    darkColor: '#34d399',
  },
  note: {
    label: 'Notes',
    icon: 'pi pi-file-edit',
    color: '#f59e0b',
    darkColor: '#fbbf24',
  },
  vital: {
    label: 'Vitals',
    icon: 'pi pi-heart',
    color: '#ef4444',
    darkColor: '#f87171',
  },
  procedure: {
    label: 'Procedures',
    icon: 'pi pi-wrench',
    color: '#06b6d4',
    darkColor: '#22d3ee',
  },
  referral: {
    label: 'Referrals',
    icon: 'pi pi-directions',
    color: '#64748b',
    darkColor: '#94a3b8',
  },
  external: {
    label: 'External',
    icon: 'pi pi-globe',
    color: '#d946ef',
    darkColor: '#e879f9',
  },
};

export type TimelineGrouping = 'none' | 'day' | 'week' | 'month' | 'problem';

export type TimelineSortOrder = 'newest-first' | 'oldest-first';

export const TIME_RANGE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last year', value: '1y' },
  { label: 'All time', value: 'all' },
];
