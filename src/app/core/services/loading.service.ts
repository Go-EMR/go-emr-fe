import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly loadingCount = signal(0);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  
  readonly loading$ = this.loadingSubject.asObservable();
  readonly isLoading = computed(() => this.loadingCount() > 0);
  
  show(): void {
    this.loadingCount.update(c => c + 1);
    this.loadingSubject.next(true);
  }
  
  hide(): void {
    this.loadingCount.update(c => Math.max(0, c - 1));
    if (this.loadingCount() === 0) {
      this.loadingSubject.next(false);
    }
  }
  
  reset(): void {
    this.loadingCount.set(0);
    this.loadingSubject.next(false);
  }
}
