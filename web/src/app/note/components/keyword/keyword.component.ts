
import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { KeywordService, Keyword, KeywordAccess } from './keyword.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { BehaviorSubject, map, Observable, ReplaySubject, startWith, Subject } from 'rxjs';
import { dd } from '../../utilites/dd';

@Component({
  selector: 'app-keyword',
  templateUrl: './keyword.component.html',
  styleUrl: './keyword.component.scss',

})
export class KeywordComponent implements OnInit {
  // @ViewChild('placeHolder', { read: ViewContainerRef })
  // viewContainer!: ViewContainerRef;

  keywords: Keyword[] = [];
  selectedKeyword: Keyword | null = null;
  isEditing = false;
  shareForm: FormGroup;
  
  editKeywordForm: FormGroup;
  state: 'VIEW' | 'EDIT' | 'CREATE' | "SHARE" = 'CREATE';

  keywordName: string = ''
  public accessLevels: { name: string, id: number }[] = []
  accessLevel$ = new BehaviorSubject<number | null>(null)
  public isSaveAccessButtonDisabled$: Observable<boolean>
  // isCreateButtonDisabled$ = new Subject<boolean>()
  isCreateButtonDisabled$ = new BehaviorSubject<boolean>(true)

  parseInt(value: string, radix = 10): number {
    return parseInt(value, radix);
  }
  startWith = startWith
  
  onKeywordNameChange(data: any) {
    console.log(!this.keywordName.length)
    this.keywordName = data
    this.isCreateButtonDisabled$.next(!this.keywordName.length)
  }

  color: number = 5051602
  userProviderId$: BehaviorSubject<string> = new BehaviorSubject('')
  userId$: BehaviorSubject<string> = new BehaviorSubject('')

  public onColorChange(data: string): void {
    const hexValue = data.substring(1); // Remove #
    this.color = parseInt(hexValue, 16)
  }
  public onColorChange2(event: Event, isCreateForm: boolean): void {
    // const input = event.target as HTMLInputElement;
    // const hexValue = input.value.substring(1); // Remove #
    // if (isCreateForm) {
    //   this.createKeywordForm.patchValue({
    //     color: parseInt(hexValue, 16)
    //   });  
    // } else {
    //   this.editKeywordForm.patchValue({
    //     color: parseInt(hexValue, 16)
    //   });
    // }
  }

  public setState(data: 'VIEW' | 'EDIT' | 'CREATE'): void {
    this.state = data;
    this.isEditing = data === 'EDIT'
  }

  constructor(
    private keywordService: KeywordService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.isSaveAccessButtonDisabled$ = this.accessLevel$.pipe(map(res => Boolean(!res)))
    this.accessLevels = this.keywordService.getAccessLevels()
    this.editKeywordForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      color: [0x000000, [Validators.required]]
    });

    this.shareForm = this.fb.group({
      user_handle: ['', Validators.required],
      access_level: [1, Validators.required]
    });
  }

  userSelectorComponent: any;

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

  // interface Result {
  //   providerId: string,
  //   userId: string,
  // }
  handleUserSelected(data: any) {
    this.userProviderId$.next(data.providerId)
    this.userId$.next(data.userId)
    this.cdr.detectChanges()
    dd(data)
  }

  ngOnInit() {

    // const module = await import('http://localhost:4204/remoteEntry2.js');
    // this.userSelectorComponent = module.UserSelectorComponent;
    this.loadKeywords();
    // setTimeout(() => {
    //   this.isCreateButtonDisabled$.next(!this.keywordName.length)
    //   this.cdr.detectChanges()
    // }, 1000)
    // this.loadAuthComponent()
    // this.loadRemoteApp('http://localhost:4204/remoteEntry2.js')
    // console.log(customElements.get('user-selector'))
    // console.log(await this.ensureWebComponent('user-selector'))
  }

  loadKeywords(): void {
    this.keywordService.getAllKeywords().subscribe({
      next: (keywords) => {
        this.keywords = keywords
        if (this.selectedKeyword) {
          const selectedId = this.selectedKeyword?.id 
          this.selectedKeyword = null;  
          this.selectedKeyword = this.keywords.find(el => el.id === selectedId)!
        }
        this.cdr.detectChanges()
      },
      error: (err) => console.error('Error loading keywords:', err)
    });
  }

  selectKeyword(id: number): void {
    this.keywordService.getKeyword(id).subscribe({
      next: (keyword) => {
        this.selectedKeyword = keyword;
        this.isEditing = false;
        this.state = 'VIEW';
        
        this.editKeywordForm.patchValue({
          name: keyword.name,
          color: keyword.color
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }

  createKeyword(): void {
    if (this.isCreateButtonDisabled$.getValue() === false) {
      const payload = { 
        name: this.keywordName,
        color: this.color
      }
      
      this.keywordService.createKeyword(payload).subscribe({
        next: () => {
          this.loadKeywords();
          // this.createKeywordForm.reset();
        },
        error: (err) => console.error('Error creating keyword:', err)
      });
    }
  }

  updateKeyword(): void {
    if (this.selectedKeyword && this.editKeywordForm.valid) {
      const data = {
        id: this.selectedKeyword.id,
        name: this.editKeywordForm.value.name,
        color: this.editKeywordForm.value.color,
      }
      this.keywordService.updateKeyword(data).subscribe({
        next: () => {
          this.loadKeywords();
        },
        error: (err) => console.error('Error updating keyword:', err)
      });
    }
  }

  deleteKeyword(id: number): any {
    this.keywordService.deleteKeyword(id).subscribe({
      next: () => this.loadKeywords(),
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }

  /**
   * загрузить доступных пользователей с их именами и авами (списками)
   * добавить в запрос выбранного пользователя в формате userList+userId
   * note@back отправит эти данные в au@back
   * au@back сделает хэш(userHandler) пользователя, вернет его в note@back
   * note@back сохранит в таблице keyword_to_user данную связь
   * вопросы
   * нужно ли для загрузки списка пользователей привлекать au@web ? - da
   * */
  shareKeyword(): void {
    // if (this.selectedKeyword && this.shareForm.valid) {

    this.keywordService.shareKeyword(
      this.selectedKeyword!.id,
      this.userProviderId$.getValue(),
      this.userId$.getValue(),
      this.accessLevel$.getValue()!
    ).subscribe({
      next: () => {
        alert('Keyword shared successfully');
        this.shareForm.reset();
      },
      error: (err) => console.error('Error sharing keyword:', err)
    });
    // }
    
  }

  displayShareKeyword(selectedId?: number) {
    const id = selectedId ?? this.selectedKeyword?.id
    this.selectedKeyword = null;  
    this.selectedKeyword = this.keywords.find(el => el.id === id)!
    this.state = 'SHARE';
  }

  public hexColor(color: number): string {
    return `#${color?.toString(16).padStart(6, '0')}`;
  }

  public accessLevelOnChange(data: number) {
    this.accessLevel$.next(data)
  }
}
// async loadAuthComponent(): Promise<void> {
//   const m = await loadRemoteModule({
//     remoteName: 'au',
//     // remoteEntry: 'https://au2.vercel.app/remoteEntry.js',
//     remoteEntry: 'http://localhost:4204/remoteEntry2.js',
//     // remoteEntry: './assets/mfe/doro/assets/mfe/au/remoteEntry.js',
//     exposedModule: './UserSelectorComponent',
//   });

//   this.viewContainer.createComponent(m.AuthComponent, {
//     injector: Injector.create({
//       providers: [
//         /**
//          * Вытащить отсюда этот компонент
//          * и положить на уровень host'а
//          */
//         {
//           provide: 'components',
//           useValue: {
//             LoadingComponent,
//           },
//           multi: true,
//         },
//       ],
//     }),
//   });
// }