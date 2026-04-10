import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchResult } from '../../../core/models/search.model';

@Component({
  selector: 'app-search-result-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (result) {
      <article class="card">
        <div class="head">
          <span class="badge" [class]="'sec-' + result.section">{{ sectionLabel() }}</span>
          @if (result.section === 'foro' && result.metadata?.['forumName']) {
            <small class="sub"
              >[Foro] {{ result.metadata['forumName'] }}
              @if (result.metadata?.['communitySlug']) {
                · en {{ result.metadata['communitySlug'] }}
              }
            </small>
          }
        </div>
        <h3>
          <a [routerLink]="result.url">{{ result.title }}</a>
        </h3>
        @if (result.excerpt) {
          <p class="excerpt" [innerHTML]="highlight(result.excerpt)"></p>
        }
        <div class="meta">
          @if (result.author) {
            <span>&#64;{{ result.author.username }}</span>
          }
          <span>· {{ relativeTime(result.createdAt) }}</span>
          @if (result.section === 'comunidad' && result.metadata?.['membersCount'] != null) {
            <span>· {{ result.metadata['membersCount'] }} miembros</span>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      .card {
        display: grid;
        gap: 0.4rem;
        padding: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        border-radius: 0.85rem;
      }
      .head {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .badge {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
      }
      .sec-feed {
        background: rgba(120, 100, 220, 0.18);
        color: #a99bff;
      }
      .sec-foro {
        background: rgba(80, 200, 120, 0.18);
        color: #6fd693;
      }
      .sec-comunidad {
        background: rgba(220, 150, 60, 0.18);
        color: #e0b06a;
      }
      .sub {
        color: var(--text-3);
        font-size: 0.78rem;
      }
      h3 {
        margin: 0;
        font-size: 1rem;
      }
      h3 a {
        color: var(--text-1);
        text-decoration: none;
      }
      .excerpt {
        margin: 0;
        color: var(--text-2);
      }
      .meta {
        font-size: 0.82rem;
        color: var(--text-3);
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class SearchResultCardComponent {
  @Input({ required: true }) result!: SearchResult;
  @Input() query = '';

  sectionLabel(): string {
    const labels: Record<string, string> = {
      novelas: 'Novelas',
      mundos: 'Mundos',
      personajes: 'Personajes',
      usuarios: 'Usuarios',
      feed: 'Feed',
      foro: 'Foro',
      comunidad: 'Comunidad',
    };
    return labels[this.result.section] ?? this.result.section;
  }

  highlight(text: string): string {
    if (!this.query) return text;
    const safe = text.replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c] as string,
    );
    const re = new RegExp(`(${this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return `hace ${Math.floor(days / 30)}mes`;
  }
}
