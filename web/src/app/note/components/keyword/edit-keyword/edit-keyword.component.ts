import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { dd } from '../../../utilites/dd';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { KeywordService } from '../keyword.service';
import { FormBuilder, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { WebComponentWrapperComponent } from '../../_remote/web-component-wrapper/web-component-wrapper';
import { KeywordUser } from '../keyword.model';

@Component({
  selector: 'app-edit-keyword',
  standalone: true,
  imports: [CommonModule, GuiDirective, WebComponentWrapperComponent],
  templateUrl: './edit-keyword.component.html',
  styleUrl: './edit-keyword.component.scss'
})
export class EditKeywordComponent implements OnInit {
  public ready: boolean = false
  public keywordName$ = new BehaviorSubject<string>('')
  keyword: any = null
  keywordUsers$: BehaviorSubject<KeywordUser[]> = new BehaviorSubject<KeywordUser[]>([])

  userSelectorInputs: any = {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    selectedUsers: []
  };

  userSelectorOutputs = {
    valueChange: this.handleUserSelected.bind(this)
  };

  public isAddingUserAccess = new BehaviorSubject<boolean>(false)
  
  accessLevels = [
    { id: 0, name: 'Выбрать доступ' },
    { id: 1, name: 'Чтение' },
    { id: 2, name: 'Изменение' },
    { id: 3, name: 'Админ' }
  ]
  accessLevel: number = 0

  get addUserAccessText(): Observable<string> {
    return combineLatest([
      this.isAddingUserAccess.asObservable(),
      this.keywordUsers$.asObservable(),
    ])
      .pipe(
        map(([isAdding, users]: [boolean, any[]]) => {
          const usersCount = users.length
          if (isAdding === true) {
            return `Добавление доступа`
          } else if (usersCount) {
            return `Доступно ${usersCount} ${this.declensionOfUsers(usersCount)}`
          } else {
            return 'Нет доступа'
          }
        }))
  }

  get addUserAccessIcon(): Observable<string> {
    return this.isAddingUserAccess.asObservable().pipe(
      map((res: boolean) => {
        return (res === true) 
          ? 'mu mu-i-minus'
          : 'mu mu-i-plus'
      }))
  }

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
    this.getKeywordUsers(Number(id))
  }
    
  public shareKeyword() {
    this.keywordService.shareKeyword(
      this.keyword.id,
      this.selectedUserToAddAccess.providerId,
      this.selectedUserToAddAccess.userId,
      Number(this.selectedAccessLevel)
    ).subscribe({
      next: (res) => {
        this.closeAddingUserAccess()
        this.getKeywordUsers(this.keyword.id)
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error sharing keyword:', err)
    });
  }



  handleUserAccessAddToggleButton() {
    const currentValue = this.isAddingUserAccess.getValue()
    currentValue
      ? this.closeAddingUserAccess()
      : this.onAddUserAccess()
  }

  onAddUserAccess() {
    this.isAddingUserAccess.next(true);
  }

  closeAddingUserAccess() {
    this.isAddingUserAccess.next(false);
  }

  public declensionOfUsers(count: number) {
    let users = '';
    if (count % 100 >= 11 && count % 100 <= 19) {
      users = 'пользователям';
    } else {
      switch (count % 10) {
        case 1:
          users = 'пользователю';
          break;
        case 2:
        case 3:
        case 4:
          users = 'пользователям';
          break;
        default:
          users = 'пользоKtjyblвателям';
      }
    }
    return `${users}`;
  }

  private getKeywordUsers(id: number) {
    this.keywordService.getKeywordUsers(id).subscribe(res => {
      this.keywordUsers$.next(res)
    })
  }

  public keywordNameOnChange(data: any) {
    this.keywordName$.next(data)
  }

  private _loadKeyword(id: number) {
    this.keywordService.getKeyword(id).subscribe({
      next: (keyword) => {
        this.keywordName$.next(keyword.name)
        this.keyword = keyword
        this.ready = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }
  selectedUserToAddAccess: any = null
  handleUserSelected(data: any) {
    this.selectedUserToAddAccess = data
    this.cdr.detectChanges()
  }
  selectedAccessLevel: number | null = null
  accessLevelOnChange(data: any) {
    this.selectedAccessLevel = data
    this.cdr.detectChanges()
  }

  handleItemActionAway(data: any) {
    dd(data)
    if (data.selectedAction === 'DELETE') {
      this.unshareKeyword(data.user)
    }
  }

  public unshareKeyword(user: any) {
    this.keywordService.unshareKeyword(
      this.keyword.id,
      user.providerId,
      user.id,
    ).subscribe({
      next: (res) => {
        this.getKeywordUsers(this.keyword.id)
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error unsharing keyword:', err)
    });
  }
}
