import { Component, effect, inject, input, signal } from '@angular/core';
import { ForumService } from '../../../core/services/forum.service';

type ReactionKey = 'LIKE' | 'HELPFUL' | 'INSIGHTFUL' | 'FUNNY';

const REACTION_MAP: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: 'LIKE', emoji: '\u{1F44D}', label: 'Like' },
];

@Component({
  selector: 'app-forum-reaction-bar',
  standalone: true,
  template: `
    <div class="reaction-bar">
      @for (r of reactionTypes; track r.key) {
        <button
          type="button"
          class="reaction-btn"
          [class.active]="activeReaction() === r.key"
          [title]="r.label"
          (click)="toggle(r.key)"
        >
          <span class="emoji">{{ r.emoji }}</span>
          @if (getCount(r.key) > 0) {
            <span class="count">{{ getCount(r.key) }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      .reaction-bar {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .reaction-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border-radius: 9999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.15s;
      }
      .reaction-btn:hover {
        border-color: var(--accent);
        background: var(--bg-card);
      }
      .reaction-btn.active {
        border-color: var(--accent);
        background: var(--accent);
        color: #fff;
      }
      .emoji {
        font-size: 1rem;
      }
      .count {
        font-weight: 600;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class ForumReactionBarComponent {
  private readonly forumService = inject(ForumService);

  readonly reactions = input.required<Record<string, number>>();
  readonly viewerReaction = input<string | null>(null);
  readonly threadSlug = input.required<string>();
  readonly replyId = input<string | null>(null);

  readonly reactionTypes = REACTION_MAP;
  readonly activeReaction = signal<string | null>(null);
  readonly localCounts = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const r = this.reactions();
      if (r && Object.keys(r).length >= 0) {
        this.localCounts.set({ ...r });
        this.activeReaction.set(this.viewerReaction());
      }
    });
  }

  getCount(key: string): number {
    return this.localCounts()[key] ?? 0;
  }

  toggle(key: ReactionKey) {
    const current = this.activeReaction();
    const counts = { ...this.localCounts() };

    if (current === key) {
      counts[key] = Math.max(0, (counts[key] ?? 0) - 1);
      this.activeReaction.set(null);
    } else {
      if (current) {
        counts[current] = Math.max(0, (counts[current] ?? 0) - 1);
      }
      counts[key] = (counts[key] ?? 0) + 1;
      this.activeReaction.set(key);
    }

    this.localCounts.set(counts);

    const rid = this.replyId();
    if (rid) {
      this.forumService
        .toggleReplyReaction(this.threadSlug(), rid, { reactionType: key })
        .subscribe();
    } else {
      this.forumService.toggleThreadReaction(this.threadSlug(), { reactionType: key }).subscribe();
    }
  }
}
