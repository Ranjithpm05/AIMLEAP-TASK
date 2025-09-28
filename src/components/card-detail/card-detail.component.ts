import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, WritableSignal, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KanbanService } from '../../services/kanban.service';
import { Card, Comment, Label, User } from '../../models';
import { NotificationService } from '../../services/notification.service';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent],
  template: `
    @if (card(); as c) {
      <div class="fixed inset-0 bg-black/60 z-40" (click)="close.emit()"></div>
      <div class="fixed inset-x-0 bottom-0 sm:top-0 sm:right-0 sm:left-auto rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl bg-[#161B22] shadow-2xl z-50 flex flex-col text-gray-300 w-full h-auto max-h-[95vh] sm:h-full sm:max-h-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        
        <!-- Handle for mobile bottom sheet -->
        <div class="w-12 h-1.5 bg-gray-600 rounded-full mx-auto my-2 sm:hidden flex-shrink-0"></div>

        <header class="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 class="text-xl font-semibold">{{ isNewCard() ? 'Create New Card' : 'Card Details' }}</h2>
          <button (click)="close.emit()" class="text-gray-400 hover:text-white" aria-label="Close">
             <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <main class="relative flex-grow p-6 overflow-y-auto">
          @if (isSaving()) {
            <div class="absolute inset-0 bg-[#161B22]/80 z-10 flex flex-col items-center justify-center">
              <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p class="mt-4 text-lg">{{ isNewCard() ? 'Creating card...' : 'Saving changes...' }}</p>
            </div>
          }
          <!-- Card Edit Form -->
          <form [formGroup]="cardForm" id="card-form" (ngSubmit)="saveCard()">
            <div class="mb-6">
              <label for="title" class="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input type="text" id="title" formControlName="title" class="w-full bg-[#0D1117] border-gray-600 rounded-md shadow-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div class="mb-6">
              <label for="description" class="block text-sm font-medium text-gray-400 mb-1">Description</label>
              <textarea id="description" formControlName="description" rows="4" class="w-full bg-[#0D1117] border-gray-600 rounded-md shadow-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
             <div class="mb-6">
                <label for="dueDate" class="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                <input type="date" id="dueDate" formControlName="dueDate" class="w-full bg-[#0D1117] border-gray-600 rounded-md shadow-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500" style="color-scheme: dark;" />
            </div>

            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-400 mb-2">Assignees</h4>
              <div class="flex flex-wrap gap-2">
                @if (isUsersLoading()) {
                  @for (_ of [1,2,3,4]; track $index) {
                    <app-skeleton height="2rem" width="2rem" className="rounded-full"></app-skeleton>
                  }
                } @else {
                  @for(user of allUsers(); track user.id) {
                    <button type="button" (click)="toggleAssignee(user)" class="rounded-full transition-all" [class.ring-2]="isAssigneeSelected(user)" [class.ring-blue-500]="isAssigneeSelected(user)">
                      <img [src]="user.avatarUrl" [alt]="user.name" [title]="user.name" class="w-8 h-8 rounded-full">
                    </button>
                  }
                }
              </div>
            </div>

            <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-400 mb-2">Labels</h4>
                <div class="flex flex-wrap gap-2">
                  @if (isLabelsLoading()) {
                    <app-skeleton height="1.75rem" width="60px" className="rounded-full"></app-skeleton>
                    <app-skeleton height="1.75rem" width="80px" className="rounded-full"></app-skeleton>
                    <app-skeleton height="1.75rem" width="50px" className="rounded-full"></app-skeleton>
                  } @else {
                    @for(label of allLabels(); track label.id) {
                        <button
                            type="button"
                            (click)="toggleLabel(label)"
                            class="px-3 py-1 text-xs font-semibold rounded-full flex items-center transition-all"
                            [class]="label.color"
                            [class.ring-2]="isLabelSelected(label)"
                            [class.ring-offset-2]="isLabelSelected(label)"
                            [class.ring-offset-[#161B22]]="isLabelSelected(label)">
                            {{label.name}}
                            @if(isLabelSelected(label)) {
                                <span class="material-symbols-outlined !text-sm ml-1.5">check</span>
                            }
                        </button>
                    }
                  }
                </div>
            </div>
          </form>

          <!-- Comments Section (only for existing cards) -->
          @if(!isNewCard()) {
            <div class="mt-8">
              <h3 class="text-lg font-semibold mb-3">Comments</h3>
              <div class="space-y-4 max-h-64 overflow-y-auto pr-2">
                @for (comment of comments(); track comment.id) {
                  <div class="flex items-start">
                    @if(comment.user.avatarUrl) {
                      <img [src]="comment.user.avatarUrl" [alt]="comment.user.name" class="w-8 h-8 rounded-full mr-3 flex-shrink-0">
                    } @else {
                      <div class="w-8 h-8 rounded-full bg-green-900 text-green-300 border-2 border-gray-700 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0" [title]="comment.user.name">
                        {{ comment.user.name.charAt(0) }}
                      </div>
                    }
                    <div class="flex-grow">
                      <p class="font-semibold text-sm text-gray-200">{{ comment.user.name }} <span class="text-xs text-gray-500 font-normal ml-2">{{ comment.timestamp | date:'short' }}</span></p>
                      <p class="text-gray-300">{{ comment.text }}</p>
                    </div>
                  </div>
                }
              </div>

              <!-- New Comment Form -->
              <form [formGroup]="commentForm" (ngSubmit)="postComment()" class="mt-4 flex items-start">
                <div class="w-8 h-8 rounded-full bg-blue-900 text-blue-300 border-2 border-gray-700 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0" title="Alex">A</div>
                <div class="flex-grow">
                  <textarea formControlName="text" rows="2" placeholder="Write a comment..." class="w-full bg-[#0D1117] border-gray-600 rounded-md shadow-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500"></textarea>
                  <button type="submit" [disabled]="commentForm.invalid" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Post</button>
                </div>
              </form>
            </div>
          }
        </main>

        <footer class="flex justify-end p-4 border-t border-gray-700 bg-[#0D1117] space-x-3 flex-shrink-0">
          <button type="button" (click)="close.emit()" class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Cancel</button>
          <button type="submit" form="card-form" [disabled]="cardForm.invalid || isSaving()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
            <span>{{ isNewCard() ? 'Create Card' : 'Save Changes' }}</span>
          </button>
        </footer>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDetailComponent implements OnDestroy {
  cardSignalInput = input.required<WritableSignal<Card | null>>({ alias: 'cardSignal' });
  close = output<void>();
  cardSaved = output<Card>();

  private kanbanService = inject(KanbanService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private commentsSub: Subscription | null = null;
  
  card = signal<Card | null>(null);
  comments = signal<Comment[]>([]);
  isSaving = signal(false);
  isNewCard = computed(() => !this.card()?.id);
  
  allUsers = signal<User[]>([]);
  allLabels = signal<Label[]>([]);
  isUsersLoading = signal(true);
  isLabelsLoading = signal(true);

  cardForm: FormGroup;
  commentForm: FormGroup;
  
  constructor() {
    this.cardForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: [''],
    });

    this.commentForm = this.fb.group({
      text: ['', Validators.required]
    });
    
    // Sync input with local, editable signal
    effect(() => {
      const inputCard = this.cardSignalInput()();
      this.card.set(inputCard ? JSON.parse(JSON.stringify(inputCard)) : null);
    });

    effect(() => {
        const currentCard = this.card();
        if (currentCard) {
            this.cardForm.patchValue({
                ...currentCard,
                dueDate: currentCard.dueDate ? formatDate(currentCard.dueDate, 'yyyy-MM-dd', 'en-US') : ''
            });
            if (!this.isNewCard()) {
              this.loadComments(currentCard.id);
            } else {
              this.comments.set([]);
            }
        } else {
            this.commentsSub?.unsubscribe();
        }
    });

    this.kanbanService.getUsers().subscribe(users => {
      this.allUsers.set(users);
      this.isUsersLoading.set(false);
    });
    this.kanbanService.getLabels().subscribe(labels => {
      this.allLabels.set(labels);
      this.isLabelsLoading.set(false);
    });
  }

  toggleAssignee(assignee: User) {
    this.card.update(card => {
      if (!card) return null;

      const formValues = this.cardForm.getRawValue();
      const newAssignees = [...card.assignees];
      const index = newAssignees.findIndex(a => a.id === assignee.id);

      if (index > -1) {
        newAssignees.splice(index, 1);
      } else {
        newAssignees.push(assignee);
      }
      
      return { 
        ...card, 
        ...formValues,
        assignees: newAssignees
      };
    });
  }

  isAssigneeSelected(assignee: User): boolean {
    return this.card()?.assignees.some(a => a.id === assignee.id) ?? false;
  }
  
  toggleLabel(label: Label) {
    this.card.update(card => {
      if (!card) return null;
      
      const formValues = this.cardForm.getRawValue();
      const newLabels = [...card.labels];
      const index = newLabels.findIndex(l => l.id === label.id);

      if (index > -1) {
        newLabels.splice(index, 1);
      } else {
        newLabels.push(label);
      }

      return { 
        ...card, 
        ...formValues,
        labels: newLabels
      };
    });
  }

  isLabelSelected(label: Label): boolean {
    return this.card()?.labels.some(l => l.id === label.id) ?? false;
  }

  loadComments(cardId: string) {
    this.kanbanService.getComments(cardId).subscribe(initialComments => {
        this.comments.set(initialComments);

        this.commentsSub?.unsubscribe();
        this.commentsSub = this.kanbanService.getCommentsStream(cardId).subscribe(newComment => {
            this.comments.update(current => [...current, newComment]);
        });
    });
  }

  postComment() {
    if (this.commentForm.invalid) return;
    const currentCard = this.card();
    if (!currentCard) return;

    const text = this.commentForm.value.text!;
    this.kanbanService.postComment(currentCard.id, text).subscribe(newComment => {
        this.comments.update(current => [...current, newComment]);
        this.commentForm.reset();
    });
  }

  saveCard() {
    if (this.cardForm.invalid || this.isSaving()) return;
    const currentCard = this.card();
    if (!currentCard) return;

    this.isSaving.set(true);

    const formValues = this.cardForm.value;
    const cardPayload: Card = {
      ...currentCard,
      title: formValues.title,
      description: formValues.description,
      dueDate: formValues.dueDate || null,
    };

    const serviceCall = this.isNewCard()
      ? this.kanbanService.addCard(cardPayload)
      : this.kanbanService.updateCard(cardPayload);

    serviceCall.subscribe({
      next: (savedCard) => {
        this.cardSaved.emit(savedCard);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.showError(err.message || 'An unknown error occurred.');
        this.isSaving.set(false);
      },
    });
  }

  ngOnDestroy() {
    this.commentsSub?.unsubscribe();
  }
}