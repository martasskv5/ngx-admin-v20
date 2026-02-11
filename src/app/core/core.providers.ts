import {
  EnvironmentProviders,
  importProvidersFrom,
  Provider,
} from "@angular/core";
import { MAT_RIPPLE_GLOBAL_OPTIONS } from "@angular/material/core";
import { NbAuthModule } from "@nebular/auth";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import { NbApiAuthStrategy } from "./auth/auth.strategy";
import { NbRoleProvider, NbSecurityModule } from "@nebular/security";
import { of } from "rxjs";
import {
  CountryOrderData,
  EarningData,
  ElectricityData,
  OrdersChartData,
  OrdersProfitChartData,
  ProfitBarAnimationChartData,
  ProfitChartData,
  SecurityCamerasData,
  SmartTableData,
  SolarData,
  StatsBarData,
  StatsProgressBarData,
  TemperatureHumidityData,
  TrafficBarData,
  TrafficChartData,
  TrafficListData,
  UserActivityData,
  UserData,
  VisitorsAnalyticsData,
} from "./data";

import {
  AnalyticsService,
  LayoutService,
  PlayerService,
  SeoService,
  StateService,
} from "./utils";

import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbThemeModule,
  NbToastrModule,
  NbWindowModule,
} from "@nebular/theme";
import { NgxEchartsModule } from "ngx-echarts";
import {
  CountryOrderService,
  EarningService,
  ElectricityService,
  OrdersChartService,
  OrdersProfitChartService,
  ProfitBarAnimationChartService,
  ProfitChartService,
  provideMockData,
  SecurityCamerasService,
  SmartTableService,
  SolarService,
  StatsBarService,
  StatsProgressBarService,
  TemperatureHumidityService,
  TrafficBarService,
  TrafficChartService,
  TrafficListService,
  UserActivityService,
  UserService,
  VisitorsAnalyticsService,
} from "./mock";
import { RippleService } from "./utils/ripple.service";

// const socialLinks = [
//   {
//     url: "https://github.com/akveo/nebular",
//     target: "_blank",
//     icon: "github",
//   },
//   {
//     url: "https://www.facebook.com/akveo/",
//     target: "_blank",
//     icon: "facebook",
//   },
//   {
//     url: "https://twitter.com/akveo_inc",
//     target: "_blank",
//     icon: "twitter",
//   },
// ];

const DATA_SERVICES = [
  { provide: UserData, useClass: UserService },
  { provide: ElectricityData, useClass: ElectricityService },
  { provide: SmartTableData, useClass: SmartTableService },
  { provide: UserActivityData, useClass: UserActivityService },
  { provide: OrdersChartData, useClass: OrdersChartService },
  { provide: ProfitChartData, useClass: ProfitChartService },
  { provide: TrafficListData, useClass: TrafficListService },
  { provide: EarningData, useClass: EarningService },
  { provide: OrdersProfitChartData, useClass: OrdersProfitChartService },
  { provide: TrafficBarData, useClass: TrafficBarService },
  {
    provide: ProfitBarAnimationChartData,
    useClass: ProfitBarAnimationChartService,
  },
  { provide: TemperatureHumidityData, useClass: TemperatureHumidityService },
  { provide: SolarData, useClass: SolarService },
  { provide: TrafficChartData, useClass: TrafficChartService },
  { provide: StatsBarData, useClass: StatsBarService },
  { provide: CountryOrderData, useClass: CountryOrderService },
  { provide: StatsProgressBarData, useClass: StatsProgressBarService },
  { provide: VisitorsAnalyticsData, useClass: VisitorsAnalyticsService },
  { provide: SecurityCamerasData, useClass: SecurityCamerasService },
  { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useExisting: RippleService },
  NbApiAuthStrategy,
];

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return of("guest");
  }
}

export function providerCore(): (Provider | EnvironmentProviders)[] {
  return [
    provideMockData(),
    ...DATA_SERVICES,
    importProvidersFrom(
      NgxEchartsModule.forRoot({
        echarts: () => import("echarts"),
      }),
      NbEvaIconsModule,
      NbThemeModule.forRoot({ name: "default" }),
      NbSidebarModule.forRoot(),
      NbMenuModule.forRoot(),
      NbDatepickerModule.forRoot(),
      NbDialogModule.forRoot(),
      NbWindowModule.forRoot(),
      NbToastrModule.forRoot(),
      NbChatModule.forRoot({
        messageGoogleMapKey: "AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY",
      }),
      NbAuthModule.forRoot({
        strategies: [
          NbApiAuthStrategy.setup({
            name: "email",
          }),
        ],
        forms: {
          login: {
            socialLinks: [] // You can add social links here if needed,
          },
          register: {
            socialLinks: [] // You can add social links here if needed,
          },
        },
      }),
      NbSecurityModule.forRoot({
        accessControl: {
          guest: {
            view: "*",
          },
          user: {
            parent: "guest",
            create: "*",
            edit: "*",
            remove: "*",
          },
        },
      })
    ),
    {
      provide: NbRoleProvider,
      useClass: NbSimpleRoleProvider,
    },
    AnalyticsService,
    LayoutService,
    PlayerService,
    SeoService,
    StateService,
  ];
}
