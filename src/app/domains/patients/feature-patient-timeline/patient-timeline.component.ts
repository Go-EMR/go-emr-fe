import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tooltip } from 'primeng/tooltip';
import { Badge } from 'primeng/badge';
import { Divider } from 'primeng/divider';
import { ToggleButton } from 'primeng/togglebutton';
import { Checkbox } from 'primeng/checkbox';

import { TimelineService } from '../data-access/services/timeline.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  TimelineEvent,
  TimelineDomain,
  TimelineGrouping,
  TimelineSortOrder,
  DOMAIN_CONFIG,
  TIME_RANGE_PRESETS,
} from '../data-access/models/timeline.model';

interface GroupedTimeline {
  label: string;
  subLabel?: string;
  events: TimelineEvent[];
}

const ALL_DOMAINS: TimelineDomain[] = [
  'encounter',
  'lab',
  'imaging',
  'prescription',
  'note',
  'vital',
  'procedure',
  'referral',
  'external',
];

@Component({
  selector: 'app-patient-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Tag,
    Skeleton,
    Select,
    InputText,
    IconField,
    InputIcon,
    Tooltip,
    Badge,
    Divider,
    ToggleButton,
    Checkbox,
  ],
  template: `
    <div class="patient-timeline" [class.dark]="themeService.isDarkMode()">

      <!-- Header -->
      <div class="timeline-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="header-text">
            <h2>Patient Timeline</h2>
            @if (!loading()) {
              <span class="event-count">
                {{ filteredEvents().length }} events
                @if (filteredEvents().length !== events().length) {
                  <span class="muted"> of {{ events().length }} total</span>
                }
              </span>
            }
          </div>
        </div>
        <div class="header-right">
          <!-- Sort order toggle -->
          <button
            class="sort-btn"
            [class.active]="sortOrder() === 'newest-first'"
            (click)="toggleSortOrder()"
            pTooltip="{{ sortOrder() === 'newest-first' ? 'Showing newest first' : 'Showing oldest first' }}"
            tooltipPosition="bottom"
          >
            <i [class]="sortOrder() === 'newest-first' ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up'"></i>
            {{ sortOrder() === 'newest-first' ? 'Newest First' : 'Oldest First' }}
          </button>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="controls-panel">

        <!-- Time Range Presets -->
        <div class="control-row">
          <span class="control-label">Time Range</span>
          <div class="preset-pills">
            @for (preset of timeRangePresets; track preset.value) {
              <button
                class="pill-btn"
                [class.active]="timeRange() === preset.value"
                (click)="setTimeRange(preset.value)"
              >
                {{ preset.label }}
              </button>
            }
          </div>
        </div>

        <!-- Domain Filters -->
        <div class="control-row domain-row">
          <span class="control-label">Filter</span>
          <div class="domain-chips">
            @for (domain of allDomains; track domain) {
              <button
                class="domain-chip"
                [class.active]="selectedDomains().has(domain)"
                [style.--domain-color]="domainConfig[domain].color"
                [style.--domain-dark-color]="domainConfig[domain].darkColor"
                (click)="toggleDomain(domain)"
                [pTooltip]="domainConfig[domain].label"
                tooltipPosition="bottom"
              >
                <i [class]="domainConfig[domain].icon"></i>
                <span class="domain-label">{{ domainConfig[domain].label }}</span>
                @if (domainCounts()[domain] > 0) {
                  <span class="domain-count">{{ domainCounts()[domain] }}</span>
                }
              </button>
            }
          </div>
          <div class="domain-actions">
            <button class="text-btn" (click)="selectAllDomains()">All</button>
            <span class="sep">|</span>
            <button class="text-btn" (click)="clearAllDomains()">None</button>
          </div>
        </div>

        <!-- Additional Controls -->
        <div class="control-row secondary-controls">
          <!-- Group by -->
          <div class="control-group">
            <span class="control-label">Group by</span>
            <p-select
              [options]="groupingOptions"
              [(ngModel)]="groupingModel"
              optionLabel="label"
              optionValue="value"
              [style]="{ 'min-width': '160px' }"
              (onChange)="grouping.set($event.value)"
            />
          </div>

          <!-- Search -->
          <div class="control-group search-group">
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input
                pInputText
                type="text"
                placeholder="Search events..."
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                class="search-input"
              />
            </p-iconfield>
          </div>

          <!-- Abnormal only -->
          <div class="control-group abnormal-group">
            <p-checkbox
              [(ngModel)]="showAbnormalModel"
              [binary]="true"
              (onChange)="showAbnormalOnly.set($event.checked)"
              inputId="abnormal-only"
            />
            <label for="abnormal-only" class="abnormal-label">
              <i class="pi pi-exclamation-circle"></i>
              Abnormal only
            </label>
          </div>
        </div>

      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-event">
              <div class="skeleton-dot">
                <p-skeleton shape="circle" size="40px" />
              </div>
              <div class="skeleton-card">
                <p-skeleton width="60%" height="20px" styleClass="mb-2" />
                <p-skeleton width="90%" height="14px" styleClass="mb-1" />
                <p-skeleton width="40%" height="12px" />
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @else if (filteredEvents().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-clock"></i>
          </div>
          <h3>No events found</h3>
          <p>Try adjusting your filters or time range to see more events.</p>
          <button class="pill-btn active" (click)="resetFilters()">
            <i class="pi pi-refresh"></i>
            Reset Filters
          </button>
        </div>
      }

      <!-- Timeline -->
      @else {
        <div class="timeline-container">
          @for (group of groupedEvents(); track group.label) {

            <!-- Group Header (if grouping is active) -->
            @if (grouping() !== 'none') {
              <div class="group-header">
                <div class="group-line"></div>
                <div class="group-label-wrap">
                  <span class="group-label">{{ group.label }}</span>
                  @if (group.subLabel) {
                    <span class="group-sublabel">{{ group.subLabel }}</span>
                  }
                  <span class="group-count">{{ group.events.length }} event{{ group.events.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="group-line"></div>
              </div>
            }

            <!-- Events in Group -->
            @for (event of group.events; track event.id; let isEven = $even) {
              <div
                class="timeline-item"
                [class.left]="isEven"
                [class.right]="!isEven"
                [class.is-abnormal]="event.isAbnormal"
                [class.is-critical]="event.isCritical"
              >
                <!-- Center Line Dot -->
                <div class="timeline-dot-wrap">
                  <div
                    class="timeline-dot"
                    [style.background-color]="themeService.isDarkMode()
                      ? domainConfig[event.domain].darkColor
                      : domainConfig[event.domain].color"
                  >
                    <i [class]="domainConfig[event.domain].icon"></i>
                  </div>
                  @if (event.isCritical) {
                    <div class="critical-ring"></div>
                  }
                </div>

                <!-- Event Card -->
                <div
                  class="event-card"
                  [class.clickable]="!!event.route"
                  (click)="navigateToSource(event)"
                  [style.--card-color]="themeService.isDarkMode()
                    ? domainConfig[event.domain].darkColor
                    : domainConfig[event.domain].color"
                >
                  <!-- Card Color Bar -->
                  <div class="card-color-bar"></div>

                  <!-- Card Header -->
                  <div class="card-header">
                    <div class="card-header-left">
                      <i
                        class="domain-icon"
                        [class]="domainConfig[event.domain].icon"
                        [style.color]="themeService.isDarkMode()
                          ? domainConfig[event.domain].darkColor
                          : domainConfig[event.domain].color"
                      ></i>
                      <span class="domain-tag">{{ domainConfig[event.domain].label }}</span>
                    </div>
                    <div class="card-header-right">
                      @if (event.isCritical) {
                        <span class="badge critical">CRITICAL</span>
                      }
                      @if (event.isAbnormal && !event.isCritical) {
                        <span class="badge abnormal">ABNORMAL</span>
                      }
                      @if (event.status) {
                        <span class="status-badge" [class]="'status-' + event.status">
                          {{ event.status | titlecase }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Card Body -->
                  <div class="card-body">
                    <h4 class="event-title">{{ event.title }}</h4>
                    <p class="event-description">{{ event.description }}</p>

                    <!-- Lab Value Row -->
                    @if (event.labValue) {
                      <div class="lab-row">
                        <span class="lab-value" [class.abnormal-value]="event.isAbnormal" [class.critical-value]="event.isCritical">
                          {{ event.labValue }}
                          @if (event.labUnit) {
                            <span class="lab-unit"> {{ event.labUnit }}</span>
                          }
                        </span>
                        @if (event.labTrend) {
                          <span class="trend-indicator" [class]="'trend-' + event.labTrend">
                            @if (event.labTrend === 'increasing') { ↑ }
                            @else if (event.labTrend === 'decreasing') { ↓ }
                            @else { → }
                          </span>
                        }
                      </div>
                    }

                    <!-- Provider / Location Row -->
                    @if (event.provider || event.location) {
                      <div class="meta-row">
                        @if (event.provider) {
                          <span class="meta-item">
                            <i class="pi pi-user"></i>
                            {{ event.provider }}
                          </span>
                        }
                        @if (event.location) {
                          <span class="meta-item">
                            <i class="pi pi-map-marker"></i>
                            {{ event.location }}
                          </span>
                        }
                      </div>
                    }

                    <!-- Problem Tags -->
                    @if (event.problemNames && event.problemNames.length > 0) {
                      <div class="problem-tags">
                        @for (name of event.problemNames; track name) {
                          <span class="problem-tag">{{ name }}</span>
                        }
                      </div>
                    }
                  </div>

                  <!-- Card Footer: Timestamp -->
                  <div class="card-footer">
                    <span class="timestamp-relative">
                      <i class="pi pi-clock"></i>
                      {{ getRelativeTime(event.timestamp) }}
                    </span>
                    <span class="timestamp-absolute">
                      {{ event.timestamp | date:'MMM d, y, h:mm a' }}
                    </span>
                    @if (event.route) {
                      <span class="view-link">
                        <i class="pi pi-arrow-right"></i>
                        View record
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .patient-timeline {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ===== HEADER ===== */
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: 1.25rem;
      color: white;
    }

    .header-text h2 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .dark .header-text h2 {
      color: #f1f5f9;
    }

    .event-count {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .dark .event-count {
      color: #94a3b8;
    }

    .muted {
      color: #94a3b8;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      border: 1.5px solid #e2e8f0;
      background: white;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .sort-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .dark .sort-btn {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
    }

    .dark .sort-btn:hover {
      border-color: #60a5fa;
      color: #60a5fa;
    }

    /* ===== CONTROLS PANEL ===== */
    .controls-panel {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .dark .controls-panel {
      background: #1e293b;
      border-color: #334155;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .control-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      min-width: 70px;
    }

    /* Time Range Pills */
    .preset-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3125rem 0.75rem;
      border-radius: 9999px;
      border: 1.5px solid #e2e8f0;
      background: white;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .pill-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .dark .pill-btn {
      background: #0f172a;
      border-color: #334155;
      color: #94a3b8;
    }

    .dark .pill-btn:hover {
      border-color: #60a5fa;
      color: #60a5fa;
    }

    .dark .pill-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    /* Domain Chips */
    .domain-row {
      align-items: flex-start;
      padding-top: 0.125rem;
    }

    .domain-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      flex: 1;
    }

    .domain-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3125rem 0.625rem;
      border-radius: 0.5rem;
      border: 1.5px solid #e2e8f0;
      background: white;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .domain-chip:hover {
      border-color: var(--domain-color);
      color: var(--domain-color);
    }

    .domain-chip.active {
      background: color-mix(in srgb, var(--domain-color) 12%, white);
      border-color: var(--domain-color);
      color: var(--domain-color);
    }

    .dark .domain-chip {
      background: #0f172a;
      border-color: #334155;
      color: #94a3b8;
    }

    .dark .domain-chip:hover {
      border-color: var(--domain-dark-color);
      color: var(--domain-dark-color);
    }

    .dark .domain-chip.active {
      background: color-mix(in srgb, var(--domain-dark-color) 15%, #0f172a);
      border-color: var(--domain-dark-color);
      color: var(--domain-dark-color);
    }

    .domain-chip i {
      font-size: 0.75rem;
    }

    .domain-count {
      background: currentColor;
      color: white;
      font-size: 0.65rem;
      padding: 0.0625rem 0.3125rem;
      border-radius: 9999px;
      font-weight: 600;
      line-height: 1.4;
      opacity: 0.85;
    }

    /* Override domain-count color when active */
    .domain-chip.active .domain-count {
      background: var(--domain-color);
      color: white;
      opacity: 1;
    }

    .domain-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
    }

    .text-btn {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.125rem 0.25rem;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .text-btn:hover {
      color: #1d4ed8;
    }

    .dark .text-btn {
      color: #60a5fa;
    }

    .dark .text-btn:hover {
      color: #93c5fd;
    }

    .sep {
      color: #e2e8f0;
      font-size: 0.75rem;
    }

    /* Secondary Controls */
    .secondary-controls {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .search-group {
      flex: 1;
      min-width: 200px;
    }

    .search-input {
      width: 100%;
      font-size: 0.875rem;
    }

    .abnormal-group {
      white-space: nowrap;
    }

    .abnormal-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #ef4444;
      cursor: pointer;
    }

    .abnormal-label i {
      font-size: 0.875rem;
    }

    /* ===== LOADING STATE ===== */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .skeleton-event {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }

    .skeleton-dot {
      flex-shrink: 0;
    }

    .skeleton-card {
      flex: 1;
      padding: 1.25rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
    }

    .dark .skeleton-card {
      background: #1e293b;
      border-color: #334155;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .dark .empty-icon {
      background: #334155;
    }

    .empty-icon i {
      font-size: 1.75rem;
      color: #94a3b8;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .empty-state h3 {
      color: #f1f5f9;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
      font-size: 0.9375rem;
    }

    /* ===== TIMELINE CONTAINER ===== */
    .timeline-container {
      position: relative;
      padding: 0.5rem 0 2rem;
    }

    /* Vertical center line */
    .timeline-container::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
      transform: translateX(-50%);
      z-index: 0;
    }

    .dark .timeline-container::before {
      background: #334155;
    }

    /* ===== GROUP HEADER ===== */
    .group-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 2rem 0 1.25rem;
      position: relative;
      z-index: 1;
    }

    .group-line {
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }

    .dark .group-line {
      background: #334155;
    }

    .group-label-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 9999px;
      padding: 0.25rem 0.875rem;
      white-space: nowrap;
    }

    .dark .group-label-wrap {
      background: #1e293b;
      border-color: #334155;
    }

    .group-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #1e293b;
    }

    .dark .group-label {
      color: #f1f5f9;
    }

    .group-sublabel {
      font-size: 0.75rem;
      color: #64748b;
    }

    .group-count {
      font-size: 0.75rem;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .dark .group-count {
      background: #334155;
      color: #94a3b8;
    }

    /* ===== TIMELINE ITEM ===== */
    .timeline-item {
      display: flex;
      position: relative;
      margin-bottom: 1.5rem;
      z-index: 1;
    }

    /* Left side: card on left, dot in center */
    .timeline-item.left {
      flex-direction: row;
      justify-content: flex-end;
      padding-right: calc(50% + 32px);
    }

    /* Right side: dot in center, card on right */
    .timeline-item.right {
      flex-direction: row;
      justify-content: flex-start;
      padding-left: calc(50% + 32px);
    }

    /* ===== DOT ===== */
    .timeline-dot-wrap {
      position: absolute;
      left: 50%;
      top: 1.25rem;
      transform: translateX(-50%);
      z-index: 2;
    }

    .timeline-dot {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease;
    }

    .dark .timeline-dot {
      border-color: #0f172a;
    }

    .timeline-dot i {
      font-size: 0.875rem;
      color: white;
    }

    .critical-ring {
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 2px solid #ef4444;
      animation: pulse-ring 2s infinite;
    }

    @keyframes pulse-ring {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    .timeline-item:hover .timeline-dot {
      transform: translateX(-50%) scale(1.1);
    }

    /* ===== EVENT CARD ===== */
    .event-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      width: 100%;
      max-width: 460px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      position: relative;
    }

    .dark .event-card {
      background: #1e293b;
      border-color: #334155;
    }

    .event-card.clickable {
      cursor: pointer;
    }

    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .dark .event-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .is-critical .event-card {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .is-abnormal:not(.is-critical) .event-card {
      border-color: rgba(245, 158, 11, 0.3);
    }

    /* Color Bar */
    .card-color-bar {
      height: 3px;
      background: var(--card-color);
      width: 100%;
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.625rem 1rem 0;
    }

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .domain-icon {
      font-size: 0.8125rem;
    }

    .domain-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--card-color);
    }

    .card-header-right {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.1875rem 0.5rem;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }

    .badge.critical {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.25);
    }

    .dark .badge.critical {
      background: rgba(220, 38, 38, 0.15);
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.3);
    }

    .badge.abnormal {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid rgba(217, 119, 6, 0.25);
    }

    .dark .badge.abnormal {
      background: rgba(217, 119, 6, 0.15);
      color: #fbbf24;
      border-color: rgba(251, 191, 36, 0.3);
    }

    .status-badge {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #64748b;
    }

    .dark .status-badge {
      background: #334155;
      color: #94a3b8;
    }

    .status-badge.status-completed,
    .status-badge.status-final {
      background: #f0fdf4;
      color: #16a34a;
    }

    .dark .status-badge.status-completed,
    .dark .status-badge.status-final {
      background: rgba(22, 163, 74, 0.15);
      color: #4ade80;
    }

    .status-badge.status-active {
      background: #eff6ff;
      color: #2563eb;
    }

    .dark .status-badge.status-active {
      background: rgba(37, 99, 235, 0.15);
      color: #60a5fa;
    }

    .status-badge.status-pending {
      background: #fefce8;
      color: #ca8a04;
    }

    .dark .status-badge.status-pending {
      background: rgba(202, 138, 4, 0.15);
      color: #facc15;
    }

    /* Card Body */
    .card-body {
      padding: 0.5rem 1rem 0.75rem;
    }

    .event-title {
      margin: 0 0 0.3125rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
    }

    .dark .event-title {
      color: #f1f5f9;
    }

    .event-description {
      margin: 0 0 0.625rem;
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.5;
    }

    .dark .event-description {
      color: #94a3b8;
    }

    /* Lab Row */
    .lab-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      padding: 0.375rem 0.625rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      width: fit-content;
    }

    .dark .lab-row {
      background: #0f172a;
    }

    .lab-value {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #1e293b;
    }

    .dark .lab-value {
      color: #f1f5f9;
    }

    .lab-value.abnormal-value {
      color: #d97706;
    }

    .dark .lab-value.abnormal-value {
      color: #fbbf24;
    }

    .lab-value.critical-value {
      color: #dc2626;
    }

    .dark .lab-value.critical-value {
      color: #f87171;
    }

    .lab-unit {
      font-size: 0.75rem;
      font-weight: 400;
      color: #64748b;
    }

    .dark .lab-unit {
      color: #94a3b8;
    }

    .trend-indicator {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1;
    }

    .trend-increasing {
      color: #ef4444;
    }

    .trend-decreasing {
      color: #10b981;
    }

    .trend-stable {
      color: #64748b;
    }

    /* Meta Row */
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.3125rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .meta-item {
      color: #94a3b8;
    }

    .meta-item i {
      font-size: 0.6875rem;
      opacity: 0.7;
    }

    /* Problem Tags */
    .problem-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3125rem;
      margin-top: 0.375rem;
    }

    .problem-tag {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: #eff6ff;
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .dark .problem-tag {
      background: rgba(59, 130, 246, 0.12);
      color: #60a5fa;
      border-color: rgba(96, 165, 250, 0.25);
    }

    /* Card Footer */
    .card-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    .dark .card-footer {
      border-top-color: #334155;
    }

    .timestamp-relative {
      display: flex;
      align-items: center;
      gap: 0.3125rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }

    .dark .timestamp-relative {
      color: #94a3b8;
    }

    .timestamp-relative i {
      font-size: 0.6875rem;
      opacity: 0.7;
    }

    .timestamp-absolute {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .view-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #3b82f6;
      margin-left: auto;
    }

    .dark .view-link {
      color: #60a5fa;
    }

    .view-link i {
      font-size: 0.625rem;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .patient-timeline {
        padding: 1rem;
      }

      /* Switch to single-column timeline on mobile */
      .timeline-container::before {
        left: 20px;
        transform: none;
      }

      .timeline-item.left,
      .timeline-item.right {
        flex-direction: row;
        justify-content: flex-start;
        padding-left: 56px;
        padding-right: 0;
      }

      .timeline-dot-wrap {
        left: 20px;
        transform: none;
      }

      .timeline-item:hover .timeline-dot {
        transform: scale(1.1);
      }

      .event-card {
        max-width: 100%;
      }

      .domain-label {
        display: none;
      }

      .control-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .secondary-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .search-group {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .preset-pills {
        gap: 0.25rem;
      }

      .pill-btn {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }
  `],
})
export class PatientTimelineComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly timelineService = inject(TimelineService);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Constants exposed to template
  readonly allDomains = ALL_DOMAINS;
  readonly domainConfig = DOMAIN_CONFIG;
  readonly timeRangePresets = TIME_RANGE_PRESETS;

  // State signals
  events = signal<TimelineEvent[]>([]);
  loading = signal(true);
  selectedDomains = signal<Set<TimelineDomain>>(new Set(ALL_DOMAINS));
  timeRange = signal('6m');
  grouping = signal<TimelineGrouping>('day');
  sortOrder = signal<TimelineSortOrder>('newest-first');
  searchTerm = signal('');
  showAbnormalOnly = signal(false);

  // Two-way ngModel bridges (PrimeNG components need plain values)
  groupingModel: TimelineGrouping = 'day';
  showAbnormalModel = false;

  readonly groupingOptions = [
    { label: 'No Grouping', value: 'none' },
    { label: 'Group by Day', value: 'day' },
    { label: 'Group by Week', value: 'week' },
    { label: 'Group by Month', value: 'month' },
    { label: 'Group by Problem', value: 'problem' },
  ];

  // ===== COMPUTED SIGNALS =====

  /** Count of events per domain from the full unfiltered set */
  domainCounts = computed<Record<TimelineDomain, number>>(() => {
    const counts = {} as Record<TimelineDomain, number>;
    for (const d of ALL_DOMAINS) {
      counts[d] = 0;
    }
    for (const e of this.events()) {
      counts[e.domain] = (counts[e.domain] ?? 0) + 1;
    }
    return counts;
  });

  /** Events after all filters applied */
  filteredEvents = computed<TimelineEvent[]>(() => {
    const domains = this.selectedDomains();
    const term = this.searchTerm().toLowerCase().trim();
    const abnormalOnly = this.showAbnormalOnly();
    const cutoff = this.getCutoffDate(this.timeRange());
    const sort = this.sortOrder();

    let result = this.events().filter((e) => {
      // Domain filter
      if (!domains.has(e.domain)) return false;

      // Time range filter
      if (cutoff && new Date(e.timestamp) < cutoff) return false;

      // Abnormal only
      if (abnormalOnly && !e.isAbnormal && !e.isCritical) return false;

      // Search
      if (term) {
        const searchable = [
          e.title,
          e.description,
          e.provider ?? '',
          e.location ?? '',
          e.status ?? '',
          ...(e.problemNames ?? []),
          ...(e.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }

      return true;
    });

    // Sort
    result = result.sort((a, b) => {
      const diff =
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sort === 'newest-first' ? diff : -diff;
    });

    return result;
  });

  /** Events grouped by the selected grouping strategy */
  groupedEvents = computed<GroupedTimeline[]>(() => {
    const events = this.filteredEvents();
    const groupBy = this.grouping();

    if (groupBy === 'none') {
      return [{ label: 'All Events', events }];
    }

    if (groupBy === 'problem') {
      return this.groupByProblem(events);
    }

    return this.groupByTime(events, groupBy);
  });

  // ===== LIFECYCLE =====

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const patientId = params['patientId'];
        if (patientId) {
          this.loadTimeline(patientId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== ACTIONS =====

  toggleDomain(domain: TimelineDomain): void {
    const current = new Set(this.selectedDomains());
    if (current.has(domain)) {
      current.delete(domain);
    } else {
      current.add(domain);
    }
    this.selectedDomains.set(current);
  }

  selectAllDomains(): void {
    this.selectedDomains.set(new Set(ALL_DOMAINS));
  }

  clearAllDomains(): void {
    this.selectedDomains.set(new Set());
  }

  setTimeRange(value: string): void {
    this.timeRange.set(value);
  }

  toggleSortOrder(): void {
    this.sortOrder.set(
      this.sortOrder() === 'newest-first' ? 'oldest-first' : 'newest-first'
    );
  }

  resetFilters(): void {
    this.selectedDomains.set(new Set(ALL_DOMAINS));
    this.timeRange.set('6m');
    this.searchTerm.set('');
    this.showAbnormalOnly.set(false);
    this.showAbnormalModel = false;
    this.grouping.set('day');
    this.groupingModel = 'day';
  }

  navigateToSource(event: TimelineEvent): void {
    if (event.route) {
      this.router.navigateByUrl(event.route);
    }
  }

  // ===== HELPERS =====

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 60) return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    return `${diffMonths} months ago`;
  }

  private loadTimeline(patientId: string): void {
    this.loading.set(true);
    this.timelineService
      .getPatientTimeline(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.loading.set(false);
        },
        error: () => {
          this.events.set([]);
          this.loading.set(false);
        },
      });
  }

  private getCutoffDate(range: string): Date | null {
    if (range === 'all') return null;
    const now = new Date();
    const map: Record<string, () => Date> = {
      '7d': () => new Date(now.getTime() - 7 * 86400000),
      '30d': () => new Date(now.getTime() - 30 * 86400000),
      '3m': () => new Date(now.getTime() - 90 * 86400000),
      '6m': () => new Date(now.getTime() - 180 * 86400000),
      '1y': () => new Date(now.getTime() - 365 * 86400000),
    };
    return map[range]?.() ?? null;
  }

  private groupByTime(
    events: TimelineEvent[],
    groupBy: 'day' | 'week' | 'month'
  ): GroupedTimeline[] {
    const groups = new Map<string, TimelineEvent[]>();

    for (const event of events) {
      const date = new Date(event.timestamp);
      let key: string;

      if (groupBy === 'day') {
        key = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else if (groupBy === 'week') {
        // ISO week start (Monday)
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        const weekEnd = new Date(d);
        weekEnd.setDate(weekEnd.getDate() + 6);
        key = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        key = date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    }

    return Array.from(groups.entries()).map(([label, evts]) => ({
      label,
      events: evts,
    }));
  }

  private groupByProblem(events: TimelineEvent[]): GroupedTimeline[] {
    const groups = new Map<string, TimelineEvent[]>();
    const noProblemsKey = 'Other / Uncategorized';

    for (const event of events) {
      if (!event.problemNames || event.problemNames.length === 0) {
        if (!groups.has(noProblemsKey)) groups.set(noProblemsKey, []);
        groups.get(noProblemsKey)!.push(event);
      } else {
        // Event may belong to multiple problems — place under first
        const problemKey = event.problemNames[0];
        if (!groups.has(problemKey)) groups.set(problemKey, []);
        groups.get(problemKey)!.push(event);
      }
    }

    return Array.from(groups.entries()).map(([label, evts]) => ({
      label,
      subLabel:
        evts[0]?.problemCodes?.[0] &&
        label !== noProblemsKey
          ? evts[0].problemCodes![0]
          : undefined,
      events: evts,
    }));
  }
}
