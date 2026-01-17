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
import {
  IntellisenseService,
  IntellisenseMetadata,
  ClassMetadata,
  MethodMetadata,
  AnnotationMetadata,
} from "../../service/intellisense.service";

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
  private intellisenseMetadata: IntellisenseMetadata | null = null;

  constructor(private intellisenseService: IntellisenseService) {}

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
      this.editor.getModel()?.getLanguageId(),
    );

    this.editor.onDidChangeModelContent(() => {
      const val = this.editor.getValue();
      this._value = val;
      this.onChange(val);
      this.onTouched();
    });

    // Register custom Java autocomplete for FalconFlow annotations
    if (this.language === "java") {
      // Load intellisense metadata from API
      this.intellisenseService.getIntellisenseMetadata().subscribe({
        next: (metadata) => {
          this.intellisenseMetadata = metadata;
          this.registerJavaCompletions();
        },
        error: (err) => {
          console.error("Failed to load intellisense metadata:", err);
          // Fallback to empty metadata
          this.intellisenseMetadata = { classes: [], annotations: [] };
          this.registerJavaCompletions();
        },
      });
    }
  }

  private defineCustomTheme() {
    monaco.editor.defineTheme("falcon-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        // Data types (String, int, boolean, Map, etc.) - Bright Cyan
        { token: "type", foreground: "4EC9B0", fontStyle: "bold" },
        { token: "type.identifier", foreground: "4EC9B0" },

        // Keywords (if, else, return, public, private, etc.) - Blue (C# style)
        { token: "keyword", foreground: "569CD6", fontStyle: "bold" },

        // Method names - Yellow/Gold
        { token: "identifier.method", foreground: "DCDCAA" },
        { token: "method", foreground: "DCDCAA" },

        // Class names - Cyan (same as types)
        { token: "identifier.class", foreground: "4EC9B0" },
        { token: "class.name", foreground: "4EC9B0" },

        // Annotations (@FPlugin, @Override, etc.) - Yellow (C# style)
        { token: "annotation", foreground: "D7BA7D", fontStyle: "bold" },
        { token: "meta", foreground: "D7BA7D" },

        // Strings - Orange
        { token: "string", foreground: "CE9178" },

        // Numbers - Light Green
        { token: "number", foreground: "B5CEA8" },

        // Comments - Green, Italic
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },

        // Variables - White (C# style - local variables are white)
        { token: "variable", foreground: "D4D4D4" },
        { token: "identifier", foreground: "D4D4D4" },

        // Properties/Fields - White (C# style)
        { token: "variable.property", foreground: "D4D4D4" },
        { token: "property", foreground: "D4D4D4" },
        { token: "field", foreground: "D4D4D4" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#D4D4D4",
        "editorCursor.foreground": "#AEAFAD",
        "editor.lineHighlightBackground": "#2F3337",
        "editorLineNumber.foreground": "#858585",
        "editor.selectionBackground": "#264F78",
        "editorSuggestWidget.background": "#252526",
        "editorSuggestWidget.border": "#454545",
        "editorSuggestWidget.selectedBackground": "#094771",
      },
    });
  }

  /**
   * Register custom autocomplete suggestions for FalconFlow Java annotations
   */
  private registerJavaCompletions() {
    monaco.languages.registerCompletionItemProvider("java", {
      triggerCharacters: ["."],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Check if we're after a dot (member access)
        const memberAccessMatch = textBeforeCursor.match(/(\w+)\.$/);
        if (memberAccessMatch) {
          const variableName = memberAccessMatch[1];
          return {
            suggestions: this.getMemberSuggestions(range, variableName),
          };
        }

        // Return global suggestions (annotations + classes)
        return { suggestions: this.getGlobalSuggestions(range) };
      },
    });
  }

  /**
   * Generate global suggestions from API metadata
   */
  private getGlobalSuggestions(
    range: monaco.IRange,
  ): monaco.languages.CompletionItem[] {
    if (!this.intellisenseMetadata) {
      return [];
    }

    const suggestions: monaco.languages.CompletionItem[] = [];

    // Add annotations from API
    this.intellisenseMetadata.annotations.forEach((annotation) => {
      suggestions.push({
        label: annotation.name,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: annotation.snippet,
        insertTextRules: annotation.snippet.includes("${")
          ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          : undefined,
        documentation: annotation.documentation,
        detail: "FalconFlow Annotation",
        range: range,
      });
    });

    // Add classes from API
    this.intellisenseMetadata.classes.forEach((classData) => {
      const kind =
        classData.type === "interface"
          ? monaco.languages.CompletionItemKind.Interface
          : classData.type === "enum"
            ? monaco.languages.CompletionItemKind.Enum
            : monaco.languages.CompletionItemKind.Class;

      suggestions.push({
        label: classData.name,
        kind: kind,
        insertText: classData.name,
        documentation: `${classData.type} ${classData.name}`,
        range: range,
      });
    });

    return suggestions;
  }

  /**
   * Get member suggestions based on variable name (context-aware)
   */
  private getMemberSuggestions(
    range: monaco.IRange,
    variableName: string,
  ): monaco.languages.CompletionItem[] {
    if (!this.intellisenseMetadata) {
      return [];
    }

    const suggestions: monaco.languages.CompletionItem[] = [];
    const lowerVar = variableName.toLowerCase();

    // Determine which class this variable likely represents
    let targetClassName: string | null = null;

    if (lowerVar.includes("req") || lowerVar === "r") {
      targetClassName = "FRequest";
    } else if (
      lowerVar.includes("map") ||
      lowerVar.includes("header") ||
      lowerVar.includes("info") ||
      lowerVar.includes("mp")
    ) {
      targetClassName = "Map";
    } else if (lowerVar.includes("vault")) {
      targetClassName = "Vault";
    }

    // If we identified a class, get its methods from the API
    if (targetClassName) {
      const classData = this.intellisenseMetadata.classes.find(
        (c) => c.name === targetClassName,
      );

      if (classData && classData.methods) {
        classData.methods.forEach((method) => {
          // Build parameter snippet
          let insertText = method.name;
          if (method.parameters && method.parameters.length > 0) {
            const params = method.parameters
              .map((p, idx) => `\${${idx + 1}:${p.name}}`)
              .join(", ");
            insertText = `${method.name}(${params})`;
          } else {
            insertText = `${method.name}()`;
          }

          suggestions.push({
            label: method.name,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: insertText,
            insertTextRules:
              method.parameters && method.parameters.length > 0
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
            documentation:
              method.documentation || `${method.returnType} ${method.name}`,
            detail: `${method.returnType}`,
            range: range,
          });
        });
      }
    }

    return suggestions;
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
