import { Injectable } from '@angular/core';
import { HttpService } from './http-service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface BindingDto {
  id: number;
  name: string;
  description?: string;
  type?: string;
  config?: any; // arbitrary configuration JSON
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface BindingBlock {
  id: number;
  name: string;
  description?: string;
  type?: string;
  config?: any;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CustomVariableService {
  private cache: BindingBlock[] = [];

  constructor(private http: HttpService) { }

  /**
   * List bindings with pagination and optional search
   */
  listBindings(q?: string, page: number = 0, size: number = 20): Observable<PageResponse<BindingDto>> {
    let url = `/api/bindings?page=${page}&size=${size}`;
    if (q && q.trim()) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    return this.http.get<PageResponse<BindingDto>>(url) as Observable<PageResponse<BindingDto>>;
  }

  /**
   * Get binding by id
   */
  getBindingById(id: number): Observable<BindingDto> {
    return this.http.get<BindingDto>(`/api/bindings/${id}`) as Observable<BindingDto>;
  }

  /**
   * Create a new binding
   */
  createBinding(payload: Partial<BindingDto>): Observable<BindingDto> {
    return this.http.post<BindingDto>(`/api/bindings`, payload) as Observable<BindingDto>;
  }

  /**
   * Update an existing binding
   */
  updateBinding(id: number, payload: Partial<BindingDto>): Observable<BindingDto> {
    return this.http.put<BindingDto>(`/api/bindings/${id}`, payload) as Observable<BindingDto>;
  }

  /**
   * Delete a binding
   */
  deleteBinding(id: number): Observable<void> {
    // HttpService does not expose a generic delete wrapper; use testAPI to call DELETE with full URL.
    const url = `${(this.http as any).baseUrl}/api/bindings/${id}`;
    return this.http.testAPI<void>({ url, method: 'DELETE' }) as Observable<void>;
  }

  /**
   * Search bindings (returns up to `size` results as BindingBlock)
   */
  searchBindings(searchTerm: string = '', size: number = 100): Observable<BindingBlock[]> {
    return this.listBindings(searchTerm, 0, size).pipe(
      map(resp => (resp && resp.content ? resp.content.map(d => this.toBlock(d)) : []))
    );
  }

  /**
   * Get all bindings (first `size` results)
   */
  getAllBindings(size: number = 100): Observable<BindingBlock[]> {
    return this.listBindings(undefined, 0, size).pipe(
      map(resp => (resp && resp.content ? resp.content.map(d => this.toBlock(d)) : []))
    );
  }

  private toBlock(dto: BindingDto): BindingBlock {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      config: dto.config,
      active: dto.active
    };
  }

  // Simple in-memory cache helpers
  cacheBindings(bindings: BindingBlock[]): void {
    this.cache = bindings;
  }

  getCachedBindings(): BindingBlock[] {
    return this.cache;
  }

  clearCache(): void {
    this.cache = [];
  }

  /**
   * Get mock bindings for local development / fallback (Observable)
   */
  getMockBindings(): Observable<BindingBlock[]> {
    const mock: BindingBlock[] = [
      { id: 1, name: 'system', description: 'System defaults', type: 'system', config: { theme: 'dark' }, active: true },
      { id: 2, name: 'auth', description: 'Authentication settings', type: 'auth', config: { tokenExpiry: 3600 }, active: true },
      { id: 3, name: 'integration', description: 'External integrations', type: 'integration', config: { retries: 3 }, active: false }
    ];
    return new Observable<BindingBlock[]>((sub) => { sub.next(mock); sub.complete(); });
  }
}
