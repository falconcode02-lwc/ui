import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

@Component({
    selector: 'app-secrets',
    templateUrl: './secrets.component.html',
    styleUrls: ['./secrets.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NzButtonModule, NzTableModule, NzModalModule, NzFormModule, NzInputModule, NzPopconfirmModule, NzIconModule, NzSpaceModule, NzPageHeaderModule, NzListModule, NzDropDownModule, NzPaginationModule, NzEmptyModule]
})
export class SecretsComponent implements OnInit {

    secrets: any[] = [];
    filteredSecrets: any[] = [];
    paginatedSecrets: any[] = [];
    searchQuery: string = '';
    pageIndex = 1;
    pageSize = 10;
    isModalVisible = false;
    isEditing = false;
    editingSecret: any = null;
    loading = false;
    saving = false;
    form: FormGroup;

    constructor(private http: HttpService, private fb: FormBuilder, private msg: NzMessageService, private cd: ChangeDetectorRef) {
        this.form = this.fb.group({
            id: [null],
            name: ['', [Validators.required]],
            type: ['text'],
            value: ['', [Validators.required]],
            metadata: ['']
        });
    }

    ngOnInit(): void {
        this.loadSecrets();
    }

    loadSecrets(): void {
        this.loading = true;
        this.http.listSecrets().subscribe({
            next: (res: any) => {
                this.secrets = Array.isArray(res) ? res : (res?.data || []);
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
        this.pageIndex = 1;
        this.updateFilteredSecrets();
    }

    onPageChange(page: number): void {
        this.pageIndex = page;
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
        const startIndex = (this.pageIndex - 1) * this.pageSize;
        this.paginatedSecrets = filtered.slice(startIndex, startIndex + this.pageSize);
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingSecret = null;
        this.form.reset({ type: 'text', metadata: '' });
        // ensure visibility change is picked up by change detection when loaded via router
        this.isModalVisible = true;
        // small tick to ensure modal overlay is rendered
        setTimeout(() => {
            try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        }, 0);
        console.log('Secrets.openCreate -> isModalVisible', this.isModalVisible);
    }

    openEdit(s: any): void {
        this.isEditing = true;
        this.editingSecret = s;
        // patchValue with metadata fallback
        this.form.patchValue({
            id: s.id,
            name: s.name,
            type: s.type,
            value: s.value,
            metadata: s.metadata || s.description || ''
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
        const payload = { ...this.form.value };
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
