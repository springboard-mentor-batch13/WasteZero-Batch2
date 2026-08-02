import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

import { MyApplicationsComponent } from './pages/applications/my-applications/my-applications';
import { Dashboard } from './pages/dashboard/dashboard';
import { MyProfile } from './pages/my-profile/my-profile';
import { EditProfile } from './pages/edit-profile/edit-profile';

import { OtpVerification } from './auth/otp-verification/otp-verification';

import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { VerifyResetOtp } from './pages/verify-reset-otp/verify-reset-otp';
import { ResetPassword } from './pages/reset-password/reset-password';
import { OpportunityForm } from './pages/opportunities/opportunity-form/opportunity-form';
import { OpportunityList } from './pages/opportunities/opportunity-list/opportunity-list';
import { OpportunityDetail } from './pages/opportunities/opportunity-detail/opportunity-detail';
import { opportunityManagerGuard } from './core/guards/opportunity-manager-guard';
import { ApplicationsComponent } from './pages/applications/admin-applications';
import { adminGuard } from './core/guards/admin-guard';

import { Messages } from './pages/messages/messages';
import { NgoPickupRequests } from './pages/pickups/ngo-pickup-requests/ngo-pickup-requests';
import { SchedulePickup } from './pages/pickups/schedule-pickup/schedule-pickup';

// Kavipriya - Notification System
import { NotificationList } from './pages/notifications/notification-list/notification-list';
import { NotificationDetail } from './pages/notifications/notification-detail/notification-detail';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent,
    title: 'Login | WasteZero'
  },

  {
    path: 'register',
    component: RegisterComponent,
    title: 'Register | WasteZero'
  },

  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'my-profile',
    component: MyProfile
  },

  {
    path: 'edit-profile',
    component: EditProfile
  },

  // Gaytri - Registration OTP
  {
    path: 'otp-verification',
    component: OtpVerification,
    title: 'OTP Verification | WasteZero'
  },


  // Arati - Forgot Password Flow
  {
    path: 'forgot-password',
    component: ForgotPassword
  },

  {
    path: 'verify-reset-otp',
    component: VerifyResetOtp
  },

  {
    path: 'reset-password',
    component: ResetPassword
  },

  // Kavipriya - NGO Opportunity CRUD
  {
    path: 'opportunities',
    component: OpportunityList,
    title: 'Opportunities | WasteZero'
  },
  {
    path: 'opportunities/create',
    component: OpportunityForm,
    canActivate: [opportunityManagerGuard],
    title: 'Create Opportunity | WasteZero'
  },
  {
    path: 'opportunities/:id/edit',
    component: OpportunityForm,
    canActivate: [opportunityManagerGuard],
    title: 'Edit Opportunity | WasteZero',
    data: { mode: 'edit' }
  },
  {
    path: 'opportunities/:id',
    component: OpportunityDetail,
    title: 'Opportunity Details | WasteZero'
  },
  {
  path: 'my-applications',
  component: MyApplicationsComponent,
  title: 'My Applications | WasteZero'
},
  {
    path: 'admin/applications',
    component: ApplicationsComponent,
    canActivate: [adminGuard],
    title: 'Applications | WasteZero'
  },

{
  path: 'messages',
  component: Messages,
  title: 'Messages | WasteZero'
},

{
  path: 'schedule-pickup',
  component: SchedulePickup,
  title: 'Schedule Pickup | WasteZero'
},

{
  path: 'ngo/pickup-requests',
  component: NgoPickupRequests,
  title: 'NGO Pickup Requests | WasteZero'
},

// Kavipriya - Notification System
{
  path: 'notifications',
  component: NotificationList,
  title: 'Notifications | WasteZero'
},
{
  path: 'notifications/:id',
  component: NotificationDetail,
  title: 'Notification Details | WasteZero'
}

];
