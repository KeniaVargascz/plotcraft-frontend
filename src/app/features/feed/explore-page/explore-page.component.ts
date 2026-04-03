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
import { AuthService } from '../../../core/services/auth.service';
import { PostModel, PostType } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PostCardComponent } from '../components/post-card/post-card.component';
import { PostComposerComponent } from '../components/post-composer/post-composer.component';
import { PostTypeFilterComponent } from '../components/post-type-filter/post-type-filter.component';

@Component({
  selector: 'app-explore-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    PostComposerComponent,
    PostTypeFilterComponent,
    PostCardComponent,
  ],
  templateUrl: './explore-page.component.html',
  styleUrl: './explore-page.component.scss',
})
export class ExplorePageComponent implements AfterViewInit, OnDestroy {
  readonly authService = inject(AuthService);

  private readonly postsService = inject(PostsService);
  private observer?: IntersectionObserver;

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLDivElement>;

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly posts = signal<PostModel[]>([]);
  readonly selectedType = signal<PostType | 'ALL'>('ALL');
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  search = '';

  constructor() {
    this.loadPosts(true);
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

  applySearch() {
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

  private loadPosts(reset: boolean) {
    if (reset) {
      this.loading.set(true);
      this.error.set(false);
    } else {
      this.loadingMore.set(true);
    }

    this.postsService
      .list({
        cursor: reset ? null : this.nextCursor(),
        type: this.selectedType(),
        search: this.search || null,
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
