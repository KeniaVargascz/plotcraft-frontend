import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { FollowsService } from '../../../core/services/follows.service';
import { NovelsService } from '../../../core/services/novels.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    RouterLink,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    TranslatePipe,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly followsService = inject(FollowsService);
  private readonly novelsService = inject(NovelsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly user = signal<User | null>(null);
  readonly novelsCount = signal(0);
  readonly publishedWords = signal(0);
  readonly publishedChapters = signal(0);
  readonly followersCount = signal(0);
  readonly followingCount = signal(0);

  constructor() {
    this.authService
      .me()
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.loading.set(false);
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
}
