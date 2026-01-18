import {Injectable, signal} from '@angular/core';
import {
  User,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut
} from 'firebase/auth';
import {auth} from './firebase';

const EMAIL_STORAGE_KEY = 'CatanDice.emailForSignIn';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      this.loading.set(false);
    });
  }

  async sendSignInLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to complete sign-in when user returns
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  }

  async completeSignIn(url: string): Promise<User | null> {
    if (!isSignInWithEmailLink(auth, url)) {
      return null;
    }

    let email = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!email) {
      // User opened link on different device - prompt for email
      email = window.prompt('Please provide your email for confirmation');
    }

    if (!email) {
      throw new Error('Email is required to complete sign-in');
    }

    const result = await signInWithEmailLink(auth, email, url);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    return result.user;
  }

  isSignInLink(url: string): boolean {
    return isSignInWithEmailLink(auth, url);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  isAuthenticated(): boolean {
    return this.user() !== null;
  }

  getUserId(): string | null {
    return this.user()?.uid ?? null;
  }

  getUserEmail(): string | null {
    return this.user()?.email ?? null;
  }
}
