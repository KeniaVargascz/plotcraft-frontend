import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PostType } from '../../../../core/models/post.model';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-post-type-filter',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './post-type-filter.component.html',
  styleUrl: './post-type-filter.component.scss',
})
export class PostTypeFilterComponent {
  @Input() selected: PostType | 'ALL' = 'ALL';
  @Output() selectedChange = new EventEmitter<PostType | 'ALL'>();

  readonly options: Array<PostType | 'ALL'> = [
    'ALL',
    'TEXT',
    'UPDATE',
    'WORLDBUILDING',
    'SHOWCASE',
    'ANNOUNCEMENT',
  ];

  choose(option: PostType | 'ALL') {
    this.selectedChange.emit(option);
  }
}
