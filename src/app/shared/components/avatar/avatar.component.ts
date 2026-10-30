import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
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
