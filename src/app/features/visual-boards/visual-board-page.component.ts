import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LightboxComponent } from '../../shared/components/lightbox/lightbox.component';
import { PromptDialogComponent } from '../../shared/components/prompt-dialog/prompt-dialog.component';
import {
  AddImageToSectionDialogComponent,
  AddImageToSectionResult,
} from './components/add-image-to-section-dialog.component';
import { CreateBoardDialogComponent } from './components/create-board-dialog.component';
import { VisualBoard, VisualBoardSavePayload, VisualBoardSection } from './models/visual-board.model';
import { VisualBoardsService } from './services/visual-boards.service';

@Component({
  selector: 'app-visual-board-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DragDropModule, LightboxComponent],
  templateUrl: './visual-board-page.template.html',
  styleUrl: './visual-board-page.styles.scss',
})
export class VisualBoardPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly visualBoardsService = inject(VisualBoardsService);

  readonly loading = signal(true);
  readonly board = signal<VisualBoard | null>(null);
  readonly addingSectionInline = signal(false);
  readonly lightboxImages = signal<string[]>([]);
  readonly lightboxIndex = signal(0);

  newSectionTitle = '';

  readonly isOwner = computed(() => {
    const board = this.board();
    const user = this.authService.getCurrentUserSnapshot();
    return Boolean(board && user && board.author.username === user.username);
  });

  readonly linkedRoute = computed(() => {
    const board = this.board();
    if (!board?.linkedType || !board.linkedSlug) return null;

    switch (board.linkedType) {
      case 'novel':
        return ['/novelas', board.linkedSlug];
      case 'world':
        return ['/mundos', board.linkedSlug];
      case 'series':
        return ['/sagas', board.linkedSlug];
      case 'character':
        return ['/personajes', board.author.username, board.linkedSlug];
      default:
        return null;
    }
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loadBoard(id);
    });
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

  promptAddSection() {
    const ref = this.dialog.open(PromptDialogComponent, {
      data: {
        title: 'Nueva seccion',
        label: 'Nombre de la seccion',
        placeholder: 'Nombre de la seccion',
        confirmText: 'Añadir',
      },
    });

    ref.afterClosed().subscribe((title: string | null) => {
      if (!title || !this.board()) return;
      this.visualBoardsService.addSection(this.board()!.id, title).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  createInlineSection() {
    if (!this.board() || !this.newSectionTitle.trim()) return;

    this.visualBoardsService.addSection(this.board()!.id, this.newSectionTitle.trim()).subscribe({
      next: () => {
        this.newSectionTitle = '';
        this.addingSectionInline.set(false);
        this.reloadCurrentBoard();
      },
    });
  }

  cancelInlineSection() {
    this.newSectionTitle = '';
    this.addingSectionInline.set(false);
  }

  renameSection(section: VisualBoardSection) {
    const ref = this.dialog.open(PromptDialogComponent, {
      data: {
        title: 'Editar seccion',
        label: 'Nombre',
        value: section.title,
        confirmText: 'Guardar',
      },
    });

    ref.afterClosed().subscribe((title: string | null) => {
      if (!title || !this.board()) return;
      this.visualBoardsService.updateSection(this.board()!.id, section.id, title).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  deleteSection(section: VisualBoardSection) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar seccion',
        description: `¿Seguro que deseas eliminar "${section.title}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed !== true || !this.board()) return;
      this.visualBoardsService.deleteSection(this.board()!.id, section.id).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  openAddImageDialog(section: VisualBoardSection) {
    const ref = this.dialog.open(AddImageToSectionDialogComponent, {
      data: { sectionTitle: section.title },
    });

    ref.afterClosed().subscribe((result: AddImageToSectionResult | null) => {
      if (!result || !this.board()) return;
      this.visualBoardsService.addItem(this.board()!.id, section.id, result).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  editCaption(sectionId: string, itemId: string, caption: string | null) {
    const ref = this.dialog.open(PromptDialogComponent, {
      data: {
        title: 'Editar pie de foto',
        label: 'Pie de foto',
        value: caption ?? '',
        confirmText: 'Guardar',
      },
    });

    ref.afterClosed().subscribe((value: string | null) => {
      if (!this.board()) return;
      this.visualBoardsService.updateItem(this.board()!.id, sectionId, itemId, value).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  deleteItem(sectionId: string, itemId: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar imagen',
        description: '¿Seguro que deseas eliminar esta imagen?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed !== true || !this.board()) return;
      this.visualBoardsService.deleteItem(this.board()!.id, sectionId, itemId).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  dropSection(event: CdkDragDrop<VisualBoardSection[]>) {
    if (!this.isOwner() || event.previousIndex === event.currentIndex) return;

    const board = this.board();
    if (!board) return;

    const sections = [...board.sections];
    moveItemInArray(sections, event.previousIndex, event.currentIndex);
    this.board.set({ ...board, sections });

    this.visualBoardsService
      .reorderSections(
        board.id,
        sections.map((section, index) => ({
          sectionId: section.id,
          orderIndex: index + 1,
        })),
      )
      .subscribe({
        next: (updated) => this.board.set(updated),
        error: () => this.reloadCurrentBoard(),
      });
  }

  dropItem(section: VisualBoardSection, event: CdkDragDrop<typeof section.items>) {
    if (!this.isOwner() || event.previousIndex === event.currentIndex) return;

    const board = this.board();
    if (!board) return;

    const sections = board.sections.map((current) => {
      if (current.id !== section.id) return current;
      const items = [...current.items];
      moveItemInArray(items, event.previousIndex, event.currentIndex);
      return { ...current, items };
    });

    this.board.set({ ...board, sections });
    const updatedSection = sections.find((item) => item.id === section.id);
    if (!updatedSection) return;

    this.visualBoardsService
      .reorderItems(
        board.id,
        section.id,
        updatedSection.items.map((item, index) => ({
          itemId: item.id,
          orderIndex: index + 1,
        })),
      )
      .subscribe({
        next: (updated) => this.board.set(updated),
        error: () => this.reloadCurrentBoard(),
      });
  }

  openLightbox(section: VisualBoardSection, itemId: string) {
    const images = section.items.map((item) => item.imageUrl);
    const index = section.items.findIndex((item) => item.id === itemId);
    this.lightboxImages.set(images);
    this.lightboxIndex.set(Math.max(index, 0));
  }

  closeLightbox() {
    this.lightboxImages.set([]);
    this.lightboxIndex.set(0);
  }

  openEditBoardDialog() {
    const board = this.board();
    if (!board) return;

    const ref = this.dialog.open(CreateBoardDialogComponent, {
      data: { mode: 'edit', board },
      width: 'min(48rem, 96vw)',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((payload: VisualBoardSavePayload | null) => {
      if (!payload) return;
      this.visualBoardsService.updateBoard(board.id, payload).subscribe({
        next: () => this.reloadCurrentBoard(),
      });
    });
  }

  private loadBoard(id: string) {
    this.loading.set(true);
    this.visualBoardsService.getBoardById(id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loading.set(false);
      },
      error: () => {
        this.board.set(null);
        this.loading.set(false);
      },
    });
  }

  private reloadCurrentBoard() {
    const board = this.board();
    if (!board) return;
    this.loadBoard(board.id);
  }
}
