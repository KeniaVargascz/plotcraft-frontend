import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  VisualBoardLinkedType,
  VisualBoardSavePayload,
  VisualBoardSummary,
} from '../models/visual-board.model';
import { VisualBoardsService } from '../services/visual-boards.service';
import { CreateBoardDialogComponent } from './create-board-dialog.component';
import { VisualBoardCardComponent } from './visual-board-card.component';

@Component({
  selector: 'app-linked-visual-boards-section',
  standalone: true,
  imports: [VisualBoardCardComponent],
  template: `
    @if (!loading() && !boards().length && !isOwner) {
    } @else {
      <section class="linked-boards">
        <div class="section-head">
          <div>
            <h2>Tableros</h2>
            @if (!boards().length) {
              <p class="hint">No hay tableros para este elemento.</p>
            }
          </div>

          @if (isOwner && !boards().length) {
            <button type="button" class="create-btn" (click)="openCreateDialog()">
              Crear tablero para esta {{ entityLabel }}
            </button>
          }
        </div>

        @if (boards().length) {
          <div class="grid">
            @for (board of boards(); track board.id) {
              <app-visual-board-card [board]="board" [mini]="true" [showActions]="false" />
            }
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      .linked-boards {
        display: grid;
        gap: 1rem;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .section-head h2,
      .hint {
        margin: 0;
      }
      .hint {
        color: var(--text-2);
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
      .create-btn {
        padding: 0.65rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        cursor: pointer;
      }
    `,
  ],
})
export class LinkedVisualBoardsSectionComponent implements OnInit {
  @Input({ required: true }) linkedType!: VisualBoardLinkedType;
  @Input({ required: true }) linkedId!: string;
  @Input({ required: true }) authorUsername!: string;
  @Input({ required: true }) entityLabel!: string;
  @Input() isOwner = false;

  private readonly visualBoardsService = inject(VisualBoardsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly boards = signal<VisualBoardSummary[]>([]);

  ngOnInit(): void {
    this.load();
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, {
      data: {
        mode: 'create',
        prefill: {
          linkedType: this.linkedType,
          linkedId: this.linkedId,
        },
      },
      width: 'min(48rem, 96vw)',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((payload: VisualBoardSavePayload | null) => {
      if (!payload) return;

      this.visualBoardsService.createBoard(payload).subscribe({
        next: (board) => {
          void this.router.navigate(['/referencias-visuales', board.id]);
        },
      });
    });
  }

  private load() {
    this.loading.set(true);
    const query = {
      linkedType: this.linkedType,
      linkedId: this.linkedId,
    };

    if (this.isOwner) {
      this.visualBoardsService.getMyBoards(query).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.boards.set(response);
          this.loading.set(false);
        },
        error: () => {
          this.boards.set([]);
          this.loading.set(false);
        },
      });
      return;
    }

    this.visualBoardsService.getPublicBoards(this.authorUsername, query).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.boards.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.boards.set([]);
        this.loading.set(false);
      },
    });
  }
}
