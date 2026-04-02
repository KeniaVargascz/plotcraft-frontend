import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  render(markdown: string) {
    return DOMPurify.sanitize(marked.parse(markdown) as string);
  }

  countWords(markdown: string) {
    const cleaned = markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/[#>*_~-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned ? cleaned.split(' ').length : 0;
  }
}
