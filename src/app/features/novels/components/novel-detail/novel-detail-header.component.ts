import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovelDetail } from '../../../../core/models/novel.model';
import { ReadingList } from '../../../../core/models/reading-list.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-novel-detail-header',
  standalone: true,
  imports: [RouterLink, SlicePipe, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="hero">
      <div class="cover">{{ novel().title.charAt(0) }}</div>

      <div class="meta">
        <div class="chips">
          <span>{{ novel().status }}</span>
          <span>{{ novel().rating }}</span>
          <span>{{ novel().wordCount }} palabras</span>
        </div>
        <h1>{{ novel().title }}</h1>
        @if (novel().novelType === 'FANFIC' && novel().linkedCommunity) {
          <a
            class="fanfic-badge"
            [routerLink]="['/comunidades', novel().linkedCommunity!.slug]"
            title="Ver comunidad"
          >
            &#9733; Fanfic de {{ novel().linkedCommunity!.name }}
          </a>
        }
        @if (novel().series; as novelSeries) {
          <a [routerLink]="['/sagas', novelSeries.slug]" class="series-badge">
            &#128218; Parte de {{ novelSeries.title }}
            <span>Libro {{ novelSeries.orderIndex }} de {{ novelSeries.novelsCount }}</span>
            @if (novelSeries.status === 'COMPLETED') {
              <span class="complete-badge">Serie completa</span>
            }
          </a>
        }
        <p class="author">
          por
          <a [routerLink]="['/perfil', novel().author.username]"
            >@{{ novel().author.username }}</a
          >
        </p>
        <p class="synopsis">{{ novel().synopsis }}</p>

        <div class="actions">
          @if (
            novel().viewerContext?.reading_progress &&
            novel().viewerContext?.reading_progress?.chapter_slug
          ) {
            <a
              [routerLink]="[
                '/novelas',
                novel().slug,
                novel().viewerContext?.reading_progress?.chapter_slug,
              ]"
            >
              Continuar desde cap.
              {{ novel().viewerContext?.reading_progress?.chapter_order }} -
              {{ novel().viewerContext?.reading_progress?.chapter_title }}
            </a>
          } @else if (isAuthenticated() && novel().chapters.length) {
            <a [routerLink]="['/novelas', novel().slug, novel().chapters[0].slug]">
              Comenzar a leer
            </a>
          }

          @if (!novel().viewerContext?.isAuthor) {
            <button
              type="button"
              [disabled]="kudoLoading()"
              (click)="toggleKudo.emit()"
              [class.active]="novel().viewerContext?.hasKudo"
            >
              <span [class.kudo-beat]="kudoBeat()">&#9829;</span>
              {{ novel().viewerContext?.hasKudo ? 'Kudo dado' : 'Dar kudo' }}
            </button>
            <button
              type="button"
              [class.active]="novel().viewerContext?.isSubscribed"
              [disabled]="subscribeLoading()"
              (click)="toggleSubscribe.emit()"
            >
              <svg
                style="display:inline-block;vertical-align:middle;margin-right:4px"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg
              >{{ novel().viewerContext?.isSubscribed ? 'Suscrito' : 'Suscribirse' }}
            </button>
          }

          @if (novel().viewerContext && !novel().viewerContext!.isAuthor) {
            <button type="button" (click)="toggleBookmark.emit()">
              {{ novel().viewerContext!.hasBookmarked ? 'Quitar guardado' : 'Guardar' }}
            </button>
            <button type="button" [disabled]="listsLoading()" (click)="toggleListsMenu.emit()">
              {{ listsLoading() ? 'Cargando listas...' : 'Guardar en lista' }}
            </button>
          }

          @if (novel().viewerContext) {
            <button
              type="button"
              class="recommend-btn"
              [disabled]="recommended()"
              (click)="openRecommend.emit()"
            >
              {{
                recommended()
                  ? ('recommend.done' | translate)
                  : ('recommend.button' | translate)
              }}
            </button>
          }

          @if (novel().viewerContext?.isAuthor) {
            <a [routerLink]="['/analytics/novelas', novel().slug]">Analytics</a>
            <a [routerLink]="['/mis-novelas', novel().slug, 'editar']">Editar novela</a>
            <a [routerLink]="['/mis-novelas', novel().slug, 'capitulos']"
              >Gestionar capitulos</a
            >
            <a routerLink="/mis-mundos">Gestionar mundos</a>
            <a routerLink="/mis-personajes">Gestionar personajes</a>
          }
        </div>

        @if (showListsMenu()) {
          <div class="list-menu">
            @if (listsLoading()) {
              <span class="list-feedback list-feedback-muted">Cargando tus listas...</span>
            } @else if (listsError()) {
              <span class="list-feedback list-feedback-error">{{ listsError() }}</span>
            } @else if (!readingLists().length) {
              <span class="list-feedback list-feedback-muted">
                Aun no tienes listas creadas para guardar esta novela.
              </span>
            } @else {
              @for (list of readingLists(); track list.id) {
                <label
                  class="list-option"
                  [class.list-option-busy]="listActionId() === list.id"
                >
                  <input
                    type="checkbox"
                    [checked]="listMembership().has(list.id)"
                    [disabled]="listActionId() === list.id || listsLoading()"
                    (change)="toggleListMembershipEvt.emit(list)"
                  />
                  <span class="list-option-copy">
                    <strong>{{ list.name }}</strong>
                    <small>
                      @if (listActionId() === list.id) {
                        Procesando...
                      } @else if (listMembership().has(list.id)) {
                        Guardada en esta lista
                      } @else {
                        Disponible
                      }
                    </small>
                  </span>
                </label>
              }

              @if (listsMessage()) {
                <span class="list-feedback list-feedback-success">{{ listsMessage() }}</span>
              }
            }
          </div>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .hero {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 220px 1fr;
      }
      .cover {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        min-height: 320px;
        display: grid;
        place-items: center;
        font-size: 4rem;
      }
      .meta {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }
      .chips,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .chips span,
      .actions a,
      .actions button {
        padding: 0.5rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: 0;
      }
      .author a {
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
      }
      .author a:hover {
        text-decoration: underline;
      }
      .fanfic-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #6f3aff, #b34dff);
        color: #fff;
        font-weight: 600;
        text-decoration: none;
        font-size: 0.85rem;
        width: fit-content;
      }
      .series-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.85rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-size: 0.85rem;
        width: fit-content;
      }
      .series-badge .complete-badge {
        background: rgba(77, 184, 138, 0.25);
        color: #63d4a2;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .actions button.active,
      .actions button.active:hover {
        background: rgba(224, 85, 85, 0.15);
        color: #e05555;
      }
      .kudo-beat {
        display: inline-block;
        animation: beat 300ms ease-in-out;
      }
      @keyframes beat {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.3);
        }
        100% {
          transform: scale(1);
        }
      }
      .list-menu {
        display: grid;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .list-option {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        cursor: pointer;
      }
      .list-option-busy {
        opacity: 0.7;
      }
      .list-option-copy {
        display: grid;
        gap: 0.25rem;
      }
      .list-option-copy small,
      .list-feedback {
        color: var(--text-2);
      }
      .list-feedback-error {
        color: #b42318;
      }
      .list-feedback-success {
        color: #027a48;
      }
      @media (max-width: 900px) {
        .hero {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NovelDetailHeaderComponent {
  readonly novel = input.required<NovelDetail>();
  readonly isAuthenticated = input.required<boolean>();
  readonly kudoLoading = input<boolean>(false);
  readonly kudoBeat = input<boolean>(false);
  readonly subscribeLoading = input<boolean>(false);
  readonly recommended = input<boolean>(false);
  readonly showListsMenu = input<boolean>(false);
  readonly listsLoading = input<boolean>(false);
  readonly listsError = input<string | null>(null);
  readonly listsMessage = input<string | null>(null);
  readonly readingLists = input<ReadingList[]>([]);
  readonly listMembership = input<Set<string>>(new Set());
  readonly listActionId = input<string | null>(null);

  readonly toggleKudo = output();
  readonly toggleBookmark = output();
  readonly toggleSubscribe = output();
  readonly toggleListsMenu = output();
  readonly toggleListMembershipEvt = output<ReadingList>();
  readonly openRecommend = output();
}
