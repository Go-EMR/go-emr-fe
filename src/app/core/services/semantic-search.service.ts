import { Injectable } from '@angular/core';
import Fuse, { FuseResult } from 'fuse.js';
import { MEDICAL_SYNONYMS } from '../../shared/data/medical-synonyms';

export interface SearchableItem {
  id: string;
  type: 'patient' | 'encounter' | 'prescription' | 'lab' | 'imaging' | 'note';
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  route?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  item: SearchableItem;
  score: number;
  matchedFields?: string[];
}

export interface GroupedSearchResults {
  patients: SearchResult[];
  encounters: SearchResult[];
  prescriptions: SearchResult[];
  labs: SearchResult[];
  imaging: SearchResult[];
  notes: SearchResult[];
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class SemanticSearchService {
  private fuse: Fuse<SearchableItem> | null = null;
  private items: SearchableItem[] = [];
  private readonly synonymMap = new Map<string, string[]>();

  constructor() {
    this.buildSynonymMap();
  }

  private buildSynonymMap(): void {
    for (const group of MEDICAL_SYNONYMS) {
      const allTerms = [group.canonical, ...group.terms].map(t => t.toLowerCase());
      for (const term of allTerms) {
        this.synonymMap.set(term, allTerms);
      }
    }
  }

  expandQuery(query: string): string[] {
    const lower = query.toLowerCase().trim();
    const expansions = new Set<string>([lower]);

    // Check direct synonym matches
    if (this.synonymMap.has(lower)) {
      for (const syn of this.synonymMap.get(lower)!) {
        expansions.add(syn);
      }
    }

    // Check partial matches — only when the input is at least 3 characters to avoid
    // over-expansion on short strings
    if (lower.length >= 3) {
      for (const [term, synonyms] of this.synonymMap.entries()) {
        if (term.includes(lower) || lower.includes(term)) {
          for (const syn of synonyms) {
            expansions.add(syn);
          }
        }
      }
    }

    // Cap expansions to avoid flooding Fuse with hundreds of queries
    return Array.from(expansions).slice(0, 12);
  }

  registerItems(items: SearchableItem[]): void {
    // Deduplicate by id — newer registrations overwrite older ones
    const map = new Map<string, SearchableItem>(this.items.map(i => [i.id, i]));
    for (const item of items) {
      map.set(item.id, item);
    }
    this.items = Array.from(map.values());
    this.rebuildIndex();
  }

  clearItems(type?: SearchableItem['type']): void {
    if (type) {
      this.items = this.items.filter(i => i.type !== type);
    } else {
      this.items = [];
    }
    this.rebuildIndex();
  }

  private rebuildIndex(): void {
    this.fuse = new Fuse(this.items, {
      keys: [
        { name: 'title', weight: 2.0 },
        { name: 'subtitle', weight: 1.5 },
        { name: 'description', weight: 1.0 },
        { name: 'keywords', weight: 1.8 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }

  search(query: string, maxResults: number = 20): GroupedSearchResults {
    const empty: GroupedSearchResults = {
      patients: [],
      encounters: [],
      prescriptions: [],
      labs: [],
      imaging: [],
      notes: [],
      totalCount: 0,
    };

    if (!this.fuse || !query.trim()) {
      return empty;
    }

    const expandedQueries = this.expandQuery(query);
    const allResults = new Map<string, SearchResult>();

    for (const q of expandedQueries) {
      const results: FuseResult<SearchableItem>[] = this.fuse.search(q, { limit: maxResults });
      for (const r of results) {
        const existing = allResults.get(r.item.id);
        const score = r.score ?? 1;
        if (!existing || score < existing.score) {
          allResults.set(r.item.id, {
            item: r.item,
            score,
            matchedFields: r.matches?.map(m => m.key ?? '') ?? [],
          });
        }
      }
    }

    const sorted = Array.from(allResults.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, maxResults);

    return {
      patients: sorted.filter(r => r.item.type === 'patient'),
      encounters: sorted.filter(r => r.item.type === 'encounter'),
      prescriptions: sorted.filter(r => r.item.type === 'prescription'),
      labs: sorted.filter(r => r.item.type === 'lab'),
      imaging: sorted.filter(r => r.item.type === 'imaging'),
      notes: sorted.filter(r => r.item.type === 'note'),
      totalCount: sorted.length,
    };
  }

  getSynonymsFor(term: string): string[] {
    return this.synonymMap.get(term.toLowerCase()) ?? [];
  }

  getICD10ForTerm(term: string): string[] {
    const lower = term.toLowerCase();
    for (const group of MEDICAL_SYNONYMS) {
      const allTerms = [group.canonical, ...group.terms].map(t => t.toLowerCase());
      if (allTerms.includes(lower) && group.icd10) {
        return group.icd10;
      }
    }
    return [];
  }
}
