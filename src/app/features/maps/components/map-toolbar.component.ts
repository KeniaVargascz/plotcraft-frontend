import { ChangeDetectionStrategy, Component, input, output, HostListener } from '@angular/core';

export type MapTool = 'pan' | 'marker' | 'region' | 'select';

interface ToolDef {
  id: MapTool | 'zoomIn' | 'zoomOut' | 'reset';
  icon: string;
  shortcut: string;
  label: string;
}

const TOOLS: ToolDef[] = [
  { id: 'pan', icon: '\u{1F590}', shortcut: 'P', label: 'Pan' },
  { id: 'marker', icon: '\u{1F4CD}', shortcut: 'M', label: 'Marker' },
  { id: 'region', icon: '\u2B21', shortcut: 'R', label: 'Region' },
  { id: 'select', icon: '\u2196', shortcut: 'S', label: 'Select' },
  { id: 'zoomIn', icon: '+', shortcut: '', label: 'Zoom In' },
  { id: 'zoomOut', icon: '\u2212', shortcut: '', label: 'Zoom Out' },
  { id: 'reset', icon: '0', shortcut: '', label: 'Reset' },
];

@Component({
  selector: 'app-map-toolbar',
  standalone: true,
  template: `
    <div class="toolbar">
      @for (tool of tools; track tool.id) {
        <button
          type="button"
          class="tool-btn"
          [class.active]="activeTool() === tool.id"
          [title]="tool.label + (tool.shortcut ? ' (' + tool.shortcut + ')' : '')"
          (click)="onToolClick(tool.id)"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      background: var(--surface-card, #1e1e2e);
      border-radius: 8px;
      border: 1px solid var(--border-color, #2a2a3a);
    }
    .tool-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--text-secondary, #aaa);
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.15s ease;
    }
    .tool-btn:hover {
      background: var(--surface-hover, #2a2a3a);
      color: var(--text-primary, #eee);
    }
    .tool-btn.active {
      background: var(--accent, #8b5cf6);
      color: #fff;
      border-color: var(--accent, #8b5cf6);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapToolbarComponent {
  readonly activeTool = input<string>('pan');
  readonly toolChange = output<string>();

  readonly tools = TOOLS;

  onToolClick(id: string): void {
    this.toolChange.emit(id);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;

    const key = event.key.toUpperCase();
    const mapping: Record<string, string> = { P: 'pan', M: 'marker', R: 'region', S: 'select' };

    if (mapping[key]) {
      event.preventDefault();
      this.toolChange.emit(mapping[key]);
    }
  }
}
