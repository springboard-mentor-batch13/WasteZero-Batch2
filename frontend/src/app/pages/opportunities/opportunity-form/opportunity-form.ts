import { Component, Input, OnInit, inject } from '@angular/core';
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

import { OPPORTUNITY_CATEGORIES, Opportunity, OpportunityCategory, OpportunityDraft } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './opportunity-form.html',
  styleUrl: './opportunity-form.css'
})
export class OpportunityForm implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';

  private readonly fb = inject(FormBuilder);
  private readonly opportunities = inject(OpportunityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = OPPORTUNITY_CATEGORIES;
  readonly today = new Date();
  loading = false;
  opportunityId?: number;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    category: ['' as OpportunityCategory | '', Validators.required],
    description: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    location: ['', Validators.required],
    eventDate: [null as Date | null, Validators.required],
    requiredVolunteers: [null as number | null, [Validators.required, Validators.min(1)]],
    skillsRequired: ['']
  });

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'edit' ? 'edit' : this.mode;
    if (this.mode !== 'edit') return;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const opportunity = this.opportunities.getById(id);
    if (!opportunity) {
      this.showMessage('Unable to complete action.');
      this.router.navigate(['/opportunities']);
      return;
    }
    this.opportunityId = id;
    this.form.patchValue({ ...opportunity, eventDate: this.toLocalDate(opportunity.eventDate), skillsRequired: opportunity.skillsRequired.join(', ') });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage('Invalid form.');
      return;
    }
    this.loading = true;
    window.setTimeout(() => {
      try {
        const draft = this.toDraft();
        const result = this.mode === 'create'
          ? this.opportunities.create(draft)
          : this.opportunities.update(this.opportunityId!, draft);
        if (!result) throw new Error('Opportunity not found');
        this.showMessage(this.mode === 'create' ? 'Opportunity created successfully.' : 'Opportunity updated successfully.');
        this.form.reset();
        this.router.navigate(['/opportunities']);
      } catch {
        this.showMessage('Unable to complete action.');
      } finally {
        this.loading = false;
      }
    }, 350);
  }

  cancel(): void { this.router.navigate(['/opportunities']); }

  hasError(controlName: string, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  errorMessage(controlName: string): string {
    const control = this.form.get(controlName) as AbstractControl;
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('minlength')) return `Enter at least ${control.getError('minlength').requiredLength} characters.`;
    if (control.hasError('maxlength')) return `Enter no more than ${control.getError('maxlength').requiredLength} characters.`;
    if (control.hasError('min')) return 'Enter a number greater than 0.';
    return '';
  }

  private toDraft(): OpportunityDraft {
    const value = this.form.getRawValue();
    return {
      title: value.title.trim(), category: value.category as OpportunityCategory, description: value.description.trim(),
      location: value.location.trim(), eventDate: this.toIsoDate(value.eventDate!), requiredVolunteers: Number(value.requiredVolunteers),
      skillsRequired: value.skillsRequired.split(',').map((skill) => skill.trim()).filter(Boolean)
    };
  }

  private toIsoDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  private toLocalDate(date: string): Date { const [year, month, day] = date.split('-').map(Number); return new Date(year, month - 1, day); }
  private showMessage(message: string): void { this.snackBar.open(message, 'Close', { duration: 3500 }); }
}
