import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostModel, PostType } from '../../../core/models/post.model';
import { PublicProfile } from '../../../core/models/profile.model';
import { AuthService } from '../../../core/services/auth.service';
import { FollowsService } from '../../../core/services/follows.service';
import { PostsService } from '../../../core/services/posts.service';
import { UserService } from '../../../core/services/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PostCardComponent } from '../../feed/components/post-card/post-card.component';
import { PostTypeFilterComponent } from '../../feed/components/post-type-filter/post-type-filter.component';

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PostCardComponent, PostTypeFilterComponent],
  templateUrl: './user-profile-page.component.html',
  styleUrl: './user-profile-page.component.scss',
})
export class UserProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  private readonly userService = inject(UserService);
  private readonly postsService = inject(PostsService);
  private readonly followsService = inject(FollowsService);

  readonly loading = signal(true);
  readonly postsLoading = signal(true);
  readonly error = signal(false);
  readonly profile = signal<PublicProfile | null>(null);
  readonly posts = signal<PostModel[]>([]);
  readonly selectedType = signal<PostType | 'ALL'>('ALL');
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly activeTab = signal<'posts' | 'saved'>('posts');

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (!username) {
        return;
      }

      this.activeTab.set('posts');
      this.loadProfile(username);
      this.loadPosts(username, true);
    });
  }

  get isOwnProfile() {
    return this.authService.getCurrentUserSnapshot()?.username === this.profile()?.username;
  }

  onTypeChange(type: PostType | 'ALL') {
    this.selectedType.set(type);
    const username = this.profile()?.username;
    if (username) {
      this.loadPosts(username, true);
    }
  }

  setTab(tab: 'posts' | 'saved') {
    this.activeTab.set(tab);
    const username = this.profile()?.username;
    if (username) {
      this.loadPosts(username, true);
    }
  }

  toggleFollow() {
    const profile = this.profile();
    if (!profile || this.isOwnProfile) {
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
      },
    });

    request.subscribe({
      error: () => {
        this.profile.set(profile);
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
    if (username && this.hasMore()) {
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
}
