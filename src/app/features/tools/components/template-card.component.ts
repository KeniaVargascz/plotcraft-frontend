import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TemplateCardData = {
  id: string;
  title: string;
  category: string;
  summary: string;
  bestFor: string;
  content: string;
  routes: Array<{ label: string; to: string }>;
};

@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="template-card card">
      <div class="template-meta">
        <span class="template-category">{{ template().category }}</span>
        <h3>{{ template().title }}</h3>
        <p>{{ template().summary }}</p>
        <small>Mejor para: {{ template().bestFor }}</small>
      </div>

      <div class="template-actions">
        <button
          type="button"
          class="copy-btn strong"
          (click)="copy.emit(template())"
        >
          {{ copied() ? 'Copiado' : 'Copiar' }}
        </button>
        <button
          type="button"
          class="ghost-btn"
          (click)="preview.emit(template())"
        >
          {{ selected() ? 'Vista activa' : 'Ver preview' }}
        </button>
        @for (route of template().routes; track route.label + route.to) {
          <a class="ghost-btn" [routerLink]="route.to">{{ route.label }}</a>
        }
      </div>

      <pre class="template-source">{{ template().content }}</pre>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: 1.4rem;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 92%, #f4e7d3 8%),
          var(--bg-card)
        );
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      }
      .template-card,
      .template-meta p {
        color: var(--text-2);
      }
      .template-card {
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 88%, #fff7ea 12%);
        padding: 1rem;
      }
      .template-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .ghost-btn,
      .copy-btn {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.65rem 1rem;
        text-decoration: none;
        cursor: pointer;
        font-weight: 600;
      }
      .copy-btn.strong {
        background: color-mix(in srgb, var(--accent-glow) 70%, var(--bg-surface));
        color: var(--accent-text);
        border-color: transparent;
      }
      .template-category {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0.28rem 0.7rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent-glow) 28%, var(--bg-surface));
        border: 1px solid color-mix(in srgb, var(--border) 75%, #c88136 25%);
        font-size: 0.8rem;
        font-weight: 600;
      }
      .template-meta small {
        color: var(--text-3);
      }
      h3,
      p {
        margin-top: 0;
      }
      code,
      pre {
        font-family: Consolas, 'Courier New', monospace;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        line-height: 1.55;
      }
      .template-source {
        margin-top: 0.85rem;
        padding: 0.9rem;
        border-radius: 0.85rem;
        background: #1f2026;
        color: #f6f6f8;
        overflow-x: auto;
        max-height: 340px;
        overflow: auto;
      }
    `,
  ],
})
export class TemplateCardComponent {
  readonly template = input.required<TemplateCardData>();
  readonly selected = input(false);
  readonly copied = input(false);

  readonly preview = output<TemplateCardData>();
  readonly copy = output<TemplateCardData>();
}
