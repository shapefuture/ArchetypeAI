import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

export interface AuthPort {
  signInAnonymously(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signInWithGoogleRedirect(): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(email: string, password: string): Promise<void>;
  linkAnonymousToGoogle(): Promise<void>;
  linkAnonymousToGoogleRedirect(): Promise<void>;
  linkAnonymousToEmail(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  readonly user$: Observable<User | null>;
  readonly isAuthenticated$: Observable<boolean>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
