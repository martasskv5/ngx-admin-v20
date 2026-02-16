import { Routes } from "@angular/router";

import { Setup } from "./setup/setup";
import { Verify } from "./verify/verify";

export const twoFactorRoutes: Routes = [
    {
        path: "setup",
        component: Setup
    },
    {
        path: "verify",
        component: Verify
    }
];