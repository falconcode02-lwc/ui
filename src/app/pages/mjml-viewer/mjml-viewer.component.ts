import { Component, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { NzResizeEvent } from 'ng-zorro-antd/resizable';
import { CodeEditorModule } from '@acrodata/code-editor';
import { oneDark } from '@codemirror/theme-one-dark';

@Component({
    selector: 'app-mjml-viewer',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzEmptyModule,
        NzResizableModule,
        CodeEditorModule
    ],
    templateUrl: './mjml-viewer.component.html',
    styleUrls: ['./mjml-viewer.component.scss']
})
export class MjmlViewerComponent implements OnInit {
    mjmlCode = signal<string>('');
    previewHtml = signal<string>('');
    isLoading = signal<boolean>(false);
    showCode = signal<boolean>(false);
    codeWidth = 400;

    editorOptions = {
        theme: oneDark,
        language: 'xml',
        readOnly: true,
        disabled: false,
        placeholder: 'MJML code will appear here...',
        indentWithTab: true,
        indentUnit: '  ',
        lineWrapping: true,
        highlightWhitespace: true,
    };

    constructor(
        private route: ActivatedRoute,
        private message: NzMessageService
    ) {
        // Watch for MJML code changes and update preview
        effect(() => {
            const code = this.mjmlCode();
            if (code) {
                this.updatePreview();
            }
        });
    }

    ngOnInit() {
        // Check if MJML code is passed via route query params
        this.route.queryParams.subscribe(params => {
            if (params['mjml']) {
                try {
                    const decoded = atob(params['mjml']);
                    this.mjmlCode.set(decoded);
                } catch (error) {
                    this.message.error('Failed to decode MJML data');
                }
            } else {
                // Load sample MJML for testing
                this.loadSampleMjml();
            }
        });
    }

    loadSampleMjml() {
        const sampleMjml = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f5f5f5">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text font-size="20px" color="#333333" padding-bottom="10px">
          Welcome to MJML Viewer
        </mj-text>
        <mj-text font-size="14px" color="#666666" padding-bottom="20px">
          This is a sample email. Upload your own MJML file or paste MJML code to preview.
        </mj-text>
        <mj-button background-color="#ff6d5a" color="#ffffff" href="https://example.com" border-radius="4px">
          Click Me
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
        this.mjmlCode.set(sampleMjml);
    } async updatePreview() {
        this.isLoading.set(true);

        try {
            // Import mjml-browser
            const mjml2html = (await import('mjml-browser')).default;

            // Compile MJML to HTML with proper options
            const result = mjml2html(this.mjmlCode(), {
                validationLevel: 'soft',
                minify: false,
                beautify: false,
                fonts: {
                    'Arial': 'Arial, sans-serif'
                },
                keepComments: false
            });

            if (result.errors && result.errors.length > 0) {
                console.warn('MJML errors:', result.errors);
                result.errors.forEach(error => {
                    this.message.warning(`MJML warning: ${error.message}`);
                });
            }

            // Log the result to debug
            console.log('MJML compilation result:', result);
            console.log('HTML output length:', result.html?.length);

            // MJML already generates complete HTML with all necessary inline styles
            // Use it directly without modification
            this.previewHtml.set(result.html);
        } catch (error) {
            console.error('Error compiling MJML:', error);
            // Fallback to displaying raw MJML in iframe
            this.previewHtml.set(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f5f5f5;
        margin: 0;
      }
      .error-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 800px;
        margin: 20px auto;
      }
      h3 {
        color: #ff4d4f;
        margin-top: 0;
      }
      pre {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
        border: 1px solid #d9d9d9;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <div class="error-container">
      <h3>⚠️ MJML Compilation Failed</h3>
      <p>Unable to compile MJML. Please check your MJML syntax.</p>
      <p><strong>Raw MJML code:</strong></p>
      <pre>${this.escapeHtml(this.mjmlCode())}</pre>
    </div>
  </body>
</html>
      `);
            this.message.error('Failed to compile MJML');
        } finally {
            this.isLoading.set(false);
        }
    }

    escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    toggleCode() {
        this.showCode.set(!this.showCode());
    }

    onCodeResize(event: NzResizeEvent) {
        if (event.width) {
            this.codeWidth = event.width;
        }
    }

    downloadHtml() {
        const html = this.previewHtml();
        if (!html) {
            this.message.warning('No preview available to download');
            return;
        }

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `email-${Date.now()}.html`;
        link.click();
        URL.revokeObjectURL(url);
        this.message.success('HTML downloaded successfully');
    }

    downloadMjml() {
        const mjml = this.mjmlCode();
        if (!mjml) {
            this.message.warning('No MJML code available to download');
            return;
        }

        const blob = new Blob([mjml], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `email-${Date.now()}.mjml`;
        link.click();
        URL.revokeObjectURL(url);
        this.message.success('MJML downloaded successfully');
    }

    loadMjmlFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            this.mjmlCode.set(content);
            this.message.success('MJML file loaded successfully');
        };
        reader.onerror = () => {
            this.message.error('Failed to read file');
        };
        reader.readAsText(file);

        // Reset input
        input.value = '';
    }

    refresh() {
        this.updatePreview();
        this.message.success('Preview refreshed');
    }

    printPreview() {
        const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        } else {
            this.message.warning('Unable to print preview');
        }
    }
}
