import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Form } from '../model/form-model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormService {
    private apiUrl = environment.apiUrl + '/api/v1/forms'; // backend endpoint

    constructor(private http: HttpClient) { }

    getAll(): Observable<Form[]> {
        return this.http.get<Form[]>(this.apiUrl);
    }

    getById(id: number): Observable<Form> {
        return this.http.get<Form>(`${this.apiUrl}/${id}`);
    }

    getByCode(code: string): Observable<Form> {
        return this.http.get<Form>(`${this.apiUrl}/code/${code}`);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    active(id: number, active: boolean): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/active?active=${active}`, {});
    }



    update(id: number, data: Form): Observable<Form> {
        return this.http.put<Form>(`${this.apiUrl}/${id}`, data);
    }

    create(data: Form): Observable<Form> {
        return this.http.post<Form>(`${this.apiUrl}`, data);
    }
}
