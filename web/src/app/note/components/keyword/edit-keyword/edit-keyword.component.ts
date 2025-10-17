import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { dd } from '../../../utilites/dd';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { KeywordService } from '../keyword.service';
import { FormBuilder, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { WebComponentWrapperComponent } from '../../_remote/web-component-wrapper/web-component-wrapper';
import { KeywordUser } from '../keyword.model';
import { validateShareKeyword } from './edit-keyword.validation';
import { LocalizedAccessLevels } from '../../../utilites/access-levels.constant';

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
  color: number = 0 //5051602
  color$ = new BehaviorSubject<number>(0)

  selectedUserToAddAccess: any = null
  selectedAccessLevel: number | null = null

  get colorObs$(): Observable<string> {
    return this.color$.asObservable().pipe(
      map(res => this.hexColor(res)))
  }

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

  get isColorChanged$(): Observable<boolean> {
    return this.color$.asObservable().pipe(map(res => {

      return res !== this.keyword?.color
    }))
  }

  get isNameChanged$(): Observable<boolean> {
    return this.keywordName$.asObservable().pipe(map(res => {
      
      return res !== this.keyword?.name
    }))
  }

  constructor(
    private keywordService: KeywordService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private injector: Injector,
    private location: Location
  ) {} 

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this._loadKeyword(Number(id)); 
    this.getKeywordUsers(Number(id))
  }

  public hexColor(color: number): string {
    return `#${color?.toString(16).padStart(6, '0')}`;
  }

  public onColorChange(data: string): void {
    const hexValue = data.substring(1); // Remove #
    const color = parseInt(hexValue, 16)
    this.color$.next(color)
    this.cdr.detectChanges();
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

  public updateKeyword() {
    const data = {
      id: this.keyword.id,
      name: this.keywordName$.getValue(),
      color: this.color$.getValue(),
    }
    this.keywordService.updateKeyword(data).subscribe({
      next: (res) => {
        const id = this.route.snapshot.paramMap.get('id');
        this._loadKeyword(Number(id))
      },
      error: (err) => console.error('Error updating keyword:', err)
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
      const usersWithLocalizedAccessLevels = res.map((el) => ({ ...el, accessLevel: this.localizeAccessLevel(el.accessLevel) }))
      this.keywordUsers$.next(usersWithLocalizedAccessLevels)
    })
  }

  private localizeAccessLevel(level: string): string {
    try {
      return LocalizedAccessLevels[level as keyof typeof LocalizedAccessLevels]
    } catch (e) {
      console.log('[ERROR localizeAccessLevel]: ' + e)
      return 'UNKNOWN'
    }
  }

  public keywordNameOnChange(data: any) {
    this.keywordName$.next(data)
  }

  private _loadKeyword(id: number) {
    this.ready = false
    this.selectedUserToAddAccess = null
    this.selectedAccessLevel = null
    this.keyword = null

    this.keywordService.getKeyword(id).subscribe({
      next: (keyword) => {
        this.keywordName$.next(keyword.name)
        this.color = keyword.color
        this.color$.next(keyword.color)
        this.keyword = keyword
        this.ready = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }
    
  handleUserSelected(data: any) {
    this.selectedUserToAddAccess = data
    this.cdr.detectChanges()
  }

  accessLevelOnChange(data: any) {
    this.selectedAccessLevel = data
    this.cdr.detectChanges()
  }

  handleItemActionAway(data: any) {
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

  public stepBack() {
    this.location.back()
  }
}
