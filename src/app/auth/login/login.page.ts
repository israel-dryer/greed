import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {AuthService} from '../../shared/auth.service';
import {SyncService} from '../../shared/sync.service';
import {addIcons} from 'ionicons';
import {logoGoogle} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonNote,
    IonSpinner,
    IonIcon
  ]
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';
  isSignUp = false;

  constructor() {
    addIcons({logoGoogle});
  }

  async ngOnInit() {
    // If already authenticated, redirect to home
    if (this.authService.isAuthenticated()) {
      await this.router.navigate(['/tabs/home'], {replaceUrl: true});
    }
  }

  async signInWithEmail() {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      if (this.isSignUp) {
        await this.authService.signUpWithEmail(this.email, this.password);
      } else {
        await this.authService.signInWithEmail(this.email, this.password);
      }
      await this.syncService.onUserLogin();
      await this.router.navigate(['/tabs/home'], {replaceUrl: true});
    } catch (err: any) {
      this.error = this.getErrorMessage(err.code);
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    this.error = '';

    try {
      await this.authService.signInWithGoogle();
      await this.syncService.onUserLogin();
      await this.router.navigate(['/tabs/home'], {replaceUrl: true});
    } catch (err: any) {
      this.error = this.getErrorMessage(err.code);
    } finally {
      this.loading = false;
    }
  }

  toggleSignUp() {
    this.isSignUp = !this.isSignUp;
    this.error = '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  continueWithoutAccount() {
    localStorage.setItem('CatanDice.authSkipped', 'true');
    this.router.navigate(['/tabs/home'], {replaceUrl: true});
  }
}
