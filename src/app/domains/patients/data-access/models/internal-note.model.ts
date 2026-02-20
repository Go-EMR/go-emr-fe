export type NoteCategory =
  | 'clinical'
  | 'administrative'
  | 'social'
  | 'behavioral'
  | 'financial'
  | 'legal'
  | 'safety';

export type NoteVisibility =
  | 'all-staff'
  | 'clinical-only'
  | 'admin-only'
  | 'author-only';

export interface InternalNote {
  id: string;
  patientId: string;
  title: string;
  content: string; // Markdown content
  category: NoteCategory;
  visibility: NoteVisibility;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;

  // Author info
  authorId: string;
  authorName: string;
  authorRole: string;

  // Version tracking
  version: number;
  versions: InternalNoteVersion[];

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Read tracking
  lastReadBy?: string[];
  readCount?: number;
}

export interface InternalNoteVersion {
  version: number;
  content: string;
  title: string;
  editedBy: string;
  editedByName: string;
  editedAt: string;
  changeDescription?: string;
}

export interface CreateInternalNoteDto {
  patientId: string;
  title: string;
  content: string;
  category: NoteCategory;
  visibility: NoteVisibility;
  tags: string[];
}

export interface UpdateInternalNoteDto {
  title?: string;
  content?: string;
  category?: NoteCategory;
  visibility?: NoteVisibility;
  tags?: string[];
  changeDescription?: string;
}

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  clinical: 'Clinical',
  administrative: 'Administrative',
  social: 'Social',
  behavioral: 'Behavioral',
  financial: 'Financial',
  legal: 'Legal',
  safety: 'Safety',
};

export const NOTE_CATEGORY_ICONS: Record<NoteCategory, string> = {
  clinical: 'pi pi-heart',
  administrative: 'pi pi-briefcase',
  social: 'pi pi-users',
  behavioral: 'pi pi-comments',
  financial: 'pi pi-dollar',
  legal: 'pi pi-shield',
  safety: 'pi pi-exclamation-triangle',
};

export const NOTE_CATEGORY_COLORS: Record<NoteCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  clinical:       { bg: '#dbeafe', text: '#1e40af', darkBg: '#1e3a5f', darkText: '#93c5fd' },
  administrative: { bg: '#f3f4f6', text: '#374151', darkBg: '#1f2937', darkText: '#d1d5db' },
  social:         { bg: '#d1fae5', text: '#065f46', darkBg: '#064e3b', darkText: '#6ee7b7' },
  behavioral:     { bg: '#ede9fe', text: '#5b21b6', darkBg: '#3b0764', darkText: '#c4b5fd' },
  financial:      { bg: '#fef3c7', text: '#92400e', darkBg: '#78350f', darkText: '#fde68a' },
  legal:          { bg: '#fee2e2', text: '#991b1b', darkBg: '#7f1d1d', darkText: '#fca5a5' },
  safety:         { bg: '#fef3c7', text: '#b45309', darkBg: '#78350f', darkText: '#fcd34d' },
};

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  'all-staff': 'All Staff',
  'clinical-only': 'Clinical Staff Only',
  'admin-only': 'Admin Staff Only',
  'author-only': 'Author Only (Private)',
};

export const NOTE_VISIBILITY_ICONS: Record<NoteVisibility, string> = {
  'all-staff': 'pi pi-users',
  'clinical-only': 'pi pi-heart',
  'admin-only': 'pi pi-briefcase',
  'author-only': 'pi pi-lock',
};
