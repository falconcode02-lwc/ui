import {
  Component,
  signal,
  Input,
  Output,
  EventEmitter,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import type { LanguageDescription } from '@codemirror/language';
import { minimalLanguages } from '../../helpers/minimal-languages';
import { CodeEditorModule } from '@acrodata/code-editor';
import { javascript } from '@codemirror/lang-javascript';
export interface KeyValuePair {
  id: string;
  key: string;
  value: any;
  selectOptions?: string[]; // For select type
  visible?: boolean; // Controls visibility in UI (default: true)
}

export type ValueControlType = 'text' | 'select' | 'codeeditor' | 'checkbox';

@Component({
  selector: 'app-key-value-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzCheckboxModule,
    NzCardModule,
    NzToolTipModule,
    CodeEditorModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="key-value-builder">
      <div class="builder-header">
        <h3>{{ title }}</h3>
        <button
          type="button"
          nz-button
          nzType="primary"
          nzSize="small"
          (click)="addPair()"
          nz-tooltip
          nzTooltipTitle="Add new key-value pair"
        >
          <nz-icon nzType="plus"></nz-icon>
          Add
        </button>
      </div>

      <div class="pairs-container">
        @if (pairs().length === 0) {
        <div class="empty-state">
          <nz-icon nzType="inbox" class="empty-icon"></nz-icon>
          <p>No items added yet. Click "Add" to create a new key-value pair.</p>
        </div>
        } @for (pair of pairs(); track pair.id) { @if (pair.visible !== false) {
        <ng-template #extraTemplate>
          <button
            type="button"
            nz-button
            nzType="text"
            nzDanger
            class="delete-btn"
            (click)="removePair(pair.id)"
            nz-tooltip
            nzTooltipTitle="Remove this pair"
          >
            <nz-icon nzType="delete"></nz-icon>
          </button>
        </ng-template>
        <nz-card
          class="pair-card"
          nzTitle="{{ pair.key }}"
          [nzSize]="'small'"
          [nzExtra]="extraTemplate"
        >
          <div class="pair-content">
            <!-- Key Input -->
            <div class="pair-field key-field">
              <label>Key</label>
              <input
                nz-input
                [(ngModel)]="pair.key"
                placeholder="Enter key name"
                (ngModelChange)="onPairChange()"
              />
            </div>

            <!-- Value Input (Based on Type) -->
            <div class="pair-field value-field">
              <label>Value</label>

              <!-- Text Input -->
              @if (valueControlType === 'text') {
              <input
                nz-input
                [(ngModel)]="pair.value"
                placeholder="Enter value"
                (ngModelChange)="onPairChange()"
              />
              }

              <!-- Select Dropdown -->
              @if (valueControlType === 'select') {
              <div class="select-container">
                <nz-select
                  [(ngModel)]="pair.value"
                  nzPlaceHolder="Select value"
                  nzShowSearch
                  (ngModelChange)="onPairChange()"
                >
                  @for (option of pair.selectOptions; track option) {
                  <nz-option [nzValue]="option" [nzLabel]="option"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="dashed"
                  nzSize="small"
                  (click)="configureSelectOptions(pair)"
                  nz-tooltip
                  nzTooltipTitle="Configure dropdown options"
                >
                  <nz-icon nzType="setting"></nz-icon>
                </button>
              </div>
              }

              <!-- Code Editor -->
              @if (valueControlType === 'codeeditor') {
              <div class="code-editor-container">
                <div class="editor-wrapper">
                  <code-editor
                    [style.height]="'180px'"
                    [theme]="options.theme"
                    [setup]="options.setup"
                    [disabled]="options.disabled"
                    [readonly]="options.readonly"
                    [placeholder]="options.placeholder"
                    [indentWithTab]="options.indentWithTab"
                    [extensions]="extensions"
                    [indentUnit]="options.indentUnit"
                    [lineWrapping]="options.lineWrapping"
                    [highlightWhitespace]="options.highlightWhitespace"
                    [language]="options.language"
                    [(ngModel)]="pair.value"
                    [languages]="languages"
                    (ngModelChange)="onPairChange()"
                  />
                  <!-- <app-editor
                    [language]="language || 'javascript'"
                    [(ngModel)]="pair.value"
                    (ngModelChange)="onPairChange()"
                  ></app-editor> -->
                </div>
              </div>
              }

              <!-- Checkbox -->
              @if (valueControlType === 'checkbox') {
              <label
                nz-checkbox
                [(ngModel)]="pair.value"
                (ngModelChange)="onPairChange()"
              >
                Enabled
              </label>
              }
            </div>

            <!-- Delete Button -->
          </div>
        </nz-card>
        } }
      </div>
    </div>

    <!-- Modal for configuring select options -->
    @if (editingSelectPair()) {
    <div class="modal-overlay" (click)="closeSelectOptionsModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4>Configure Dropdown Options</h4>
          <button
            type="button"
            nz-button
            nzType="text"
            (click)="closeSelectOptionsModal()"
          >
            <nz-icon nzType="close"></nz-icon>
          </button>
        </div>
        <div class="modal-body">
          <label>Options (one per line)</label>
          <textarea
            nz-input
            [(ngModel)]="selectOptionsText"
            [nzAutosize]="{ minRows: 5, maxRows: 15 }"
            placeholder="Enter options, one per line&#10;Example:&#10;Option 1&#10;Option 2&#10;Option 3"
          >
          </textarea>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            nz-button
            nzType="default"
            (click)="closeSelectOptionsModal()"
          >
            Cancel
          </button>
          <button
            type="button"
            nz-button
            nzType="primary"
            (click)="saveSelectOptions()"
          >
            Save Options
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .key-value-builder {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .pairs-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        // max-height: 600px;
        overflow-y: auto;
        padding: 4px;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--text-secondary);

        .empty-icon {
          font-size: 48px;
          opacity: 0.5;
          margin-bottom: 16px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .pair-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);

        &:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .pair-content {
        display: grid;
        // grid-template-columns: 1fr 2fr auto;
        // gap: 12px;
        align-items: start;
      }

      .pair-field {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
      }

      .select-container {
        display: flex;
        gap: 8px;
        align-items: center;

        nz-select {
          flex: 1;
        }
      }

      .code-editor-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;

        .editor-toolbar {
          display: flex;
          justify-content: flex-end;

          nz-select {
            width: 150px;
          }
        }

        .editor-wrapper {
          height: 200px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          overflow: hidden;
        }
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--bg-primary);
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-color);

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .modal-body {
        padding: 24px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-primary);
        }

        textarea {
          width: 100%;
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .pair-content {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .delete-btn {
          margin-top: 0;
        }
      }
    `,
  ],
})
export class KeyValueBuilderComponent implements OnInit {
  @Input() title: string = 'Key-Value Pairs';
  @Input() initialPairs: KeyValuePair[] = [];
  @Input() valueControlType: ValueControlType = 'text'; // Controlled from parent
  @Input() language: string = 'javascript'; // For code editor type
  @Output() pairsChange = new EventEmitter<KeyValuePair[]>();

  pairs = signal<KeyValuePair[]>([]);
  editingSelectPair = signal<KeyValuePair | null>(null);
  selectOptionsText: string = '';

  // Code editor options
  options: any = {
    theme: 'dark',
    language: 'javascript',
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    setup: {
      lineNumbers: 'on',
    },
    disabled: false,
    readonly: false,
    placeholder: 'Enter code here...',
    indentWithTab: true,
    indentUnit: '2',
    lineWrapping: true,
    highlightWhitespace: true,
  };

  extensions = [javascript()];
  languages: LanguageDescription[] = minimalLanguages;

  ngOnInit() {
    if (this.initialPairs && this.initialPairs.length > 0) {
      this.pairs.set([...this.initialPairs]);
    }
  }

  addPair() {
    const newPair: KeyValuePair = {
      id: this.generateId(),
      key: '',
      value: this.getDefaultValue(),
      selectOptions: [],
    };

    this.pairs.update((pairs) => [...pairs, newPair]);
    this.onPairChange();
  }

  removePair(id: string) {
    this.pairs.update((pairs) => pairs.filter((p) => p.id !== id));
    this.onPairChange();
  }

  getDefaultValue(): any {
    switch (this.valueControlType) {
      case 'checkbox':
        return false;
      case 'text':
      case 'select':
      case 'codeeditor':
      default:
        return '';
    }
  }

  configureSelectOptions(pair: KeyValuePair) {
    this.editingSelectPair.set(pair);
    this.selectOptionsText = (pair.selectOptions || []).join('\n');
  }

  saveSelectOptions() {
    const pair = this.editingSelectPair();
    if (pair) {
      pair.selectOptions = this.selectOptionsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Reset value if it's not in the new options
      if (pair.value && !pair.selectOptions.includes(pair.value)) {
        pair.value = '';
      }

      this.onPairChange();
    }
    this.closeSelectOptionsModal();
  }

  closeSelectOptionsModal() {
    this.editingSelectPair.set(null);
    this.selectOptionsText = '';
  }

  onPairChange() {
    this.pairsChange.emit(this.pairs());
  }

  getPairsAsObject(): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    this.pairs().forEach((pair) => {
      if (pair.key) {
        result[pair.key] = pair.value;
      }
    });
    return result;
  }

  getPairsAsArray(): KeyValuePair[] {
    return this.pairs();
  }

  private generateId(): string {
    return `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
