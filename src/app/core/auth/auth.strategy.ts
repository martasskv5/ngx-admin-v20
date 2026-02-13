import { inject } from '@angular/core';
import { NbAuthStrategy, NbAuthResult } from '@nebular/auth';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, AuthResponse, LoginRequest, RegisterRequest, ResetPasswordRequest, RegisterResponse } from './auth.service';

export class NbApiAuthStrategy extends NbAuthStrategy {
    private readonly authService = inject(AuthService);

    static setup(options: any): [typeof NbApiAuthStrategy, any] {
        return [NbApiAuthStrategy, options];
    }

    authenticate(data?: any): Observable<NbAuthResult> {
        return this.login(data);
    }

    login(data?: any): Observable<NbAuthResult> {
        const credentials: LoginRequest = {
            email: data?.email,
            password: data?.password,
        };

        return this.authService.login(credentials).pipe(
            map((response: AuthResponse) => {
                // Save the access token
                this.authService.saveToken(response.accessToken);

                // Decode the JWT token to extract user information
                const decodedToken = this.authService.decodeToken(response.accessToken);

                // Extract user info from token claims
                const user = {
                    email: decodedToken?.email || decodedToken?.sub || credentials.email,
                    id: decodedToken?.sub || decodedToken?.nameid,
                    firstName: decodedToken?.given_name,
                    lastName: decodedToken?.family_name,
                    name: decodedToken?.name
                };

                this.authService.saveUser(user);

                return new NbAuthResult(
                    true,
                    response,
                    '/pages',
                    null,
                    ['Successfully logged in']
                );
            }),
            catchError((error) => {
                const errorMessage =
                    error?.status === 401
                        ? 'Invalid email or password'
                        : error?.error?.message || 'Login failed';
                return of(
                    new NbAuthResult(
                        false,
                        error,
                        null,
                        [errorMessage]
                    )
                );
            })
        );
    }

    register(data?: any): Observable<NbAuthResult> {
        const registrationData: RegisterRequest = {
            email: data?.email,
            password: data?.password,
            firstName: data?.firstName,
            lastName: data?.lastName,
        };

        return this.authService.register(registrationData).pipe(
            map((response: RegisterResponse) => {
                // Save the access token
                // this.authService.saveToken(response.accessToken);

                // // Decode the JWT token to extract user information
                // const decodedToken = this.authService.decodeToken(response.accessToken);

                // // Extract user info from token claims
                // const user = {
                //     email: decodedToken?.email || decodedToken?.sub || registrationData.email,
                //     id: decodedToken?.sub || decodedToken?.nameid,
                //     firstName: decodedToken?.given_name || registrationData.firstName,
                //     lastName: decodedToken?.family_name || registrationData.lastName,
                //     name: decodedToken?.name
                // };

                // this.authService.saveUser(user);

                return new NbAuthResult(
                    true,
                    response,
                    '/auth/verify-email?email=' + registrationData.email,
                    null,
                    ['Successfully registered']
                );
            }),
            catchError((error) => {
                const errorMessage = error?.error?.message || 'Registration failed';
                return of(
                    new NbAuthResult(
                        false,
                        error,
                        null,
                        [errorMessage]
                    )
                );
            })
        );
    }

    logout(): Observable<NbAuthResult> {
        this.authService.logout();
        return of(
            new NbAuthResult(true, null, '/auth/login', null, 'Successfully logged out')
        );
    }

    getToken(): Observable<any> {
        const tokenString = this.authService.getToken();
        return of(tokenString);
    }

    refreshToken(data?: any): Observable<NbAuthResult> {
        return of(
            new NbAuthResult(true, null, '/', null, 'Token refreshed')
        );
    }

    requestPassword(data?: any): Observable<NbAuthResult> {
        return this.authService.requestPassword(data?.email).pipe(
            map(() =>
                new NbAuthResult(
                    true,
                    null,
                    null,
                    ['Reset password email sent']
                )
            ),
            catchError((error) => {
                const errorMessage = error?.error?.message || 'Request password failed';
                return of(new NbAuthResult(false, error, null, [errorMessage]));
            })
        );
    }

    resetPassword(data?: any): Observable<NbAuthResult> {
        const resetData: ResetPasswordRequest = {
            email: data?.email,
            token: data?.token,
            password: data?.password,
        };

        return this.authService.resetPassword(resetData).pipe(
            map(() =>
                new NbAuthResult(
                    true,
                    null,
                    '/auth/login',
                    ['Password successfully reset']
                )
            ),
            catchError((error) => {
                const errorMessage = error?.error?.message || 'Reset password failed';
                return of(new NbAuthResult(false, error, null, [errorMessage]));
            })
        );
    }
}
