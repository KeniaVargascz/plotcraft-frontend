import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { CommunityType } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-create-community-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Crear comunidad</h1>

      @if (!type()) {
        <p class="lead">Selecciona el tipo de comunidad que quieres crear:</p>
        <div class="type-grid">
          <button type="button" class="type-card" (click)="selectType('PRIVATE')">
            <h2>Privada</h2>
            <p>Asociada a una de tus novelas (requiere 30 días).</p>
            <small>Creación inmediata</small>
          </button>
          <button type="button" class="type-card" (click)="selectType('PUBLIC')">
            <h2>Pública</h2>
            <p>Comunidad temática abierta para todos.</p>
            <small>Requiere aprobación</small>
          </button>
          <button type="button" class="type-card" (click)="selectType('FANDOM')">
            <h2>Fandom</h2>
            <p>Centrada en una obra o universo.</p>
            <small>Requiere aprobación</small>
          </button>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="selected-type">
            <strong>Tipo:</strong> {{ type() }}
            <button type="button" (click)="type.set(null)">Cambiar</button>
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

          <label>
            URL de portada
            <input type="url" formControlName="coverUrl" />
          </label>

          <label>
            URL de banner
            <input type="url" formControlName="bannerUrl" />
          </label>

          @if (type() === 'PRIVATE') {
            <label>
              Novela vinculada
              <select formControlName="linkedNovelId">
                <option value="">— Selecciona —</option>
                @for (n of novels(); track n.id) {
                  <option [value]="n.id">{{ n.title }}</option>
                }
              </select>
            </label>
            <p class="help">La novela debe tener al menos 30 días publicada.</p>
          } @else {
            <div class="info">
              Tu solicitud será revisada por el equipo de PlotCraft antes de ser publicada.
            </div>
          }

          @if (errorMessage()) {
            <div class="error">{{ errorMessage() }}</div>
          }

          <button type="submit" class="primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando…' : (type() === 'PRIVATE' ? 'Crear comunidad' : 'Enviar solicitud') }}
          </button>
        </form>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
        max-width: 720px;
      }
      h1 {
        margin: 0;
      }
      .lead {
        color: var(--text-2);
      }
      .type-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .type-card {
        padding: 1.25rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        text-align: left;
      }
      .type-card:hover {
        border-color: var(--accent-text);
      }
      .type-card h2 {
        margin: 0 0 0.5rem;
      }
      .type-card p {
        margin: 0 0 0.5rem;
        color: var(--text-2);
      }
      .type-card small {
        color: var(--text-3);
      }
      form {
        display: grid;
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      input,
      textarea,
      select {
        padding: 0.65rem 0.85rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font: inherit;
      }
      .selected-type {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .selected-type button {
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
      }
      .help {
        margin: 0;
        color: var(--text-3);
        font-size: 0.85rem;
      }
      .info {
        padding: 0.85rem;
        border-radius: 0.6rem;
        background: rgba(80, 140, 220, 0.15);
        color: #77c4ea;
      }
      .error {
        padding: 0.75rem;
        border-radius: 0.6rem;
        background: rgba(214, 90, 90, 0.15);
        color: #e49d9d;
      }
      .primary {
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: none;
        cursor: pointer;
        font-weight: 600;
      }
      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CreateCommunityPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunityService);
  private readonly novelsService = inject(NovelsService);
  private readonly router = inject(Router);

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
    this.novelsService.listMine({ limit: 100 }).subscribe({
      next: (res) => this.novels.set(res.data),
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
    if (this.form.invalid || !this.type()) return;
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
        coverUrl: v.coverUrl || undefined,
        bannerUrl: v.bannerUrl || undefined,
        linkedNovelId: t === 'PRIVATE' ? v.linkedNovelId || undefined : undefined,
      })
      .subscribe({
        next: (c) => {
          this.saving.set(false);
          if (t === 'PRIVATE') {
            void this.router.navigate(['/comunidades', c.slug]);
          } else {
            void this.router.navigate(['/mis-comunidades']);
          }
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err?.error?.error?.message || err?.error?.message || err?.message || 'Error al crear la comunidad';
          this.errorMessage.set(msg);
        },
      });
  }
}
