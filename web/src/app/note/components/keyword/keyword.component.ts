
import { Component, OnInit } from '@angular/core';
import { KeywordService, Keyword, KeywordAccess } from './keyword.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-keyword',
  templateUrl: './keyword.component.html',
  styleUrl: './keyword.component.scss',
})
export class KeywordComponent implements OnInit {
  keywords: Keyword[] = [];
  selectedKeyword: Keyword | null = null;
  userHandle = 'current_user'; // Replace with actual user handling
  isEditing = false;
  shareForm: FormGroup;
  keywordForm: FormGroup;

  parseInt(value: string, radix = 10): number {
    return parseInt(value, radix);
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const hexValue = input.value.substring(1); // Remove #
    this.keywordForm.patchValue({
      color: parseInt(hexValue, 16)
    });
  }

  constructor(
    private keywordService: KeywordService,
    private fb: FormBuilder
  ) {
    this.keywordForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      color: [0x000000, [Validators.required]]
    });

    this.shareForm = this.fb.group({
      user_handle: ['', Validators.required],
      access_level: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadKeywords();
  }

  loadKeywords(): void {
    this.keywordService.getAllKeywords().subscribe({
      next: (keywords) => this.keywords = keywords,
      error: (err) => console.error('Error loading keywords:', err)
    });
  }

  selectKeyword(keyword: Keyword): void {
    this.selectedKeyword = keyword;
    this.isEditing = false;
    this.keywordForm.patchValue({
      name: keyword.name,
      color: keyword.color
    });
  }

  createKeyword(): void {
    if (this.keywordForm.valid) {
      this.keywordService.createKeyword(this.keywordForm.value, this.userHandle).subscribe({
        next: () => {
          this.loadKeywords();
          this.keywordForm.reset();
        },
        error: (err) => console.error('Error creating keyword:', err)
      });
    }
  }

  updateKeyword(): void {
    if (this.selectedKeyword && this.keywordForm.valid) {
      this.keywordService.updateKeyword(
        this.selectedKeyword.id,
        this.keywordForm.value,
        this.userHandle
      ).subscribe({
        next: () => {
          this.loadKeywords();
          this.selectedKeyword = null;
        },
        error: (err) => console.error('Error updating keyword:', err)
      });
    }
  }

  deleteKeyword(id: number): void {
    // if (confirm('Are you sure you want to delete this keyword?')) {
    this.keywordService.deleteKeyword(id, this.userHandle).subscribe({
      next: () => this.loadKeywords(),
      error: (err) => console.error('Error deleting keyword:', err)
    });
    // }
  }

  shareKeyword(): void {
    if (this.selectedKeyword && this.shareForm.valid) {
      this.keywordService.shareKeyword(
        this.selectedKeyword.id,
        this.shareForm.value.user_handle,
        this.shareForm.value.access_level,
        this.userHandle
      ).subscribe({
        next: () => {
          alert('Keyword shared successfully');
          this.shareForm.reset();
        },
        error: (err) => console.error('Error sharing keyword:', err)
      });
    }
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.selectedKeyword = null;
    this.keywordForm.reset();
  }

  hexColor(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
