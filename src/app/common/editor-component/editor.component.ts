import { Component, AfterViewInit, ViewChild, ElementRef, Input, forwardRef } from '@angular/core';
import * as monaco from 'monaco-editor';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'app-editor',
    standalone: true,
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MonacoEditorComponent),
            multi: true
        }
    ]
})
export class MonacoEditorComponent implements AfterViewInit, ControlValueAccessor {
    @ViewChild('editorContainer') editorContainer!: ElementRef;

    @Input() language: string = 'javascript';
    @Input() theme: string = 'vs-dark';
    @Input() fontSize: number = 14;
    @Input() readOnly: boolean = false;
    @Input() minimap: boolean = true;

    private _value = '';
    editor!: monaco.editor.IStandaloneCodeEditor;

    onChange = (value: string) => { };
    onTouched = () => { };

    writeValue(value: string): void {
        this._value = value || '';
        if (this.editor) {
            this.editor.setValue(this._value);
        }
    }

    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
    setDisabledState(isDisabled: boolean) { this.editor?.updateOptions({ readOnly: isDisabled }); }

    ngAfterViewInit() {
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
            value: this._value,
            language: this.language,
            theme: this.theme,
            automaticLayout: true,
            fontSize: this.fontSize,
            readOnly: this.readOnly,
            minimap: { enabled: this.minimap },
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto', // or 'indentation'
            showFoldingControls: 'always', // 'always' | 'mouseover'
        });

        this.editor.onDidChangeModelContent(() => {
            const val = this.editor.getValue();
            this._value = val;
            this.onChange(val);
            this.onTouched();
        });
    }

    // ✅ Update options dynamically if inputs change
    ngOnChanges() {
        if (this.editor) {
            monaco.editor.setModelLanguage(this.editor.getModel()!, this.language);
            monaco.editor.setTheme(this.theme);
            this.editor.updateOptions({
                fontSize: this.fontSize,
                readOnly: this.readOnly,
                minimap: { enabled: this.minimap }
            });
        }
    }
}
