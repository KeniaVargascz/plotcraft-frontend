import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostModel } from '../../../../core/models/post.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PostsService } from '../../../../core/services/posts.service';
import { LightboxComponent } from '../../../../shared/components/lightbox/lightbox.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { SlicePipe } from '@angular/common';
import { CommentListComponent } from '../comment-list/comment-list.component';
import { ReactionBarComponent } from '../reaction-bar/reaction-bar.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MarkdownPipe,
    SlicePipe,
    CommentListComponent,
    ReactionBarComponent,
    LightboxComponent,
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  private readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly formBuilder = inject(FormBuilder);

  @Input({ required: true }) post!: PostModel;
  @Output() postChange = new EventEmitter<PostModel>();
  @Output() postDeleted = new EventEmitter<string>();

  readonly editing = signal(false);
  readonly loading = signal(false);
  readonly commentsOpen = signal(false);
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  get isAuthor() {
    return this.authService.getCurrentUserSnapshot()?.id === this.post.author.id;
  }

  startEdit() {
    this.form.reset({ content: this.post.content });
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  saveEdit() {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.postsService.update(this.post.id, this.form.getRawValue()).subscribe({
      next: (post) => {
        this.postChange.emit(post);
        this.editing.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleSaved() {
    if (!this.authService.isAuthenticated() || !this.post.viewerContext || this.loading()) {
      return;
    }

    this.loading.set(true);
    const action = this.post.viewerContext.hasSaved
      ? this.postsService.unsave(this.post.id)
      : this.postsService.save(this.post.id);

    action.subscribe({
      next: () => {
        this.postChange.emit({
          ...this.post,
          viewerContext: {
            ...this.post.viewerContext!,
            hasSaved: !this.post.viewerContext!.hasSaved,
          },
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  deletePost() {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.postsService.delete(this.post.id).subscribe({
      next: () => {
        this.postDeleted.emit(this.post.id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openLightbox(index: number) {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
  }

  toggleComments() {
    this.commentsOpen.update((value) => !value);
  }

  relativeDate(dateValue: string) {
    const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);
    if (seconds < 60) {
      return 'ahora';
    }
    if (seconds < 3600) {
      return `hace ${Math.floor(seconds / 60)}m`;
    }
    if (seconds < 86400) {
      return `hace ${Math.floor(seconds / 3600)}h`;
    }
    return `hace ${Math.floor(seconds / 86400)}d`;
  }
}
