import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  toast = signal<Toast | null>(null);
  
  showError(message: string, duration = 4000) {
    this.toast.set({ message, type: 'error', duration });
  }
}
