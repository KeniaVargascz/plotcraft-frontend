import { Genre } from '../../core/models/genre.model';

export const GENRE_CANONICAL_SLUG_ALIASES: Record<string, string> = {
  accion: 'accion',
  adventure: 'aventura',
  aventura: 'aventura',
  'ciencia-ficcion': 'ciencia-ficcion',
  comedia: 'comedia',
  cyberpunk: 'cyberpunk',
  'dark-fantasy': 'dark-fantasy',
  distopia: 'distopia',
  dystopia: 'distopia',
  drama: 'drama',
  fanfiction: 'fanfiction',
  fantasia: 'fantasia',
  fantasy: 'fantasia',
  gore: 'gore',
  historica: 'historica',
  historical: 'historica',
  horror: 'terror',
  infantil: 'infantil',
  isekai: 'isekai',
  juvenil: 'juvenil',
  litrpg: 'litrpg',
  'literary-fiction': 'literary-fiction',
  magia: 'magia',
  misterio: 'misterio',
  mystery: 'misterio',
  mythology: 'mythology',
  paranormal: 'paranormal',
  poetica: 'poetica',
  poetry: 'poetry',
  policiaca: 'policiaca',
  psicologica: 'psicologica',
  romance: 'romance',
  'sci-fi': 'ciencia-ficcion',
  'slice-of-life': 'slice-of-life',
  sobrenatural: 'sobrenatural',
  steampunk: 'steampunk',
  suspenso: 'suspenso',
  terror: 'terror',
  thriller: 'thriller',
  urbana: 'urbana',
  'young-adult': 'juvenil',
  epica: 'epica',
};

export const GENRE_LABEL_FALLBACKS: Record<string, string> = {
  accion: 'Accion',
  aventura: 'Aventura',
  'ciencia-ficcion': 'Ciencia ficcion',
  comedia: 'Comedia',
  cyberpunk: 'Cyberpunk',
  'dark-fantasy': 'Dark Fantasy',
  distopia: 'Distopia',
  drama: 'Drama',
  fanfiction: 'Fanfiction',
  fantasia: 'Fantasia',
  gore: 'Gore',
  historica: 'Historica',
  infantil: 'Infantil',
  isekai: 'Isekai',
  juvenil: 'Juvenil',
  litrpg: 'LitRPG',
  'literary-fiction': 'Ficcion literaria',
  magia: 'Magia',
  misterio: 'Misterio',
  mythology: 'Mitologia',
  paranormal: 'Paranormal',
  poetica: 'Poetica',
  poetry: 'Poesia',
  policiaca: 'Policiaca',
  psicologica: 'Psicologica',
  romance: 'Romance',
  'slice-of-life': 'Slice of Life',
  sobrenatural: 'Sobrenatural',
  steampunk: 'Steampunk',
  suspenso: 'Suspenso',
  terror: 'Terror',
  thriller: 'Thriller',
  urbana: 'Urbana',
  epica: 'Epica',
};

export const ALLOWED_GENRE_SLUGS = new Set([
  'fantasia',
  'romance',
  'ciencia-ficcion',
  'misterio',
  'thriller',
  'terror',
  'drama',
  'aventura',
  'accion',
  'distopia',
  'historica',
  'paranormal',
  'suspenso',
  'comedia',
  'isekai',
  'fanfiction',
]);

export function normalizeGenreToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canonicalGenreSlug(value: string): string {
  const normalized = normalizeGenreToken(value);
  return GENRE_CANONICAL_SLUG_ALIASES[normalized] ?? normalized;
}

export function genreTranslationKey(value: string): string {
  return `genres.labels.${canonicalGenreSlug(value)}`;
}

export function genreFallbackLabel(
  genre: Pick<Genre, 'slug' | 'label'> | { slug: string; label?: string } | string,
): string {
  if (typeof genre === 'string') {
    return GENRE_LABEL_FALLBACKS[canonicalGenreSlug(genre)] ?? genre;
  }

  return GENRE_LABEL_FALLBACKS[canonicalGenreSlug(genre.slug)] ?? genre.label ?? genre.slug;
}
