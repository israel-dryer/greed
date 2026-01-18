import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
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
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);
  private readonly router = inject(Router);

  email = '';
  loading = false;
  emailSent = false;
  error = '';

  async ngOnInit() {
    // Check if this is a sign-in link
    const url = window.location.href;
    if (this.authService.isSignInLink(url)) {
      this.loading = true;
      try {
        const user = await this.authService.completeSignIn(url);
        if (user) {
          await this.syncService.onUserLogin();
          await this.router.navigate(['/tabs/home'], {replaceUrl: true});
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to sign in';
      } finally {
        this.loading = false;
      }
    }

    // If already authenticated, redirect to home
    if (this.authService.isAuthenticated()) {
      await this.router.navigate(['/tabs/home'], {replaceUrl: true});
    }
  }

  async sendSignInLink() {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      console.log('Sending sign-in link to:', this.email);
      await this.authService.sendSignInLink(this.email);
      console.log('Sign-in link sent successfully');
      this.emailSent = true;
    } catch (err: any) {
      console.error('Error sending sign-in link:', err);
      this.error = err.message || 'Failed to send sign-in link';
    } finally {
      this.loading = false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  continueWithoutAccount() {
    this.router.navigate(['/tabs/home'], {replaceUrl: true});
  }
}
