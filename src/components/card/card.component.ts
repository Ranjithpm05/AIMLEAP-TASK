import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card } from '../../models';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (card(); as card) {
      <div
        (click)="view.emit()"
        (dragstart)="onDragStart($event)"
        (dragend)="onDragEnd($event)"
        draggable="true"
        class="bg-[#21262D] rounded-md border border-gray-700 p-3 mb-3 cursor-pointer hover:border-gray-500 transition-all duration-200">
        
        <div class="flex flex-wrap gap-1.5 mb-2">
          @for (label of card.labels; track label.id) {
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full" [class]="label.color">
              {{ label.name }}
            </span>
          }
        </div>

        <p class="font-medium text-gray-300 mb-3">{{ card.title }}</p>
        
        <div class="flex items-center justify-between">
          <div class="flex -space-x-2">
            @for (assignee of card.assignees; track assignee.id) {
              @if(assignee.avatarUrl) {
                <img [src]="assignee.avatarUrl" [alt]="assignee.name" [title]="assignee.name" class="w-7 h-7 rounded-full border-2 border-[#161B22]">
              } @else {
                <div class="w-7 h-7 rounded-full bg-blue-900 text-blue-300 border-2 border-[#161B22] flex items-center justify-center font-bold text-xs" [title]="assignee.name">
                  {{ assignee.name.charAt(0) }}
                </div>
              }
            }
          </div>

          <div class="flex items-center text-gray-500 text-sm space-x-3">
            @if(card.dueDate) {
              <div class="flex items-center" [class.text-red-400]="isOverdue()" [title]="'Due on ' + (card.dueDate | date:'longDate')">
                <span class="material-symbols-outlined !text-base mr-1">event</span>
                <span>{{ card.dueDate | date:'MMM d' }}</span>
              </div>
            }
            @if(card.commentCount > 0) {
              <div class="flex items-center">
                <span class="material-symbols-outlined !text-base mr-1">chat_bubble_outline</span>
                <span>{{ card.commentCount }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  card = input.required<Card>();
  view = output<void>();
  dragStart = output<Card>();

  isOverdue = computed(() => {
    const card = this.card();
    if (!card?.dueDate) {
      return false;
    }
    // Parse YYYY-MM-DD to create date in local timezone at midnight to avoid timezone issues
    const parts = card.dueDate.split('-').map(Number);
    const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  });

  onDragStart(event: DragEvent) {
    const cardData = this.card();
    if (event.dataTransfer && cardData) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', cardData.id);
      this.dragStart.emit(cardData);
      // Add class to the dragged element itself
      (event.target as HTMLElement).classList.add('dragging-card');
    }
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging-card');
  }
}