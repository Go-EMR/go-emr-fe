import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent, SkeletonListComponent } from '../skeleton/skeleton.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  cellTemplate?: TemplateRef<any>;
  headerTemplate?: TemplateRef<any>;
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: (row: any) => boolean;
  hidden?: (row: any) => boolean;
  handler: (row: any) => void;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    EmptyStateComponent,
    SkeletonComponent,
    SkeletonListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="data-table-container" [class.loading]="loading">
      @if (loading) {
        <div class="loading-overlay">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      }

      @if (!loading && data.length === 0) {
        <app-empty-state
          [icon]="emptyIcon"
          [title]="emptyTitle"
          [description]="emptyDescription"
          [actionLabel]="emptyActionLabel"
          [actionIcon]="emptyActionIcon"
          [actionRoute]="emptyActionRoute">
        </app-empty-state>
      } @else {
        <div class="table-wrapper">
          <table 
            mat-table 
            [dataSource]="data" 
            matSort 
            (matSortChange)="onSort($event)"
            class="data-table">
            
            <!-- Selection Column -->
            @if (selectable) {
              <ng-container matColumnDef="select" sticky>
                <th mat-header-cell *matHeaderCellDef class="checkbox-cell">
                  <mat-checkbox
                    (change)="$event ? toggleAllRows() : null"
                    [checked]="selection.hasValue() && isAllSelected()"
                    [indeterminate]="selection.hasValue() && !isAllSelected()">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let row" class="checkbox-cell">
                  <mat-checkbox
                    (click)="$event.stopPropagation()"
                    (change)="$event ? selection.toggle(row) : null"
                    [checked]="selection.isSelected(row)">
                  </mat-checkbox>
                </td>
              </ng-container>
            }

            <!-- Dynamic Columns -->
            @for (column of columns; track column.key) {
              <ng-container [matColumnDef]="column.key" [sticky]="column.sticky">
                <th 
                  mat-header-cell 
                  *matHeaderCellDef 
                  [mat-sort-header]="column.sortable ? column.key : ''"
                  [disabled]="!column.sortable"
                  [style.width]="column.width"
                  [style.text-align]="column.align || 'left'">
                  @if (column.headerTemplate) {
                    <ng-container *ngTemplateOutlet="column.headerTemplate"></ng-container>
                  } @else {
                    {{ column.label }}
                  }
                </th>
                <td 
                  mat-cell 
                  *matCellDef="let row" 
                  [style.text-align]="column.align || 'left'">
                  @if (column.cellTemplate) {
                    <ng-container *ngTemplateOutlet="column.cellTemplate; context: { $implicit: row, value: row[column.key] }"></ng-container>
                  } @else {
                    {{ row[column.key] }}
                  }
                </td>
              </ng-container>
            }

            <!-- Actions Column -->
            @if (actions.length > 0) {
              <ng-container matColumnDef="actions" stickyEnd>
                <th mat-header-cell *matHeaderCellDef class="actions-cell">Actions</th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  @if (actions.length <= 2) {
                    @for (action of getVisibleActions(row); track action.label) {
                      <button 
                        mat-icon-button 
                        [color]="action.color"
                        [disabled]="action.disabled?.(row)"
                        [matTooltip]="action.label"
                        (click)="action.handler(row); $event.stopPropagation()">
                        <mat-icon>{{ action.icon }}</mat-icon>
                      </button>
                    }
                  } @else {
                    <button mat-icon-button [matMenuTriggerFor]="actionsMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionsMenu="matMenu">
                      @for (action of getVisibleActions(row); track action.label) {
                        <button 
                          mat-menu-item 
                          [disabled]="action.disabled?.(row)"
                          (click)="action.handler(row)">
                          @if (action.icon) {
                            <mat-icon [color]="action.color">{{ action.icon }}</mat-icon>
                          }
                          <span>{{ action.label }}</span>
                        </button>
                      }
                    </mat-menu>
                  }
                </td>
              </ng-container>
            }

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: stickyHeader"></tr>
            <tr 
              mat-row 
              *matRowDef="let row; columns: displayedColumns"
              [class.clickable]="rowClickable"
              [class.selected]="selection.isSelected(row)"
              (click)="onRowClick(row)">
            </tr>
          </table>
        </div>

        @if (paginator) {
          <mat-paginator
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageSizeOptions]="pageSizeOptions"
            [pageIndex]="pageIndex"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      }
    </div>
  `,
  styles: [`
    .data-table-container {
      position: relative;
      background: white;
      border-radius: 12px;
      overflow: hidden;

      &.loading {
        pointer-events: none;
      }
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;

      th {
        background: #f8fafc;
        font-weight: 600;
        color: #475569;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      td {
        font-size: 0.9rem;
        color: #1e293b;
      }

      tr.mat-mdc-row {
        transition: background 0.2s;

        &.clickable {
          cursor: pointer;

          &:hover {
            background: #f8fafc;
          }
        }

        &.selected {
          background: #e0f7fa;
        }
      }
    }

    .checkbox-cell {
      width: 48px;
      padding-right: 8px !important;
    }

    .actions-cell {
      width: 100px;
      text-align: center;

      button {
        margin: 0 2px;
      }
    }

    mat-paginator {
      border-top: 1px solid #e2e8f0;
    }

    /* Empty state inside table */
    app-empty-state {
      padding: 48px 24px;
    }
  `]
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading = false;
  @Input() selectable = false;
  @Input() rowClickable = false;
  @Input() stickyHeader = true;
  @Input() paginator = true;
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  
  // Empty state inputs
  @Input() emptyIcon = 'inbox';
  @Input() emptyTitle = 'No data found';
  @Input() emptyDescription = '';
  @Input() emptyActionLabel = '';
  @Input() emptyActionIcon = '';
  @Input() emptyActionRoute = '';

  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  selection = new SelectionModel<any>(true, []);

  get displayedColumns(): string[] {
    const cols: string[] = [];
    
    if (this.selectable) {
      cols.push('select');
    }
    
    cols.push(...this.columns.map(c => c.key));
    
    if (this.actions.length > 0) {
      cols.push('actions');
    }
    
    return cols;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
  }

  getVisibleActions(row: any): TableAction[] {
    return this.actions.filter(action => !action.hidden?.(row));
  }

  onRowClick(row: any): void {
    if (this.rowClickable) {
      this.rowClick.emit(row);
    }
  }

  onSort(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
