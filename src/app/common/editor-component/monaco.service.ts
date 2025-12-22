import * as monaco from 'monaco-editor';

export class MonacoService {
  create(container: HTMLElement, options: monaco.editor.IStandaloneEditorConstructionOptions) {
    return monaco.editor.create(container, options);
  }

  format(editor: monaco.editor.IStandaloneCodeEditor) {
    editor.getAction('editor.action.formatDocument')?.run();
  }
}

export const monacoService = new MonacoService();
