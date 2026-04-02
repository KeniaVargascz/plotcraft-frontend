import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostModel, PostType } from '../../../core/models/post.model';
import { PublicProfile } from '../../../core/models/profile.model';
import { AuthService } from '../../../core/services/auth.service';
import { FollowsService } from '../../../core/services/follows.service';
import { NovelSummary } from '../../../core/models/novel.model';
import { NovelsService } from '../../../core/services/novels.service';
import { PostsService } from '../../../core/services/posts.service';
import { UserService } from '../../../core/services/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { NovelCardComponent } from '../../novels/components/novel-card.component';
import { PostCardComponent } from '../../feed/components/post-card/post-card.component';
import { PostTypeFilterComponent } from '../../feed/components/post-type-filter/post-type-filter.component';

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    PostCardComponent,
    PostTypeFilterComponent,
    NovelCardComponent,
  ],
  templateUrl: './user-profile-page.component.html',
  styleUrl: './user-profile-page.component.scss',
})
export class UserProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  private readonly userService = inject(UserService);
  private readonly postsService = inject(PostsService);
  private readonly followsService = inject(FollowsService);
  private readonly novelsService = inject(NovelsService);

  readonly loading = signal(true);
  readonly postsLoading = signal(true);
  readonly error = signal(false);
  readonly profile = signal<PublicProfile | null>(null);
  readonly posts = signal<PostModel[]>([]);
  readonly novels = signal<NovelSummary[]>([]);
  readonly selectedType = signal<PostType | 'ALL'>('ALL');
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly activeTab = signal<'posts' | 'saved' | 'novels'>('posts');
  readonly followPending = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (!username) {
        return;
      }

      this.activeTab.set('posts');
      this.loadProfile(username);
      this.loadActiveTab(username, true);
    });
  }

  get isOwnProfile() {
    return Boolean(
      this.profile()?.viewerContext.isSelf ||
      this.authService.getCurrentUserSnapshot()?.username === this.profile()?.username,
    );
  }

  onTypeChange(type: PostType | 'ALL') {
    this.selectedType.set(type);
    const username = this.profile()?.username;
    if (username) {
      this.loadPosts(username, true);
    }
  }

  setTab(tab: 'posts' | 'saved' | 'novels') {
    this.activeTab.set(tab);
    const username = this.profile()?.username;
    if (username) {
      this.loadActiveTab(username, true);
    }
  }

  toggleFollow() {
    const profile = this.profile();
    if (!profile || this.isOwnProfile || this.followPending()) {
      return;
    }

    const following = Boolean(profile.viewerContext.isFollowing);
    const request = following
      ? this.followsService.unfollow(profile.username)
      : this.followsService.follow(profile.username);

    this.profile.set({
      ...profile,
      followersCount: profile.followersCount + (following ? -1 : 1),
      viewerContext: {
        isFollowing: !following,
        isSelf: profile.viewerContext.isSelf,
      },
    });
    this.followPending.set(true);

    request.subscribe({
      next: () => {
        this.followPending.set(false);
      },
      error: () => {
        this.profile.set(profile);
        this.followPending.set(false);
      },
    });
  }

  updatePost(updatedPost: PostModel) {
    this.posts.update((items) =>
      items.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  }

  removePost(postId: string) {
    this.posts.update((items) => items.filter((post) => post.id !== postId));
  }

  loadMore() {
    const username = this.profile()?.username;
    if (username && this.hasMore() && this.activeTab() !== 'novels') {
      this.loadPosts(username, false);
    }
  }

  private loadProfile(username: string) {
    this.loading.set(true);
    this.error.set(false);

    this.userService.getPublicProfile(username).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadPosts(username: string, reset: boolean) {
    this.postsLoading.set(true);

    const request =
      this.activeTab() === 'saved' && this.isOwnProfile
        ? this.postsService.getSavedPosts({
            cursor: reset ? null : this.nextCursor(),
            type: this.selectedType(),
          })
        : this.postsService.getUserPosts(username, {
            cursor: reset ? null : this.nextCursor(),
            type: this.selectedType(),
          });

    request.subscribe({
      next: (response) => {
        this.posts.set(reset ? response.data : [...this.posts(), ...response.data]);
        this.nextCursor.set(response.pagination.nextCursor);
        this.hasMore.set(response.pagination.hasMore);
        this.postsLoading.set(false);
      },
      error: () => {
        this.postsLoading.set(false);
      },
    });
  }

  private loadActiveTab(username: string, reset: boolean) {
    if (this.activeTab() === 'novels') {
      this.postsLoading.set(false);
      this.hasMore.set(false);
      this.novelsService.listByUser(username, { limit: 24 }).subscribe({
        next: (response) => this.novels.set(response.data),
        error: () => this.novels.set([]),
      });
      return;
    }

    this.novels.set([]);
    this.loadPosts(username, reset);
  }
}
