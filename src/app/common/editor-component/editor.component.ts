import {
  Component,
  AfterViewInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  forwardRef,
} from "@angular/core";
import * as monaco from "monaco-editor";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";

@Component({
  selector: "app-editor",
  standalone: true,
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.css"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorComponent),
      multi: true,
    },
  ],
})
export class MonacoEditorComponent
  implements AfterViewInit, OnChanges, ControlValueAccessor
{
  @ViewChild("editorContainer") editorContainer!: ElementRef;

  @Input() language: string = "java";
  @Input() theme: string = "vs-dark";
  @Input() fontSize: number = 14;
  @Input() readOnly: boolean = false;
  @Input() minimap: boolean = true;

  private _value = "";
  editor!: monaco.editor.IStandaloneCodeEditor;

  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string): void {
    this._value = value || "";
    if (this.editor) {
      this.editor.setValue(this._value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean) {
    this.editor?.updateOptions({ readOnly: isDisabled });
  }

  ngAfterViewInit() {
    console.log("Monaco Editor - Initializing with language:", this.language);

    this.defineCustomTheme();

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this._value,
      language: this.language,
      theme: "falcon-dark",
      automaticLayout: true,
      fontSize: this.fontSize,
      readOnly: this.readOnly,
      minimap: { enabled: this.minimap },
      folding: true,
      foldingHighlight: true,
      foldingStrategy: "auto",
      showFoldingControls: "always",
    });

    console.log(
      "Monaco Editor - Created with model language:",
      this.editor.getModel()?.getLanguageId()
    );

    this.editor.onDidChangeModelContent(() => {
      const val = this.editor.getValue();
      this._value = val;
      this.onChange(val);
      this.onTouched();
    });

    // Register custom Java autocomplete for FalconFlow annotations
    if (this.language === "java") {
      this.registerJavaCompletions();
    }
  }

  private defineCustomTheme() {
    monaco.editor.defineTheme("falcon-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "type", foreground: "4EC9B0" }, // Datatypes (Cyan)
        { token: "keyword", foreground: "C586C0" }, // Keywords (Purple)
        { token: "string", foreground: "CE9178" }, // Strings (Orange/Red)
        { token: "comment", foreground: "6A9955" }, // Comments (Green)
        { token: "number", foreground: "B5CEA8" }, // Numbers (Light Green)
        { token: "annotation", foreground: "DCDCAA" }, // Annotations (Yellow)
        { token: "identifier.class", foreground: "4EC9B0" }, // Class names
        { token: "identifier.method", foreground: "DCDCAA" }, // Method names
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#D4D4D4",
        "editorCursor.foreground": "#AEAFAD",
        "editor.lineHighlightBackground": "#2F3337",
        "editorLineNumber.foreground": "#858585",
        "editor.selectionBackground": "#264F78",
      },
    });
  }

  /**
   * Register custom autocomplete suggestions for FalconFlow Java annotations
   */
  private registerJavaCompletions() {
    monaco.languages.registerCompletionItemProvider("java", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: "@FResource",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              '@FResource(name="${1:Resource Name}", description="${2:Description}")',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              "FalconFlow Resource annotation - Defines a resource/function in a plugin",
            detail: "FalconFlow Annotation",
            range: range,
          },
          {
            label: "@FPlugin",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "@FPlugin",
            documentation:
              "FalconFlow Plugin annotation - Marks a class as a FalconFlow plugin",
            detail: "FalconFlow Annotation",
            range: range,
          },
          {
            label: "@FParam",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              '@FParam(value="${1:paramName}", description="${2:Parameter description}", required=false)',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              "FalconFlow Parameter annotation - Defines a parameter for a resource method",
            detail: "FalconFlow Annotation",
            range: range,
          },
        ];

        return { suggestions };
      },
    });
  }

  // ✅ Update options dynamically if inputs change
  ngOnChanges() {
    if (this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel()!, this.language);
      monaco.editor.setTheme("falcon-dark");
      this.editor.updateOptions({
        fontSize: this.fontSize,
        readOnly: this.readOnly,
        minimap: { enabled: this.minimap },
      });
    }
  }
}
