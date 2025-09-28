import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div [style.width]="width()" [style.height]="height()" [class]="'bg-gray-700 rounded animate-pulse ' + className()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
  className = input<string>('');
}