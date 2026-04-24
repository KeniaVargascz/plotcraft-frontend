import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VotesService, ChapterVoteResponse } from '../../../core/services/votes.service';

@Component({
  selector: 'app-vote-button',
  standalone: true,
  imports: [],
  templateUrl: './vote-button.component.html',
  styleUrl: './vote-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteButtonComponent {
  private readonly votesService = inject(VotesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() chapterId!: string;
  @Input() votesCount = 0;
  @Input() hasVoted = false;
  @Input() disabled = false;
  @Output() voted = new EventEmitter<ChapterVoteResponse>();

  readonly loading = signal(false);

  toggleVote() {
    if (this.disabled || this.loading()) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.loading.set(true);
    const previousState = this.hasVoted;
    const previousCount = this.votesCount;

    // Optimistic update
    this.hasVoted = !this.hasVoted;
    this.votesCount += this.hasVoted ? 1 : -1;

    const action = previousState
      ? this.votesService.removeVote(this.chapterId)
      : this.votesService.castVote(this.chapterId);

    action.subscribe({
      next: (response) => {
        this.votesCount = response.votesCount;
        this.hasVoted = response.hasVoted;
        this.loading.set(false);
        this.voted.emit(response);
      },
      error: () => {
        this.hasVoted = previousState;
        this.votesCount = previousCount;
        this.loading.set(false);
      },
    });
  }
}
