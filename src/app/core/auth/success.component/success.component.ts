import { ChangeDetectionStrategy, Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NbCardModule, NbAlertModule, NbButtonModule, NbIconModule } from '@nebular/theme';

@Component({
    selector: 'ngx-auth-success',
    imports: [
        CommonModule,
        RouterModule,
        NbCardModule,
        NbAlertModule,
        NbButtonModule,
        NbIconModule
    ],
    templateUrl: './success.component.html',
    styleUrl: './success.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessComponent {

}
