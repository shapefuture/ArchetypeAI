
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app.component';
import { AUTH_PORT } from './app/core/ports/auth.port';
import { STORAGE_PORT } from './app/core/ports/storage.port';
import { FirebaseAuthAdapter } from './app/core/adapters/firebase-auth.adapter';
import { FirebaseStorageAdapter } from './app/core/adapters/firebase-storage.adapter';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: AUTH_PORT, useClass: FirebaseAuthAdapter },
    { provide: STORAGE_PORT, useClass: FirebaseStorageAdapter },
  ],
}).catch(err => console.error(err));
