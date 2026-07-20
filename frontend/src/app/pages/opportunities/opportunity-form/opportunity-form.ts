import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { OPPORTUNITY_STATE_CITIES, OPPORTUNITY_STATUSES, Opportunity, OpportunityDraft, OpportunityStatus } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './opportunity-form.html',
  styleUrl: './opportunity-form.css'
})
export class OpportunityForm implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;
  @Input() mode: 'create' | 'edit' = 'create';

  private readonly fb = inject(FormBuilder);
  private readonly opportunities = inject(OpportunityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly statuses = OPPORTUNITY_STATUSES;
  readonly stateCities = OPPORTUNITY_STATE_CITIES;
  readonly states = OPPORTUNITY_STATE_CITIES.map((option) => option.state);
  readonly today = new Date();
  readonly acceptedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  readonly maxImageSize = 5 * 1024 * 1024;
  loading = false;
  opportunityId?: string;
  selectedImageFile?: File;
  imagePreviewUrl?: string;
  isDraggingImage = false;
  private serviceOwnedPreview = false;
  private imageRemoved = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    status: ['' as OpportunityStatus | '', Validators.required],
    description: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    state: ['', Validators.required],
    city: ['', Validators.required],
    date: [null as Date | null, Validators.required],
    duration: ['', Validators.required],
    requiredSkills: ['']
  });

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'edit' ? 'edit' : this.mode;
    if (this.mode !== 'edit') return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.opportunities.getById(id).subscribe({
      next: (opportunity) => {
        this.opportunityId = id;
        this.form.patchValue({
          ...opportunity,
          status: this.toOpportunityStatus(opportunity.status),
          date: opportunity.date,
          requiredSkills: opportunity.requiredSkills.join(', ')
        });
        this.imagePreviewUrl = opportunity.imageUrl;
        this.serviceOwnedPreview = !!opportunity.imageUrl;
      },
      error: (error) => {
        console.error('Failed to load opportunity:', error);
        this.showMessage('Unable to load opportunity.');
        this.router.navigate(['/opportunities']);
      }
    });
  }

  ngOnDestroy(): void {
    this.revokeImagePreview();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage('Invalid form.');
      return;
    }
    this.loading = true;
    const draft = this.toDraft();
    const request = this.mode === 'create'
      ? this.opportunities.create(draft)
      : this.opportunities.update(this.opportunityId!, draft);
    request.subscribe({
      next: () => {
        this.showMessage(this.mode === 'create' ? 'Opportunity created successfully.' : 'Opportunity updated successfully.');
        this.form.reset();
        this.router.navigate(['/opportunities']);
      },
      error: (error) => {
        console.error('Failed to save opportunity:', error);
        this.showMessage(error.error?.message || 'Unable to complete action.');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  cancel(): void { this.router.navigate(['/opportunities']); }

  onStateSelectionChange(): void {
    this.form.controls.city.setValue('');
  }

  browseImage(): void {
    this.imageInput?.nativeElement.click();
  }

  replaceImage(): void {
    this.browseImage();
  }

  removeImage(): void {
    this.selectedImageFile = undefined;
    this.revokeImagePreview();
    this.serviceOwnedPreview = false;
    this.imageRemoved = true;
    if (this.imageInput) this.imageInput.nativeElement.value = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.handleImageFile(file);
    input.value = '';
  }

  onImageDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImage = true;
  }

  onImageDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImage = false;
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImage = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleImageFile(file);
  }

  imageFileSize(): string {
    return this.selectedImageFile ? this.formatFileSize(this.selectedImageFile.size) : '';
  }

  hasError(controlName: string, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  errorMessage(controlName: string): string {
    const control = this.form.get(controlName) as AbstractControl;
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('minlength')) return `Enter at least ${control.getError('minlength').requiredLength} characters.`;
    if (control.hasError('maxlength')) return `Enter no more than ${control.getError('maxlength').requiredLength} characters.`;
    return '';
  }

  citiesForSelectedState(): string[] {
    const selectedState = this.form.controls.state.value;
    return this.stateCities.find((option) => option.state === selectedState)?.cities ?? [];
  }

  private toDraft(): OpportunityDraft {
    const value = this.form.getRawValue();
    return {
      title: value.title.trim(),
      status: value.status as OpportunityStatus,
      description: value.description.trim(),
      state: value.state,
      city: value.city,
      date: value.date!,
      duration: value.duration.trim(),
      requiredSkills: value.requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
      imageFile: this.selectedImageFile,
      imageUrl: this.serviceOwnedPreview ? this.imagePreviewUrl : undefined,
      removeImage: this.imageRemoved
    };
  }

  private handleImageFile(file: File): void {
    if (!this.acceptedImageTypes.includes(file.type)) {
      this.showMessage('Only JPG, PNG and WEBP images are allowed.');
      return;
    }
    if (file.size > this.maxImageSize) {
      this.showMessage('Maximum file size is 5 MB.');
      return;
    }

    this.selectedImageFile = file;
    this.revokeImagePreview();
    this.imagePreviewUrl = URL.createObjectURL(file);
    this.serviceOwnedPreview = false;
    this.imageRemoved = false;
  }

  private revokeImagePreview(): void {
    if (!this.imagePreviewUrl) return;
    if (!this.serviceOwnedPreview) URL.revokeObjectURL(this.imagePreviewUrl);
    this.imagePreviewUrl = undefined;
  }

  private formatFileSize(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private toOpportunityStatus(status: string): OpportunityStatus { return this.statuses.includes(status as OpportunityStatus) ? status as OpportunityStatus : 'Open'; }
  private showMessage(message: string): void { this.snackBar.open(message, 'Close', { duration: 3500 }); }
}
