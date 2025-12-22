import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, effect, ComponentRef, ViewContainerRef, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { PluginService, PluginDto } from '../../service/plugin.service';
import { FormBuilderComponent } from '../form-builder/form-builder.component';
import { CodeEditor } from "@acrodata/code-editor";
import { java } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { HttpService } from '../../service/http-service';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { minimalLanguages } from '../../helpers/minimal-languages';
import type { LanguageDescription } from '@codemirror/language';

export interface PluginFormData {
    pluginName: string;
    pluginDesc: string;
    pluginAuthor: string;
    version: string;
    pluginDocument: string;
    icon: string;
    active: boolean;
    props?: string;
    secrets?: string; // JSON schema used for plugin.setSecrets
}

@Component({
    selector: 'app-plugin-manager',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzDrawerModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzIconModule,
        NzModalModule,
        NzSwitchModule,
        NzDividerModule,
        NzTableModule,
        NzPopconfirmModule,
        NzTagModule,
        NzToolTipModule,
        NzTabsModule,
        NzUploadModule,
        CodeEditor,
        NzResizableModule,
        NzSplitterModule,
        NzPageHeaderModule,
        NzListModule,
        NzDropDownModule,
        NzPaginationModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './plugin-manager.component.html',
    styleUrls: ['./plugin-manager.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginManagerComponent implements OnInit, AfterViewInit {
    // Store polling interval reference
    private codeEditorSyncInterval: any;
    languages: LanguageDescription[] = minimalLanguages.slice();
    /**
     * Sync form fields from code editor content
     */
    private syncFormFromCodeEditor(): void {
        const code = this.codeEditor?.view?.state.doc.toString() || '';
        if (!code) return;
        // Helper to extract quoted setter value (handles escaped quotes and multiline)
        const extractSetter = (setter: string) => {
            // Correct regex: character class [^"\\] for anything except quote or backslash
            const match = code.match(new RegExp(`plugin\\s*\\.\\s*set${setter}\\s*\\(\\s*\\"((?:[^\\"\\\\]|\\\\.)*)\\"\\s*\\)\\s*;`, 'm'));
            return match ? match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                : '';
        };
        // Helper to extract raw setter value (for props, multiline, handles quoted and unquoted, including nested braces)
        const extractSetterRaw = (setter: string) => {
            let quotedMatch: any = null;
            
            // For Secrets and Props, always expect base64-encoded string
            if (setter == 'Secrets' || setter == 'Props') {
                const methodName = setter == 'Secrets' ? 'setSecrets' : 'setProps';
                // Match quoted string (base64 format): plugin.setSecrets("base64string") or plugin.setProps("base64string");
                const base64Match = code.match(new RegExp(`plugin\\s*\\.\\s*${methodName}\\s*\\(\\s*"([^"]*)"\\s*\\)`, 'm'));
                if (base64Match) {
                    try {
                        const base64String = base64Match[1];
                        if (!base64String) return '{}';
                        // Decode base64 to get the original JSON
                        const decodedJson = decodeURIComponent(escape(atob(base64String)));
                        // Pretty-print the decoded JSON
                        const parsed = JSON.parse(decodedJson);
                        return JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        console.warn(`Failed to decode base64 ${setter.toLowerCase()}:`, e);
                        return '{}';
                    }
                }
                return '{}';
            }
            
            // For other setters, handle quoted values
            quotedMatch = code.match(new RegExp(`plugin\\s*\\.\\s*set${setter}\\s*\\(\\s*\\\"([\\s\\S]*?)\\\"\\s*\\)\\s*;`, 'm'));
            if (quotedMatch) {
                let val = quotedMatch[1].trim();
                try {
                    val = JSON.stringify(JSON.parse(val), null, 2);
                } catch { }
                return val;
            }
            // Try to match unquoted JSON block (e.g., plugin.setProps({ ... });)
            const rawMatch = code.match(new RegExp(`plugin\\s*\\.\\s*set${setter}\\s*\\(\\s*({[\\s\\S]*?})\\s*\\)\\s*;`, 'm'));
            if (rawMatch) {
                let val = rawMatch[1].trim();
                // Try to pretty-print JSON if valid
                try {
                    val = JSON.stringify(JSON.parse(val), null, 2);
                } catch { }
                return val;
            }
            // Fallback: match any value inside parentheses
            const anyMatch = code.match(new RegExp(`plugin\\s*\\.\\s*set${setter}\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*;`, 'm'));
            let val = anyMatch ? anyMatch[1].trim() : '';
            try {
                val = JSON.stringify(JSON.parse(val), null, 2);
            } catch { }
            return val;
        };
        this.ngZone.run(() => {

            const iconValue = extractSetter('Icon');
            const propsValue = extractSetterRaw('Props');
            debugger
            const secretsValue = extractSetterRaw('Secrets');
            this.pluginForm.patchValue({
                version: extractSetter('Version'),
                pluginName: extractSetter('PluginName'),
                pluginDesc: extractSetter('PluginDesc'),
                pluginAuthor: extractSetter('PluginAuthor'),
                pluginDocument: extractSetter('PluginDocument'),
                icon: iconValue,
                props: propsValue,
                secrets: secretsValue
            }, { emitEvent: false });
            // Update icon preview // // // // // //
            if (iconValue && iconValue.startsWith('data:image')) {
                this.iconPreview = iconValue;
            } else {
                this.iconPreview = '';
            }
            this.cdr.markForCheck();
        });
    }
    // Resizable LogCat panel height
    logCatHeight: number = 160;
    // Skip one auto-generate cycle when we do targeted setter updates
    private suppressAutoGenerateOnce = false;

    onLogCatResize(event: NzResizeEvent): void {
        if (event.height) {
            const newHeight = Math.min(Math.max(event.height, 80), 400);
            if (newHeight !== this.logCatHeight) {
                this.logCatHeight = newHeight;
                this.cdr.markForCheck();
            }
        }
    }
    /**
     * Deploy plugin from drawer using current code in editor
     */
    deployPluginFromDrawer(): void {
        const javaCode = this.codeEditor?.view?.state.doc.toString() || this.generatedCode;
        const loadingId = this.message.loading('Deploying...', { nzDuration: 0 }).messageId;
        // this.alldisabled(true);
        const encodedFile = this.utf8ToBase64(javaCode);
        this.httpService.savePostData({
            encodedFile: encodedFile,
            classType: 'plugin',
            id: this.editingPluginId || 0,
            compileType: '', // Empty for deploy
            version: this.codeVersion
        }).subscribe({
            next: (response: any) => {
                this.message.remove(loadingId);
                let logMsg = '';
                if (response && response.status === 'Success') {
                    logMsg = '✅ Success: Plugin compiled & deployed successfully.';
                    this.message.success('Whoaaa! Compiled & Deployed successfully', { nzDuration: 5000 });
                    this.codeVersion = response.version
                    this.loadPlugins();
                } else if (response && response.status === 'Failed') {
                    if (response.id && response.id == -1) {
                        logMsg = '⚠️ Warning: No change in file.';
                        this.message.warning('No change in file');
                    } else {
                        logMsg = '❌ Error: Failed to deploy! ' + (response.message || 'Unknown error');
                        this.message.error('Oh no! Failed to deploy!');
                    }
                } else {
                    logMsg = '⚠️ Warning: Deployment completed with warnings.';
                    this.message.warning('Deployment completed with warnings');
                }
                if (response && response.message) {
                    logMsg += '\n' + response.message;
                }

                this.compileLogs.push(logMsg);
                // this.alldisabled(false);
                this.cdr.markForCheck();
            },
            error: (error: any) => {
                this.message.remove(loadingId);
                const logMsg = '❌ Error: Failed to deploy plugin: ' + (error.message || 'Network error');
                this.compileLogs.push(logMsg);
                this.message.error('Failed to deploy plugin: ' + (error.message || 'Network error'));
                this.alldisabled(false);
                this.cdr.markForCheck();
            }
        });
    }
    /**
     * Alias for generating new plugin code (for compatibility)
     */
    private generateNewPluginCode(plugin: PluginDto): string {
        return this.generateFullPluginCode(plugin);
    }
    /**
     * Generate plugin code preview based on form and original source
     */
    generatePluginCode(): void {
        // If editing, update only the init section; else, generate full code
        if (this.isEditMode && this.originalSourceCode) {
            this.generatedCode = this.updateInitSectionInCode(this.originalSourceCode, this.pluginForm.value);
        } else {
            this.generatedCode = this.generateFullPluginCode(this.pluginForm.value);
        }
        this.cdr.markForCheck();
    }

    /**
     * Initialize code editor (stub for compatibility)
     */
    initializeCodeEditor(): void {
        // If you need to perform any setup for the code editor, do it here
        // For now, this is a stub to resolve the error
    }
    /**
     * Escape special characters for Java string literals
     */
    private escapeJavaString(str: string): string {
        if (!str) return '';
        return str
            .replace(/\\/g, '\\\\')   // Escape backslashes
            .replace(/\n/g, '\\n')       // Escape newlines
            .replace(/\r/g, '\\r')       // Escape carriage returns
            .replace(/\t/g, '\\t')       // Escape tabs
            .replace(/"/g, '\\"');     // Escape double quotes
    }
    /**
     * Convert plugin name to a valid Java class name
     */
    private toClassName(name: string): string {
        // Remove non-alphanumeric, capitalize each word, and join
        return name
            .replace(/[^a-zA-Z0-9 ]/g, ' ') // Remove special chars
            .split(' ') // Split by spaces
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    /**
     * Replace a single PluginDto setter call value without touching other code.
     * Example: replace plugin.setVersion("...");
     */
    private replacePluginSetter(code: string, setterSuffix: string, valueWithQuotes: string): string {
        // Matches: plugin.setVersion("anything"); with arbitrary spaces and line breaks
        const pattern = new RegExp(
            `(plugin\\s*\\.\\s*set${setterSuffix}\\s*\\(\\s*)\"[^\"]*\"(\\s*\\)\\s*;)`
        );
        if (pattern.test(code)) {
            return code.replace(pattern, `$1${valueWithQuotes}$2`);
        }
        return code;
    }

    // Replace a setter with a raw (non-quoted) argument, e.g., setProps({...})
    private replacePluginSetterRaw(code: string, setterSuffix: string, rawValue: string): string {
        const pattern = new RegExp(`(plugin\\s*\\.\\s*set${setterSuffix}\\s*\\(\\s*)([\\s\\S]*?)(\\s*\\)\\s*;)`);
        if (pattern.test(code)) {
            return code.replace(pattern, `$1${rawValue}$3`);
        }
        return code;
    }
    /**
     * Enable or disable all relevant UI controls during compile/deploy
     */
    alldisabled(disabled: boolean): void {
        // Example: disable/enable form and buttons
        if (disabled) {
            this.pluginForm.disable();
        } else {
            this.pluginForm.enable();
        }
        // You can add more UI state logic here if needed
        this.cdr.markForCheck();
    }
    // Drawer state
    drawerVisible = false;
    drawerTitle = 'Create New Plugin';
    isEditMode = false;
    editingPluginId?: number;

    // Form
    pluginForm!: FormGroup;

    // Plugin List
    plugins: PluginDto[] = [];
    filteredPlugins: PluginDto[] = [];
    searchText = '';
    loading = false;

    // Pagination
    pageIndex = 1;
    pageSize = 10;
    total = 0;

    // Form Builder Modal
    private formBuilderModalRef?: NzModalRef;

    // Code Editor
    @ViewChild(CodeEditor) codeEditor?: CodeEditor;
    generatedCode = '';
    javaExtensions = [java(), EditorView.editable.of(false), EditorView.lineWrapping];

    // Icon Upload
    iconPreview: string = '';
    uploadingIcon = false;

    // Store original source code when editing
    originalSourceCode: string = '';
    isLoadingSourceCode = false;

    // Compile logs
    compileLogs: string[] = [];

    // Compile response modal
    compileResponseVisible = false;
    compileResponseText = '';

    /**
     * Check if the given icon string is a base64 image
     */
    isBase64Icon(icon: string): boolean {
        return !!icon && icon.startsWith('data:image');
    }

    /**
     * Clear all compile logs
     */
    clearLogs(): void {
        this.compileLogs = [];
        this.cdr.markForCheck();
    }

    /**
     * Update isBase64Icon property based on icon value
     */
    private updateIsBase64Icon(): void {
        const iconValue = this.pluginForm?.get('icon')?.value;
        (this as any).isBase64Icon = !!iconValue && iconValue.startsWith('data:image');
    }

    constructor(
        private fb: FormBuilder,
        private pluginService: PluginService,
        private message: NzMessageService,
        private cdr: ChangeDetectorRef,
        private modal: NzModalService,
        private httpService: HttpService,
        private ngZone: NgZone
    ) {

    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardShortcuts(event: KeyboardEvent): void {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

        if (ctrlKey && event.key === 's') {
            event.preventDefault();
            this.deployPluginFromDrawer();
            return;
        }


    }

    ngOnInit(): void {
        this.initForm();
        this.loadPlugins();

        // Selective update: when Version changes, update just plugin.setVersion("...") in code
        this.pluginForm.get('version')?.valueChanges.subscribe((v: string) => {
            const newVersion = v ?? '';
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(newVersion);
            const replaced = this.replacePluginSetter(current, 'Version', `"${escaped}"`);
            if (replaced && replaced !== current) {
                this.suppressAutoGenerateOnce = true;
                this.generatedCode = replaced;
                this.cdr.markForCheck();
            }
        });

        // Selective updates for other quoted setters
        this.pluginForm.get('pluginName')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(val ?? '');
            const replaced = this.replacePluginSetter(current, 'PluginName', `"${escaped}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        this.pluginForm.get('pluginDesc')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(val ?? '');
            const replaced = this.replacePluginSetter(current, 'PluginDesc', `"${escaped}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        this.pluginForm.get('pluginAuthor')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(val ?? '');
            const replaced = this.replacePluginSetter(current, 'PluginAuthor', `"${escaped}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        this.pluginForm.get('pluginDocument')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(val ?? '');
            const replaced = this.replacePluginSetter(current, 'PluginDocument', `"${escaped}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        this.pluginForm.get('icon')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            const escaped = this.escapeJavaString(val ?? '');
            const replaced = this.replacePluginSetter(current, 'Icon', `"${escaped}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; }
            // Update icon preview
            if (val && val.startsWith('data:image')) {
                this.iconPreview = val;
            } else {
                this.iconPreview = '';
            }
            this.cdr.markForCheck();
        });

        // setProps - always base64 encode the JSON
        this.pluginForm.get('props')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            let base64Encoded = '';
            try {
                const parsed = JSON.parse(val ?? '{}');
                const jsonString = JSON.stringify(parsed); // minified JSON
                base64Encoded = this.utf8ToBase64(jsonString);
            } catch { 
                // If parsing fails, encode empty object
                base64Encoded = this.utf8ToBase64('{}');
            }
            const replaced = this.replacePluginSetter(current, 'Props', `"${base64Encoded}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        // setSecrets - always base64 encode the JSON
        this.pluginForm.get('secrets')?.valueChanges.subscribe((val: string) => {
            const current = this.codeEditor?.view?.state.doc.toString() || this.generatedCode || '';
            if (!current) { return; }
            let base64Encoded = '';
            try {
                const parsed = JSON.parse(val ?? '{}');
                const jsonString = JSON.stringify(parsed); // minified JSON
                base64Encoded = this.utf8ToBase64(jsonString);
            } catch { 
                // If parsing fails, encode empty object
                base64Encoded = this.utf8ToBase64('{}');
            }
            const replaced = this.replacePluginSetter(current, 'Secrets', `"${base64Encoded}"`);
            if (replaced !== current) { this.suppressAutoGenerateOnce = true; this.generatedCode = replaced; this.cdr.markForCheck(); }
        });

        // Subscribe to form changes to regenerate code (unless suppressed once)
        this.pluginForm.valueChanges.subscribe(() => {
            if (this.suppressAutoGenerateOnce) {
                this.suppressAutoGenerateOnce = false;
                return;
            }
            this.generatePluginCode();
        });
    }

    ngAfterViewInit(): void {
        this.initializeCodeEditor();
        // Poll for code changes every 500ms and sync form

        this.startCodeWatch();


    }


    startCodeWatch() {
        if (this.codeEditorSyncInterval) {
            clearInterval(this.codeEditorSyncInterval);
        }
        let lastCode = this.codeEditor?.view?.state.doc.toString() || '';
        this.codeEditorSyncInterval = setInterval(() => {
            if (this.drawerVisible) {
                const currentCode = this.codeEditor?.view?.state.doc.toString() || '';
                if (currentCode !== lastCode) {
                    lastCode = currentCode;
                    this.syncFormFromCodeEditor();
                    console.log('code is changed')
                }
            }
        }, 1500);
    }

    ngOnDestroy() {
        if (this.codeEditorSyncInterval) {
            clearInterval(this.codeEditorSyncInterval);
        }
    }


    /**
     * Initialize the plugin form
     */
    initForm(): void {
        this.pluginForm = this.fb.group({
            pluginName: ['', [Validators.required, Validators.maxLength(100)]],
            pluginDesc: ['', [Validators.required, Validators.maxLength(500)]],
            pluginAuthor: ['', [Validators.required, Validators.maxLength(100)]],
            version: ['1.0.0', [Validators.required, Validators.pattern(/^\d+\.\d+\.\d+$/)]],
            pluginDocument: ['', [Validators.maxLength(5000)]],
            icon: ['', [Validators.maxLength(10000)]],
            active: [true],
            props: [''],
            secrets: ['']
        });
    }

    /**
     * Load plugins list
     */
    loadPlugins(): void {
        this.loading = true;
        this.pluginService.listPlugins(undefined, this.pageIndex - 1, this.pageSize).subscribe({
            next: (response) => {
                this.plugins = response.content;
                this.filteredPlugins = response.content;
                this.total = response.totalElements;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error loading plugins:', error);
                this.message.error('Failed to load plugins');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    /**
     * Search/filter plugins
     */
    search(): void {
        const keyword = this.searchText.toLowerCase();
        this.filteredPlugins = this.plugins.filter(
            (p) =>
                p.pluginName.toLowerCase().includes(keyword) ||
                p.pluginDesc.toLowerCase().includes(keyword) ||
                p.pluginAuthor.toLowerCase().includes(keyword) ||
                p.version.toLowerCase().includes(keyword)
        );
        this.cdr.markForCheck();
    }

    /**
     * Open drawer to create new plugin
     */
    openCreateDrawer(): void {
        this.isEditMode = false;
        this.drawerTitle = 'Create New Plugin';
        // Clear all fields except version
        this.pluginForm.reset({
            pluginName: '',
            pluginDesc: '',
            pluginAuthor: '',
            version: '1.0.0',
            pluginDocument: '',
            icon: '',
            active: true,
            props: '',
            secrets: ''
        });
        this.iconPreview = '';
        this.drawerVisible = true;
        setTimeout(() => this.generatePluginCode(), 100);
        this.cdr.markForCheck();
    }

    /**
     * Open drawer to edit plugin
     */
    openEditDrawer(plugin: PluginDto): void {
        this.isEditMode = true;
        this.editingPluginId = plugin.id;
        this.drawerTitle = 'Edit Plugin';

        // Decode base64-encoded props and secrets for editing
        let decodedProps = '';
        let decodedSecrets = '';
        
        try {
            if (plugin.props) {
                const propsDecoded = decodeURIComponent(escape(atob(plugin.props)));
                const propsParsed = JSON.parse(propsDecoded);
                decodedProps = JSON.stringify(propsParsed, null, 2);
            }
        } catch (e) {
            console.warn('Failed to decode props, using as-is:', e);
            decodedProps = plugin.props || '';
        }
        
        try {
            if (plugin.secrets) {
                const secretsDecoded = decodeURIComponent(escape(atob(plugin.secrets)));
                const secretsParsed = JSON.parse(secretsDecoded);
                decodedSecrets = JSON.stringify(secretsParsed, null, 2);
            }
        } catch (e) {
            console.warn('Failed to decode secrets, using as-is:', e);
            decodedSecrets = plugin.secrets || '';
        }

        this.pluginForm.patchValue({
            pluginName: plugin.pluginName,
            pluginDesc: plugin.pluginDesc,
            pluginAuthor: plugin.pluginAuthor,
            version: plugin.version,
            pluginDocument: plugin.pluginDocument,
            icon: plugin.icon,
            active: plugin.active,
            props: decodedProps,
            secrets: decodedSecrets
        });

        this.updateIconPreview();
        this.drawerVisible = true;

        // Fetch original source code for selective updates
        this.fetchOriginalSourceCode(plugin);

        this.cdr.markForCheck();
    }

    /**
     * Fetch the original source code for editing
     */
    codeVersion = 0;
    private fetchOriginalSourceCode(plugin: PluginDto): void {
        this.codeVersion = 0;
        this.isLoadingSourceCode = true;

        // Prefer backend source: fetch by classType + fqcn (computed from pluginName)
        const fqcn = this.toClassName(plugin.pluginId);
        this.httpService.getDataByClassTypeAndFqcn<any>('plugin', fqcn).subscribe({
            next: (resp: any) => {
                debugger
                this.codeVersion = resp?.version || 0;
                // Use rawClass to bind editor (decode base64)
                let raw = resp?.rawClass || '';
                try {
                    if (raw) {
                        raw = decodeURIComponent(escape(atob(raw)));
                    }
                } catch (e) {
                    console.warn('Failed to decode base64 rawClass:', e);
                }
                this.originalSourceCode = raw || this.generateNewPluginCode(this.pluginForm.value);
                this.generatedCode = this.originalSourceCode;
                // Capture id for subsequent deploy/compile calls
                if (resp?.id) {
                    this.editingPluginId = resp.id;
                }
                this.isLoadingSourceCode = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Failed to fetch class by fqcn:', err);
                this.message.error('Failed to load source code, using generated code');
                this.originalSourceCode = this.generateNewPluginCode(this.pluginForm.value);
                this.generatedCode = this.originalSourceCode;
                this.isLoadingSourceCode = false;
                this.cdr.markForCheck();
            }
        });
    }

    /**
     * Close drawer
     */
    closeDrawer(): void {
        this.drawerVisible = false;
        this.pluginForm.reset();
        this.isEditMode = false;
        this.editingPluginId = undefined;
        // if (this.codeEditorSyncInterval) {
        //     clearInterval(this.codeEditorSyncInterval);
        //     this.codeEditorSyncInterval = null;
        // }
        this.cdr.markForCheck();
    }

    /**
     * Open Form Builder for setProps
     */
    openFormBuilder(): void {
        // Parse existing props if available
        let initialData: any = null;
        const propsValue = this.pluginForm.get('props')?.value;
        if (propsValue) {
            try {
                initialData = JSON.parse(propsValue);
            } catch (e) {
                console.error('Error parsing props:', e);
            }
        }

        // Create fullscreen modal with Form Builder
        this.formBuilderModalRef = this.modal.create({
            nzTitle: 'Configure Plugin Properties Schema',
            nzContent: FormBuilderComponent,
            nzWidth: '100vw',
            nzStyle: { top: '0px', padding: '0px' },
            nzBodyStyle: {
                height: 'calc(100vh - 110px)',
                padding: '24px',
                overflow: 'auto'
            },
            nzMaskClosable: false,
            nzClosable: true,
            nzFooter: [
                {
                    label: 'Cancel',
                    onClick: () => this.closeFormBuilder()
                },
                {
                    label: 'Save Props Schema',
                    type: 'primary',
                    onClick: (componentInstance) => this.saveFormBuilderProps(componentInstance)
                }
            ]
        });

        // Load initial data into FormBuilder component if available
        if (this.formBuilderModalRef.componentInstance && initialData) {
            const fbComponent = this.formBuilderModalRef.componentInstance as any;

            // Set formConfig if present
            if (initialData.title || initialData.description || initialData.submitUrl) {
                fbComponent.formConfig.set({
                    title: initialData.title || 'Plugin Properties',
                    description: initialData.description || '',
                    height: initialData.height || '100%',
                    width: initialData.width || '100%',
                    submitUrl: initialData.submitUrl || '',
                    successMessage: initialData.successMessage || 'Form submitted successfully!',
                    errorMessage: initialData.errorMessage || 'Failed to submit form. Please try again.',
                    submitButtonLabel: initialData.submitButtonLabel || 'Submit',
                    resetButtonLabel: initialData.resetButtonLabel || 'Reset',
                    showResetButton: initialData.showResetButton !== undefined ? initialData.showResetButton : true,
                    showSubmitButton: initialData.showSubmitButton !== undefined ? initialData.showSubmitButton : true,
                    onInit: initialData.onInit || '',
                    onDestroy: initialData.onDestroy || '',
                });
            }

            // Set fields if present
            if (initialData.fields && Array.isArray(initialData.fields)) {
                fbComponent.formFields.set(initialData.fields);
            } else if (Array.isArray(initialData)) {
                // Legacy format: just an array of fields
                fbComponent.formFields.set(initialData);
            }

            this.message.info('Loaded existing props schema');
        }

        this.cdr.markForCheck();
    }

    /**
     * Open Form Builder for Secret Schema (plugin.setSecrets)
     */
    openSecretsBuilder(): void {
        let initialData: any = null;
        const secretsValue = this.pluginForm.get('secrets')?.value;
        if (secretsValue) {
            try { initialData = JSON.parse(secretsValue); } catch (e) { console.error('Error parsing secrets:', e); }
        }
        this.formBuilderModalRef = this.modal.create({
            nzTitle: 'Configure Secret Schema',
            nzContent: FormBuilderComponent,
            nzWidth: '100vw',
            nzStyle: { top: '0px', padding: '0px' },
            nzBodyStyle: { height: 'calc(100vh - 110px)', padding: '24px', overflow: 'auto' },
            nzMaskClosable: false,
            nzClosable: true,
            nzFooter: [
                { label: 'Cancel', onClick: () => this.closeFormBuilder() },
                { label: 'Save Secret Schema', type: 'primary', onClick: (ci) => this.saveSecretsSchema(ci) }
            ]
        });
        if (this.formBuilderModalRef.componentInstance && initialData) {
            const fbComponent = this.formBuilderModalRef.componentInstance as any;
            if (initialData.title || initialData.description) {
                fbComponent.formConfig.set({
                    title: initialData.title || 'Secrets',
                    description: initialData.description || '',
                    height: initialData.height || '100%',
                    width: initialData.width || '100%',
                    submitUrl: initialData.submitUrl || '',
                    successMessage: initialData.successMessage || 'Saved!',
                    errorMessage: initialData.errorMessage || 'Failed!',
                    submitButtonLabel: initialData.submitButtonLabel || 'Submit',
                    resetButtonLabel: initialData.resetButtonLabel || 'Reset',
                    showResetButton: initialData.showResetButton !== undefined ? initialData.showResetButton : true,
                    showSubmitButton: initialData.showSubmitButton !== undefined ? initialData.showSubmitButton : true,
                    onInit: initialData.onInit || '',
                    onDestroy: initialData.onDestroy || '',
                });
            }
            if (initialData.fields && Array.isArray(initialData.fields)) {
                fbComponent.formFields.set(initialData.fields);
            } else if (Array.isArray(initialData)) {
                fbComponent.formFields.set(initialData);
            }
            this.message.info('Loaded existing secret schema');
        }
        this.cdr.markForCheck();
    }

    /** Save secret schema */
    saveSecretsSchema(componentInstance: any): void {
        try {
            const formConfig = componentInstance.formConfig();
            const formFields = componentInstance.formFields();
            const schema = { ...formConfig, fields: formFields };
            const secretsJson = JSON.stringify(schema, null, 2);
            this.pluginForm.patchValue({ secrets: secretsJson });
            this.message.success('Secret schema saved');
            this.closeFormBuilder();
        } catch (e) {
            console.error('Error saving secrets schema', e);
            this.message.error('Failed to save secrets schema');
        }
    }

    /**
     * Close Form Builder modal
     */
    closeFormBuilder(): void {
        if (this.formBuilderModalRef) {
            this.formBuilderModalRef.close();
            this.formBuilderModalRef = undefined;
        }
        this.cdr.markForCheck();
    }

    /**
     * Save Form Builder props
     */
    saveFormBuilderProps(componentInstance: any): void {
        try {
            // Get the form schema from FormBuilderComponent
            const formConfig = componentInstance.formConfig();
            const formFields = componentInstance.formFields();

            // Create the complete schema
            const schema = {
                ...formConfig,
                fields: formFields
            };

            // Convert to JSON string with formatting
            const propsJson = JSON.stringify(schema, null, 2);

            // Update the form
            this.pluginForm.patchValue({ props: propsJson });
            this.message.success('Props schema saved successfully!');
            this.closeFormBuilder();

            console.log('Saved props schema:', schema);
        } catch (error) {
            console.error('Error saving form builder props:', error);
            this.message.error('Failed to save props schema');
        }
    }

    /**
     * Submit plugin form
     */
    submitForm(): void {
        if (this.pluginForm.invalid) {
            Object.values(this.pluginForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            return;
        }

        const formData = this.pluginForm.value;
        const loadingMsg = this.message.loading(
            this.isEditMode ? 'Updating plugin...' : 'Creating plugin...',
            { nzDuration: 0 }
        );

        // TODO: Replace with actual API calls when backend is ready
        setTimeout(() => {
            this.message.remove(loadingMsg.messageId);
            this.message.success(
                this.isEditMode ? 'Plugin updated successfully!' : 'Plugin created successfully!'
            );
            this.closeDrawer();
            this.loadPlugins();
        }, 1000);
    }

    /**
     * Delete plugin
     */
    deletePlugin(id: number): void {
        const loadingMsg = this.message.loading('Deleting plugin...', { nzDuration: 0 });

        // TODO: Replace with actual API call when backend is ready
        setTimeout(() => {
            this.message.remove(loadingMsg.messageId);
            this.message.success('Plugin deleted successfully!');
            this.loadPlugins();
        }, 1000);
    }

    /**
     * Compile plugin
     */
    compilePlugin(plugin: PluginDto): void {
        // First, generate the code for this plugin
        this.compilePluginAndShow();
    }



    /**
     * Compile plugin and show response in modal
     */
    compilePluginAndShow(): void {
        this.codeVersion = 0;
        const javaCode = this.codeEditor?.view?.state.doc.toString() || this.generatedCode;
        const loadingId = this.message.loading('Compiling...', { nzDuration: 0 }).messageId;
        this.alldisabled(true);
        const encodedFile = this.utf8ToBase64(javaCode);
        this.httpService.savePostData({
            encodedFile: encodedFile,
            classType: 'plugin',
            id: this.editingPluginId || 0,
            compileType: 'onlyCompile',
            version: this.codeVersion
        }).subscribe({
            next: (response: any) => {
                this.message.remove(loadingId);
                let logMsg = '';
                if (response && response.status === 'Success') {
                    logMsg = '✅ Success: Plugin compiled.';
                    this.compileResponseText = response.message || 'Compiled successfully.';
                    this.compileResponseVisible = true;
                    // Show modal with code editor and compile result
                    this.modal.create({
                        nzTitle: 'Compile Result & Source Code',
                        nzContent: `<div style='margin-bottom:12px;'><b>Compile Output:</b><br/><pre style='white-space:pre-wrap;'>${this.compileResponseText}</pre></div><div><b>Source Code:</b><br/><textarea style='width:100%;height:300px;font-family:monospace;font-size:13px;'>${javaCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea></div>`,
                        nzWidth: '800px',
                        nzOnOk: () => { this.compileResponseVisible = false; }
                    });
                } else if (response && response.status === 'Failed') {
                    logMsg = '❌ Error: Failed to compile! ' + (response.message || 'Unknown error');
                    this.compileResponseText = response.message || 'Compilation failed.';
                    this.compileResponseVisible = true;
                    this.modal.error({
                        nzTitle: 'Compile Error',
                        nzContent: `<pre style='white-space:pre-wrap;'>${this.compileResponseText}</pre>`,
                        nzOnOk: () => { this.compileResponseVisible = false; }
                    });
                } else {
                    logMsg = '⚠️ Warning: Compilation completed with warnings.';
                    this.compileResponseText = response.message || 'Compilation completed with warnings.';
                    this.compileResponseVisible = true;
                    this.modal.warning({
                        nzTitle: 'Compile Warning',
                        nzContent: `<pre style='white-space:pre-wrap;'>${this.compileResponseText}</pre>`,
                        nzOnOk: () => { this.compileResponseVisible = false; }
                    });
                }
                if (response && response.message) {
                    logMsg += '\n' + response.message;
                }
                this.compileLogs.push(logMsg);
                this.alldisabled(false);
                this.cdr.markForCheck();
            },
            error: (error: any) => {
                this.message.remove(loadingId);
                const logMsg = '❌ Error: Failed to compile plugin: ' + (error.message || 'Network error');
                this.compileLogs.push(logMsg);
                this.compileResponseText = logMsg;
                this.compileResponseVisible = true;
                this.modal.error({
                    nzTitle: 'Compile Error',
                    nzContent: `<pre style='white-space:pre-wrap;'>${this.compileResponseText}</pre>`,
                    nzOnOk: () => { this.compileResponseVisible = false; }
                });
                this.alldisabled(false);
                this.cdr.markForCheck();
            }
        });
    }


    /**
     * Convert UTF-8 string to Base64
     */
    private utf8ToBase64(str: string): string {
        return btoa(unescape(encodeURIComponent(str)));
        //btoa(str);
    }

    /**
     * Generate plugin init section only
     */
    private generateInitSection(plugin: PluginDto): string {
        const version = plugin.version;
        const pluginName = plugin.pluginName;
        const pluginDesc = plugin.pluginDesc;
        const pluginAuthor = plugin.pluginAuthor;
        const pluginDocument = plugin.pluginDocument || '';
        const icon = plugin.icon || '';
        const propsJson = plugin.props || '{}';
        const secretsJson = plugin.secrets || '{}';

        // Base64 encode props JSON
        let propsFormatted = '""';
        try {
            const parsed = JSON.parse(propsJson);
            const propsJsonString = JSON.stringify(parsed);
            const propsBase64 = this.utf8ToBase64(propsJsonString);
            propsFormatted = `"${propsBase64}"`;
        } catch (e) {
            // If parsing fails, encode empty object
            propsFormatted = `"${this.utf8ToBase64('{}')}"`;
        }

        // Base64 encode secrets JSON
        let secretsFormatted = '""';
        try {
            const parsedS = JSON.parse(secretsJson);
            const secretsJsonString = JSON.stringify(parsedS);
            const secretsBase64 = this.utf8ToBase64(secretsJsonString);
            secretsFormatted = `"${secretsBase64}"`;
        } catch {
            // If parsing fails, encode empty object
            secretsFormatted = `"${this.utf8ToBase64('{}')}"`;
        }

        return `  @onload
  void init() {
      @new PluginDto plugin;
      plugin.setVersion("${version}");
      plugin.setPluginName("${pluginName}");
      plugin.setPluginDesc("${pluginDesc}");
      plugin.setPluginAuthor("${pluginAuthor}");
      plugin.setPluginDocument("${this.escapeJavaString(pluginDocument)}");
      plugin.setIcon("${this.escapeJavaString(icon)}");
      plugin.setProps(${propsFormatted});
    plugin.setSecrets(${secretsFormatted});

      pluginService.register(plugin);
  }`;
    }

    /**
     * Update only the init section in existing code
     */
    private updateInitSectionInCode(originalCode: string, plugin: PluginDto): string {
        const newInitSection = this.generateInitSection(plugin);
        const onloadIdx = originalCode.indexOf('@onload');
        if (onloadIdx === -1) {
            console.warn('Could not find @onload in original code, returning full code');
            return this.generateFullPluginCode(plugin);
        }
        // Ensure this is the init() method
        const initIdx = originalCode.indexOf('void', onloadIdx);
        if (initIdx === -1 || originalCode.indexOf('init', initIdx) === -1) {
            console.warn('Could not find init() signature, returning full code');
            return this.generateFullPluginCode(plugin);
        }
        // Find first opening brace after init signature
        const braceStart = originalCode.indexOf('{', initIdx);
        if (braceStart === -1) {
            console.warn('Could not find opening brace for init(), returning full code');
            return this.generateFullPluginCode(plugin);
        }
        // Walk to the matching closing brace using a depth counter
        let i = braceStart;
        let depth = 0;
        let braceEnd = -1;
        for (; i < originalCode.length; i++) {
            const ch = originalCode[i];
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) { braceEnd = i; break; }
            }
        }
        if (braceEnd === -1) {
            console.warn('Could not match closing brace for init(), returning full code');
            return this.generateFullPluginCode(plugin);
        }
        // Replace from @onload up to the matched closing brace
        const before = originalCode.slice(0, onloadIdx);
        const after = originalCode.slice(braceEnd + 1);
        return `${before}${newInitSection}${after}`;
    }

    /**
     * Generate complete plugin code (for new plugins)
     */
    private generateFullPluginCode(plugin: PluginDto): string {
        const className = this.toClassName(plugin.pluginName);
        const version = plugin.version;
        const pluginName = plugin.pluginName;
        const pluginDesc = plugin.pluginDesc;
        const pluginAuthor = plugin.pluginAuthor;
        const pluginDocument = plugin.pluginDocument || '';
        const icon = plugin.icon || '';
        const propsJson = plugin.props || '{}';
        const secretsJson = (plugin as any).secrets || '[]';

        // Base64 encode props JSON
        let propsFormatted = '""';
        try {
            const parsed = JSON.parse(propsJson);
            const propsJsonString = JSON.stringify(parsed);
            const propsBase64 = this.utf8ToBase64(propsJsonString);
            propsFormatted = `"${propsBase64}"`;
        } catch (e) {
            // If parsing fails, encode empty object
            propsFormatted = `"${this.utf8ToBase64('{}')}"`;
        }

        // Base64 encode secrets JSON
        let secretsFormatted = '""';
        try {
            const parsedS = JSON.parse(secretsJson);
            const secretsJsonString = JSON.stringify(parsedS);
            const secretsBase64 = this.utf8ToBase64(secretsJsonString);
            secretsFormatted = `"${secretsBase64}"`;
        } catch {
            // If parsing fails, encode empty object
            secretsFormatted = `"${this.utf8ToBase64('{}')}"`;
        }

        return `@FPlugin
public class <Plugin ID> extends Function {

  @useplugin
  @useapi 
  
  @run 
  public FunctionResponse invoke(FRequest req) {
      // TODO: Implement plugin logic here
      
      @new FunctionResponse response;
      response.setStatus(FunctionStatus.SUCCESS);
      response.setMessage("Successfully executed");
      return response;
  }

  @onload
  void registerPlugin() {
      @new PluginDto plugin;
      plugin.setVersion("${version}");
      plugin.setPluginName("${pluginName}");
      plugin.setPluginDesc("${pluginDesc}");
      plugin.setPluginAuthor("${pluginAuthor}");
      plugin.setPluginDocument("${this.escapeJavaString(pluginDocument)}");
      plugin.setIcon("${this.escapeJavaString(icon)}");
      plugin.setProps(${propsFormatted});
    plugin.setSecrets(${secretsFormatted});

      pluginService.register(plugin);
  }

}`;
    }

    /**
     * Handle icon upload before upload
     */
    beforeIconUpload = (file: NzUploadFile): boolean => {
        // Check if it's an image
        const isImage = file.type?.startsWith('image/');
        if (!isImage) {
            this.message.error('You can only upload image files!');
            return false;
        }

        // Check file size (max 2MB)
        const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
        if (!isLt2M) {
            this.message.error('Image must be smaller than 2MB!');
            return false;
        }

        // Read file and validate dimensions
        this.uploadingIcon = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64String = e.target.result;

            // Create image to check dimensions
            const img = new Image();
            img.onload = () => {
                // Validate dimensions (must be 64x64)
                if (img.width !== 64 || img.height !== 64) {
                    this.uploadingIcon = false;
                    this.message.error(`Icon must be exactly 64x64 pixels! Current size: ${img.width}x${img.height}`);
                    this.cdr.markForCheck();
                    return;
                }

                // Dimensions are correct, proceed with upload
                this.iconPreview = base64String;
                this.pluginForm.patchValue({ icon: base64String });
                this.uploadingIcon = false;
                this.message.success('Icon uploaded successfully!');
                this.cdr.markForCheck();
            };
            img.onerror = () => {
                this.uploadingIcon = false;
                this.message.error('Failed to load image');
                this.cdr.markForCheck();
            };
            img.src = base64String;
        };
        reader.onerror = () => {
            this.uploadingIcon = false;
            this.message.error('Failed to read image file');
            this.cdr.markForCheck();
        };
        reader.readAsDataURL(file as any);

        // Return false to prevent default upload behavior
        return false;
    };

    /**
     * Remove icon
     */
    removeIcon(): void {
        this.iconPreview = '';
        this.pluginForm.patchValue({ icon: '' });
        this.message.success('Icon removed');
        this.cdr.markForCheck();
    }

    /**
     * Update icon preview when form value changes
     */
    private updateIconPreview(): void {
        const iconValue = this.pluginForm.get('icon')?.value;
        if (iconValue && iconValue.startsWith('data:image')) {
            this.iconPreview = iconValue;
        } else {
            this.iconPreview = '';
        }
    }

    /**
     * Handle page change
     */
    onPageChange(page: number): void {
        this.pageIndex = page;
        this.loadPlugins();
    }

    /**
     * Export current plugin as base64-encoded .ffx file
     */
    exportPlugin(): void {
        const code = this.codeEditor?.view?.state.doc.toString() || this.generatedCode;
        const base64 = btoa(unescape(encodeURIComponent(code)));
        const blob = new Blob([base64], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.pluginForm.get('pluginName')?.value || 'plugin') + '.ffx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Import plugin from base64-encoded .ffx file
     */
    importPlugin(event: any): void {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const base64 = e.target.result;
                const code = decodeURIComponent(escape(atob(base64)));
                this.generatedCode = code;
                if (this.codeEditor?.view) {
                    this.codeEditor.view.dispatch({ changes: { from: 0, to: this.codeEditor.view.state.doc.length, insert: code } });
                }
                setTimeout(() => this.syncFormFromCodeEditor(), 100);
                this.message.success('Plugin imported from .ffx file');
            } catch {
                this.message.error('Failed to decode .ffx file');
            }
        };
        reader.onerror = () => {
            this.message.error('Failed to read .ffx file');
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}
