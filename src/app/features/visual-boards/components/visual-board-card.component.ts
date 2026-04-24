import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VisualBoardSummary } from '../models/visual-board.model';

@Component({
  selector: 'app-visual-board-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <article class="card" [class.mini]="mini">
      <a class="cover" [routerLink]="['/referencias-visuales', board.id]">
        @if (board.coverUrl) {
          <img [src]="board.coverUrl" [alt]="board.title" loading="lazy" />
        } @else if (board.previewImages?.length) {
          <div class="collage">
            @for (image of visiblePreviewImages(); track image) {
              <img [src]="image" alt="" loading="lazy" />
            }
          </div>
        } @else {
          <div class="placeholder"><span>Imagen</span></div>
        }
      </a>

      <div class="body">
        <div class="badges">
          <span class="badge visibility" [class.public]="board.isPublic">
            {{ board.isPublic ? 'Publico' : 'Privado' }}
          </span>
          @if (board.linkedType) {
            <span class="badge linked">{{ linkedLabel(board.linkedType) }}</span>
          }
        </div>

        <a class="title" [routerLink]="['/referencias-visuales', board.id]">{{ board.title }}</a>

        @if (board.description && !mini) {
          <p class="description">{{ board.description }}</p>
        }

        <p class="meta">
          {{ board.sectionsCount }} secciones · {{ board.totalImagesCount }} imagenes
        </p>
        <p class="meta">Actualizado {{ board.updatedAt | date: 'mediumDate' }}</p>

        @if (!mini && showActions) {
          <div class="actions">
            <a [routerLink]="['/referencias-visuales', board.id]">Abrir</a>
            <button type="button" (click)="edit.emit(board)">Editar</button>
            <button type="button" class="danger" (click)="remove.emit(board)">Eliminar</button>
          </div>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        display: grid;
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
        background: var(--bg-card);
      }
      .cover,
      .cover img,
      .collage img {
        display: block;
        width: 100%;
      }
      .cover {
        min-height: 13rem;
        background: var(--bg-surface);
      }
      .cover img,
      .collage img {
        height: 100%;
        object-fit: cover;
      }
      .collage {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: 6.5rem;
      }
      .placeholder {
        min-height: 13rem;
        display: grid;
        place-items: center;
        color: var(--text-3);
        background:
          linear-gradient(135deg, rgba(168, 196, 173, 0.18), rgba(205, 180, 158, 0.18)),
          var(--bg-surface);
      }
      .body {
        display: grid;
        gap: 0.65rem;
        padding: 1rem;
      }
      .badges,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .badge {
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
      }
      .badge.public {
        background: rgba(84, 140, 98, 0.12);
        color: #3f7f51;
        border-color: rgba(84, 140, 98, 0.22);
      }
      .badge.linked {
        background: rgba(172, 117, 73, 0.12);
        color: #8a5a35;
        border-color: rgba(172, 117, 73, 0.2);
      }
      .title {
        color: var(--text-1);
        text-decoration: none;
        font-size: 1rem;
        font-weight: 700;
      }
      .description,
      .meta {
        margin: 0;
        color: var(--text-2);
      }
      .description {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .actions a,
      .actions button {
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .actions .danger {
        color: #9e2f2f;
      }
      .mini .cover,
      .mini .placeholder {
        min-height: 10rem;
      }
      .mini .collage {
        grid-auto-rows: 5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualBoardCardComponent {
  @Input({ required: true }) board!: VisualBoardSummary;
  @Input() mini = false;
  @Input() showActions = true;
  @Output() edit = new EventEmitter<VisualBoardSummary>();
  @Output() remove = new EventEmitter<VisualBoardSummary>();

  visiblePreviewImages() {
    return (this.board.previewImages ?? []).slice(0, 4);
  }

  linkedLabel(type: string) {
    switch (type) {
      case 'novel':
        return 'Novela';
      case 'world':
        return 'Mundo';
      case 'character':
        return 'Personaje';
      case 'series':
        return 'Serie';
      default:
        return type;
    }
  }
}
