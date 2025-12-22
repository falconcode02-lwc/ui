import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Scheduler {
    id?: number;
    name: string;
    description?: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    cron: string;
    hourInterval?: number;
    dayOfMonth?: number;
    daysOfWeek?: string; // comma-separated "1,3,5"
    months?: string;     // comma-separated "1,4,7"
    enabled: boolean;
    nextRun?: string;
    createdAt?: string;
    updatedAt?: string;
    request?: string
}

@Injectable({
    providedIn: 'root'
})
export class SchedulerService {

    private baseUrl = environment.apiUrl + '/api/schedulers';

    constructor(private http: HttpClient) { }

    /** 🔹 Get all schedulers */
    getAll(): Observable<Scheduler[]> {
        return this.http.get<Scheduler[]>(this.baseUrl);
    }

    /** 🔹 Get scheduler by ID */
    getById(id: number): Observable<Scheduler> {
        return this.http.get<Scheduler>(`${this.baseUrl}/${id}`);
    }

    /** 🔹 Create new scheduler */
    create(scheduler: Scheduler): Observable<Scheduler> {
        return this.http.post<Scheduler>(this.baseUrl, scheduler);
    }

    /** 🔹 Update scheduler */
    update(id: number, scheduler: Scheduler): Observable<Scheduler> {
        return this.http.put<Scheduler>(`${this.baseUrl}/${id}`, scheduler);
    }

    /** 🔹 Delete scheduler */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    /** 🔹 Toggle enable/disable */
    toggle(id: number, enabled: boolean): Observable<Scheduler> {
        return this.http.patch<Scheduler>(
            `${this.baseUrl}/${id}/toggle?enabled=${enabled}`,
            {}
        );
    }
}
