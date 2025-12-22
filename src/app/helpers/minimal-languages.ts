import { LanguageDescription } from '@codemirror/language';

// Keep only the languages we actually use across the app.
// Each entry is lazy-loaded to keep initial bundles small.
export const minimalLanguages: LanguageDescription[] = [
  LanguageDescription.of({
    name: 'java',
    alias: ['java'],
    extensions: ['java'],
    load: () => import('@codemirror/lang-java').then(m => m.java())
  }),
  LanguageDescription.of({
    name: 'json',
    alias: ['json'],
    extensions: ['json'],
    load: () => import('@codemirror/lang-json').then(m => m.json())
  }),
  LanguageDescription.of({
    name: 'html',
    alias: ['html', 'htm'],
    extensions: ['html', 'htm'],
    load: () => import('@codemirror/lang-html').then(m => m.html())
  }),
  LanguageDescription.of({
    name: 'css',
    alias: ['css', 'scss'],
    extensions: ['css', 'scss'],
    load: () => import('@codemirror/lang-css').then(m => m.css())
  }),
  LanguageDescription.of({
    name: 'javascript',
    alias: ['js', 'javascript'],
    extensions: ['js', 'mjs', 'cjs'],
    load: () => import('@codemirror/lang-javascript').then(m => m.javascript())
  }),
  LanguageDescription.of({
    name: 'typescript',
    alias: ['ts', 'typescript'],
    extensions: ['ts', 'tsx'],
    load: () => import('@codemirror/lang-javascript').then(m => m.javascript({ typescript: true }))
  }),
  LanguageDescription.of({
    name: 'markdown',
    alias: ['md', 'markdown'],
    extensions: ['md', 'markdown'],
    load: () => import('@codemirror/lang-markdown').then(m => m.markdown())
  }),
  LanguageDescription.of({
    name: 'sql',
    alias: ['sql'],
    extensions: ['sql'],
    load: () => import('@codemirror/lang-sql').then(m => m.sql())
  })
];
