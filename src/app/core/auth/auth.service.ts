import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email?: string;
    resetCode: string;
    newPassword: string;
}

export interface AuthResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
    name: string;
    twoFactorEnabled: boolean;
}

export interface RegisterResponse {
    message: string;
    userId?: string;
    email?: string;
    name?: string;
}

export interface MFASetupResponse {
    secretKey: string;
    qrCodeUri: string;
    qrCodeBase64: string;
    message: string;
}

export interface MFAValidateRequest {
    secretKey: string;
    code: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly authUrl = '/api/Auth';

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.authUrl}/login`, credentials);
    }

    register(data: RegisterRequest): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.authUrl}/register`, data);
    }

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    getToken(): string | null {
        const token = localStorage.getItem('authToken');
        return token ? token.trim() : null;
    }

    saveToken(token: string): void {
        if (!token) {
            console.warn('Attempted to save empty token');
            return;
        }
        // Trim whitespace and validate JWT format
        const cleanToken = token.trim();
        if (!cleanToken.includes('.') || cleanToken.split('.').length !== 3) {
            console.error('Invalid JWT format:', cleanToken);
            return;
        }
        console.log('Saving token with length:', cleanToken.length);
        localStorage.setItem('authToken', cleanToken);
    }

    saveUser(user: any): void {
        try {
            localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
            console.error('Failed to save user data to localStorage', e);
        }
    }

    decodeToken(token: string): any {
        try {
            if (!token || typeof token !== 'string') {
                console.warn('Invalid token provided');
                return null;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                console.warn('Token does not have 3 parts');
                return null;
            }

            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Failed to decode token', e);
            return null;
        }
    }

    getUser(): any {
        const user = localStorage.getItem('user');
        if (!user) {
            return null;
        }
        try {
            return JSON.parse(user);
        } catch (e) {
            console.error('Failed to parse user data from localStorage', e);
            localStorage.removeItem('user');
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    requestPassword(email: string): Observable<void> {
        return this.http.post<void>(`${this.authUrl}/forgotPassword`, { email });
    }

    resetPassword(data: ResetPasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.authUrl}/resetPassword`, data);
    }

    resendVerificationEmail(email: string): Observable<void> {
        return this.http.post<void>(`${this.authUrl}/resendVerificationEmail`, { email });
    }

    mfaSetup(): Observable<MFASetupResponse> {
        return this.http.get<MFASetupResponse>(`${this.authUrl}/2fa/setup`);
    }

    mfaValidate(data: MFAValidateRequest): Observable<void> {
        return this.http.post<void>(`${this.authUrl}/2fa/validate`, data);
    }

    mfaDisable(): Observable<void> {
        return this.http.post<void>(`${this.authUrl}/2fa/disable`, {});
    }

    mfaStatus(): Observable<{ twoFactorEnabled: boolean; requiresSetup: boolean; message: string }> {
        return this.http.get<{ twoFactorEnabled: boolean; requiresSetup: boolean; message: string }>(`${this.authUrl}/2fa/status`);
    }
}
