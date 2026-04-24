import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { VisualBoardSavePayload, VisualBoardSummary } from './models/visual-board.model';
import { VisualBoardsService } from './services/visual-boards.service';
import { CreateBoardDialogComponent } from './components/create-board-dialog.component';
import { VisualBoardCardComponent } from './components/visual-board-card.component';

@Component({
  selector: 'app-my-visual-boards-page',
  standalone: true,
  imports: [FormsModule, VisualBoardCardComponent],
  template: `
    <section class="page">
      <header class="header">
        <div>
          <h1>Referencias visuales</h1>
          <p>Organiza tableros por novela, mundo, personaje o serie.</p>
        </div>
        <button type="button" class="primary" (click)="openCreateDialog()">Nuevo tablero</button>
      </header>

      <section class="filters">
        <label>
          <span>Vinculacion</span>
          <select [(ngModel)]="linkedType" (ngModelChange)="loadBoards()">
            <option value="">Todos</option>
            <option value="novel">Novela</option>
            <option value="world">Mundo</option>
            <option value="character">Personaje</option>
            <option value="series">Serie</option>
            <option value="free">Libre</option>
          </select>
        </label>

        <label>
          <span>Visibilidad</span>
          <select [(ngModel)]="visibility" (ngModelChange)="loadBoards()">
            <option value="">Todos</option>
            <option value="public">Publicos</option>
            <option value="private">Privados</option>
          </select>
        </label>
      </section>

      @if (loading()) {
        <p class="state">Cargando tableros...</p>
      } @else if (!boards().length) {
        <p class="state">Aún no tienes tableros de referencias visuales.</p>
      } @else {
        <div class="grid">
          @for (board of boards(); track board.id) {
            <app-visual-board-card
              [board]="board"
              (edit)="openEditDialog($event)"
              (remove)="confirmDelete($event)"
            />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page,
      .filters {
        display: grid;
        gap: 1rem;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: center;
      }
      .filters {
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      select {
        padding: 0.7rem 0.8rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
      }
      .primary {
        padding: 0.75rem 1.1rem;
        border-radius: 999px;
        border: 0;
        background: var(--accent-glow);
        color: var(--accent-text);
        cursor: pointer;
      }
      .state {
        color: var(--text-2);
      }
      @media (max-width: 760px) {
        .header {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyVisualBoardsPageComponent implements OnInit {
  private readonly visualBoardsService = inject(VisualBoardsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly boards = signal<VisualBoardSummary[]>([]);

  linkedType = '';
  visibility = '';

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards() {
    this.loading.set(true);
    this.visualBoardsService
      .getMyBoards({

        linkedType: (this.linkedType || null) as
          | 'novel'
          | 'world'
          | 'character'
          | 'series'
          | 'free'
          | null,
        isPublic:
          this.visibility === 'public' ? true : this.visibility === 'private' ? false : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (boards) => {
          this.boards.set(boards);
          this.loading.set(false);
        },
        error: () => {
          this.boards.set([]);
          this.loading.set(false);
        },
      });
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, {
      data: { mode: 'create' },
      width: 'min(48rem, 96vw)',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((payload: VisualBoardSavePayload | null) => {
      if (!payload) return;
      this.visualBoardsService.createBoard(payload).subscribe({
        next: (board) => {
          this.loadBoards();
          void this.router.navigate(['/referencias-visuales', board.id]);
        },
      });
    });
  }

  openEditDialog(board: VisualBoardSummary) {
    this.visualBoardsService.getBoardById(board.id).subscribe({
      next: (detail) => {
        const ref = this.dialog.open(CreateBoardDialogComponent, {
          data: { mode: 'edit', board: detail },
          width: 'min(48rem, 96vw)',
          maxWidth: '96vw',
        });

        ref.afterClosed().subscribe((payload: VisualBoardSavePayload | null) => {
          if (!payload) return;
          this.visualBoardsService.updateBoard(board.id, payload).subscribe({
            next: () => this.loadBoards(),
          });
        });
      },
    });
  }

  confirmDelete(board: VisualBoardSummary) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar tablero',
        description: `¿Seguro que deseas eliminar "${board.title}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed !== true) return;
      this.visualBoardsService.deleteBoard(board.id).subscribe({
        next: () => {
          this.boards.update((current) => current.filter((item) => item.id !== board.id));
        },
      });
    });
  }
}
