import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { COMMUNITY_TYPE_LABELS, Community } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-edit-community-page',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (community(); as c) {
      <section class="page">
        <h1>Editar comunidad</h1>

        <div class="readonly">
          <p><strong>Tipo:</strong> {{ typeLabel(c) }}</p>
          @if (c.linkedNovel) {
            <p><strong>Novela vinculada:</strong> {{ c.linkedNovel.title }}</p>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
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

          @if (errorMessage()) {
            <div class="error">{{ errorMessage() }}</div>
          }

          <button type="submit" class="primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      </section>
    }
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
      .readonly p {
        margin: 0.25rem 0;
        color: var(--text-2);
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
      textarea {
        padding: 0.65rem 0.85rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font: inherit;
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
export class EditCommunityPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly community = signal<Community | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    rules: ['', [Validators.maxLength(5000)]],
    coverUrl: [''],
    bannerUrl: [''],
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.service.getCommunityBySlug(slug).subscribe({
      next: (c) => {
        this.community.set(c);
        this.form.patchValue({
          name: c.name,
          description: c.description ?? '',
          rules: c.rules ?? '',
          coverUrl: c.coverUrl ?? '',
          bannerUrl: c.bannerUrl ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(c: Community): string {
    return COMMUNITY_TYPE_LABELS[c.type];
  }

  submit(): void {
    const c = this.community();
    if (!c || this.form.invalid) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.form.value;
    this.service
      .update(c.slug, {
        name: v.name!,
        description: v.description || undefined,
        rules: v.rules || undefined,
        coverUrl: v.coverUrl || undefined,
        bannerUrl: v.bannerUrl || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.dialog.open(AlertDialogComponent, {
            data: { title: 'Guardado', message: 'Comunidad actualizada correctamente.' },
          });
          void this.router.navigate(['/comunidades', updated.slug]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err?.error?.error?.message || err?.error?.message || err?.message || 'Error al guardar';
          this.errorMessage.set(msg);
        },
      });
  }
}
