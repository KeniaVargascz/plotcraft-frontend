import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FollowModel } from '../../../../core/models/follow.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-suggestion-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './suggestion-list.component.html',
  styleUrl: './suggestion-list.component.scss',
})
export class SuggestionListComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) suggestions!: FollowModel[];
  @Input() max = 4;
  @Output() follow = new EventEmitter<string>();
  @Output() unfollow = new EventEmitter<string>();

  readonly followedUsers = signal<Set<string>>(new Set());
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  get visibleSuggestions() {
    return this.suggestions.slice(0, this.max);
  }

  getInitial(suggestion: FollowModel): string {
    return (suggestion.displayName || suggestion.username).slice(0, 1).toUpperCase();
  }

  isFollowed(username: string): boolean {
    return this.followedUsers().has(username);
  }

  onFollow(username: string) {
    this.followedUsers.update((set) => new Set(set).add(username));
    this.follow.emit(username);
    this.cdr.markForCheck();

    const timer = setTimeout(() => {
      this.timers.delete(username);
      this.cdr.markForCheck();
    }, 4000);
    this.timers.set(username, timer);
  }

  onUndo(username: string) {
    const timer = this.timers.get(username);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(username);
    }
    this.followedUsers.update((set) => {
      const next = new Set(set);
      next.delete(username);
      return next;
    });
    this.unfollow.emit(username);
    this.cdr.markForCheck();
  }
}
