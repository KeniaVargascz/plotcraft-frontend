import { Injectable, inject } from '@angular/core';
import { Genre } from '../models/genre.model';
import { TranslationService } from './translation.service';
import {
  ALLOWED_GENRE_SLUGS,
  canonicalGenreSlug,
  genreFallbackLabel,
  genreTranslationKey,
} from '../../shared/constants/genre-localization';

@Injectable({ providedIn: 'root' })
export class GenreLocalizationService {
  private readonly translationService = inject(TranslationService);

  labelFor(
    genre: Pick<Genre, 'slug' | 'label'> | { slug: string; label?: string } | string,
  ): string {
    const slug = typeof genre === 'string' ? genre : genre.slug;
    const key = genreTranslationKey(slug);
    const translated = this.translationService.translate(key);
    return translated !== key ? translated : genreFallbackLabel(genre);
  }

  canonicalizeGenres(genres: Genre[]): Genre[] {
    const deduped = new Map<string, Genre>();

    for (const genre of genres) {
      const canonicalSlug = canonicalGenreSlug(genre.slug);
      if (!ALLOWED_GENRE_SLUGS.has(canonicalSlug)) {
        continue;
      }
      const current = deduped.get(canonicalSlug);

      if (!current || this.genrePriority(genre) > this.genrePriority(current)) {
        deduped.set(canonicalSlug, genre);
      }
    }

    return [...deduped.values()].sort((a, b) =>
      this.labelFor(a).localeCompare(this.labelFor(b), 'es'),
    );
  }

  private genrePriority(genre: Genre): number {
    const canonicalSlug = canonicalGenreSlug(genre.slug);
    let score = 0;

    if (genre.slug === canonicalSlug) {
      score += 2;
    }

    if (this.labelFor(genre) === genreFallbackLabel({ slug: canonicalSlug })) {
      score += 1;
    }

    return score;
  }
}
