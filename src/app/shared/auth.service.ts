import {Injectable, signal} from '@angular/core';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {auth} from './firebase';

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

  async signInWithEmail(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
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
