import { Pipe, PipeTransform } from '@angular/core';
import DOMPurify from 'dompurify';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  transform(value: string | null | undefined, query: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const normalized = query?.trim();
    if (!normalized) {
      return DOMPurify.sanitize(value);
    }

    const pattern = new RegExp(`(${escapeRegExp(normalized)})`, 'gi');
    const highlighted = value.replace(pattern, '<mark>$1</mark>');
    return DOMPurify.sanitize(highlighted);
  }
}
