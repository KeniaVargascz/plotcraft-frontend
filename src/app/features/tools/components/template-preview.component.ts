import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkdownService } from '../../../core/services/markdown.service';
import { TemplateCardData } from './template-card.component';

@Component({
  selector: 'app-template-preview',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="preview-section card">
      <div class="block-head">
        <div>
          <p class="mini-label">Preview</p>
          <h2>{{ template().title }}</h2>
        </div>
        <div class="preview-actions">
          <span class="template-category">{{ template().category }}</span>
          <button
            type="button"
            class="copy-btn strong"
            (click)="useTemplate.emit(template())"
          >
            {{ copied() ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
      </div>

      <div class="preview-grid">
        <article class="preview-pane">
          <h3>Markdown</h3>
          <pre>{{ template().content }}</pre>
        </article>

        <article class="preview-pane rendered">
          <h3>Resultado</h3>
          <div class="md" [innerHTML]="renderedContent()"></div>
        </article>
      </div>
    </section>
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
      .preview-section {
        padding: 1.3rem;
      }
      .mini-label {
        color: var(--text-2);
        margin: 0 0 0.35rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
      }
      h2,
      h3,
      p {
        margin-top: 0;
      }
      h2 {
        margin-bottom: 0.25rem;
        font-size: 1.4rem;
      }
      .preview-actions {
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
      .block-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .preview-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        gap: 1rem;
      }
      .preview-pane {
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 88%, #fff7ea 12%);
        padding: 1rem;
      }
      .preview-pane h3 {
        margin-bottom: 0.75rem;
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
      .preview-pane pre {
        margin-top: 0.85rem;
        padding: 0.9rem;
        border-radius: 0.85rem;
        background: #1f2026;
        color: #f6f6f8;
        overflow-x: auto;
      }
      .rendered .md {
        line-height: 1.7;
      }
      .rendered .md :global(p) {
        margin: 0 0 0.8rem;
      }
      .rendered .md :global(table) {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      .rendered .md :global(th),
      .rendered .md :global(td) {
        border: 1px solid var(--border);
        padding: 0.55rem 0.7rem;
        text-align: left;
      }
      .rendered .md :global(blockquote) {
        margin: 0 0 1rem;
        padding: 0.8rem 1rem;
        border-left: 4px solid #c88136;
        background: color-mix(in srgb, var(--bg-surface) 78%, #f6ead7 22%);
      }
      .rendered .md :global(img) {
        max-width: 100%;
        border-radius: 0.8rem;
      }
      @media (max-width: 1040px) {
        .preview-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TemplatePreviewComponent {
  private readonly markdownService = inject(MarkdownService);

  readonly template = input.required<TemplateCardData>();
  readonly copied = input(false);

  readonly close = output<void>();
  readonly useTemplate = output<TemplateCardData>();

  renderedContent(): string {
    return this.markdownService.render(this.template().content);
  }
}
