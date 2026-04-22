import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadingStats } from '../../core/models/library.model';
import { LibraryService } from '../../core/services/library.service';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  template: `
    @if (stats(); as current) {
      <section class="page-shell">
        <h1>Estadisticas</h1>
        <div class="grid">
          <article class="card">
            <strong>{{ current.totalChaptersRead }}</strong
            ><span>Capitulos</span>
          </article>
          <article class="card">
            <strong>{{ current.totalNovelsCompleted }}</strong
            ><span>Completadas</span>
          </article>
          <article class="card">
            <strong>{{ current.totalWordsRead }}</strong
            ><span>Palabras</span>
          </article>
          <article class="card">
            <strong>{{ current.readingStreakDays }}</strong
            ><span>Racha</span>
          </article>
        </div>
        <article class="card">
          <h2>Actividad mensual</h2>
          @for (item of current.monthlyBreakdown; track item.year + '-' + item.month) {
            <div class="bar-row">
              <span>{{ item.month }}/{{ item.year }}</span>
              <div class="bar">
                <span
                  [style.width.%]="maxWords() ? (item.wordsRead / maxWords()) * 100 : 0"
                ></span>
              </div>
              <small>{{ item.wordsRead }}</small>
            </div>
          }
        </article>
      </section>
    }
  `,
  styles: [
    '.page-shell,.grid,.card{display:grid;gap:1rem}.grid{grid-template-columns:repeat(4,minmax(0,1fr))}.card{padding:1rem;border:1px solid var(--border);border-radius:1rem;background:var(--bg-card)}.bar-row{display:grid;grid-template-columns:90px 1fr 70px;gap:1rem;align-items:center}.bar{height:10px;border-radius:999px;background:var(--bg-surface);overflow:hidden}.bar span{display:block;height:100%;background:var(--accent)}@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}}',
  ],
})
export class StatsPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly stats = signal<ReadingStats | null>(null);
  readonly maxWords = signal(0);

  constructor() {
    this.libraryService.getStats().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stats) => {
      this.stats.set(stats);
      this.maxWords.set(Math.max(...stats.monthlyBreakdown.map((item) => item.wordsRead), 0));
    });
  }
}
