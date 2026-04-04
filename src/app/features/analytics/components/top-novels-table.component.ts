import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SparklineChartComponent } from './sparkline-chart.component';

export interface TopNovelRow {
  novel: { id: string; title: string; slug: string; coverUrl?: string | null };
  views: number;
  likes: number;
  readers: number;
  completionRate: number;
  sparkValues?: number[];
}

@Component({
  selector: 'app-top-novels-table',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SparklineChartComponent],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-title">Novela</th>
            <th class="col-num">Vistas</th>
            <th class="col-num">Likes</th>
            <th class="col-num">Lectores</th>
            <th class="col-num">Completado</th>
            <th class="col-spark">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          @for (row of novels(); track row.novel.id) {
            <tr class="row" [routerLink]="'/analytics/novelas/' + row.novel.slug">
              <td class="col-title">
                <span class="novel-name">{{ row.novel.title }}</span>
              </td>
              <td class="col-num">{{ row.views | number }}</td>
              <td class="col-num">{{ row.likes | number }}</td>
              <td class="col-num">{{ row.readers | number }}</td>
              <td class="col-num">{{ row.completionRate }}%</td>
              <td class="col-spark">
                @if (row.sparkValues && row.sparkValues.length > 1) {
                  <app-sparkline-chart [values]="row.sparkValues" />
                } @else {
                  <span class="no-data">-</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      border-bottom: 1px solid var(--border);
    }
    th {
      text-align: left;
      padding: 12px 16px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 14px 16px;
      font-size: 0.9rem;
      color: var(--text-1);
      border-bottom: 1px solid var(--border);
    }
    .row {
      cursor: pointer;
      transition: background 0.15s;
    }
    .row:hover {
      background: var(--bg-surface);
    }
    .row:last-child td {
      border-bottom: none;
    }
    .col-num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    th.col-num { text-align: right; }
    .col-spark {
      width: 100px;
      min-width: 80px;
    }
    .novel-name {
      font-weight: 500;
    }
    .no-data {
      color: var(--text-3);
    }
  `,
})
export class TopNovelsTableComponent {
  readonly novels = input.required<TopNovelRow[]>();
}
