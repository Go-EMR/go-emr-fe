import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  InternalNote,
  CreateInternalNoteDto,
  UpdateInternalNoteDto,
} from '../models/internal-note.model';
import { MOCK_INTERNAL_NOTES } from './mock-data/internal-notes.mock';

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class InternalNotesService {
  private mockNotes: InternalNote[] = [...MOCK_INTERNAL_NOTES];

  constructor(private http: HttpClient) {}

  getPatientNotes(patientId: string): Observable<InternalNote[]> {
    if (USE_MOCK) {
      const notes = this.mockNotes.filter((n) => n.patientId === patientId);
      return of(notes).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<InternalNote[]>(
      `/api/patients/${patientId}/internal-notes`
    );
  }

  getNote(noteId: string): Observable<InternalNote | undefined> {
    if (USE_MOCK) {
      return of(this.mockNotes.find((n) => n.id === noteId)).pipe(
        delay(MOCK_DELAY)
      );
    }
    return this.http.get<InternalNote>(`/api/internal-notes/${noteId}`);
  }

  createNote(dto: CreateInternalNoteDto): Observable<InternalNote> {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const newNote: InternalNote = {
        id: `INT-${Date.now()}`,
        ...dto,
        isPinned: false,
        isArchived: false,
        authorId: 'USR-001',
        authorName: 'Dr. Sarah Chen',
        authorRole: 'Attending Physician',
        version: 1,
        versions: [
          {
            version: 1,
            content: dto.content,
            title: dto.title,
            editedBy: 'USR-001',
            editedByName: 'Dr. Sarah Chen',
            editedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
        readCount: 0,
        lastReadBy: [],
      };
      this.mockNotes.unshift(newNote);
      return of(newNote).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<InternalNote>('/api/internal-notes', dto);
  }

  updateNote(
    noteId: string,
    dto: UpdateInternalNoteDto
  ): Observable<InternalNote> {
    if (USE_MOCK) {
      const idx = this.mockNotes.findIndex((n) => n.id === noteId);
      if (idx >= 0) {
        const note = this.mockNotes[idx];
        const newVersion = note.version + 1;
        const now = new Date().toISOString();
        const updatedNote: InternalNote = {
          ...note,
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.visibility !== undefined && { visibility: dto.visibility }),
          tags: dto.tags ?? note.tags,
          version: newVersion,
          versions: [
            ...note.versions,
            {
              version: newVersion,
              content: dto.content ?? note.content,
              title: dto.title ?? note.title,
              editedBy: 'USR-001',
              editedByName: 'Dr. Sarah Chen',
              editedAt: now,
              changeDescription: dto.changeDescription,
            },
          ],
          updatedAt: now,
        };
        this.mockNotes[idx] = updatedNote;
        return of(updatedNote).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.put<InternalNote>(`/api/internal-notes/${noteId}`, dto);
  }

  togglePin(noteId: string): Observable<InternalNote> {
    if (USE_MOCK) {
      const idx = this.mockNotes.findIndex((n) => n.id === noteId);
      if (idx >= 0) {
        this.mockNotes[idx] = {
          ...this.mockNotes[idx],
          isPinned: !this.mockNotes[idx].isPinned,
        };
        return of(this.mockNotes[idx]).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.patch<InternalNote>(
      `/api/internal-notes/${noteId}/pin`,
      {}
    );
  }

  toggleArchive(noteId: string): Observable<InternalNote> {
    if (USE_MOCK) {
      const idx = this.mockNotes.findIndex((n) => n.id === noteId);
      if (idx >= 0) {
        this.mockNotes[idx] = {
          ...this.mockNotes[idx],
          isArchived: !this.mockNotes[idx].isArchived,
        };
        return of(this.mockNotes[idx]).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.patch<InternalNote>(
      `/api/internal-notes/${noteId}/archive`,
      {}
    );
  }

  deleteNote(noteId: string): Observable<void> {
    if (USE_MOCK) {
      this.mockNotes = this.mockNotes.filter((n) => n.id !== noteId);
      return of(void 0).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`/api/internal-notes/${noteId}`);
  }
}
