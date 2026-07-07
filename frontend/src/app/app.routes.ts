import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

import { Dashboard } from './pages/dashboard/dashboard';
import { MyProfile } from './pages/my-profile/my-profile';
import { EditProfile } from './pages/edit-profile/edit-profile';

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
  }
];