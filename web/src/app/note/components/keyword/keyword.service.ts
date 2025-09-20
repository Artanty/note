import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface Keyword {
  id: number;
  name: string;
  color: number;
  created_at: string;
  updated_at: string;
}

export interface KeywordAccess {
  keyword_id: number;
  user_handle: string;
  access_level: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private baseUrl = `${process.env['NOTE_BACK_URL']}/keywords`;

  constructor(private http: HttpClient) {}

  // Get all keywords for current user
  getAllKeywords(): Observable<Keyword[]> {
    return this.http.post<Keyword[]>(`${this.baseUrl}/list`, null);
  }

  // Get single keyword
  getKeyword(id: number): Observable<Keyword> {
    const data = { id: id }
    return this.http.post<Keyword>(`${this.baseUrl}/get-one`, data);
  }

  // Create new keyword
  createKeyword(keyword: { name: string; color: number }): Observable<Keyword> {
    return this.http.post<Keyword>(`${this.baseUrl}/create`, {
      ...keyword,
    });
  }

  // Update keyword
  updateKeyword(keyword: { id: number, name?: string; color?: number }): Observable<Keyword> {
    const data = keyword
    return this.http.post<Keyword>(`${this.baseUrl}/update`, data);
  }

  deleteKeyword(id: number): Observable<any> {
    const data = { id: id }
    return this.http.post<any>(`${this.baseUrl}/delete`, data);
  }

  // Share keyword with another user
  shareKeyword(
    keywordId: number, 
    targetUserProviderId: string,
    targetUserId: string, 
    accessLevel: number
  ): Observable<KeywordAccess> {
    return this.http.post<KeywordAccess>(`${this.baseUrl}/share`, {
      keywordId: keywordId,
      targetUserProviderId: targetUserProviderId,
      targetUserId: targetUserId,
      accessLevel: accessLevel,
    });
  }

  public getAccessLevels() {
    return [
      { id: 1, name: 'Чтение' },
      { id: 2, name: 'Чтение и запись' },
      { id: 3, name: 'Админ' },
      { id: 4, name: 'Нет доступа' },
    ]
  }
}