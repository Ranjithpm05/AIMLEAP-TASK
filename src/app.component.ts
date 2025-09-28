/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  template: `
    <main class="h-screen w-screen overflow-hidden flex flex-col">
      <router-outlet></router-outlet>
    </main>
    <app-toast></app-toast>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent],
})
export class AppComponent {}