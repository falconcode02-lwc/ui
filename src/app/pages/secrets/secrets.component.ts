import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpService } from '../../service/http-service';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
// Pagination not used for Secrets list
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { PluginService, PluginDto } from '../../service/plugin.service';
import { VAULT_TYPE_OPTIONS } from '../../common/vault-type';

@Component({
    selector: 'app-secrets',
    templateUrl: './secrets.component.html',
    styleUrls: ['./secrets.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NzButtonModule, NzTableModule, NzModalModule, NzFormModule, NzInputModule, NzSelectModule, NzPopconfirmModule, NzIconModule, NzSpaceModule, NzPageHeaderModule, NzListModule, NzDropDownModule, NzEmptyModule, NzSpinModule, NzDividerModule, NzInputNumberModule]
})
export class SecretsComponent implements OnInit {

    vaultTypeOptions = VAULT_TYPE_OPTIONS;

    secrets: any[] = [];
    filteredSecrets: any[] = [];
    searchQuery: string = '';
    isModalVisible = false;
    isEditing = false;
    editingSecret: any = null;
    loading = false;
    saving = false;
    form: FormGroup;

    // Plugin-related properties
    plugins: PluginDto[] = [];
    pluginsWithSecrets: PluginDto[] = []; // Only plugins that have secrets defined
    loadingPlugins = false;
    pluginsLoaded = false;
    selectedPlugin: PluginDto | null = null;
    dynamicSecretFields: any[] = []; // Parsed secret fields from plugin's secrets JSON
    // Holds existing credentials for selected plugin type (for future dropdown/autocomplete; does NOT filter main list)
    pluginCredentials: any[] = [];

    constructor(
        private http: HttpService,
        private fb: FormBuilder,
        private msg: NzMessageService,
        private cd: ChangeDetectorRef,
        private pluginService: PluginService
    ) {
        this.form = this.fb.group({
            id: [null],
            name: ['', [Validators.required]],
            pluginId: [null],
            vaultType: ['DB', [Validators.required]]
            // Dynamic fields will be added when plugin is selected
        });
    }

    ngOnInit(): void {
        this.loadSecrets();
    // Plugins are only needed inside Add/Edit modal. Load lazily for faster page open.
    }

    loadPlugins(): void {
    if (this.pluginsLoaded || this.loadingPlugins) return;
        this.loadingPlugins = true;
        this.pluginService.listPlugins('', 0, 100).subscribe({
            next: (res) => {
                this.plugins = res.content || [];
                // Filter to only plugins that have secrets defined
                this.pluginsWithSecrets = this.plugins.filter(p => p.secrets && p.secrets.trim().length > 0);
                this.loadingPlugins = false;
        this.pluginsLoaded = true;
                this.cd.markForCheck();
            },
            error: (err) => {
                this.loadingPlugins = false;
                console.error('Failed to load plugins', err);
            }
        });
    }

    /**
     * Parse the secrets JSON schema from a plugin and extract field definitions
     */
    parsePluginSecrets(plugin: PluginDto): any[] {
        if (!plugin.secrets) return [];
        try {
            const secObj = JSON.parse(plugin.secrets);
            // Handle multiple formats (same logic as PluginService)
            if (Array.isArray(secObj)) {
                return secObj;
            } else if (secObj.secrets && Array.isArray(secObj.secrets)) {
                return secObj.secrets;
            } else if (secObj.fields && Array.isArray(secObj.fields)) {
                return secObj.fields;
            } else {
                // Fallback: find first array value
                for (const key in secObj) {
                    if (Array.isArray(secObj[key])) {
                        return secObj[key];
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing plugin secrets:', e);
        }
        return [];
    }

    /**
     * Called when user selects a plugin from the dropdown
     */
    onPluginChange(pluginId: number): void {
        // Remove old dynamic fields from form
        this.dynamicSecretFields.forEach(field => {
            if (this.form.contains(field.id)) {
                this.form.removeControl(field.id);
            }
        });

        this.selectedPlugin = this.pluginsWithSecrets.find(p => p.id === pluginId) || null;
        this.dynamicSecretFields = [];
    this.pluginCredentials = [];

        if (this.selectedPlugin) {
            this.dynamicSecretFields = this.parsePluginSecrets(this.selectedPlugin);
            // Add dynamic form controls for each secret field
            this.dynamicSecretFields.forEach(field => {
                const validators = field.required ? [Validators.required] : [];
                this.form.addControl(field.id, this.fb.control(field.defaultValue || '', validators));
            });

            // Load existing credentials for this plugin type (like Workflow bindSecrets(type)),
            // BUT do not change the main list view. We only store it for optional UI use.
            const type = (this.selectedPlugin as any)?.pluginId;
            if (type) {
                this.http.listSecretsByType(type).subscribe({
                    next: (res: any) => {
                        const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
                        this.pluginCredentials = Array.isArray(list) ? list : [];
                        this.cd.markForCheck();
                    },
                    error: () => {
                        this.pluginCredentials = [];
                    }
                });
            }
        }
        this.cd.detectChanges();
    }

    loadSecrets(): void {
        this.loading = true;
        this.http.listSecrets().subscribe({
            next: (res: any) => {
                const list = Array.isArray(res) ? res : (res?.data || []);
                // Precompute frequently rendered/derived fields to keep template fast.
                this.secrets = (Array.isArray(list) ? list : []).map((s: any) => {
                    const updatedAtText = this.formatDate(s?.updatedAt);
                    return { ...s, updatedAtText };
                });
                this.updateFilteredSecrets();
                this.loading = false;
                this.cd.markForCheck();
            },
            error: (err: any) => {
                this.loading = false;
                this.msg.error('Failed to load credentials');
            }
        });
    }

    onSearchChange(query: string): void {
        this.updateFilteredSecrets();
    }

    updateFilteredSecrets(): void {
        let filtered = this.secrets;
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = this.secrets.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.type && s.type.toLowerCase().includes(q))
            );
        }
        this.filteredSecrets = filtered;
    }

    trackBySecretId(index: number, item: any): any {
        return item?.id ?? item?.name ?? index;
    }

    openCreate(): void {
    this.loadPlugins();
        this.isEditing = false;
        this.editingSecret = null;
        this.selectedPlugin = null;
        this.dynamicSecretFields = [];
        
        // Remove any old dynamic fields
        Object.keys(this.form.controls).forEach(key => {
            if (!['id', 'name', 'pluginId', 'vaultType'].includes(key)) {
                this.form.removeControl(key);
            }
        });
        
        this.form.reset({ vaultType: 'DB', pluginId: null });
        // ensure visibility change is picked up by change detection when loaded via router
        this.isModalVisible = true;
        // small tick to ensure modal overlay is rendered
        setTimeout(() => {
            try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        }, 0);
        console.log('Secrets.openCreate -> isModalVisible', this.isModalVisible);
    }

    openEdit(s: any): void {
    this.loadPlugins();
        this.isEditing = true;
        this.editingSecret = s;
        this.selectedPlugin = null;
        this.dynamicSecretFields = [];
        
        // Remove any old dynamic fields first
        Object.keys(this.form.controls).forEach(key => {
            if (!['id', 'name', 'pluginId', 'vaultType'].includes(key)) {
                this.form.removeControl(key);
            }
        });

        // If secret has a pluginId, load that plugin's schema and populate fields
        if (s.pluginId) {
            const plugin = this.pluginsWithSecrets.find(p => p.id === s.pluginId);
            if (plugin) {
                this.selectedPlugin = plugin;
                this.dynamicSecretFields = this.parsePluginSecrets(plugin);
                // Add dynamic form controls
                this.dynamicSecretFields.forEach(field => {
                    const validators = field.required ? [Validators.required] : [];
                    const value = s.secretData?.[field.id] || s[field.id] || field.defaultValue || '';
                    this.form.addControl(field.id, this.fb.control(value, validators));
                });
            }
        }

        // patchValue with existing data
        this.form.patchValue({
            id: s.id,
            name: s.name,
            pluginId: s.pluginId || null,
            vaultType: s.vaultType || 'DB'
        });
        this.isModalVisible = true;
    }

    formatDate(v: any): string {
        if (!v) return '';
        try {
            const d = new Date(v);
            return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
        } catch (e) { return String(v); }
    }

    closeModal(): void {
        this.isModalVisible = false;
        try { this.cd.detectChanges(); } catch (e) { }
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        
        // Build payload to match Workflow implementation:
        // { name, type, value: JSON.stringify({ secretName: name, ...dynamicFields }), metadata: '' }
        // Keep extra fields (pluginId/vaultType) as they're used by UI/backends that support vault selection.
        const formValues = this.form.value;
        const secretData: any = {};

        // Collect dynamic field values
        this.dynamicSecretFields.forEach(field => {
            secretData[field.id] = formValues[field.id];
        });

        // Ensure workflow-compatible shape.
        // Workflow uses `type: this.selectedNode?.data?.call[0]` which is typically the plugin type/class name.
        // Workflow persists secrets with `type` equal to the plugin "call[0]" value.
        // In this app, that maps to PluginDto.pluginId (e.g. TelegramMessagePlugin).
        // Do NOT use pluginName (e.g. "Telegram"), otherwise `/api/secrets/getByType?type=...` won't match.
        const pluginType =
            (this.selectedPlugin as any)?.pluginId ||
            (this.selectedPlugin as any)?.type ||
            (this.selectedPlugin as any)?.pluginType ||
            (this.selectedPlugin as any)?.className ||
            (this.selectedPlugin as any)?.name ||
            'custom';

        const valueObj: any = {
            secretName: formValues.name,
            ...secretData
        };

        const payload: any = {
            // backend-required fields
            name: formValues.name,
            type: pluginType,
            value: JSON.stringify(valueObj),
            metadata: (this.editingSecret as any)?.metadata || '',

            // additional fields (safe to keep; backend may ignore)
            id: formValues.id,
            pluginId: formValues.pluginId,
            pluginName: this.selectedPlugin?.pluginName || null,
            vaultType: formValues.vaultType,
            secretData: valueObj
        };

        this.saving = true;
        if (this.isEditing && this.editingSecret && this.editingSecret.id) {
            this.http.updateSecret(this.editingSecret.id, payload).subscribe({
                next: (res: any) => {
                    this.saving = false;
                    this.msg.success('Credential updated');
                    this.isModalVisible = false;
                    this.loadSecrets();
                },
                error: (err: any) => {
                    this.saving = false;
                    this.msg.error('Update failed');
                }
            });
        } else {
            this.http.createSecret(payload).subscribe({
                next: (res: any) => {
                    this.saving = false;
                    this.msg.success('Credential created');
                    this.isModalVisible = false;
                    this.loadSecrets();
                },
                error: (err: any) => {
                    this.saving = false;
                    this.msg.error('Create failed');
                }
            });
        }
    }

    confirmDelete(id: any): void {
        this.http.deleteSecret(id).subscribe({
            next: (res: any) => {
                this.msg.success('Credential deleted');
                this.loadSecrets();
            },
            error: (err: any) => {
                this.msg.error('Delete failed');
            }
        });
    }

}
