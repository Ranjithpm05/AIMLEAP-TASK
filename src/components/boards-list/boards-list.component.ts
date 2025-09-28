import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KanbanService } from '../../services/kanban.service';
import { Board } from '../../models';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-boards-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="p-4 sm:p-6 lg:p-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-100">Boards</h1>
        <p class="text-gray-400 mt-1">Select a board to view its tasks</p>
      </header>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        @if (isLoading()) {
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="flex flex-col bg-[#161B22] p-6 rounded-lg border border-gray-700">
              <div class="flex-grow">
                <app-skeleton height="1.75rem" width="70%" className="mb-3"></app-skeleton>
                <app-skeleton height="1rem" width="90%" className="mb-2"></app-skeleton>
                <app-skeleton height="1rem" width="80%"></app-skeleton>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-700/50 flex flex-wrap gap-x-4 gap-y-2">
                @for(item of [1,2,3,4]; track item) {
                  <div class="flex items-center">
                    <app-skeleton height="1rem" width="1rem" className="mr-2"></app-skeleton>
                    <app-skeleton height="1rem" width="4rem"></app-skeleton>
                  </div>
                }
              </div>
            </div>
          }
        } @else if (error()) {
          <div class="col-span-full text-center py-12 bg-[#161B22] rounded-lg">
            <span class="material-symbols-outlined text-5xl text-red-400">error</span>
            <h3 class="text-xl font-medium text-gray-300 mt-4">Something went wrong</h3>
            <p class="text-gray-500 mt-2">{{ error() }}</p>
          </div>
        } @else if (boards().length > 0) {
          @for (board of boards(); track board.id) {
            <a [routerLink]="['/board', board.id]" class="flex flex-col bg-[#161B22] p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex-grow">
                <h2 class="text-xl font-bold text-gray-200 truncate">{{ board.name }}</h2>
                <p class="text-gray-400 mt-2 text-sm line-clamp-2 h-10">{{ board.description }}</p>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-700/50 flex flex-wrap gap-x-4 gap-y-2">
                @for(column of board.columns; track column.id) {
                  <div class="flex items-center text-sm text-gray-400">
                    <span class="font-medium text-gray-300 mr-1.5">{{ column.cards.length }}</span>
                    <span>{{ column.title }}</span>
                  </div>
                }
              </div>
            </a>
          }
        } @else {
          <div class="col-span-full text-center py-12 bg-[#161B22] rounded-lg">
            <h3 class="text-xl font-medium text-gray-300">No boards found</h3>
            <p class="text-gray-500 mt-2">Get started by creating a new board.</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsListComponent {
  private kanbanService = inject(KanbanService);
  private notificationService = inject(NotificationService);
  boards = signal<Board[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.kanbanService.getBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Could not load boards. Please try again later.');
        this.notificationService.showError(err.message || 'Failed to fetch boards.');
        this.isLoading.set(false);
      },
    });
  }
}