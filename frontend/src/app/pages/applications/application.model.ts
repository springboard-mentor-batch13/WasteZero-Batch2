export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface VolunteerApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  appliedDate: string;
}

export interface VolunteerApplicationRequest {
  opportunityId: string;
}

export interface VolunteerApplicationCheck {
  applied: boolean;
  application?: VolunteerApplication;
}
