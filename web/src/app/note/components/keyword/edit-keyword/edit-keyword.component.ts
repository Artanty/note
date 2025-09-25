import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { dd } from '../../../utilites/dd';
import { BehaviorSubject } from 'rxjs';
import { KeywordService } from '../keyword.service';
import { FormBuilder, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { WebComponentWrapperComponent } from '../../_remote/web-component-wrapper/web-component-wrapper';
import { GuiService } from '../../_remote/web-component-wrapper/gui.service';

@Component({
  selector: 'app-edit-keyword',
  standalone: true,
  imports: [CommonModule, GuiDirective],
  // providers: [GuiService],
  templateUrl: './edit-keyword.component.html',
  styleUrl: './edit-keyword.component.scss'
})
export class EditKeywordComponent implements OnInit {
  public ready: boolean = false
  public keywordName$ = new BehaviorSubject<string>('')

  constructor(
    private keywordService: KeywordService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private injector: Injector,
  ) {} 

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this._loadKeyword(Number(id)); 
  }

  public loginOnChange(data: any) {
    dd(data)
  }

  private _loadKeyword(id: number) {
    this.keywordService.getKeyword(id).subscribe({
      next: (keyword) => {
        // this.keywordName$.next(keyword.name)
        
        this.ready = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }
}
