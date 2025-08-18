import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GetUserKeywordsReq {

}
export interface Keyword {
  id: number,
  name: string
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  
  private baseUrl = process.env['NOTE_BACK_URL']

  constructor(private http: HttpClient) {}

  getUserKeywords(data?: GetUserKeywordsReq | any): Observable<Keyword[]> {
    // data = null
    return this.http.post<Keyword[]>(`${this.baseUrl}/keywords/list`, data);
  }
  
}