import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({providedIn: 'root'})
export class ApiMetadataService {

     private baseUrl = environment.apiUrl;
     constructor(private http: HttpClient) {}

    load() {
        return this.http.get<any[]>(`${this.baseUrl}/api/code/metadata`);
    }
    
}