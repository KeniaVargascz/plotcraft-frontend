import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { COMMUNITY_STATUS_LABELS, Community, CommunityType } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-my-communities-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <header class="header">
        <div>
          <h1>Mis comunidades</h1>
          <p>Gestiona y crea las comunidades de tu cuenta.</p>
        </div>
        @if (!showCreate()) {
          <button type="button" class="primary" (click)="openCreate()">+ Nueva comunidad</button>
        }
      </header>

      @if (showCreate()) {
        <article class="create-card">
          <div class="create-head">
            <h2>Crear nueva comunidad</h2>
            <button type="button" class="ghost" (click)="cancelCreate()">Cancelar</button>
          </div>

          @if (!type()) {
            <p class="lead">Selecciona el tipo de comunidad que quieres crear:</p>
            <div class="type-grid">
              <button type="button" class="type-card" (click)="selectType('PRIVATE')">
                <h3>Privada</h3>
                <p>Asociada a una de tus novelas. Solo tus seguidores pueden unirse.</p>
                <small>Requiere novela ≥30 días y ≥10 seguidores</small>
              </button>
              <button type="button" class="type-card" (click)="selectType('PUBLIC')">
                <h3>Pública</h3>
                <p>Comunidad temática abierta para todos los usuarios.</p>
                <small>Requiere aprobación del equipo</small>
              </button>
              <button type="button" class="type-card" (click)="selectType('FANDOM')">
                <h3>Fandom</h3>
                <p>Centrada en una obra o universo (anime, libro, serie...).</p>
                <small>Requiere aprobación del equipo</small>
              </button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="selected-type">
                <strong>Tipo:</strong> {{ typeLabel() }}
                <button type="button" class="ghost" (click)="type.set(null)">Cambiar</button>
              </div>

              <label>
                Nombre
                <input type="text" formControlName="name" maxlength="200" />
              </label>

              <label>
                Descripción
                <textarea formControlName="description" rows="3" maxlength="2000"></textarea>
              </label>

              <label>
                Reglas <small>(Markdown soportado)</small>
                <textarea formControlName="rules" rows="5" maxlength="5000"></textarea>
              </label>

              @if (type() === 'PRIVATE') {
                <label>
                  URL de portada
                  <input type="url" formControlName="coverUrl" placeholder="https://..." />
                </label>

                <label>
                  URL de banner
                  <input type="url" formControlName="bannerUrl" placeholder="https://..." />
                </label>
              }

              @if (type() === 'PRIVATE') {
                <label>
                  Novela vinculada
                  <select formControlName="linkedNovelId">
                    <option value="">— Selecciona una novela —</option>
                    @for (n of novels(); track n.id) {
                      <option [value]="n.id">{{ n.title }}</option>
                    }
                  </select>
                </label>
                <p class="help">
                  La novela debe tener al menos 30 días desde su publicación, y necesitas ≥10 seguidores.
                </p>
              } @else {
                <div class="info">
                  ℹ Tu solicitud será revisada por el equipo de PlotCraft antes de hacerse pública.
                  Recibirás una notificación con el resultado.
                </div>
              }

              @if (errorMessage()) {
                <div class="error">{{ errorMessage() }}</div>
              }

              <div class="form-actions">
                <button type="button" class="ghost" (click)="cancelCreate()">Cancelar</button>
                <button type="submit" class="primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Guardando…' : (type() === 'PRIVATE' ? 'Crear comunidad' : 'Enviar solicitud') }}
                </button>
              </div>
            </form>
          }
        </article>
      }

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!items().length) {
        <p class="empty">Aún no has creado ninguna comunidad.</p>
      } @else {
        <ul class="list">
          @for (c of items(); track c.id) {
            <li class="item">
              <div class="info-block">
                <div class="name-row">
                  <strong>{{ c.name }}</strong>
                  <span class="badge" [class]="'status-' + c.status.toLowerCase()">
                    {{ statusLabel(c) }}
                  </span>
                </div>
                @if (c.description) {
                  <p class="desc">{{ c.description }}</p>
                }
                @if (c.status === 'REJECTED' && c.rejectionReason) {
                  <div class="reject-box">
                    <strong>Motivo:</strong> {{ c.rejectionReason }}
                  </div>
                }
              </div>
              <div class="actions">
                @if (c.status === 'ACTIVE') {
                  <a [routerLink]="['/comunidades', c.slug]">Ver</a>
                }
                @if (c.type === 'PRIVATE' || c.status !== 'ACTIVE') {
                  @if (c.status === 'ACTIVE') {
                    <a [routerLink]="['/mis-comunidades', c.slug, 'editar']">Editar</a>
                  }
                  <button type="button" (click)="remove(c)">Eliminar</button>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .header h1 {
        margin: 0 0 0.25rem;
      }
      .header p {
        margin: 0;
        color: var(--text-2);
      }
      .primary {
        padding: 0.7rem 1.2rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
        border: 0;
        cursor: pointer;
      }
      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ghost {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
        cursor: pointer;
      }
      .create-card {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .create-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .create-head h2 {
        margin: 0;
      }
      .lead {
        margin: 0;
        color: var(--text-2);
      }
      .type-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
      }
      .type-card {
        padding: 1rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        text-align: left;
      }
      .type-card:hover {
        border-color: var(--accent-text);
      }
      .type-card h3 {
        margin: 0 0 0.4rem;
      }
      .type-card p {
        margin: 0 0 0.4rem;
        color: var(--text-2);
        font-size: 0.85rem;
      }
      .type-card small {
        color: var(--text-3);
        font-size: 0.75rem;
      }
      form {
        display: grid;
        gap: 0.85rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        color: var(--text-2);
      }
      input,
      textarea,
      select {
        padding: 0.6rem 0.8rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font: inherit;
      }
      .selected-type {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .help {
        margin: 0;
        color: var(--text-3);
        font-size: 0.8rem;
      }
      .info {
        padding: 0.8rem;
        border-radius: 0.6rem;
        background: rgba(80, 140, 220, 0.12);
        color: #88b7e0;
        font-size: 0.85rem;
      }
      .error {
        padding: 0.75rem;
        border-radius: 0.6rem;
        background: rgba(214, 90, 90, 0.15);
        color: #e49d9d;
      }
      .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .info-block {
        flex: 1;
      }
      .name-row {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        margin-bottom: 0.4rem;
      }
      .desc {
        margin: 0;
        color: var(--text-2);
        font-size: 0.9rem;
      }
      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-active {
        background: rgba(77, 184, 138, 0.15);
        color: #63d4a2;
      }
      .status-pending {
        background: rgba(214, 176, 80, 0.15);
        color: #d4ac6b;
      }
      .status-rejected {
        background: rgba(214, 90, 90, 0.15);
        color: #e49d9d;
      }
      .status-suspended {
        background: rgba(214, 140, 80, 0.15);
        color: #e8b27a;
      }
      .reject-box {
        margin-top: 0.5rem;
        padding: 0.6rem;
        border-radius: 0.5rem;
        background: rgba(214, 90, 90, 0.1);
        color: #e49d9d;
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .actions a,
      .actions button {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        cursor: pointer;
        font-size: 0.82rem;
      }
      .empty {
        text-align: center;
        color: var(--text-2);
      }
    `,
  ],
})
export class MyCommunitiesPageComponent implements OnInit {
  private readonly service = inject(CommunityService);
  private readonly novelsService = inject(NovelsService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<Community[]>([]);
  readonly loading = signal(true);

  // Inline create state
  readonly showCreate = signal(false);
  readonly type = signal<CommunityType | null>(null);
  readonly novels = signal<NovelSummary[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    rules: ['', [Validators.maxLength(5000)]],
    coverUrl: [''],
    bannerUrl: [''],
    linkedNovelId: [''],
  });

  ngOnInit(): void {
    this.loadCommunities();
    if (this.route.snapshot.queryParamMap.get('nueva') === '1') {
      this.openCreate();
    }
  }

  private loadCommunities(): void {
    this.loading.set(true);
    this.service.getMyOwnedCommunities().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(c: Community): string {
    return COMMUNITY_STATUS_LABELS[c.status];
  }

  typeLabel(): string {
    const t = this.type();
    return t === 'PRIVATE' ? 'Privada' : t === 'PUBLIC' ? 'Pública' : 'Fandom';
  }

  openCreate(): void {
    this.showCreate.set(true);
    this.errorMessage.set(null);
    if (!this.novels().length) {
      this.novelsService.listMine({ limit: 50 }).subscribe({
        next: (res) => this.novels.set(res.data),
      });
    }
  }

  cancelCreate(): void {
    this.showCreate.set(false);
    this.type.set(null);
    this.errorMessage.set(null);
    this.form.reset({
      name: '',
      description: '',
      rules: '',
      coverUrl: '',
      bannerUrl: '',
      linkedNovelId: '',
    });
  }

  selectType(t: CommunityType): void {
    this.type.set(t);
    const linkedCtrl = this.form.controls.linkedNovelId;
    if (t === 'PRIVATE') {
      linkedCtrl.setValidators([Validators.required]);
    } else {
      linkedCtrl.clearValidators();
      linkedCtrl.setValue('');
    }
    linkedCtrl.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid || !this.type() || this.saving()) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.form.value;
    const t = this.type()!;
    this.service
      .create({
        type: t,
        name: v.name!,
        description: v.description || undefined,
        rules: v.rules || undefined,
        coverUrl: t === 'PRIVATE' ? v.coverUrl || undefined : undefined,
        bannerUrl: t === 'PRIVATE' ? v.bannerUrl || undefined : undefined,
        linkedNovelId: t === 'PRIVATE' ? v.linkedNovelId || undefined : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelCreate();
          this.loadCommunities();
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'Error al crear la comunidad';
          this.errorMessage.set(msg);
        },
      });
  }

  remove(c: Community): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar comunidad',
          description: `¿Seguro que deseas eliminar "${c.name}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok || ok === 'false') return;
        this.service.delete(c.slug, true).subscribe({
          next: () => this.items.update((l) => l.filter((x) => x.id !== c.id)),
        });
      });
  }
}
