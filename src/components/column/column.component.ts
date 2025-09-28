import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Card as CardModel, Column } from '../../models';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    @if (column(); as col) {
      <div 
        class="flex-shrink-0 w-72 sm:w-80 bg-[#161B22] rounded-lg p-3 flex flex-col"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.drop-zone-active]="isDragOver()">
        
        <div class="flex justify-between items-center mb-4 px-1 flex-shrink-0">
          <h3 class="font-semibold text-gray-200">{{ col.title }}</h3>
          <span class="text-sm font-medium bg-gray-700 text-gray-300 rounded-full px-2.5 py-0.5">
            {{ col.cards.length }}
          </span>
        </div>

        <div class="flex-grow min-h-[100px] overflow-y-auto pr-1 -mr-1">
          @for(card of col.cards; track card.id) {
            <app-card [card]="card" (view)="viewCard.emit(card)" (dragStart)="propagateDragStart.emit($event)"></app-card>
          }
          @if(col.cards.length === 0 && !isDragOver()) {
            <div class="text-center py-4 text-gray-500 text-sm">No tasks here.</div>
          }
        </div>

        <div class="flex-shrink-0 pt-2">
            <button (click)="addCardRequest.emit()" class="w-full text-left text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 p-2 rounded-md flex items-center text-sm">
                <span class="material-symbols-outlined !text-base mr-2">add</span>
                Add Card
            </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnComponent {
  column = input.required<Column>();
  viewCard = output<CardModel>();
  cardDropped = output<string>(); // Outputs columnId
  propagateDragStart = output<CardModel>(); // Re-emits from card
  addCardRequest = output<void>();

  isDragOver = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const columnData = this.column();
    if (columnData) {
        this.cardDropped.emit(columnData.id);
    }
  }
}