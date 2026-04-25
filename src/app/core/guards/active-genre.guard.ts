import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { GenresService } from '../services/genres.service';

export const activeGenreGuard: CanActivateFn = (route) => {
  const genresService = inject(GenresService);
  const router = inject(Router);
  const slug = route.paramMap.get('genreSlug');

  if (!slug) return true;

  return genresService.list().pipe(
    map((genres) => {
      if (genres.some((g) => g.slug === slug)) return true;
      return router.createUrlTree(['/novelas/generos']);
    }),
  );
};
