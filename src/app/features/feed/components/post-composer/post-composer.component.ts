import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostModel, PostType } from '../../../../core/models/post.model';
import { PostsService } from '../../../../core/services/posts.service';
import { TagChipsInputComponent } from '../../../../shared/components/tag-chips-input/tag-chips-input.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    ErrorMessageComponent,
    TagChipsInputComponent,
  ],
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
  readonly imageUrls = signal<string[]>([]);
  readonly tags = signal<string[]>([]);
  readonly showImageInput = signal(false);

  imageUrlInput = '';

  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(5000)]],
    type: ['TEXT' as PostType],
  });

  get contentLength() {
    return this.form.controls.content.value.length;
  }

  get canAddImages() {
    return this.imageUrls().length < 4;
  }

  toggleImageInput() {
    this.showImageInput.update((v) => !v);
  }

  addImageUrl() {
    const url = this.imageUrlInput.trim();
    if (!url || !this.canAddImages) {
      return;
    }
    this.imageUrls.update((urls) => [...urls, url]);
    this.imageUrlInput = '';
  }

  removeImage(index: number) {
    this.imageUrls.update((urls) => urls.filter((_, i) => i !== index));
  }

  onTagsChange(newTags: string[]) {
    this.tags.set(newTags);
  }

  submit() {
    if (this.form.invalid || this.publishing()) {
      this.form.markAllAsTouched();
      return;
    }

    this.publishing.set(true);
    this.error.set(null);

    this.postsService
      .create({
        ...this.form.getRawValue(),
        image_urls: this.imageUrls().length ? this.imageUrls() : undefined,
        tags: this.tags().length ? this.tags() : undefined,
      })
      .subscribe({
        next: (post) => {
          this.form.reset({ content: '', type: 'TEXT' });
          this.imageUrls.set([]);
          this.tags.set([]);
          this.imageUrlInput = '';
          this.showImageInput.set(false);
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
