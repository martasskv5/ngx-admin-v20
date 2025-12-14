import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatRipple } from "@angular/material/core";
import { NbSecurityModule } from "@nebular/security";
import {
  NbActionsModule,
  NbButtonModule,
  NbContextMenuModule,
  NbIconModule,
  NbMediaBreakpointsService,
  NbMenuService,
  NbSearchModule,
  NbSelectModule,
  NbSidebarService,
  NbThemeService,
  NbUserModule,
} from "@nebular/theme";

import { UserData } from "@app/core/data/users";
import { LayoutService } from "@app/core/utils";
import { AuthService } from "@app/core/auth/auth.service";

import { Subject } from "rxjs";
import { filter, map, takeUntil, tap } from "rxjs/operators";
import { Router } from "@angular/router";

@Component({
  selector: "ngx-header",
  styleUrls: ["./header.component.scss"],
  templateUrl: "./header.component.html",
  imports: [
    NbUserModule,
    NbContextMenuModule,
    NbIconModule,
    NbSelectModule,
    NbActionsModule,
    NbSecurityModule,
    NbSearchModule,
    NbButtonModule,
    MatRipple,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  user: any;
  isMaterialTheme = false;

  themes = [
    {
      value: "default",
      name: "Light",
    },
    {
      value: "dark",
      name: "Dark",
    },
    {
      value: "cosmic",
      name: "Cosmic",
    },
    {
      value: "corporate",
      name: "Corporate",
    },
    {
      value: "material-light",
      name: "Material Light",
    },
    {
      value: "material-dark",
      name: "Material Dark",
    },
  ];

  currentTheme = "default";

  userMenu = [{ title: "Profile" }, { title: "Log out" }];

  constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private userService: UserData,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load saved theme from localStorage or use default
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    this.currentTheme = savedTheme;
    
    if (savedTheme !== this.themeService.currentTheme) {
      this.themeService.changeTheme(savedTheme);
    }

    // Get authenticated user from auth service
    const authenticatedUser = this.authService.getUser();
    const isAuth = this.authService.isAuthenticated();
    
    if (authenticatedUser && isAuth) {
      const firstName = authenticatedUser.firstName || '';
      const lastName = authenticatedUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      this.user = {
        name: fullName || authenticatedUser.email,
        id: authenticatedUser.id
      };
    } else {
      // Fallback to mock user if not authenticated
      this.userService
        .getUsers()
        .pipe(takeUntil(this.destroy$))
        .subscribe((users: any) => (this.user = users.nick));
    }

    // Listen for user menu clicks
    this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-context-menu'),
        map(({ item: { title } }) => title),
        takeUntil(this.destroy$)
      )
      .subscribe((title) => {
        if (title === 'Log out') {
          this.logout();
        } else if (title === 'Profile') {
          // Handle profile navigation if needed
        }
      });

    this.themeService
      .onThemeChange()
      .pipe(
        map(({ name }) => name),
        tap((theme) => {
          const themeName = theme?.name || "";
          this.isMaterialTheme = themeName.startsWith("material");
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((themeName) => (this.currentTheme = themeName));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
    localStorage.setItem('selectedTheme', themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, "menu-sidebar");
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
}
