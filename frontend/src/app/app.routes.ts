import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

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

import { OpportunityList } from './pages/opportunities/opportunity-list/opportunity-list';
import { OpportunityDetails } from './pages/opportunities/opportunity-details/opportunity-details';



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
    title: 'Create Opportunity | WasteZero'
  },
  {
    path: 'opportunities/:id/edit',
    component: OpportunityForm,
    title: 'Edit Opportunity | WasteZero',
    data: { mode: 'edit' }
  },
  {
    path: 'opportunities/:id',
    component: OpportunityDetail,
    title: 'Opportunity Details | WasteZero'
  }
];
