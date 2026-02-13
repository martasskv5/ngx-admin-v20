import { ChangeDetectionStrategy, Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NbCardModule, NbAlertModule, NbButtonModule, NbIconModule } from '@nebular/theme';

import { AuthService } from '../auth.service';

@Component({
    selector: 'ngx-verify-email',
    standalone: true,
    imports: [CommonModule, NbCardModule, NbAlertModule, NbButtonModule, NbIconModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrl: './verify-email.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    readonly email = signal<string>('');
    readonly isLoading = signal(false);
    readonly resendSuccess = signal(false);

    constructor() {
        effect(() => {
            // Read email from query params when route activates
            this.route.queryParamMap.subscribe((params) => {
                const emailParam = params.get('email');
                if (emailParam) {
                    this.email.set(emailParam);
                }
            });
        });
    }


    onResendEmail(): void {
        this.isLoading.set(true);
        // Call your auth service to resend verification email
        this.authService.resendVerificationEmail(this.email()).subscribe({
          next: () => {
            this.resendSuccess.set(true);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
    }
}