import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-app-storage',
  templateUrl: './app-storage.page.html',
  styleUrls: ['./app-storage.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AppStoragePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
