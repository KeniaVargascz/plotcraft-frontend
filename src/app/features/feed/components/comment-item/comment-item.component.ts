import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentModel } from '../../../../core/models/comment.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CommentsService } from '../../../../core/services/comments.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RelativeDatePipe],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss',
})
export class CommentItemComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly commentsService = inject(CommentsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  readonly authService = inject(AuthService);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }

  @Input({ required: true }) comment!: CommentModel;
  @Input({ required: true }) postId!: string;
  @Output() commentChange = new EventEmitter<CommentModel>();

  readonly editing = signal(false);
  readonly loading = signal(false);
  readonly menuOpen = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  get isAuthor() {
    return this.authService.getCurrentUserSnapshot()?.id === this.comment.author.id;
  }

  startEdit() {
    this.form.reset({ content: this.comment.content });
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  save() {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.commentsService.update(this.postId, this.comment.id, this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (comment) => {
        this.commentChange.emit(comment);
        this.editing.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  remove() {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.commentsService.delete(this.postId, this.comment.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (comment) => {
        this.commentChange.emit(comment);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

}
