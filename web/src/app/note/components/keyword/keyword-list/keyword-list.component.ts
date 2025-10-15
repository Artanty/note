import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { hexColor } from '../../../utilites/hex-color';
import { CommonModule } from '@angular/common';
import { Keyword, KeywordUser } from '../keyword.model';
import { KeywordService } from '../keyword.service';
import { Router } from '@angular/router';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-keyword-list',
  standalone: true,
  imports: [GuiDirective, CommonModule],
  templateUrl: './keyword-list.component.html',
  styleUrl: './keyword-list.component.scss'
})
export class KeywordListComponent implements OnInit {
  public keywords: Keyword[] = [];
  hexColor = hexColor
  // keywordUsers: KeywordUser[] = []; //temp
  
  constructor(
    private keywordService: KeywordService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    // this.keywordUsers$ = this.keywordService.getKeywordUsers(50)
  }

  ngOnInit() {
    this._loadKeywords();
  }

  public deleteKeyword(event: Event, id: number) {
    event.stopPropagation();
    console.log('delete clicked')
    this.keywordService.deleteKeyword(id).subscribe({
      next: () => this._loadKeywords(),
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }

  public goToKeywordEdit(id: number) {
    this.router.navigateByUrl('/note/keyword-edit' + '/' + id)
  }

  private _loadKeywords(): void {
    this.keywordService.getAllKeywords().subscribe({
      next: (keywords) => {
        this.keywords = keywords
        this.cdr.detectChanges()
      },
      error: (err) => console.error('Error loading keywords:', err)
    });
  }
}