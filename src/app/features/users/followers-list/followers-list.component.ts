import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FollowModel } from '../../../core/models/follow.model';
import { FollowsService } from '../../../core/services/follows.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-followers-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './followers-list.component.html',
  styleUrl: './followers-list.component.scss',
})
export class FollowersListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly followsService = inject(FollowsService);

  readonly loading = signal(true);
  readonly username = signal('');
  readonly users = signal<FollowModel[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (!username) {
        return;
      }

      this.username.set(username);
      this.load(true);
    });
  }

  toggleFollow(user: FollowModel) {
    const request = user.isFollowing
      ? this.followsService.unfollow(user.username)
      : this.followsService.follow(user.username);

    this.users.update((items) =>
      items.map((item) =>
        item.id === user.id ? { ...item, isFollowing: !item.isFollowing } : item,
      ),
    );

    request.subscribe({
      error: () => {
        this.users.update((items) =>
          items.map((item) =>
            item.id === user.id ? { ...item, isFollowing: user.isFollowing } : item,
          ),
        );
      },
    });
  }

  load(reset: boolean) {
    this.loading.set(reset);

    this.followsService
      .getFollowers(this.username(), reset ? null : this.nextCursor())
      .subscribe((response) => {
        this.users.set(reset ? response.data : [...this.users(), ...response.data]);
        this.nextCursor.set(response.pagination.nextCursor);
        this.hasMore.set(response.pagination.hasMore);
        this.loading.set(false);
      });
  }
}
