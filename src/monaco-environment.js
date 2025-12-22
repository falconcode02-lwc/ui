self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId, label) {
    if (label === 'json') {
      return './assets/monaco/workers/json.worker.js';
    }
    if (label === 'css') {
      return './assets/monaco/workers/css.worker.js';
    }
    if (label === 'html') {
      return './assets/monaco/workers/html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './assets/monaco/workers/ts.worker.js';
    }

    return './assets/monaco/workers/editor.worker.js';
  }
};
