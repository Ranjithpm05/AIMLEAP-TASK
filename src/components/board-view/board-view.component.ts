import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KanbanService } from '../../services/kanban.service';
import { NotificationService } from '../../services/notification.service';
import { Board, Card, Column as ColumnModel, Label, User } from '../../models';
import { ColumnComponent } from '../column/column.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ColumnComponent,
    SkeletonComponent,
    CardDetailComponent
  ],
  template: `
    <div class="h-full flex flex-col bg-[#0D1117]">
      <!-- Header -->
      <header class="flex-shrink-0 bg-[#161B22] border-b border-gray-700 p-4">
        @if (isLoading()) {
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <app-skeleton height="1.75rem" width="250px"></app-skeleton>
            </div>
            <div class="flex items-center gap-4">
              <app-skeleton height="1.25rem" width="80px"></app-skeleton>
              <app-skeleton height="2rem" width="300px"></app-skeleton>
              <app-skeleton height="2rem" width="200px"></app-skeleton>
            </div>
          </div>
        } @else if (board(); as b) {
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <a routerLink="/" title="Back to Boards" class="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <span class="material-symbols-outlined">arrow_back</span>
                <span>Boards</span>
              </a>
              <span class="text-gray-600">/</span>
              <h1 class="text-xl font-bold text-gray-100">{{ b.name }}</h1>
            </div>

            <div class="flex flex-col md:flex-row md:items-center text-gray-400 gap-4">
              <span class="font-medium shrink-0">Filter by:</span>
              <div class="flex items-center">
                <span class="mr-3 shrink-0">Labels:</span>
                <div class="flex flex-wrap items-center gap-2">
                  @for(label of uniqueLabels(); track label.id) {
                    <button 
                      (click)="toggleLabelFilter(label.id)"
                      [class]="'px-3 py-1 text-sm font-semibold rounded-full transition-all ' + 
                               label.color + 
                               (selectedLabelIds().includes(label.id) ? ' ring-2 ring-offset-2 ring-offset-[#161B22]' : '') +
                               (selectedLabelIds().length > 0 && !selectedLabelIds().includes(label.id) ? ' opacity-50' : '')">
                      {{label.name}}
                    </button>
                  }
                </div>
              </div>
              <div class="flex items-center">
                <span class="mr-3">Assignees:</span>
                 <div class="flex -space-x-2">
                  @for (assignee of uniqueAssignees(); track assignee.id) {
                     <button (click)="toggleAssigneeFilter(assignee.id)">
                        @if(assignee.avatarUrl) {
                          <img [src]="assignee.avatarUrl" [alt]="assignee.name" [title]="assignee.name" 
                              class="w-8 h-8 rounded-full border-2 border-[#161B22] hover:border-blue-500 transition"
                              [class.ring-2]="selectedAssigneeIds().includes(assignee.id)"
                              [class.ring-blue-500]="selectedAssigneeIds().includes(assignee.id)"
                              [class.opacity-50]="selectedAssigneeIds().length > 0 && !selectedAssigneeIds().includes(assignee.id)">
                        }
                     </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </header>

      <!-- Board Canvas -->
      <main class="flex-grow p-4 overflow-x-auto">
        @if (isLoading()) {
          <div class="flex space-x-4">
            @for(item of [1,2,3,4]; track item) {
              <div class="flex-shrink-0 w-80 bg-[#161B22] rounded-lg p-3">
                <app-skeleton height="1.5rem" width="60%" className="mb-4"></app-skeleton>
                <app-skeleton height="6rem" className="mb-3"></app-skeleton>
                <app-skeleton height="4rem"></app-skeleton>
              </div>
            }
          </div>
        } @else if (filteredBoard(); as b) {
           <div class="flex space-x-4 h-full">
            @for (column of b.columns; track column.id) {
              <app-column 
                [column]="column"
                (viewCard)="openCardDetail($event)"
                (cardDropped)="onCardDropped($event)"
                (propagateDragStart)="onDragStart($event)"
                (addCardRequest)="onAddCardRequest(column.id)"></app-column>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <h2 class="text-xl font-medium">Board not found</h2>
            <p class="text-gray-500">The board you are looking for does not exist.</p>
          </div>
        }
      </main>

      <!-- Card Detail Drawer -->
      @if(selectedCard()) {
        <app-card-detail [cardSignal]="selectedCard" (close)="closeCardDetail()" (cardSaved)="onCardSaved($event)"></app-card-detail>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardViewComponent {
  private route = inject(ActivatedRoute);
  private kanbanService = inject(KanbanService);
  private notificationService = inject(NotificationService);

  board = signal<Board | null>(null);
  isLoading = signal(true);
  selectedCard: WritableSignal<Card | null> = signal(null);
  draggedCard = signal<{ card: Card; originalBoardState: Board } | null>(null);

  selectedLabelIds = signal<string[]>([]);
  selectedAssigneeIds = signal<string[]>([]);

  uniqueLabels = computed<Label[]>(() => {
    const labels = new Map<string, Label>();
    this.board()?.columns.forEach(c => c.cards.forEach(card => card.labels.forEach(l => labels.set(l.id, l))));
    return Array.from(labels.values());
  });

  uniqueAssignees = computed<User[]>(() => {
    const assignees = new Map<string, User>();
    this.board()?.columns.forEach(c => c.cards.forEach(card => card.assignees.forEach(a => assignees.set(a.id, a))));
    return Array.from(assignees.values());
  });

  filteredBoard = computed<Board | null>(() => {
    const currentBoard = this.board();
    if (!currentBoard) return null;

    const selectedLabels = this.selectedLabelIds();
    const selectedAssignees = this.selectedAssigneeIds();

    if (selectedLabels.length === 0 && selectedAssignees.length === 0) {
      return currentBoard;
    }

    const filteredColumns = currentBoard.columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => {
        const hasLabel = selectedLabels.length === 0 || card.labels.some(l => selectedLabels.includes(l.id));
        const hasAssignee = selectedAssignees.length === 0 || card.assignees.some(a => selectedAssignees.includes(a.id));
        return hasLabel && hasAssignee;
      })
    }));

    return { ...currentBoard, columns: filteredColumns };
  });

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.isLoading.set(true);
        this.board.set(null);
        return this.kanbanService.getBoard(id!);
      })
    ).subscribe({
      next: board => {
        this.board.set(board);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleLabelFilter(labelId: string) {
    this.selectedLabelIds.update(ids => {
      const index = ids.indexOf(labelId);
      if (index > -1) {
        return [...ids.slice(0, index), ...ids.slice(index + 1)];
      } else {
        return [...ids, labelId];
      }
    });
  }

  toggleAssigneeFilter(assigneeId: string) {
    this.selectedAssigneeIds.update(ids => {
      const index = ids.indexOf(assigneeId);
      if (index > -1) {
        return [...ids.slice(0, index), ...ids.slice(index + 1)];
      } else {
        return [...ids, assigneeId];
      }
    });
  }

  openCardDetail(card: Card) {
    this.selectedCard.set(card);
  }

  closeCardDetail() {
    this.selectedCard.set(null);
  }

  onDragStart(card: Card) {
    const currentBoard = this.board();
    if (currentBoard) {
      const boardStateCopy = JSON.parse(JSON.stringify(currentBoard));
      this.draggedCard.set({ card, originalBoardState: boardStateCopy });
    }
  }

  onCardDropped(toColumnId: string) {
    const dragInfo = this.draggedCard();
    if (!dragInfo) return;

    const { card, originalBoardState } = dragInfo;
    const fromColumnId = card.columnId;

    if (fromColumnId === toColumnId) {
        this.draggedCard.set(null);
        return;
    }

    this.board.update(currentBoard => {
      if (!currentBoard) return null;
      const board = JSON.parse(JSON.stringify(currentBoard));
      const fromColumn = board.columns.find((c: ColumnModel) => c.id === fromColumnId);
      const toColumn = board.columns.find((c: ColumnModel) => c.id === toColumnId);
      if (fromColumn && toColumn) {
        const cardIndex = fromColumn.cards.findIndex((c: Card) => c.id === card.id);
        if (cardIndex > -1) {
          const [movedCard] = fromColumn.cards.splice(cardIndex, 1);
          movedCard.columnId = toColumnId;
          toColumn.cards.push(movedCard);
        }
      }
      return board;
    });

    this.kanbanService.moveCard(card.id, toColumnId, fromColumnId).subscribe({
      error: () => {
        this.notificationService.showError('Failed to move card. Reverting.');
        this.board.set(originalBoardState);
      },
      complete: () => {
        this.draggedCard.set(null);
      }
    });
  }

  onAddCardRequest(columnId: string) {
    const newCard: Card = {
      id: '', // Empty ID signifies a new card
      title: '',
      description: '',
      columnId: columnId,
      assignees: [],
      labels: [],
      dueDate: null,
      commentCount: 0
    };
    this.selectedCard.set(newCard);
  }
  
  onCardSaved(savedCard: Card) {
    this.board.update(board => {
      if (!board) return null;
      
      const newBoard = JSON.parse(JSON.stringify(board));
      const column = newBoard.columns.find((c: ColumnModel) => c.id === savedCard.columnId);

      if (column) {
          const cardIndex = column.cards.findIndex((c: Card) => c.id === savedCard.id);
          if (cardIndex > -1) {
            // It's an update to an existing card
            column.cards[cardIndex] = savedCard;
          } else {
            // It's a new card, add it to the beginning of the column
            column.cards.unshift(savedCard);
          }
      }
      return newBoard;
    });
    this.closeCardDetail();
  }
}