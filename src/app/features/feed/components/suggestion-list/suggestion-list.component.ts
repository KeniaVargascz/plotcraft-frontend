import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FollowModel } from '../../../../core/models/follow.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-suggestion-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './suggestion-list.component.html',
  styleUrl: './suggestion-list.component.scss',
})
export class SuggestionListComponent {
  @Input({ required: true }) suggestions!: FollowModel[];
  @Input() max = 4;
  @Output() follow = new EventEmitter<string>();

  get visibleSuggestions() {
    return this.suggestions.slice(0, this.max);
  }

  getInitial(suggestion: FollowModel): string {
    return (suggestion.displayName || suggestion.username).slice(0, 1).toUpperCase();
  }
}
