import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NotificationService, Toast } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast(); as toast) {
      <div 
        class="fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white animate-fade-in-out"
        [ngClass]="{
          'bg-red-600': toast.type === 'error',
          'bg-green-600': toast.type === 'success',
          'bg-blue-600': toast.type === 'info'
        }">
        <div class="flex items-center">
          <span class="material-symbols-outlined mr-3">
            {{ toast.type === 'error' ? 'error' : 'info' }}
          </span>
          <p>{{ toast.message }}</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-fade-in-out {
      animation: fadeIn 0.5s, fadeOut 0.5s 3.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private notificationService = inject(NotificationService);
  toast = signal<Toast | null>(null);
  
  constructor() {
    effect((onCleanup) => {
      const currentToast = this.notificationService.toast();
      if (currentToast) {
        this.toast.set(currentToast);
        const timer = setTimeout(() => {
          this.toast.set(null);
          this.notificationService.toast.set(null); // Clear service state
        }, currentToast.duration);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }
}
