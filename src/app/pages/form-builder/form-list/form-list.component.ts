import { Component, OnInit } from '@angular/core';
import { FormService } from '../../../service/form.service';
import { Form } from '../../../model/form-model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableSortOrder } from 'ng-zorro-antd/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { constants } from '../../../environments/constats';
import { arrayToDate } from '../../../common/dateformat';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
    selector: 'app-form-list',
    templateUrl: './form-list.component.html',
    styleUrls: ['./form-list.component.scss'],
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        NzListModule,
        NzCardModule,
        NzEmptyModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        NzToolTipModule,
        NzSwitchModule,
        NzModalModule,
        NzPageHeaderModule,
        NzGridModule,
        NzSpaceModule,
        NzDropDownModule
    ]
})
export class FormListComponent implements OnInit {

    constants = constants;
    forms: Form[] = [];
    filteredForms: Form[] = [];
    loading = false;
    searchText = '';

    sortKey: keyof Form | null = null;
    sortValue: NzTableSortOrder | null = null;


    constructor(
        private formService: FormService,
        private message: NzMessageService,
        private router: Router,
        private modal: NzModalService
    ) { }

    ngOnInit(): void {
        this.loadForms();
    }

    loadForms(): void {
        this.loading = true;
        this.formService.getAll().subscribe({
            next: (data) => {

                data.map(d => {
                    d.createdTime = arrayToDate(d.createdTime)
                    d.modifiedTime = arrayToDate(d.modifiedTime)
                })

                this.forms = data;
                this.filteredForms = data;
                this.loading = false;
            },
            error: () => {
                this.message.error('Failed to load forms');
                this.loading = false;
            }
        });
    }

    search(): void {
        const keyword = this.searchText.toLowerCase();
        this.filteredForms = this.forms.filter(
            (f) =>
                f.name.toLowerCase().includes(keyword) ||
                f.code.toLowerCase().includes(keyword) ||
                f.description.toLowerCase().includes(keyword)
        );
    }

    sort(sort: { key: string; value: NzTableSortOrder }): void {
        this.sortKey = sort.key as keyof Form;
        this.sortValue = sort.value;

        if (this.sortKey && this.sortValue) {
            // Optional: implement sorting logic if needed
        } else {
            this.filteredForms = [...this.forms];
        }
    }

    edit(form: Form): void {
        this.router.navigate(['/form-builder/' + form.id]);
    }

    delete(form: Form): void {
        if (confirm(`Delete form "${form.name}"?`)) {
            this.formService.delete(form.id).subscribe({
                next: () => {
                    this.message.success('Deleted successfully');
                    this.loadForms();
                },
                error: () => this.message.error('Failed to delete form')
            });
        }
    }

    newForm() {
        this.router.navigate(['/form-builder']);
    }

    /**
     * Handle active status change
     */
    onActiveChange(event: any, form: Form): void {
        this.modal.confirm({
            nzTitle: 'Are you sure?',
            nzContent: `Do you really want to ${form.active ? 'activate' : 'deactivate'} <b>${form.name}</b>?`,
            nzOkText: `Yes, ${form.active ? 'Activate' : 'Deactivate'}`,
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.formService.active(form.id, form.active).subscribe({
                    next: () => {
                        this.message.success(`${form.active ? 'Activated' : 'Deactivated'} successfully`);
                    },
                    error: () => {
                        this.message.error(`Failed to ${form.active ? 'activate' : 'deactivate'} form`);
                        form.active = !form.active;
                    }
                });
            },
            nzCancelText: 'Cancel',
            nzOnCancel: () => {
                // Revert the toggle
                form.active = !form.active;
            },
        });
        event.preventDefault();
        event.stopPropagation();
    }
}
