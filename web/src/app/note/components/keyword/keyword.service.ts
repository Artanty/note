import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { Keyword, KeywordAccess, KeywordUser, KeywordUsersRes, ShareKeywordRes } from './keyword.model';
import { validateShareKeyword } from './edit-keyword/edit-keyword.validation';

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

  // get list of users that have access to keyword
  public getKeywordUsers(keywordId: number): Observable<KeywordUser[]> {
    const data = {
      "keywordId": keywordId
    }
    return this.http.post<KeywordUsersRes>(`${this.baseUrl}/users/list`, data).pipe(
      map(res => {
        return res.enrichedUsersData
      }));
  }
  


  // Share keyword with another user
  shareKeyword(
    keywordId: number, 
    targetUserProviderId: string,
    targetUserId: string, 
    accessLevel: number
  ): Observable<ShareKeywordRes> {
    validateShareKeyword(keywordId, targetUserProviderId, targetUserId, accessLevel)
    return this.http.post<ShareKeywordRes>(`${this.baseUrl}/share`, {
      keywordId: keywordId,
      targetUserProviderId: targetUserProviderId,
      targetUserId: targetUserId,
      accessLevel: accessLevel,
    });
  }

  // Share keyword with another user
  unshareKeyword(
    keywordId: number, 
    targetUserProviderId: string,
    targetUserId: string, 
    
  ): Observable<ShareKeywordRes> {
    return this.http.post<ShareKeywordRes>(`${this.baseUrl}/unshare`, {
      keywordId: keywordId,
      targetUserProviderId: targetUserProviderId,
      targetUserId: targetUserId,
    });
  }

  public getAccessLevels() {
    return [
      { id: 1, name: 'Просмотр' },
      { id: 2, name: 'Изменение' },
      { id: 3, name: 'Админ' },
      { id: 4, name: 'Владелец' },
    ]
  }
}