import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentModel } from '../../../../core/models/comment.model';
import { PostModel } from '../../../../core/models/post.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CommentsService } from '../../../../core/services/comments.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, CommentItemComponent],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.scss',
})
export class CommentListComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly commentsService = inject(CommentsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) post!: PostModel;
  @Output() commentCountChange = new EventEmitter<number>();

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly comments = signal<CommentModel[]>([]);
  readonly creating = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit() {
    this.load();
  }

  get contentLength() {
    return this.form.controls.content.value.length;
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    this.commentsService
      .list(this.post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.comments.set(response.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  createComment() {
    if (this.form.invalid || this.creating()) {
      return;
    }

    this.creating.set(true);
    this.commentsService
      .create(this.post.id, this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.comments.update((items) => [...items, comment]);
          this.commentCountChange.emit(1);
          this.form.reset({ content: '' });
          this.creating.set(false);
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }

  updateComment(updatedComment: CommentModel) {
    if (updatedComment.isDeleted) {
      this.comments.update((items) => items.filter((c) => c.id !== updatedComment.id));
      this.commentCountChange.emit(-1);
    } else {
      this.comments.update((items) =>
        items.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment)),
      );
    }
  }
}
