/**
 * PrimeNG Shared Exports
 * 
 * This file exports commonly used PrimeNG modules for easy importing.
 * Import these in your standalone components as needed.
 * 
 * Usage in a component:
 * ```typescript
 * import { TableModule, ButtonModule, InputTextModule } from 'primeng';
 * // or use the barrel export:
 * import { PRIMENG_COMMON } from '@shared/primeng';
 * 
 * @Component({
 *   imports: [...PRIMENG_COMMON, TableModule],
 * })
 * ```
 */

// Form Components
export { InputTextModule } from 'primeng/inputtext';
export { InputTextareaModule } from 'primeng/inputtextarea';
export { InputNumberModule } from 'primeng/inputnumber';
export { InputMaskModule } from 'primeng/inputmask';
export { InputSwitchModule } from 'primeng/inputswitch';
export { InputGroupModule } from 'primeng/inputgroup';
export { InputGroupAddonModule } from 'primeng/inputgroupaddon';
export { PasswordModule } from 'primeng/password';
export { DropdownModule } from 'primeng/dropdown';
export { MultiSelectModule } from 'primeng/multiselect';
export { AutoCompleteModule } from 'primeng/autocomplete';
export { CalendarModule } from 'primeng/calendar';
export { CheckboxModule } from 'primeng/checkbox';
export { RadioButtonModule } from 'primeng/radiobutton';
export { SelectButtonModule } from 'primeng/selectbutton';
export { ToggleButtonModule } from 'primeng/togglebutton';
export { SliderModule } from 'primeng/slider';
export { RatingModule } from 'primeng/rating';
export { ColorPickerModule } from 'primeng/colorpicker';
export { ChipsModule } from 'primeng/chips';
export { EditorModule } from 'primeng/editor';
export { FloatLabelModule } from 'primeng/floatlabel';
export { IconFieldModule } from 'primeng/iconfield';
export { InputIconModule } from 'primeng/inputicon';

// Button Components
export { ButtonModule } from 'primeng/button';
export { SplitButtonModule } from 'primeng/splitbutton';
export { SpeedDialModule } from 'primeng/speeddial';

// Data Components
export { TableModule } from 'primeng/table';
export { TreeTableModule } from 'primeng/treetable';
export { DataViewModule } from 'primeng/dataview';
export { VirtualScrollerModule } from 'primeng/virtualscroller';
export { OrderListModule } from 'primeng/orderlist';
export { PickListModule } from 'primeng/picklist';
export { PaginatorModule } from 'primeng/paginator';
export { TreeModule } from 'primeng/tree';
export { TimelineModule } from 'primeng/timeline';
export { OrgChartModule } from 'primeng/organizationchart';

// Panel Components
export { AccordionModule } from 'primeng/accordion';
export { CardModule } from 'primeng/card';
export { DividerModule } from 'primeng/divider';
export { FieldsetModule } from 'primeng/fieldset';
export { PanelModule } from 'primeng/panel';
export { SplitterModule } from 'primeng/splitter';
export { ScrollPanelModule } from 'primeng/scrollpanel';
export { TabViewModule } from 'primeng/tabview';
export { ToolbarModule } from 'primeng/toolbar';
export { StepperModule } from 'primeng/stepper';

// Overlay Components
export { DialogModule } from 'primeng/dialog';
export { ConfirmDialogModule } from 'primeng/confirmdialog';
export { SidebarModule } from 'primeng/sidebar';
export { OverlayPanelModule } from 'primeng/overlaypanel';
export { TooltipModule } from 'primeng/tooltip';
export { DrawerModule } from 'primeng/drawer';
export { PopoverModule } from 'primeng/popover';

// File Components
export { FileUploadModule } from 'primeng/fileupload';

// Menu Components
export { MenuModule } from 'primeng/menu';
export { MenubarModule } from 'primeng/menubar';
export { ContextMenuModule } from 'primeng/contextmenu';
export { TieredMenuModule } from 'primeng/tieredmenu';
export { BreadcrumbModule } from 'primeng/breadcrumb';
export { TabMenuModule } from 'primeng/tabmenu';
export { StepsModule } from 'primeng/steps';
export { PanelMenuModule } from 'primeng/panelmenu';
export { MegaMenuModule } from 'primeng/megamenu';
export { DockModule } from 'primeng/dock';

// Chart Components
export { ChartModule } from 'primeng/chart';

// Messages Components
export { ToastModule } from 'primeng/toast';
export { MessagesModule } from 'primeng/messages';

// Media Components
export { ImageModule } from 'primeng/image';
export { GalleriaModule } from 'primeng/galleria';
export { CarouselModule } from 'primeng/carousel';

// Misc Components
export { AvatarModule } from 'primeng/avatar';
export { AvatarGroupModule } from 'primeng/avatargroup';
export { BadgeModule } from 'primeng/badge';
export { ChipModule } from 'primeng/chip';
export { TagModule } from 'primeng/tag';
export { ProgressBarModule } from 'primeng/progressbar';
export { ProgressSpinnerModule } from 'primeng/progressspinner';
export { ScrollTopModule } from 'primeng/scrolltop';
export { SkeletonModule } from 'primeng/skeleton';
export { InplaceModule } from 'primeng/inplace';
export { MeterGroupModule } from 'primeng/metergroup';
export { AnimateOnScrollModule } from 'primeng/animateonscroll';
export { RippleModule } from 'primeng/ripple';
export { StyleClassModule } from 'primeng/styleclass';
export { FocusTrapModule } from 'primeng/focustrap';
export { BlockUIModule } from 'primeng/blockui';

// Services
export { MessageService } from 'primeng/api';
export { ConfirmationService } from 'primeng/api';

// Common imports for most components
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

/**
 * Common PrimeNG modules used across most components
 * Import this array in your component's imports
 */
export const PRIMENG_COMMON = [
  ButtonModule,
  InputTextModule,
  TooltipModule,
  RippleModule,
  BadgeModule,
  TagModule,
  AvatarModule,
  CardModule,
  DividerModule,
  ProgressSpinnerModule,
  ToastModule,
  IconFieldModule,
  InputIconModule,
];

// Data table essentials
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';

/**
 * PrimeNG modules for data tables with filtering/sorting
 */
export const PRIMENG_TABLE = [
  TableModule,
  PaginatorModule,
  DropdownModule,
  MultiSelectModule,
  CalendarModule,
  InputTextModule,
  ButtonModule,
  TooltipModule,
  TagModule,
];

// Form essentials
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { InputSwitchModule } from 'primeng/inputswitch';

/**
 * PrimeNG modules for forms
 */
export const PRIMENG_FORMS = [
  InputTextModule,
  InputTextareaModule,
  InputNumberModule,
  DropdownModule,
  MultiSelectModule,
  CalendarModule,
  CheckboxModule,
  RadioButtonModule,
  FloatLabelModule,
  PasswordModule,
  InputSwitchModule,
  ButtonModule,
  IconFieldModule,
  InputIconModule,
];
