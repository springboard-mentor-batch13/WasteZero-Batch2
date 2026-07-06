
import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { MyProfile } from './pages/my-profile/my-profile';
import { EditProfile } from './pages/edit-profile/edit-profile';

export const routes: Routes = [
  {
  path: 'my-profile',
  component: MyProfile
},
  {
    path: 'edit-profile',
    component: EditProfile
  },

];