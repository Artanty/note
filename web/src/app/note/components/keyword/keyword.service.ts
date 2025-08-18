//keywordService.ts

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
  getKeyword(id: number, userHandle: string): Observable<Keyword> {
    return this.http.get<Keyword>(`${this.baseUrl}/${id}`, {
      params: { user_handle: userHandle }
    });
  }

  // Create new keyword
  createKeyword(keyword: { name: string; color: number }, userHandle: string): Observable<Keyword> {
    return this.http.post<Keyword>(`${this.baseUrl}/create`, {
      ...keyword,
      user_handle: userHandle
    });
  }

  // Update keyword
  updateKeyword(id: number, keyword: { name?: string; color?: number }, userHandle: string): Observable<Keyword> {
    return this.http.put<Keyword>(`${this.baseUrl}/${id}`, {
      ...keyword,
      user_handle: userHandle
    });
  }

  // Delete keyword
  deleteKeyword(id: number, userHandle: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { user_handle: userHandle }
    });
  }

  // Share keyword with another user
  shareKeyword(keywordId: number, targetUserHandle: string, accessLevel: number, userHandle: string): Observable<KeywordAccess> {
    return this.http.post<KeywordAccess>(`${this.baseUrl}/${keywordId}/share`, {
      target_user_handle: targetUserHandle,
      access_level: accessLevel,
      user_handle: userHandle
    });
  }
}