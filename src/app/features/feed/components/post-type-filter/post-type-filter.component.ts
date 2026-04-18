import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { PostType } from '../../../../core/models/post.model';
import { TranslationService } from '../../../../core/services/translation.service';
import {
  CustomSelectComponent,
  SelectOption,
} from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-post-type-filter',
  standalone: true,
  imports: [CustomSelectComponent],
  templateUrl: './post-type-filter.component.html',
  styleUrl: './post-type-filter.component.scss',
})
export class PostTypeFilterComponent {
  private readonly t = inject(TranslationService);

  @Input() selected: PostType | 'ALL' = 'ALL';
  @Output() selectedChange = new EventEmitter<PostType | 'ALL'>();

  get selectOptions(): SelectOption[] {
    const types: Array<PostType | 'ALL'> = [
      'ALL',
      'TEXT',
      'UPDATE',
      'WORLDBUILDING',
      'SHOWCASE',
      'ANNOUNCEMENT',
      'NEW_CHAPTER',
      'NEW_NOVEL',
      'WORLD_UPDATE',
      'NEW_CHARACTER',
      'RECOMMENDATION',
    ];
    return types.map((type) => ({
      value: type,
      label: type === 'ALL' ? this.t.translate('feed.all') : this.t.translate('post.types.' + type),
    }));
  }

  onSelect(value: string) {
    this.selectedChange.emit(value as PostType | 'ALL');
  }
}
