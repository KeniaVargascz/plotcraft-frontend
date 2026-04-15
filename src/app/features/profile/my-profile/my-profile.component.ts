import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { PostModel } from '../../../core/models/post.model';
import { AuthService } from '../../../core/services/auth.service';
import { FollowsService } from '../../../core/services/follows.service';
import { NovelsService } from '../../../core/services/novels.service';
import { PostsService } from '../../../core/services/posts.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PostCardComponent } from '../../feed/components/post-card/post-card.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    TranslatePipe,
    PostCardComponent,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly followsService = inject(FollowsService);
  private readonly novelsService = inject(NovelsService);
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly user = signal<User | null>(null);
  readonly novelsCount = signal(0);
  readonly publishedWords = signal(0);
  readonly publishedChapters = signal(0);
  readonly followersCount = signal(0);
  readonly followingCount = signal(0);

  readonly activity = signal<PostModel[]>([]);
  readonly activityLoading = signal(true);
  readonly activityCursor = signal<string | null>(null);
  readonly activityHasMore = signal(false);

  constructor() {
    this.authService
      .me()
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.loading.set(false);
          this.loadActivity(user.username);
          this.followsService.getFollowers(user.username).subscribe({
            next: (res) => this.followersCount.set(res.data.length),
          });
          this.followsService.getFollowing(user.username).subscribe({
            next: (res) => this.followingCount.set(res.data.length),
          });
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return of(null);
        }),
      )
      .subscribe();

    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (response) => {
        this.novelsCount.set(response.data.filter((novel) => novel.isPublic).length);
        this.publishedWords.set(response.data.reduce((total, novel) => total + novel.wordCount, 0));
        this.publishedChapters.set(
          response.data.reduce((total, novel) => total + novel.stats.publishedChaptersCount, 0),
        );
      },
    });
  }

  loadMoreActivity() {
    const u = this.user();
    if (!u || !this.activityHasMore()) return;
    this.loadActivity(u.username, false);
  }

  onPostUpdate(updated: PostModel) {
    this.activity.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }

  onPostRemoved(postId: string) {
    this.activity.update((list) => list.filter((p) => p.id !== postId));
  }

  private loadActivity(username: string, reset = true) {
    this.activityLoading.set(true);
    this.postsService
      .getUserPosts(username, {
        cursor: reset ? null : this.activityCursor(),
        limit: 10,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const list = reset ? res.data : [...this.activity(), ...res.data];
          this.activity.set(list);
          this.activityCursor.set(res.pagination.nextCursor);
          this.activityHasMore.set(res.pagination.hasMore);
          this.activityLoading.set(false);
        },
        error: () => this.activityLoading.set(false),
      });
  }
}
