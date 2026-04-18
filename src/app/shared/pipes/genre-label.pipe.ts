import { Pipe, PipeTransform, inject } from '@angular/core';
import { GenreLocalizationService } from '../../core/services/genre-localization.service';
import { Genre } from '../../core/models/genre.model';

@Pipe({
  name: 'genreLabel',
  standalone: true,
  pure: true,
})
export class GenreLabelPipe implements PipeTransform {
  private readonly genreLocalization = inject(GenreLocalizationService);

  transform(
    value: Pick<Genre, 'slug' | 'label'> | { slug: string; label?: string } | string,
  ): string {
    return this.genreLocalization.labelFor(value);
  }
}
