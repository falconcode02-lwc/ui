import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../environments/environment";

export interface ParameterMetadata {
  name: string;
  type: string;
}

export interface MethodMetadata {
  name: string;
  returnType: string;
  parameters: ParameterMetadata[];
  documentation: string;
}

export interface FieldMetadata {
  name: string;
  type: string;
}

export interface ClassMetadata {
  name: string;
  type: string; // "class", "interface", "enum"
  methods: MethodMetadata[];
  fields: FieldMetadata[];
}

export interface AnnotationMetadata {
  name: string;
  snippet: string;
  documentation: string;
}

export interface IntellisenseMetadata {
  classes: ClassMetadata[];
  annotations: AnnotationMetadata[];
}

@Injectable({
  providedIn: "root",
})
export class IntellisenseService {
  private cache: IntellisenseMetadata | null = null;
  private readonly apiUrl = environment.apiUrl + "/api/v1/intellisense/classes";

  constructor(private http: HttpClient) {}

  /**
   * Fetch intellisense metadata from the backend.
   * Results are cached to avoid repeated API calls.
   */
  getIntellisenseMetadata(): Observable<IntellisenseMetadata> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<IntellisenseMetadata>(this.apiUrl).pipe(
      tap((data) => {
        this.cache = data;
      }),
    );
  }

  /**
   * Clear the cache and force a refresh on the next call.
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Get methods for a specific class by name.
   */
  getMethodsForClass(className: string): MethodMetadata[] {
    if (!this.cache) {
      return [];
    }

    const classData = this.cache.classes.find((c) => c.name === className);
    return classData ? classData.methods : [];
  }
}
