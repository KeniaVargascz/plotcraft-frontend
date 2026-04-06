import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FollowModel } from '../../../core/models/follow.model';
import { PostModel, PostType } from '../../../core/models/post.model';
import { FeedService } from '../../../core/services/feed.service';
import { FollowsService } from '../../../core/services/follows.service';
import { TagChipsInputComponent } from '../../../shared/components/tag-chips-input/tag-chips-input.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PostCardComponent } from '../components/post-card/post-card.component';
import { PostComposerComponent } from '../components/post-composer/post-composer.component';
import { PostTypeFilterComponent } from '../components/post-type-filter/post-type-filter.component';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    PostComposerComponent,
    PostTypeFilterComponent,
    PostCardComponent,
    TagChipsInputComponent,
  ],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss',
})
export class FeedPageComponent implements AfterViewInit, OnDestroy {
  private readonly feedService = inject(FeedService);
  private readonly followsService = inject(FollowsService);
  private observer?: IntersectionObserver;

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLDivElement>;

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly posts = signal<PostModel[]>([]);
  readonly suggestions = signal<FollowModel[]>([]);
  readonly selectedType = signal<PostType | 'ALL'>('ALL');
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly searchQuery = signal('');
  readonly searchTags = signal<string[]>([]);
  readonly isSearching = signal(false);
  readonly followingCount = signal<number | null>(null);

  constructor() {
    this.loadPosts(true);
    this.loadSuggestions();
  }

  ngAfterViewInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  onTypeChange(type: PostType | 'ALL') {
    this.selectedType.set(type);
    this.loadPosts(true);
  }

  addPost(post: PostModel) {
    this.posts.update((items) => [post, ...items]);
  }

  updatePost(updatedPost: PostModel) {
    this.posts.update((items) =>
      items.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  }

  removePost(postId: string) {
    this.posts.update((items) => items.filter((post) => post.id !== postId));
  }

  onSearch() {
    const q = this.searchQuery();
    const tags = this.searchTags();
    if (!q && !tags.length) {
      this.isSearching.set(false);
      this.loadPosts(true);
      return;
    }
    this.isSearching.set(true);
    this.loading.set(true);
    this.feedService
      .searchFeed({ search: q || null, tags: tags.length ? tags : undefined })
      .subscribe({
        next: (response) => {
          this.posts.set(response.data);
          this.nextCursor.set(response.pagination.nextCursor);
          this.hasMore.set(response.pagination.hasMore);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchTags.set([]);
    this.isSearching.set(false);
    this.loadPosts(true);
  }

  onSearchTagsChange(tags: string[]) {
    this.searchTags.set(tags);
  }

  followSuggestion(username: string) {
    this.followsService.follow(username).subscribe({
      next: () => {
        this.suggestions.update((items) => items.filter((item) => item.username !== username));
      },
    });
  }

  private loadPosts(reset: boolean) {
    if (reset) {
      this.loading.set(true);
      this.error.set(false);
    } else {
      this.loadingMore.set(true);
    }

    this.feedService
      .getFeed({
        cursor: reset ? null : this.nextCursor(),
        type: this.selectedType(),
      })
      .subscribe({
        next: (response) => {
          this.posts.set(reset ? response.data : [...this.posts(), ...response.data]);
          this.nextCursor.set(response.pagination.nextCursor);
          this.hasMore.set(response.pagination.hasMore);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  private loadSuggestions() {
    this.followsService.getSuggestions().subscribe({
      next: (suggestions) => this.suggestions.set(suggestions),
    });
  }

  private setupObserver() {
    if (!this.sentinel) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && this.hasMore() && !this.loading() && !this.loadingMore()) {
        this.loadPosts(false);
      }
    });

    this.observer.observe(this.sentinel.nativeElement);
  }
}
