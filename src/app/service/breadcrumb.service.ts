import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url?: string;
  queryParams?: any;
  onClick?: () => void;
  icon?: string;  // nz-icon type (e.g., 'home', 'user', 'setting')
  iconTheme?: 'outline' | 'fill' | 'twotone';  // Icon theme, defaults to 'outline'
  key?: string;  // Unique key to identify and update breadcrumb
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  public breadcrumbs$: Observable<Breadcrumb[]> = this.breadcrumbsSubject.asObservable();

  constructor() { }

  /**
   * Set the breadcrumbs (replaces all existing breadcrumbs)
   */
  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbsSubject.value;
  }

  /**
   * Add a breadcrumb to the end
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    const current = this.breadcrumbsSubject.value;
    this.breadcrumbsSubject.next([...current, breadcrumb]);
  }

  /**
   * Remove the last breadcrumb
   */
  removeLastBreadcrumb(): void {
    const current = this.breadcrumbsSubject.value;
    if (current.length > 0) {
      this.breadcrumbsSubject.next(current.slice(0, -1));
    }
  }

  /**
   * Remove breadcrumb at specific index
   */
  removeBreadcrumbAt(index: number): void {
    const current = this.breadcrumbsSubject.value;
    this.breadcrumbsSubject.next(current.filter((_, i) => i !== index));
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbsSubject.next([]);
  }

  /**
   * Update breadcrumb at specific index
   */
  updateBreadcrumb(index: number, breadcrumb: Breadcrumb): void {
    const current = this.breadcrumbsSubject.value;
    if (index >= 0 && index < current.length) {
      const updated = [...current];
      updated[index] = breadcrumb;
      this.breadcrumbsSubject.next(updated);
    }
  }

  /**
   * Update or add breadcrumb by key
   * If a breadcrumb with the same key exists, it will be updated
   * Otherwise, a new breadcrumb will be added
   * @param breadcrumb - The breadcrumb to upsert
   * @param merge - If true, merges with existing breadcrumb instead of replacing
   */
  upsertBreadcrumb(breadcrumb: Breadcrumb, merge: boolean = false): void {
    if (!breadcrumb.key) {
      // If no key provided, just add it
      this.addBreadcrumb(breadcrumb);
      return;
    }

    const current = this.breadcrumbsSubject.value;
    const existingIndex = current.findIndex(b => b.key === breadcrumb.key);

    if (existingIndex !== -1) {
      // Update existing breadcrumb
      const updated = [...current];
      if (merge) {
        // Merge with existing breadcrumb (partial update)
        updated[existingIndex] = { ...updated[existingIndex], ...breadcrumb };
      } else {
        // Replace entire breadcrumb
        updated[existingIndex] = breadcrumb;
      }
      this.breadcrumbsSubject.next(updated);
    } else {
      // Add new breadcrumb
      this.breadcrumbsSubject.next([...current, breadcrumb]);
    }
  }

  /**
   * Update specific fields of a breadcrumb by key
   * Only updates the provided fields, keeping others unchanged
   */
  updateBreadcrumbFields(key: string, fields: Partial<Breadcrumb>): void {
    const current = this.breadcrumbsSubject.value;
    const existingIndex = current.findIndex(b => b.key === key);

    if (existingIndex !== -1) {
      const updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...fields };
      this.breadcrumbsSubject.next(updated);
    }
  }

  /**
   * Remove breadcrumb by key
   */
  removeBreadcrumbByKey(key: string): void {
    const current = this.breadcrumbsSubject.value;
    this.breadcrumbsSubject.next(current.filter(b => b.key !== key));
  }

  /**
   * Update specific fields of a breadcrumb by key
   * Only updates the provided fields, keeps others unchanged
   */
  updateBreadcrumbByKey(key: string, updates: Partial<Breadcrumb>): void {
    const current = this.breadcrumbsSubject.value;
    const index = current.findIndex(b => b.key === key);
    
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...updates };
      this.breadcrumbsSubject.next(updated);
    }
  }
}
