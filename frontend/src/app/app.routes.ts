import { Routes } from "@angular/router";

import { authGuard } from "./core/auth.guard";
import { DashboardComponent } from "./modules/dashboard/components/dashboard.component";
import { LoginComponent } from "./modules/auth/components/login.component";
import { RegisterComponent } from "./modules/auth/components/register.component";
import { MapViewComponent } from "./modules/map/components/map-view.component";
import { ProfileComponent } from "./modules/profile/components/profile.component";
import { ReportsComponent } from "./modules/reports/components/reports.component";

export const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: "map", component: MapViewComponent, canActivate: [authGuard] },
  { path: "reports", component: ReportsComponent, canActivate: [authGuard] },
  { path: "profile", component: ProfileComponent, canActivate: [authGuard] },
  { path: "**", redirectTo: "" },
];
