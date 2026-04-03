import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumPoll } from '../../../core/models/forum-poll.model';
import { ForumService } from '../../../core/services/forum.service';

@Component({
  selector: 'app-poll-widget',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="poll-card">
      <h4 class="question">{{ poll().question }}</h4>

      @if (mode() === 'vote') {
        <div class="options">
          @for (opt of poll().options; track opt.id) {
            <label class="option-label">
              <input
                type="radio"
                [name]="'poll-' + poll().id"
                [value]="opt.id"
                [(ngModel)]="selectedOption"
              />
              {{ opt.text }}
            </label>
          }
        </div>
        <button
          type="button"
          class="vote-btn"
          [disabled]="!selectedOption"
          (click)="vote()"
        >
          Votar
        </button>
      }

      @if (mode() === 'results' || mode() === 'no-session') {
        <div class="results">
          @for (opt of poll().options; track opt.id) {
            <div class="result-row">
              <div class="result-label">
                <span>{{ opt.text }}</span>
                <span class="pct">{{ opt.pct }}%</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  [style.width.%]="opt.pct"
                  [class.voted]="poll().viewerContext?.votedOptionId === opt.id"
                ></div>
              </div>
            </div>
          }
          <p class="total">{{ poll().totalVotes }} voto{{ poll().totalVotes !== 1 ? 's' : '' }}</p>
        </div>

        @if (mode() === 'no-session') {
          <div class="login-banner">
            Inicia sesion para votar en esta encuesta.
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .poll-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
    }
    .question {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: var(--text-1);
    }
    .options { display: grid; gap: 0.5rem; }
    .option-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-1);
      cursor: pointer;
    }
    .vote-btn {
      margin-top: 0.75rem;
      padding: 0.5rem 1.25rem;
      border-radius: 0.75rem;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .vote-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .results { display: grid; gap: 0.6rem; }
    .result-row { display: grid; gap: 0.2rem; }
    .result-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-1);
    }
    .pct { font-weight: 600; color: var(--text-2); }
    .bar-track {
      height: 0.5rem;
      border-radius: 0.25rem;
      background: var(--bg-base);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 0.25rem;
      background: var(--accent);
      opacity: 0.6;
      transition: width 0.4s ease;
    }
    .bar-fill.voted { opacity: 1; }
    .total {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--text-3);
    }
    .login-banner {
      margin-top: 0.75rem;
      padding: 0.6rem 0.85rem;
      border-radius: 0.65rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--text-2);
      text-align: center;
    }
  `],
})
export class PollWidgetComponent implements OnInit {
  private readonly forumService = inject(ForumService);

  readonly poll = input.required<ForumPoll>();
  readonly threadSlug = input.required<string>();
  readonly isAuthenticated = input(false);

  readonly voted = output<void>();

  selectedOption = '';

  readonly mode = computed<'vote' | 'results' | 'no-session'>(() => {
    if (!this.isAuthenticated()) return 'no-session';
    if (this.hasVoted() || this.poll().status === 'CLOSED') return 'results';
    return 'vote';
  });

  readonly hasVoted = signal(false);

  ngOnInit() {
    if (this.poll().viewerContext?.votedOptionId) {
      this.hasVoted.set(true);
    }
  }

  vote() {
    if (!this.selectedOption) return;
    this.forumService.votePoll(this.threadSlug(), this.selectedOption).subscribe(() => {
      this.hasVoted.set(true);
      this.voted.emit();
    });
  }
}
