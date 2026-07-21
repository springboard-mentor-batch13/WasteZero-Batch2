export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface VolunteerApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  postedByName: string;
  volunteerUserId: string;
  volunteerName: string;
  volunteerEmail: string;
  appliedDate: string;
  status: ApplicationStatus;
}

export interface VolunteerApplicationRequest {
  opportunityId: string;
  opportunityTitle: string;
  postedByName: string;
  volunteerUserId: string;
  volunteerName: string;
  volunteerEmail: string;
  appliedDate: string;
}
