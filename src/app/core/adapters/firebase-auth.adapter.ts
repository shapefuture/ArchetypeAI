import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { getAuth, Auth, onAuthStateChanged, signInAnonymously as firebaseSignInAnonymously, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, linkWithPopup, linkWithRedirect, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { AuthPort, User } from '../ports/auth.port';
import { getFirebaseApp } from '../../../environments/firebase-init';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthAdapter implements AuthPort {

  private auth: Auth;
  private userSubject = new BehaviorSubject<User | null>(null);

  readonly user$: Observable<User | null> = this.userSubject.asObservable();
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.auth = getAuth(getFirebaseApp());

    // Resolve pending redirect auth results if present.
    // User state is propagated via onAuthStateChanged below.
    getRedirectResult(this.auth).catch(() => {});

    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
        };
        this.userSubject.next(user);
        (this.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
      } else {
        this.userSubject.next(null);
        (this.isAuthenticated$ as BehaviorSubject<boolean>).next(false);
      }
    });
  }

  async signInAnonymously(): Promise<void> {
    await firebaseSignInAnonymously(this.auth);
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signInWithGoogleRedirect(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUpWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async linkAnonymousToGoogle(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user to link');
    }
    const provider = new GoogleAuthProvider();
    await linkWithPopup(currentUser, provider);
  }

  async linkAnonymousToGoogleRedirect(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user to link');
    }
    const provider = new GoogleAuthProvider();
    // NOTE: must use linkWithRedirect (not signInWithRedirect) — the first arg is a User, not an Auth.
    await linkWithRedirect(currentUser, provider);
  }

  async linkAnonymousToEmail(email: string, password: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user to link');
    }
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(currentUser, credential);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
