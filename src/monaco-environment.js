self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId, label) {
    const base = "/ff/assets/monaco/vs";
    if (label === 'json') {
      return base + '/language/json/jsonWorker.js';
    }
    if (label === 'css') {
      return base + '/language/css/cssWorker.js';
    }
    if (label === 'html') {
      return base + '/language/html/htmlWorker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return base + '/language/typescript/tsWorker.js';
    }

    return base + '/editor/editor.worker.js';
  }
};
