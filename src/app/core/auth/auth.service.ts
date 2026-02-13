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
    token: string;
    password: string;
}

export interface AuthResponse {
    tokenType: string;
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
}

export interface RegisterResponse {
    message: string;
    userId?: string;
    email?: string;
    name?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api';

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
    }

    register(data: RegisterRequest): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
    }

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    getToken(): string | null {
        return localStorage.getItem('authToken');
    }

    saveToken(token: string): void {
        localStorage.setItem('authToken', token);
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
        return this.http.post<void>(`${this.apiUrl}/forgotPassword`, { email });
    }

    resetPassword(data: ResetPasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/resetPassword`, data);
    }
}
