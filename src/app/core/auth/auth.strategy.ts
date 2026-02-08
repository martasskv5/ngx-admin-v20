import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { NbAuthStrategy, NbAuthResult } from '@nebular/auth';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, AuthResponse, LoginRequest, RegisterRequest } from './auth.service';

export class NbApiAuthStrategy extends NbAuthStrategy {
  private readonly http = inject(HttpClient);
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
      map((response: AuthResponse) => {
        // Save the access token
        this.authService.saveToken(response.accessToken);
        
        // Decode the JWT token to extract user information
        const decodedToken = this.authService.decodeToken(response.accessToken);
        
        // Extract user info from token claims
        const user = {
          email: decodedToken?.email || decodedToken?.sub || registrationData.email,
          id: decodedToken?.sub || decodedToken?.nameid,
          firstName: decodedToken?.given_name || registrationData.firstName,
          lastName: decodedToken?.family_name || registrationData.lastName,
          name: decodedToken?.name
        };
        
        this.authService.saveUser(user);
        
        return new NbAuthResult(
          true,
          response,
          '/pages',
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

  resetPassword(data?: any): Observable<NbAuthResult> {
    return of(
      new NbAuthResult(false, null, null, null, 'Reset password not implemented')
    );
  }

  requestPassword(data?: any): Observable<NbAuthResult> {
    return of(
      new NbAuthResult(false, null, null, null, 'Request password not implemented')
    );
  }
}
