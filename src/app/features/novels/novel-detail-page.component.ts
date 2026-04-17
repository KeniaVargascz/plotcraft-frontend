import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NovelDetail } from '../../core/models/novel.model';
import { AuthService } from '../../core/services/auth.service';
import { KudosService } from '../../core/services/kudos.service';
import { NovelsService } from '../../core/services/novels.service';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { ReadingList } from '../../core/models/reading-list.model';
import { ReadingListsService } from '../../core/services/reading-lists.service';
import { TimelineService } from '../../core/services/timeline.service';
import { TimelineDetail } from '../../core/models/timeline.model';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { WorldCardComponent } from '../worlds/components/world-card.component';
import { LinkedVisualBoardsSectionComponent } from '../visual-boards/components/linked-visual-boards-section.component';
import { GenreLabelPipe } from '../../shared/pipes/genre-label.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PostsService } from '../../core/services/posts.service';

@Component({
  selector: 'app-novel-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    SlicePipe,
    FormsModule,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    WorldCardComponent,
    CharacterCardComponent,
    LinkedVisualBoardsSectionComponent,
    GenreLabelPipe,
    TranslatePipe,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (novel(); as currentNovel) {
      <section class="detail-shell">
        <article class="hero">
          <div class="cover">{{ currentNovel.title.charAt(0) }}</div>

          <div class="meta">
            <div class="chips">
              <span>{{ currentNovel.status }}</span>
              <span>{{ currentNovel.rating }}</span>
              <span>{{ currentNovel.wordCount }} palabras</span>
            </div>
            <h1>{{ currentNovel.title }}</h1>
            @if (currentNovel.novelType === 'FANFIC' && currentNovel.linkedCommunity) {
              <a
                class="fanfic-badge"
                [routerLink]="['/comunidades', currentNovel.linkedCommunity.slug]"
                title="Ver comunidad"
              >
                ★ Fanfic de {{ currentNovel.linkedCommunity.name }}
              </a>
            }
            @if (currentNovel.series; as novelSeries) {
              <a [routerLink]="['/sagas', novelSeries.slug]" class="series-badge">
                📚 Parte de {{ novelSeries.title }}
                <span>Libro {{ novelSeries.orderIndex }} de {{ novelSeries.novelsCount }}</span>
                @if (novelSeries.status === 'COMPLETED') {
                  <span class="complete-badge">Serie completa</span>
                }
              </a>
            }
            <p class="author">
              por
              <a [routerLink]="['/perfil', currentNovel.author.username]"
                >@{{ currentNovel.author.username }}</a
              >
            </p>
            <p class="synopsis">{{ currentNovel.synopsis }}</p>

            <div class="actions">
              @if (
                currentNovel.viewerContext?.reading_progress &&
                currentNovel.viewerContext?.reading_progress?.chapter_slug
              ) {
                <a
                  [routerLink]="[
                    '/novelas',
                    currentNovel.slug,
                    currentNovel.viewerContext?.reading_progress?.chapter_slug,
                  ]"
                >
                  Continuar desde cap.
                  {{ currentNovel.viewerContext?.reading_progress?.chapter_order }} -
                  {{ currentNovel.viewerContext?.reading_progress?.chapter_title }}
                </a>
              } @else if (authService.isAuthenticated() && currentNovel.chapters.length) {
                <a [routerLink]="['/novelas', currentNovel.slug, currentNovel.chapters[0].slug]">
                  Comenzar a leer
                </a>
              }

              @if (!currentNovel.viewerContext?.isAuthor) {
                <button
                  type="button"
                  [disabled]="kudoLoading()"
                  (click)="toggleKudo()"
                  [class.active]="currentNovel.viewerContext?.hasKudo"
                >
                  <span [class.kudo-beat]="kudoBeat()">&#9829;</span>
                  {{ currentNovel.viewerContext?.hasKudo ? 'Kudo dado' : 'Dar kudo' }}
                </button>
                <button
                  type="button"
                  [class.active]="currentNovel.viewerContext?.isSubscribed"
                  [disabled]="subscribeLoading()"
                  (click)="toggleSubscription()"
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
                  >{{ currentNovel.viewerContext?.isSubscribed ? 'Suscrito' : 'Suscribirse' }}
                </button>
              }

              @if (currentNovel.viewerContext && !currentNovel.viewerContext.isAuthor) {
                <button type="button" (click)="toggleBookmark()">
                  {{ currentNovel.viewerContext.hasBookmarked ? 'Quitar guardado' : 'Guardar' }}
                </button>
                <button type="button" [disabled]="listsLoading()" (click)="toggleListsMenu()">
                  {{ listsLoading() ? 'Cargando listas...' : 'Guardar en lista' }}
                </button>
              }

              @if (currentNovel.viewerContext) {
                <button
                  type="button"
                  class="recommend-btn"
                  [disabled]="recommended()"
                  (click)="openRecommendPreview()"
                >
                  {{
                    recommended()
                      ? ('recommend.done' | translate)
                      : ('recommend.button' | translate)
                  }}
                </button>
              }

              @if (currentNovel.viewerContext?.isAuthor) {
                <a [routerLink]="['/analytics/novelas', currentNovel.slug]">Analytics</a>
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'editar']">Editar novela</a>
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'capitulos']"
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
                        (change)="toggleListMembership(list)"
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

        <section class="content-grid">
          <div class="chapter-list card">
            <h2>Capitulos</h2>
            @for (chapter of currentNovel.chapters; track chapter.id) {
              <a class="chapter-item" [routerLink]="['/novelas', currentNovel.slug, chapter.slug]">
                <span>{{ chapter.order }}. {{ chapter.title }}</span>
                <small>{{ chapter.wordCount }} palabras</small>
              </a>
            }
          </div>

          <aside class="stats card">
            <h3>Estadisticas</h3>
            <span>{{ currentNovel.stats.chaptersCount }} capitulos</span>
            <span>{{ currentNovel.stats.kudosCount }} kudos</span>
            <span>{{ currentNovel.stats.bookmarksCount }} guardados</span>
            <span>{{ currentNovel.stats.votesCount }} votos</span>
            <span>{{ currentNovel.stats.commentsCount }} comentarios</span>
            <span>{{ currentNovel.stats.worldsCount }} mundos</span>
            <span>{{ currentNovel.stats.charactersCount }} personajes</span>
            <span>{{ currentNovel.viewsCount }} vistas</span>
            <span>Actualizada {{ currentNovel.updatedAt | date: 'longDate' }}</span>
          </aside>
        </section>

        <section class="related-block">
          <div class="section-head">
            <h2>Detalle</h2>
          </div>
          <div class="detail-card card">
            @if (currentNovel.genres?.length) {
              <div class="detail-row">
                <span class="detail-label">Géneros</span>
                <div class="chips-block">
                  @for (g of currentNovel.genres; track g.id) {
                    <span class="chip chip-genre">{{ g | genreLabel }}</span>
                  }
                </div>
              </div>
            }

            @if (currentNovel.romanceGenres?.length) {
              <div class="detail-row">
                <span class="detail-label">Romance</span>
                <div class="chips-block">
                  @for (rg of currentNovel.romanceGenres; track rg.id) {
                    <span class="romance-genre-badge">{{ rg.label }}</span>
                  }
                </div>
              </div>
            }

            @if (currentNovel.pairings?.length || pairingTags(currentNovel).length) {
              <div class="detail-row">
                <span class="detail-label">Parejas</span>
                <div class="pairings-block">
                  @for (p of currentNovel.pairings; track p.id) {
                    <span class="pairing-pill" [class.is-main]="p.isMain">
                      @if (p.isMain) {
                        <span class="main-tag">★ Principal</span>
                      }
                      {{ p.characterA.name }} × {{ p.characterB.name }}
                    </span>
                  }
                  @for (pt of pairingTags(currentNovel); track pt) {
                    <span class="pairing-pill">{{ pt }}</span>
                  }
                </div>
              </div>
            }

            @if (nonPairingTags(currentNovel).length) {
              <div class="detail-row">
                <span class="detail-label">Etiquetas</span>
                <div class="chips-block">
                  @for (t of nonPairingTags(currentNovel); track t) {
                    <span class="chip chip-tag">#{{ t }}</span>
                  }
                </div>
              </div>
            }

            @if (currentNovel.warnings?.length) {
              <div class="detail-row">
                <span class="detail-label">Advertencias</span>
                <div class="chips-block">
                  @for (w of currentNovel.warnings; track w) {
                    <span class="chip chip-warning">⚠ {{ w }}</span>
                  }
                </div>
              </div>
            }

            <div class="detail-row">
              <span class="detail-label">Idioma</span>
              <span class="chip chip-meta">{{
                currentNovel.language?.name || currentNovel.language?.code || 'es'
              }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Estado</span>
              <span class="chip chip-meta">{{ currentNovel.status }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Clasificación</span>
              <span class="chip chip-meta">{{ currentNovel.rating }}</span>
            </div>
          </div>
        </section>

        @if (currentNovel.worlds.length && currentNovel.novelType !== 'FANFIC') {
          <section class="related-block">
            <div class="section-head">
              <h2>Mundos vinculados</h2>
              <a routerLink="/mundos">Explorar atlas</a>
            </div>
            <div class="world-grid">
              @for (world of currentNovel.worlds; track world.id) {
                <app-world-card [world]="world" />
              }
            </div>
          </section>
        }

        @if (currentNovel.characters.length || currentNovel.communityCharacters?.length) {
          <section class="related-block">
            <div class="section-head">
              <h2>Personajes</h2>
              <a routerLink="/personajes">Explorar personajes</a>
            </div>

            @if (currentNovel.communityCharacters?.length) {
              @if (currentNovel.novelType === 'FANFIC' && currentNovel.linkedCommunity) {
                <h3 class="char-group-title">Personajes del fandom</h3>
              }
              <div class="character-grid">
                @for (cc of currentNovel.communityCharacters!; track cc.id) {
                  <article class="cc-mini">
                    <div class="avatar">
                      @if (cc.avatarUrl) {
                        <img [src]="cc.avatarUrl" [alt]="cc.name" />
                      } @else {
                        <span>{{ cc.name.charAt(0) }}</span>
                      }
                    </div>
                    <div class="body">
                      <strong>{{ cc.name }}</strong>
                      @if (currentNovel.linkedCommunity) {
                        <span class="canon-badge">
                          Canon de {{ currentNovel.linkedCommunity.name }}
                        </span>
                      }
                    </div>
                  </article>
                }
              </div>
            }

            @if (currentNovel.characters.length) {
              @if (
                currentNovel.novelType === 'FANFIC' && currentNovel.communityCharacters?.length
              ) {
                <h3 class="char-group-title">Personajes originales</h3>
              }
              <div class="character-grid">
                @for (character of currentNovel.characters; track character.id) {
                  <app-character-card [character]="character" />
                }
              </div>
            }
          </section>
        }

        @if (currentNovel.viewerContext?.isAuthor) {
          <section class="related-block">
            <div class="section-head">
              <h2>Timeline</h2>
              @if (timeline()) {
                <a [routerLink]="['/mis-timelines', timeline()!.id]">Abrir timeline completo</a>
              }
            </div>
            @if (timeline(); as tl) {
              <div class="timeline-summary card">
                <h3>{{ tl.name }}</h3>
                @if (tl.description) {
                  <p class="tl-desc">{{ tl.description }}</p>
                }
              </div>
              @if (tl.events.length) {
                <div class="tl-events-list">
                  @for (evt of tl.events; track evt.id) {
                    <div class="tl-event-row">
                      <span class="tl-event-icon">{{ eventTypeIcon(evt.type) }}</span>
                      <div class="tl-event-info">
                        <strong>{{ evt.title }}</strong>
                        @if (evt.dateLabel) {
                          <small>{{ evt.dateLabel }}</small>
                        }
                      </div>
                      <span
                        class="tl-relevance"
                        [class]="'tl-relevance-' + evt.relevance.toLowerCase()"
                        >{{ evt.relevance }}</span
                      >
                    </div>
                  }
                </div>
              }
            } @else {
              <div class="timeline-empty card">
                <p>Organiza la cronologia de tu historia.</p>
                <button
                  type="button"
                  class="tl-create-btn"
                  (click)="createTimeline(currentNovel.slug)"
                >
                  Crear timeline
                </button>
              </div>
            }
          </section>
        }

        <app-linked-visual-boards-section
          [linkedType]="'novel'"
          [linkedId]="currentNovel.id"
          [authorUsername]="currentNovel.author.username"
          [entityLabel]="'novela'"
          [isOwner]="currentNovel.viewerContext?.isAuthor ?? false"
        />

        <section class="novel-comments">
          <h2>Comentarios</h2>

          @if (commentsEnabled()) {
            @if (authService.isAuthenticated()) {
              <div class="comment-form">
                <textarea
                  rows="3"
                  placeholder="Escribe un comentario…"
                  [(ngModel)]="newComment"
                ></textarea>
                <button
                  class="btn-send"
                  [disabled]="commentSending() || !newComment.trim()"
                  (click)="submitComment(currentNovel.slug)"
                >
                  {{ commentSending() ? 'Enviando…' : 'Comentar' }}
                </button>
              </div>
            }

            @if (novelCommentsLoading() && !novelComments().length) {
              <p class="comment-hint">Cargando comentarios…</p>
            } @else if (!novelComments().length) {
              <p class="comment-hint">Aún no hay comentarios. ¡Sé el primero!</p>
            } @else {
              <div class="comments-list">
                @for (c of novelComments(); track c.id) {
                  <div class="comment-item">
                    <div class="comment-avatar">
                      {{ (c.author.displayName || c.author.username).charAt(0).toUpperCase() }}
                    </div>
                    <div class="comment-body">
                      <div class="comment-header">
                        <a class="comment-author" [routerLink]="['/@' + c.author.username]">
                          {{ c.author.displayName || '@' + c.author.username }}
                        </a>
                        <span class="comment-date">{{ relativeDate(c.createdAt) }}</span>
                        @if (currentNovel.viewerContext?.isAuthor) {
                          <button
                            class="comment-delete"
                            title="Eliminar comentario"
                            (click)="removeComment(currentNovel.slug, c.id)"
                          >
                            ✕
                          </button>
                        }
                      </div>
                      <p class="comment-text">{{ c.content }}</p>
                    </div>
                  </div>
                }
              </div>

              @if (commentsHasMore()) {
                <button
                  class="btn-load-more"
                  [disabled]="novelCommentsLoading()"
                  (click)="loadMoreComments(currentNovel.slug)"
                >
                  {{ novelCommentsLoading() ? 'Cargando…' : 'Ver más comentarios' }}
                </button>
              }
            }
          } @else {
            <p class="comment-hint">Los comentarios están desactivados para esta novela.</p>
          }
        </section>

      </section>
    }

    @if (showRecommendPreview()) {
      <div class="recommend-overlay" (click)="closeRecommendPreview()">
        <div class="recommend-modal" (click)="$event.stopPropagation()">
          <h3>{{ 'recommend.modalTitle' | translate }}</h3>

          <div class="recommend-novel-preview">
            @if (novel()?.coverUrl) {
              <img [src]="novel()!.coverUrl!" [alt]="novel()!.title" />
            } @else {
              <div class="preview-cover-placeholder">{{ novel()!.title.charAt(0) }}</div>
            }
            <div class="preview-info">
              <strong>{{ novel()!.title }}</strong>
              <span>por @{{ novel()!.author.username }}</span>
              @if (novel()!.synopsis) {
                <p>{{ novel()!.synopsis! | slice: 0 : 150 }}...</p>
              }
            </div>
          </div>

          <textarea
            [(ngModel)]="recommendMessage"
            rows="3"
            [placeholder]="'recommend.placeholder' | translate"
          ></textarea>

          <div class="recommend-actions">
            <button type="button" class="btn-cancel" (click)="closeRecommendPreview()">
              {{ 'recommend.cancel' | translate }}
            </button>
            <button
              type="button"
              class="btn-confirm"
              [disabled]="recommending()"
              (click)="confirmRecommend()"
            >
              {{
                recommending()
                  ? ('recommend.confirming' | translate)
                  : ('recommend.confirm' | translate)
              }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .detail-shell,
      .meta,
      .card,
      .chapter-list,
      .related-block {
        display: grid;
        gap: 1rem;
      }
      .chapter-list {
        /* Cuando la columna se estira (porque la aside derecha es mas alta),
           los items se reparten en el espacio sobrante. Forzamos top-align. */
        align-content: start;
      }
      .hero,
      .content-grid,
      .section-head {
        display: grid;
        gap: 1.25rem;
      }
      .section-head {
        grid-template-columns: 1fr auto;
        align-items: center;
      }
      .section-head a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .section-head a:hover {
        color: var(--accent);
      }
      .hero {
        grid-template-columns: 220px 1fr;
      }
      .cover,
      .card {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .cover {
        min-height: 320px;
        display: grid;
        place-items: center;
        font-size: 4rem;
      }
      .meta,
      .card {
        padding: 1.25rem;
      }
      .chips,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .author a {
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
      }
      .author a:hover {
        text-decoration: underline;
      }
      .chips span,
      .actions a,
      .actions button,
      .stats span {
        padding: 0.5rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: 0;
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
      .content-grid {
        grid-template-columns: 1fr 280px;
        margin-top: 1.5rem;
      }
      .world-grid,
      .character-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .romance-card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
      }
      .detail-card {
        display: grid;
        gap: 0.75rem;
        padding: 1.25rem;
      }
      .detail-row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 0.75rem;
        align-items: start;
      }
      .detail-label {
        color: var(--text-3);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        padding-top: 0.4rem;
      }
      .chips-block {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        font-size: 0.78rem;
        white-space: nowrap;
      }
      .chip-genre {
        background: var(--accent-glow);
        color: var(--accent-text);
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
      .char-group-title {
        margin: 1rem 0 0.5rem;
        font-size: 0.95rem;
        color: var(--text-2);
      }
      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.75rem;
      }
      .cc-mini {
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 0.5rem;
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
      }
      .cc-mini .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--bg-surface);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .cc-mini .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cc-mini .body {
        display: grid;
        gap: 0.2rem;
      }
      .canon-badge {
        display: inline-block;
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.7rem;
        width: fit-content;
      }
      .chip-tag {
        background: rgba(122, 156, 220, 0.14);
        color: #9bb6e8;
        border: 1px solid rgba(122, 156, 220, 0.3);
      }
      .chip-warning {
        background: rgba(214, 154, 91, 0.12);
        color: #e0b07a;
        border: 1px solid rgba(214, 154, 91, 0.3);
      }
      .chip-meta {
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
      }
      .novel-comments {
        display: grid;
        gap: 1rem;
      }
      .novel-comments h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .comment-form {
        display: grid;
        gap: 0.5rem;
      }
      .comment-form textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        font-family: inherit;
        resize: vertical;
      }
      .comment-form textarea:focus {
        outline: none;
        border-color: var(--accent);
      }
      .btn-send {
        justify-self: end;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #fff;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        min-height: unset;
      }
      .btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .comment-hint {
        color: var(--text-3);
        font-size: 0.85rem;
        text-align: center;
        padding: 1rem;
        margin: 0;
      }
      .comments-list {
        display: grid;
        gap: 0.75rem;
      }
      .comment-item {
        display: flex;
        gap: 0.6rem;
      }
      .comment-avatar {
        width: 2rem;
        height: 2rem;
        min-width: 2rem;
        border-radius: 50%;
        background: var(--accent-glow);
        color: var(--accent-text);
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .comment-body {
        flex: 1;
        min-width: 0;
      }
      .comment-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .comment-author {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--text-1);
        text-decoration: none;
      }
      .comment-author:hover {
        color: var(--accent-text);
      }
      .comment-date {
        color: var(--text-3);
        font-size: 0.78rem;
      }
      .comment-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        min-height: unset;
        border: none;
        border-radius: 50%;
        background: none;
        color: var(--text-3);
        cursor: pointer;
        padding: 0;
      }
      .comment-delete:hover {
        color: #e55;
        background: var(--bg-surface);
      }
      .comment-text {
        margin: 0.2rem 0 0;
        color: var(--text-2);
        font-size: 0.85rem;
        line-height: 1.5;
      }
      .btn-load-more {
        display: block;
        margin: 0 auto;
        padding: 0.5rem 1.2rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-size: 0.85rem;
        min-height: unset;
      }
      .btn-load-more:hover {
        border-color: var(--accent);
      }
      .recommend-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: grid;
        place-items: center;
        z-index: 1000;
        padding: 1rem;
      }
      .recommend-modal {
        display: grid;
        gap: 1rem;
        width: 100%;
        max-width: 480px;
        padding: 1.5rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
      }
      .recommend-modal h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-1);
      }
      .recommend-novel-preview {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .recommend-novel-preview img {
        width: 60px;
        height: 80px;
        border-radius: 0.5rem;
        object-fit: cover;
        flex-shrink: 0;
      }
      .preview-cover-placeholder {
        width: 60px;
        height: 80px;
        border-radius: 0.5rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        display: grid;
        place-items: center;
        font-size: 1.5rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .preview-info {
        display: grid;
        gap: 0.15rem;
        align-content: start;
        min-width: 0;
      }
      .preview-info strong {
        color: var(--text-1);
        font-size: 0.9rem;
      }
      .preview-info span {
        color: var(--text-3);
        font-size: 0.8rem;
      }
      .preview-info p {
        margin: 0;
        color: var(--text-2);
        font-size: 0.8rem;
        line-height: 1.4;
      }
      .recommend-modal textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        resize: vertical;
        font-family: inherit;
      }
      .recommend-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .btn-cancel {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .btn-cancel:hover {
        border-color: var(--accent);
      }
      .btn-confirm {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .btn-confirm:hover {
        box-shadow: 0 0 12px var(--accent-glow);
      }
      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (max-width: 640px) {
        .detail-row {
          grid-template-columns: 1fr;
          gap: 0.4rem;
        }
        .detail-label {
          padding-top: 0;
        }
      }
      .romance-genre-badge {
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        font-weight: 600;
      }
      .pairings-block {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pairing-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        background: rgba(224, 85, 85, 0.12);
        color: #e89a9a;
        border: 1px solid rgba(224, 85, 85, 0.3);
        font-size: 0.85rem;
      }
      .pairing-pill.is-main {
        background: rgba(224, 85, 85, 0.22);
        color: #f0b0b0;
        border-color: rgba(224, 85, 85, 0.55);
        font-weight: 600;
      }
      .pairing-pill .main-tag {
        font-size: 0.7rem;
        opacity: 0.85;
      }
      .chapter-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        text-decoration: none;
        color: var(--text-1);
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--border);
      }
      .timeline-summary,
      .timeline-empty {
        text-align: center;
      }
      .tl-desc {
        color: var(--text-2);
        font-size: 0.85rem;
        margin: 0;
      }
      .tl-count {
        display: inline-block;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.8rem;
        font-weight: 600;
      }
      .timeline-empty p {
        color: var(--text-3);
        margin: 0;
      }
      .tl-create-btn {
        padding: 0.6rem 1.2rem;
        border-radius: 1rem;
        border: 1px dashed var(--border-s);
        background: transparent;
        color: var(--accent-text);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .tl-create-btn:hover {
        background: var(--accent-glow);
      }
      .tl-events-list {
        display: grid;
        gap: 0;
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
      }
      .tl-event-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 1rem;
        border-bottom: 1px solid var(--border);
        background: var(--bg-card);
      }
      .tl-event-row:last-child {
        border-bottom: none;
      }
      .tl-event-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .tl-event-info {
        flex: 1;
        display: grid;
        gap: 0.15rem;
        min-width: 0;
      }
      .tl-event-info strong {
        font-size: 0.85rem;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tl-event-info small {
        font-size: 0.75rem;
        color: var(--text-3);
      }
      .tl-relevance {
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 600;
        flex-shrink: 0;
      }
      .tl-relevance-critical {
        background: rgba(224, 85, 85, 0.15);
        color: #e05555;
      }
      .tl-relevance-major {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      .tl-relevance-minor {
        background: rgba(201, 168, 76, 0.15);
        color: var(--accent-text);
      }
      .tl-relevance-background {
        background: var(--bg-surface);
        color: var(--text-3);
      }
      .tl-see-all {
        display: block;
        text-align: center;
        padding: 0.6rem;
        background: var(--bg-surface);
        color: var(--accent-text);
        font-size: 0.8rem;
        text-decoration: none;
      }
      .tl-see-all:hover {
        background: var(--accent-glow);
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
      @media (max-width: 900px) {
        .hero,
        .content-grid,
        .world-grid,
        .character-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NovelDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelsService = inject(NovelsService);
  private readonly kudosService = inject(KudosService);
  private readonly subscriptionsService = inject(SubscriptionsService);
  private readonly readingListsService = inject(ReadingListsService);
  private readonly timelineService = inject(TimelineService);
  readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly novel = signal<NovelDetail | null>(null);
  readonly timeline = signal<TimelineDetail | null>(null);
  readonly readingLists = signal<ReadingList[]>([]);
  readonly showListsMenu = signal(false);
  readonly listMembership = signal(new Set<string>());
  readonly listsLoading = signal(false);
  readonly listsError = signal<string | null>(null);
  readonly listsMessage = signal<string | null>(null);
  readonly listActionId = signal<string | null>(null);
  readonly kudoLoading = signal(false);
  readonly kudoBeat = signal(false);
  readonly recommending = signal(false);
  readonly recommended = signal(false);
  readonly showRecommendPreview = signal(false);
  recommendMessage = '';

  readonly novelComments = signal<import('../../core/services/novels.service').NovelCommentModel[]>(
    [],
  );
  readonly novelCommentsLoading = signal(false);
  readonly commentsCursor = signal<string | null>(null);
  readonly commentsHasMore = signal(false);
  readonly commentsEnabled = signal(true);
  readonly commentSending = signal(false);
  newComment = '';
  readonly subscribeLoading = signal(false);

  toggleSubscription() {
    const novel = this.novel();
    if (!novel) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const ctx = novel.viewerContext;
    if (!ctx) return;

    const wasSubscribed = ctx.isSubscribed;
    // Optimistic
    this.novel.set({
      ...novel,
      stats: {
        ...novel.stats,
        subscribersCount: novel.stats.subscribersCount + (wasSubscribed ? -1 : 1),
      },
      viewerContext: { ...ctx, isSubscribed: !wasSubscribed },
    });
    this.subscribeLoading.set(true);
    const action = wasSubscribed
      ? this.subscriptionsService.unsubscribe(novel.slug)
      : this.subscriptionsService.subscribe(novel.slug);

    action.subscribe({
      next: (res) => {
        const latest = this.novel();
        if (!latest) return;
        this.novel.set({
          ...latest,
          stats: { ...latest.stats, subscribersCount: res.subscribersCount },
          viewerContext: latest.viewerContext
            ? { ...latest.viewerContext, isSubscribed: res.isSubscribed }
            : null,
        });
        this.subscribeLoading.set(false);
      },
      error: () => {
        // Rollback
        const latest = this.novel();
        if (latest) {
          this.novel.set({
            ...latest,
            stats: {
              ...latest.stats,
              subscribersCount: novel.stats.subscribersCount,
            },
            viewerContext: latest.viewerContext
              ? { ...latest.viewerContext, isSubscribed: wasSubscribed }
              : null,
          });
        }
        this.subscribeLoading.set(false);
      },
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        return;
      }

      this.error.set(false);
      this.showListsMenu.set(false);
      this.listsError.set(null);
      this.listsMessage.set(null);
      this.listActionId.set(null);
      this.readingLists.set([]);
      this.listMembership.set(new Set<string>());
      this.loading.set(true);
      this.timeline.set(null);
      this.novelsService.getBySlug(slug).subscribe({
        next: (novel) => {
          this.novel.set(novel);
          this.loadComments(slug, true);
          if (this.authService.isAuthenticated()) {
            this.loadReadingLists(novel.id);
            if (novel.viewerContext?.isAuthor) {
              this.loadTimeline(novel.slug);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  toggleBookmark() {
    const novel = this.novel();
    if (!novel) {
      return;
    }

    this.novelsService.toggleBookmark(novel.slug).subscribe((response) => {
      this.novel.set({
        ...novel,
        stats: {
          ...novel.stats,
          bookmarksCount: novel.stats.bookmarksCount + (response.hasBookmarked ? 1 : -1),
        },
        viewerContext: novel.viewerContext
          ? { ...novel.viewerContext, hasBookmarked: response.hasBookmarked }
          : null,
      });
    });
  }

  toggleKudo() {
    const novel = this.novel();
    if (!novel) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.kudoLoading.set(true);
    const action = novel.viewerContext?.hasKudo
      ? this.kudosService.removeKudo(novel.slug)
      : this.kudosService.addKudo(novel.slug);

    action.subscribe({
      next: (response) => {
        this.novel.set({
          ...novel,
          stats: { ...novel.stats, kudosCount: response.kudosCount },
          viewerContext: novel.viewerContext
            ? { ...novel.viewerContext, hasKudo: response.hasKudo }
            : null,
        });
        if (response.hasKudo) {
          this.kudoBeat.set(true);
          setTimeout(() => this.kudoBeat.set(false), 300);
        }
        this.kudoLoading.set(false);
      },
      error: () => this.kudoLoading.set(false),
    });
  }

  toggleListsMenu() {
    if (this.listsLoading()) {
      return;
    }

    this.showListsMenu.update((value) => !value);
  }

  toggleListMembership(list: ReadingList) {
    const novel = this.novel();
    if (!novel || this.listActionId()) {
      return;
    }

    const alreadyIncluded = this.listMembership().has(list.id);
    this.listActionId.set(list.id);
    this.listsError.set(null);
    this.listsMessage.set(null);

    if (alreadyIncluded) {
      this.readingListsService
        .removeItem(list.id, novel.id)
        .pipe(finalize(() => this.listActionId.set(null)))
        .subscribe({
          next: () => {
            this.listsMessage.set(`"${list.name}" actualizada.`);
            this.loadReadingLists(novel.id, false);
          },
          error: () => {
            this.listsError.set('No se pudo quitar la novela de la lista.');
          },
        });
      return;
    }

    this.readingListsService
      .addItem(list.id, { novel_id: novel.id })
      .pipe(finalize(() => this.listActionId.set(null)))
      .subscribe({
        next: () => {
          this.listsMessage.set(`"${list.name}" actualizada.`);
          this.loadReadingLists(novel.id, false);
        },
        error: () => {
          this.listsError.set('No se pudo guardar la novela en la lista.');
        },
      });
  }

  eventTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      WORLD_EVENT: '\u{1F30D}',
      STORY_EVENT: '\u{1F4D6}',
      CHARACTER_ARC: '\u{1F3AD}',
      CHAPTER_EVENT: '\u{1F4C4}',
      LORE_EVENT: '\u{1F4DC}',
      NOTE: '\u{1F4DD}',
    };
    return icons[type] || '\u{1F4CC}';
  }

  romanceGenreLabel(value: string | null): string {
    return value ?? '';
  }

  private isPairingTag(tag: string): boolean {
    if (!tag.includes('/')) return false;
    const parts = tag.split('/');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }

  private prettifyName(s: string): string {
    return s
      .split('-')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  pairingTags(novel: { tags?: string[] | null }): string[] {
    return (novel.tags ?? [])
      .filter((t) => this.isPairingTag(t))
      .map((t) => {
        const [a, b] = t.split('/');
        return `${this.prettifyName(a)} × ${this.prettifyName(b)}`;
      });
  }

  nonPairingTags(novel: { tags?: string[] | null }): string[] {
    return (novel.tags ?? []).filter((t) => !this.isPairingTag(t));
  }

  createTimeline(novelSlug: string) {
    this.timelineService.getByNovelSlug(novelSlug).subscribe({
      next: (tl) => this.timeline.set(tl),
    });
  }

  private loadTimeline(novelSlug: string) {
    this.timelineService.getByNovelSlug(novelSlug).subscribe({
      next: (detail) => this.timeline.set(detail),
      error: () => this.timeline.set(null),
    });
  }

  private loadReadingLists(novelId: string, showLoader = true) {
    if (showLoader) {
      this.listsLoading.set(true);
    }

    this.listsError.set(null);
    this.readingListsService
      .listMine(novelId)
      .pipe(finalize(() => this.listsLoading.set(false)))
      .subscribe({
        next: (lists) => {
          this.readingLists.set(lists);
          this.listMembership.set(
            new Set(lists.filter((list) => list.contains_novel).map((list) => list.id)),
          );
        },
        error: () => {
          this.readingLists.set([]);
          this.listMembership.set(new Set<string>());
          this.listsError.set('No se pudieron cargar tus listas.');
        },
      });
  }

  openRecommendPreview() {
    const n = this.novel();
    if (!n) return;
    this.recommendMessage = `Recomiendo "${n.title}" de @${n.author.username}`;
    this.showRecommendPreview.set(true);
  }

  closeRecommendPreview() {
    this.showRecommendPreview.set(false);
  }

  confirmRecommend() {
    const n = this.novel();
    if (!n || this.recommending()) return;
    this.recommending.set(true);
    this.postsService
      .create({
        content: this.recommendMessage.trim() || `Recomiendo "${n.title}"`,
        type: 'RECOMMENDATION',
        novel_id: n.id,
      })
      .subscribe({
        next: () => {
          this.recommending.set(false);
          this.recommended.set(true);
          this.showRecommendPreview.set(false);
        },
        error: () => {
          this.recommending.set(false);
        },
      });
  }

  // ── Novel Comments ──

  loadComments(slug: string, reset: boolean) {
    this.novelCommentsLoading.set(true);
    this.novelsService.listComments(slug, reset ? null : this.commentsCursor(), 20).subscribe({
      next: (res) => {
        const list = reset ? res.data : [...this.novelComments(), ...res.data];
        this.novelComments.set(list);
        this.commentsCursor.set(res.pagination.nextCursor);
        this.commentsHasMore.set(res.pagination.hasMore);
        this.commentsEnabled.set(res.commentsEnabled);
        this.novelCommentsLoading.set(false);
      },
      error: () => this.novelCommentsLoading.set(false),
    });
  }

  loadMoreComments(slug: string) {
    this.loadComments(slug, false);
  }

  submitComment(slug: string) {
    if (!this.newComment.trim() || this.commentSending()) return;
    this.commentSending.set(true);
    this.novelsService.createComment(slug, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.novelComments.update((list) => [...list, comment]);
        this.newComment = '';
        this.commentSending.set(false);
      },
      error: () => this.commentSending.set(false),
    });
  }

  removeComment(slug: string, commentId: string) {
    this.novelsService.deleteComment(slug, commentId).subscribe({
      next: () => {
        this.novelComments.update((list) => list.filter((c) => c.id !== commentId));
      },
    });
  }

  relativeDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
