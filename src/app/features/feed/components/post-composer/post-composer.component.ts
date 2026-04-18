import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostModel, PostType } from '../../../../core/models/post.model';
import { PostsService } from '../../../../core/services/posts.service';
import { NovelsService } from '../../../../core/services/novels.service';
import { WorldsService } from '../../../../core/services/worlds.service';
import { CharactersService } from '../../../../core/services/characters.service';
import { TagChipsInputComponent } from '../../../../shared/components/tag-chips-input/tag-chips-input.component';
import {
  CustomSelectComponent,
  SelectOption,
} from '../../../../shared/components/custom-select/custom-select.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../core/services/translation.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

interface ComposerNovel {
  id: string;
  title: string;
  slug: string;
  chapters: { id: string; title: string; slug: string; order: number }[];
}

interface ComposerWorld {
  id: string;
  name: string;
  slug: string;
}

interface ComposerCharacter {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    ErrorMessageComponent,
    TagChipsInputComponent,
    CustomSelectComponent,
  ],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.scss',
})
export class PostComposerComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly postsService = inject(PostsService);
  private readonly t = inject(TranslationService);
  private readonly novelsService = inject(NovelsService);
  private readonly worldsService = inject(WorldsService);
  private readonly charactersService = inject(CharactersService);

  @Output() postCreated = new EventEmitter<PostModel>();
  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;

  readonly expanded = signal(false);
  readonly publishing = signal(false);
  readonly error = signal<string | null>(null);
  readonly postTypes: PostType[] = [
    'TEXT',
    'UPDATE',
    'WORLDBUILDING',
    'SHOWCASE',
    'ANNOUNCEMENT',
    'NEW_CHAPTER',
    'NEW_NOVEL',
    'WORLD_UPDATE',
    'NEW_CHARACTER',
  ];
  readonly imageUrls = signal<string[]>([]);
  readonly tags = signal<string[]>([]);
  readonly showImageInput = signal(false);

  readonly myNovels = signal<ComposerNovel[]>([]);
  readonly myWorlds = signal<ComposerWorld[]>([]);
  readonly myCharacters = signal<ComposerCharacter[]>([]);
  readonly selectedNovelId = signal<string | null>(null);
  readonly selectedChapterId = signal<string | null>(null);
  readonly selectedWorldId = signal<string | null>(null);
  readonly selectedCharacterIds = signal<string[]>([]);
  private contentDataLoaded = false;

  readonly selectedNovelChapters = computed(() => {
    const novelId = this.selectedNovelId();
    if (!novelId) return [];
    return this.myNovels().find((n) => n.id === novelId)?.chapters ?? [];
  });

  readonly needsContentLinker = computed(() => {
    const type = this.form.controls.type.value;
    return ['NEW_CHAPTER', 'NEW_NOVEL', 'WORLD_UPDATE', 'NEW_CHARACTER'].includes(type);
  });

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

  get postTypeOptions(): SelectOption[] {
    return this.postTypes.map((type) => ({
      value: type,
      label: this.t.translate('post.types.' + type),
    }));
  }

  get novelOptions(): SelectOption[] {
    return [
      { value: '', label: 'Selecciona novela' },
      ...this.myNovels().map((n) => ({ value: n.id, label: n.title })),
    ];
  }

  get chapterOptions(): SelectOption[] {
    return [
      { value: '', label: 'Selecciona capitulo' },
      ...this.selectedNovelChapters().map((c) => ({
        value: c.id,
        label: `Cap. ${c.order}: ${c.title}`,
      })),
    ];
  }

  get worldOptions(): SelectOption[] {
    return [
      { value: '', label: 'Selecciona mundo' },
      ...this.myWorlds().map((w) => ({ value: w.id, label: w.name })),
    ];
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

  onTypeChange() {
    this.selectedNovelId.set(null);
    this.selectedChapterId.set(null);
    this.selectedWorldId.set(null);
    this.selectedCharacterIds.set([]);
    if (this.needsContentLinker() && !this.contentDataLoaded) {
      this.loadContentData();
    }
  }

  selectNovel(value: string) {
    this.selectedNovelId.set(value || null);
    this.selectedChapterId.set(null);
  }

  selectChapter(value: string) {
    this.selectedChapterId.set(value || null);
  }

  selectWorld(value: string) {
    this.selectedWorldId.set(value || null);
  }

  selectPostType(value: string) {
    this.form.controls.type.setValue(value as PostType);
    this.onTypeChange();
  }

  toggleCharacter(id: string) {
    this.selectedCharacterIds.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }

  private loadContentData() {
    this.contentDataLoaded = true;
    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (res) => {
        const novels: ComposerNovel[] = res.data.map((n) => ({
          id: n.id,
          title: n.title,
          slug: n.slug,
          chapters:
            n.chapters?.map((c) => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              order: c.order,
            })) ?? [],
        }));
        this.myNovels.set(novels);
      },
    });
    this.worldsService.listMine({ limit: 50 }).subscribe({
      next: (res) =>
        this.myWorlds.set(
          res.data.map((w) => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
          })),
        ),
    });
    this.charactersService.listMine({ limit: 50 }).subscribe({
      next: (res) =>
        this.myCharacters.set(
          res.data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          })),
        ),
    });
  }

  insertBold() {
    this.wrapSelection('**', '**');
  }

  insertItalic() {
    this.wrapSelection('*', '*');
  }

  insertLink() {
    const ta = this.contentTextarea.nativeElement;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const replacement = `[${selected || 'texto'}](https://)`;
    const newValue = ta.value.substring(0, start) + replacement + ta.value.substring(end);
    this.form.controls.content.setValue(newValue);
    setTimeout(() => {
      const urlStart = start + (selected || 'texto').length + 3;
      ta.selectionStart = urlStart;
      ta.selectionEnd = urlStart + 8;
      ta.focus();
    });
  }

  private wrapSelection(prefix: string, suffix: string) {
    const ta = this.contentTextarea.nativeElement;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || 'texto') + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    this.form.controls.content.setValue(newValue);
    setTimeout(() => {
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + (selected || 'texto').length;
      ta.focus();
    });
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
        novel_id: this.selectedNovelId() ?? undefined,
        chapter_id: this.selectedChapterId() ?? undefined,
        world_id: this.selectedWorldId() ?? undefined,
        character_ids: this.selectedCharacterIds().length ? this.selectedCharacterIds() : undefined,
      })
      .subscribe({
        next: (post) => {
          this.form.reset({ content: '', type: 'TEXT' });
          this.imageUrls.set([]);
          this.tags.set([]);
          this.imageUrlInput = '';
          this.showImageInput.set(false);
          this.selectedNovelId.set(null);
          this.selectedChapterId.set(null);
          this.selectedWorldId.set(null);
          this.selectedCharacterIds.set([]);
          this.expanded.set(false);
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
