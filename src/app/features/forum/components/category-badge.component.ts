import { Component, input } from '@angular/core';
import { ForumCategory } from '../../../core/models/forum-thread.model';

const CATEGORY_CONFIG: Record<ForumCategory, { label: string; color: string; bg: string }> = {
  GENERAL: { label: 'General', color: '#6b7280', bg: '#f3f4f6' },
  FEEDBACK: { label: 'Feedback', color: '#2563eb', bg: '#dbeafe' },
  WRITING_TIPS: { label: 'Consejos', color: '#16a34a', bg: '#dcfce7' },
  WORLD_BUILDING: { label: 'Worldbuilding', color: '#7c3aed', bg: '#ede9fe' },
  CHARACTERS: { label: 'Personajes', color: '#ea580c', bg: '#ffedd5' },
  SHOWCASE: { label: 'Showcase', color: '#ca8a04', bg: '#fef9c3' },
  ANNOUNCEMENTS: { label: 'Anuncios', color: '#dc2626', bg: '#fee2e2' },
  HELP: { label: 'Ayuda', color: '#0891b2', bg: '#cffafe' },
  OFF_TOPIC: { label: 'Off-topic', color: '#9ca3af', bg: '#f9fafb' },
};

@Component({
  selector: 'app-category-badge',
  standalone: true,
  template: `
    <span
      class="badge"
      [style.color]="config().color"
      [style.background]="config().bg"
      [style.borderColor]="config().color"
    >
      {{ config().label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
      white-space: nowrap;
      line-height: 1.4;
    }
  `],
})
export class CategoryBadgeComponent {
  readonly category = input.required<ForumCategory>();

  config() {
    return CATEGORY_CONFIG[this.category()] ?? CATEGORY_CONFIG['GENERAL'];
  }
}
