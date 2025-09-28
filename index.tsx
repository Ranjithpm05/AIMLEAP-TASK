/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {AppComponent} from './src/app.component';
import { provideRouter, withHashLocation } from '@angular/router';
import { APP_ROUTES } from './src/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation())
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.