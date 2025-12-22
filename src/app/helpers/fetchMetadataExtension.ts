import { EditorView } from "codemirror";
import { StateEffect } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { createCompletionSource } from "./completionFactory";
import { customCompletion } from "./javaAutocomplete";

export function metadataAutoloadExtension(fetchFn: () => Promise<any>) {
  return EditorView.domEventHandlers({
    focus(event, view) {
      if ((view as any)._metadataLoaded) return;
      (view as any)._metadataLoaded = true;

      fetchFn().then(data => {
        (view as any)._metadata = data;

        const completionExt = autocompletion({
          override: [createCompletionSource(data)],
          activateOnTyping: true
        });

        // ✅ Proper way to inject extension dynamically
        view.dispatch({
          effects: StateEffect.appendConfig.of(completionExt)
        });
      });
    }
  });
}
