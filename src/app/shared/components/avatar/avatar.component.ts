import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar-container"
      [class.size-sm]="size() === 'sm'"
      [class.size-md]="size() === 'md'"
      [class.size-lg]="size() === 'lg'"
      [class.size-xl]="size() === 'xl'"
      [style.background-color]="bgColor()"
    >
      @if (src()) {
        <img [src]="src()" [alt]="name()" (error)="onImgError()" />
      } @else {
        <span class="initials">{{ initials() }}</span>
      }
    </div>
  `,
  styles: [`
    .avatar-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      overflow: hidden;
      flex-shrink: 0;
      user-select: none;
      font-weight: 700;
      color: #ffffff;
      background: #1cc29f;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.size-sm {
        width: 28px;
        height: 28px;
        font-size: 0.75rem;
      }

      &.size-md {
        width: 38px;
        height: 38px;
        font-size: 0.9rem;
      }

      &.size-lg {
        width: 50px;
        height: 50px;
        font-size: 1.15rem;
      }

      &.size-xl {
        width: 68px;
        height: 68px;
        font-size: 1.5rem;
      }
    }
  `],
})
export class AvatarComponent {
  src = input<string | undefined>();
  name = input<string>('User');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  hasImgError = false;

  onImgError(): void {
    this.hasImgError = true;
  }

  initials(): string {
    const n = this.name().trim();
    if (!n) return 'U';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }

  bgColor(): string {
    const colors = ['#1cc29f', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < this.name().length; i++) {
      hash = this.name().charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }
}
