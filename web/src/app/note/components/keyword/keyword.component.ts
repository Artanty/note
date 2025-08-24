
import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { KeywordService, Keyword, KeywordAccess } from './keyword.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { loadRemoteModule } from '@angular-architects/module-federation';

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
  createKeywordForm: FormGroup;
  editKeywordForm: FormGroup;
  state: 'VIEW' | 'EDIT' | 'CREATE' | "SHARE" = 'CREATE';

  parseInt(value: string, radix = 10): number {
    return parseInt(value, radix);
  }

  public onColorChange(event: Event, isCreateForm: boolean): void {
    const input = event.target as HTMLInputElement;
    const hexValue = input.value.substring(1); // Remove #
    if (isCreateForm) {
      this.createKeywordForm.patchValue({
        color: parseInt(hexValue, 16)
      });  
    } else {
      this.editKeywordForm.patchValue({
        color: parseInt(hexValue, 16)
      });
    }
    
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
    this.createKeywordForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      color: [0x000000, [Validators.required]]
    });
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
    userSelected: this.handleUserSelected.bind(this)
  };

  private handleUserSelected(user: any) {
    console.log('User selected from web component:', user);
    // Add to selected users
    this.userSelectorInputs.selectedUsers = [
      ...this.userSelectorInputs.selectedUsers,
      user
    ];
  }

  async ngOnInit() {
    // const module = await import('http://localhost:4204/remoteEntry2.js');
    // this.userSelectorComponent = module.UserSelectorComponent;
    this.loadKeywords();
    // this.loadAuthComponent()
    // this.loadRemoteApp('http://localhost:4204/remoteEntry2.js')
    console.log(customElements.get('user-selector'))
    console.log(await this.ensureWebComponent('user-selector'))
  }
  async ensureWebComponent(tagName: string): Promise<boolean> {
    // Quick check first
    if (customElements.get(tagName)) return true;
  
    // Wait with polling
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (customElements.get(tagName)) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, 5000);
    });
  }
  async loadRemoteApp(remoteUrl: string) {
    await this.loadScript(remoteUrl);
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }
  
  // onUserSelected(data: any) {
  //   console.log(data)
  // }

  availableUsers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ];

  handleUserSelection(user: any) {
    console.log('User selected:', user);
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
        this.createKeywordForm.patchValue({
          name: keyword.name,
          color: keyword.color
        });
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
    if (this.createKeywordForm.valid) {
      this.keywordService.createKeyword(this.createKeywordForm.value).subscribe({
        next: () => {
          this.loadKeywords();
          this.createKeywordForm.reset();
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
   * нужно ли для загрузки списка пользователей привлекать au@web ?
   * */
  shareKeyword(): void {
    // if (this.selectedKeyword && this.shareForm.valid) {
    //   this.keywordService.shareKeyword(
    //     this.selectedKeyword.id,
    //     this.shareForm.value.user_handle,
    //     this.shareForm.value.access_level,
    //   ).subscribe({
    //     next: () => {
    //       alert('Keyword shared successfully');
    //       this.shareForm.reset();
    //     },
    //     error: (err) => console.error('Error sharing keyword:', err)
    //   });
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
}
