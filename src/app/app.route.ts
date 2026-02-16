import { Routes } from "@angular/router";
import {
  NbAuthComponent,
  NbLoginComponent,
  NbLogoutComponent,
  NbRegisterComponent,
  NbRequestPasswordComponent,
  NbResetPasswordComponent,
} from "@nebular/auth";
import { VerifyEmailComponent } from "./core/auth/verify-email.component/verify-email.component";
import { SuccessComponent } from "./core/auth/success.component/success.component";
import { authGuard } from "./core/auth/auth.guard";

export const appRoutes: Routes = [
  {
    path: "pages",
    canActivate: [authGuard],
    loadChildren: () => import("./pages/pages.route").then((m) => m.pageRoutes),
  },
  {
    path: "auth",
    component: NbAuthComponent,
    children: [
      {
        path: "",
        component: NbLoginComponent,
      },
      {
        path: "login",
        component: NbLoginComponent,
      },
      {
        path: "register",
        component: NbRegisterComponent,
      },
      {
        path: "logout",
        component: NbLogoutComponent,
      },
      {
        path: "request-password",
        component: NbRequestPasswordComponent,
      },
      {
        path: "reset-password",
        component: NbResetPasswordComponent,
      },
      {
        path: "verify-email",
        component: VerifyEmailComponent,
      },
      {
        path: "success",
        component: SuccessComponent,
      },
      {
        path: "2fa",
        loadChildren: () => import("./core/auth/2fa/2fa.routes").then((r) => r.twoFactorRoutes),
      }
    ],
  },
  { path: "", redirectTo: "pages", pathMatch: "full" },
  { path: "**", redirectTo: "pages" },
];
