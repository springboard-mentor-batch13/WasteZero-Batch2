import { Injectable } from '@angular/core';

import { Opportunity, OpportunityDraft } from './opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private nextId = 1;
  private opportunities: Opportunity[] = [];

  // TODO: Replace these in-memory methods with backend API calls when available.
  // TODO:
  // Replace local image preview with backend upload
  // POST /api/opportunities/upload
  // Backend will upload to Cloudinary
  // Backend returns imageUrl
  // Store imageUrl inside Opportunity model
  getAll(): Opportunity[] {
    return this.opportunities.map((opportunity) => this.copy(opportunity));
  }

  getById(id: number): Opportunity | undefined {
    const opportunity = this.opportunities.find((item) => item.id === id);
    return opportunity ? this.copy(opportunity) : undefined;
  }

  create(draft: OpportunityDraft): Opportunity {
    const opportunity = this.toOpportunity(draft, this.nextId++);
    this.opportunities = [...this.opportunities, opportunity];
    return this.copy(opportunity);
  }

  update(id: number, draft: OpportunityDraft): Opportunity | undefined {
    const index = this.opportunities.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    this.revokeImagePreview(this.opportunities[index], draft.imageFile, draft.removeImage);
    const opportunity = this.toOpportunity(draft, id, this.opportunities[index]);
    this.opportunities = this.opportunities.map((item, itemIndex) => itemIndex === index ? opportunity : item);
    return this.copy(opportunity);
  }

  delete(id: number): boolean {
    const opportunity = this.opportunities.find((item) => item.id === id);
    this.revokeImagePreview(opportunity);
    const initialLength = this.opportunities.length;
    this.opportunities = this.opportunities.filter((item) => item.id !== id);
    return this.opportunities.length !== initialLength;
  }

  private copy(opportunity: Opportunity): Opportunity {
    return { ...opportunity, skillsRequired: [...opportunity.skillsRequired] };
  }

  private toOpportunity(draft: OpportunityDraft, id: number, previous?: Opportunity): Opportunity {
    const { removeImage, ...opportunityDraft } = draft;
    const hasNewImage = !!opportunityDraft.imageFile && opportunityDraft.imageFile !== previous?.imageFile;
    const imagePreviewUrl = removeImage
      ? undefined
      : hasNewImage
        ? URL.createObjectURL(opportunityDraft.imageFile!)
        : previous?.imagePreviewUrl;

    return {
      ...opportunityDraft,
      id,
      imagePreviewUrl,
      imageFile: removeImage ? undefined : opportunityDraft.imageFile,
      skillsRequired: [...opportunityDraft.skillsRequired]
    };
  }

  private revokeImagePreview(opportunity?: Opportunity, replacementFile?: File, removeImage = false): void {
    if (!opportunity?.imagePreviewUrl || (!removeImage && replacementFile === opportunity.imageFile)) return;
    URL.revokeObjectURL(opportunity.imagePreviewUrl);
  }
}
