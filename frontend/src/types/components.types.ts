import { ReactNode, MouseEvent, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { User } from './auth.types';
import { TextResource } from './text.types';
import { SpeakSession } from './speak.types';
import { LoadingState, SelectOption } from './common.types';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

// Layout component props
export interface AppHeaderProps extends BaseComponentProps {
  user: User | null;
  onLogout: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchValue?: string;
  searchLoading?: boolean;
}

export interface UserMenuProps extends BaseComponentProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

// Navigation and routing
export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: ReactNode;
  roles?: string[];
  isActive?: boolean;
  badge?: string | number;
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

export interface SearchBarProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  autoFocus?: boolean;
  debounceMs?: number;
}

export interface SelectProps<T = string> extends BaseComponentProps {
  label?: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  multiple?: boolean;
}

// Button component props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Card component props
export interface CardProps extends BaseComponentProps {
  resource: TextResource;
  onFavorite?: (resourceId: string, isFavorite: boolean) => void;
  onView?: (resourceId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface ModalDetailProps extends ModalProps {
  resource: TextResource | null;
  onFavorite?: (resourceId: string, isFavorite: boolean) => void;
  onPractice?: (resourceId: string) => void;
}

// Loading and error states
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: any) => ReactNode);
  onError?: (error: Error, errorInfo: any) => void;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Speaking session components
export interface SpeakSessionProps extends BaseComponentProps {
  sessionId: string;
  onSessionEnd: (sessionId: string, success: boolean) => void;
  onSessionUpdate?: (session: SpeakSession) => void;
}

export interface AudioRecorderProps extends BaseComponentProps {
  onStart: () => void;
  onStop: (audioBlob: Blob) => void;
  onPause?: () => void;
  onResume?: () => void;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  maxDuration?: number;
  disabled?: boolean;
}

export interface AudioPlayerProps extends BaseComponentProps {
  src: string;
  autoPlay?: boolean;
  controls?: boolean;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

// Table component props
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  selectedRows?: string[];
  onRowSelect?: (selectedIds: string[]) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

// Toast notification props
export interface ToastProps extends BaseComponentProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Progress components
export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export interface StepperProps extends BaseComponentProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface StepItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
  disabled?: boolean;
}

// Chart and visualization props
export interface ChartProps extends BaseComponentProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  type?: 'line' | 'bar' | 'pie' | 'area';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// List component props
export interface ListProps<T> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  divider?: boolean;
  hover?: boolean;
  onClick?: (item: T, index: number) => void;
}

// Badge component props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
}

// Accordion component props
export interface AccordionProps extends BaseComponentProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
}

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

// Tab component props
export interface TabsProps extends BaseComponentProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
}

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  icon?: ReactNode;
}

// Event handler types
export type ClickHandler = (event: MouseEvent<HTMLElement>) => void;
export type ChangeHandler = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
export type SubmitHandler = (event: FormEvent<HTMLFormElement>) => void;
export type KeyHandler = (event: KeyboardEvent<HTMLElement>) => void;

// Theme and styling
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  muted: string;
}

export interface ComponentVariants {
  button: Record<string, string>;
  badge: Record<string, string>;
  alert: Record<string, string>;
  card: Record<string, string>;
}