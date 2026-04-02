import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostModel, PostType } from '../../../../core/models/post.model';
import { PostsService } from '../../../../core/services/posts.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ErrorMessageComponent],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.scss',
})
export class PostComposerComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly postsService = inject(PostsService);

  @Output() postCreated = new EventEmitter<PostModel>();

  readonly publishing = signal(false);
  readonly error = signal<string | null>(null);
  readonly postTypes: PostType[] = ['TEXT', 'UPDATE', 'WORLDBUILDING', 'SHOWCASE', 'ANNOUNCEMENT'];

  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(5000)]],
    type: ['TEXT' as PostType],
  });

  get contentLength() {
    return this.form.controls.content.value.length;
  }

  submit() {
    if (this.form.invalid || this.publishing()) {
      this.form.markAllAsTouched();
      return;
    }

    this.publishing.set(true);
    this.error.set(null);

    this.postsService.create(this.form.getRawValue()).subscribe({
      next: (post) => {
        this.form.reset({ content: '', type: 'TEXT' });
        this.postCreated.emit(post);
        this.publishing.set(false);
      },
      error: () => {
        this.error.set('common.error');
        this.publishing.set(false);
      },
    });
  }
}
