import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WbEntryLink } from '../../../../core/models/wb-entry.model';

@Component({
  selector: 'app-wb-link-graph',
  standalone: true,
  imports: [],
  template: `
    <div class="graph-container">
      <svg [attr.viewBox]="'0 0 ' + svgWidth + ' ' + svgHeight" class="graph-svg">
        <!-- Lines -->
        @for (node of nodePositions(); track node.slug) {
          <line
            [attr.x1]="centerX"
            [attr.y1]="centerY"
            [attr.x2]="node.x"
            [attr.y2]="node.y"
            [attr.stroke]="node.color"
            stroke-width="1.5"
            opacity="0.4"
          />
        }

        <!-- Central node -->
        <circle
          [attr.cx]="centerX"
          [attr.cy]="centerY"
          r="28"
          fill="var(--accent-glow)"
          stroke="var(--accent-text)"
          stroke-width="2"
        />
        <text
          [attr.x]="centerX"
          [attr.y]="centerY"
          text-anchor="middle"
          dominant-baseline="central"
          fill="var(--accent-text)"
          font-size="10"
          font-weight="600"
        >
          {{ truncate(centralEntry().name, 10) }}
        </text>

        <!-- Connected nodes -->
        @for (node of nodePositions(); track node.slug) {
          <g class="node-group" (click)="navigateToEntry(node.slug)" style="cursor:pointer;">
            <circle
              [attr.cx]="node.x"
              [attr.cy]="node.y"
              r="22"
              [attr.fill]="node.color + '33'"
              [attr.stroke]="node.color"
              stroke-width="1.5"
            />
            <text
              [attr.x]="node.x"
              [attr.y]="node.y - 4"
              text-anchor="middle"
              dominant-baseline="central"
              fill="var(--text-1)"
              font-size="8"
              font-weight="500"
            >
              {{ truncate(node.name, 9) }}
            </text>
            <text
              [attr.x]="node.x"
              [attr.y]="node.y + 8"
              text-anchor="middle"
              dominant-baseline="central"
              fill="var(--text-3)"
              font-size="6"
            >
              {{ truncate(node.relation, 12) }}
            </text>

            <!-- Tooltip on hover via title -->
            <title>{{ node.relation }}: {{ node.name }}</title>
          </g>
        }
      </svg>
    </div>
  `,
  styles: [
    `
      .graph-container {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }
      .graph-svg {
        width: 100%;
        height: auto;
        min-height: 14rem;
      }
      .node-group:hover circle {
        stroke-width: 2.5;
        filter: brightness(1.2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WbLinkGraphComponent {
  private readonly router = inject(Router);

  readonly centralEntry = input.required<{ name: string; slug: string }>();
  readonly links = input.required<WbEntryLink[]>();
  readonly worldSlug = input.required<string>();

  readonly svgWidth = 400;
  readonly svgHeight = 280;
  readonly centerX = 200;
  readonly centerY = 140;
  readonly radius = 100;

  readonly nodePositions = computed(() => {
    const items = this.links();
    if (!items.length) return [];
    const angleStep = (2 * Math.PI) / items.length;
    return items.map((link, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return {
        x: this.centerX + this.radius * Math.cos(angle),
        y: this.centerY + this.radius * Math.sin(angle),
        name: link.entry.name,
        slug: link.entry.slug,
        relation: link.relation,
        color: link.entry.category.color || '#7b8fc2',
      };
    });
  });

  truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  navigateToEntry(entrySlug: string) {
    void this.router.navigate(['/mundos', this.worldSlug(), 'lore', entrySlug]);
  }
}
