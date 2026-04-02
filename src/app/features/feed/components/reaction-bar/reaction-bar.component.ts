import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ReactionsService } from '../../../../core/services/reactions.service';
import { PostModel } from '../../../../core/models/post.model';
import { ReactionType } from '../../../../core/models/reaction.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reaction-bar',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './reaction-bar.component.html',
  styleUrl: './reaction-bar.component.scss',
})
export class ReactionBarComponent {
  private readonly reactionsService = inject(ReactionsService);
  readonly authService = inject(AuthService);

  @Input({ required: true }) post!: PostModel;
  @Output() postChange = new EventEmitter<PostModel>();

  readonly loading = signal(false);
  readonly reactionOptions: Array<{ type: ReactionType; emoji: string }> = [
    { type: 'LIKE', emoji: '❤' },
    { type: 'LOVE', emoji: '✨' },
    { type: 'FIRE', emoji: '🔥' },
    { type: 'CLAP', emoji: '👏' },
  ];

  toggle(reactionType: ReactionType = 'LIKE') {
    if (!this.authService.isAuthenticated() || this.loading()) {
      return;
    }

    this.loading.set(true);

    this.reactionsService.toggle(this.post.id, reactionType).subscribe({
      next: (response) => {
        const previousType = this.post.viewerContext?.reactionType ?? null;
        const summary = { ...this.post.stats.reactionsSummary };

        if (previousType) {
          summary[previousType] = Math.max(0, summary[previousType] - 1);
        }

        if (response.reacted && response.reactionType) {
          summary[response.reactionType] += 1;
        }

        this.postChange.emit({
          ...this.post,
          stats: {
            ...this.post.stats,
            reactionsCount: response.newCount,
            reactionsSummary: summary,
          },
          viewerContext: this.post.viewerContext
            ? {
                ...this.post.viewerContext,
                hasReacted: response.reacted,
                reactionType: response.reactionType,
              }
            : null,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
