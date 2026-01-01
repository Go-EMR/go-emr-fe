import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'goemr-theme';
  
  // Current theme preference (what user selected)
  readonly themePreference = signal<Theme>(this.getStoredTheme());
  
  // Actual applied theme (resolved from system if needed)
  readonly isDarkMode = signal<boolean>(this.calculateIsDark());
  
  constructor() {
    // Apply theme on initialization
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme();
      
      // Listen to system preference changes
      this.listenToSystemChanges();
      
      // React to theme changes
      effect(() => {
        const theme = this.themePreference();
        this.saveTheme(theme);
        this.isDarkMode.set(this.calculateIsDark());
        this.applyTheme();
      });
    }
  }
  
  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const current = this.isDarkMode();
    this.themePreference.set(current ? 'light' : 'dark');
  }
  
  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.themePreference.set(theme);
  }
  
  /**
   * Get the current theme icon for UI
   */
  getThemeIcon(): string {
    const pref = this.themePreference();
    if (pref === 'system') return 'pi pi-desktop';
    return this.isDarkMode() ? 'pi pi-moon' : 'pi pi-sun';
  }
  
  /**
   * Get theme label for UI
   */
  getThemeLabel(): string {
    const pref = this.themePreference();
    switch (pref) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  }
  
  private getStoredTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'system';
  }
  
  private saveTheme(theme: Theme): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }
  
  private calculateIsDark(): boolean {
    const pref = this.themePreference();
    
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    
    // System preference
    if (isPlatformBrowser(this.platformId)) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }
  
  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const isDark = this.isDarkMode();
      const html = document.documentElement;
      
      if (isDark) {
        html.classList.add('dark-mode');
        html.setAttribute('data-theme', 'dark');
      } else {
        html.classList.remove('dark-mode');
        html.setAttribute('data-theme', 'light');
      }
    }
  }
  
  private listenToSystemChanges(): void {
    if (isPlatformBrowser(this.platformId)) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', () => {
        // Only react if user prefers system theme
        if (this.themePreference() === 'system') {
          this.isDarkMode.set(this.calculateIsDark());
          this.applyTheme();
        }
      });
    }
  }
}
