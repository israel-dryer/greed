import {Component, OnInit} from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {


  ngOnInit() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (prefersDark.matches) {
      EdgeToEdge.setBackgroundColor({color: '#1f1f1f'}).then();
    } else {
      EdgeToEdge.setBackgroundColor({color: '#fff'}).then();
    }

    prefersDark.addEventListener('change', (mediaQuery) => {
      if (mediaQuery.matches) {
        EdgeToEdge.setBackgroundColor({color: '#1f1f1f'}).then();
      } else {
        EdgeToEdge.setBackgroundColor({color: '#fff'}).then();
      }
    });
  }
}
