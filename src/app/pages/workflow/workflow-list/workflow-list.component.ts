import { Component, OnInit } from '@angular/core';
import { WorkflowService } from '../../../service/workflow.service';
import { Workflow } from '../../../model/workflow-model';
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
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { constants } from '../../../environments/constats';
import { arrayToDate } from '../../../common/dateformat';

import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { WorkflowImportComponent } from '../workflow-import/workflow-import.component';

@Component({
    selector: 'app-workflow-list',
    templateUrl: './workflow-list.component.html',
    styleUrls: ['./workflow-list.component.scss'],
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
        NzDropDownModule,
        WorkflowImportComponent
    ]
})
export class WorkflowListComponent implements OnInit {

    constants = constants;
    workflows: Workflow[] = [];
    filteredWorkflows: Workflow[] = [];
    loading = false;
    searchText = '';
    isImportModalVisible = false;

    sortKey: keyof Workflow | null = null;
    sortValue: NzTableSortOrder | null = null;


    constructor(
        private workflowService: WorkflowService,
        private message: NzMessageService,
        private router: Router,
        private modal: NzModalService
    ) { }

    ngOnInit(): void {
        this.loadWorkflows();
    }

    loadWorkflows(): void {
        this.loading = true;
        this.workflowService.getAll().subscribe({
            next: (data) => {

                data.map(d => {
                    debugger
                    d.createdTime = arrayToDate(d.createdTime)
                    d.modifiedTime = arrayToDate(d.modifiedTime)
                })

                this.workflows = data;
                this.filteredWorkflows = data;
                this.loading = false;
            },
            error: () => {
                this.message.error('Failed to load workflows');
                this.loading = false;
            }
        });
    }

    search(): void {
        const keyword = this.searchText.toLowerCase();
        this.filteredWorkflows = this.workflows.filter(
            (w) =>
                w.name.toLowerCase().includes(keyword) ||
                w.code.toLowerCase().includes(keyword) ||
                w.description.toLowerCase().includes(keyword)
        );
    }

    sort(sort: { key: string; value: NzTableSortOrder }): void {
        this.sortKey = sort.key as keyof Workflow;
        this.sortValue = sort.value;

        if (this.sortKey && this.sortValue) {
            // this.filteredWorkflows = [...this.filteredWorkflows].sort((a, b) => {
            //     const valA = a[this.sortKey] || '';
            //     const valB = b[this.sortKey] || '';
            //     const cmp = valA > valB ? 1 : valA < valB ? -1 : 0;
            //     return this.sortValue === 'ascend' ? cmp : -cmp;
            // });
        } else {
            this.filteredWorkflows = [...this.workflows];
        }
    }

    edit(workflow: Workflow): void {
        // this.message.info(`Edit workflow: ${workflow.name}`);
        this.router.navigate(['/workflow/designer/' + workflow.id]);
        // You can navigate to edit route or open a drawer/modal
    }

    delete(workflow: Workflow): void {
        if (confirm(`Delete workflow "${workflow.name}"?`)) {
            this.workflowService.delete(workflow.id).subscribe({
                next: () => {
                    this.message.success('Deleted successfully');
                    this.loadWorkflows();
                },
                error: () => this.message.error('Failed to delete workflow')
            });
        }
    }
    newWorkflow() {
        this.router.navigate(['/workflow/designer']);
    }

    onActiveChange(e: any, workflow: Workflow) {

        this.modal.confirm({
            nzTitle: 'Are you sure?',
            nzContent: `Do you really want to ${workflow.active ? 'activate' : 'deactivate'} <b>${workflow.name}</b>?`,
            nzOkText: `Yes, ${workflow.active ? 'Activate' : 'Deactivate'}`,
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.workflowService.active(workflow.id, workflow.active).subscribe({
                    next: () => {
                        this.message.success(`${workflow.active ? 'Activated' : 'Deactivated'} successfully`);
                        this.loadWorkflows();
                    },
                    error: () => {
                        this.message.error(`Failed to ${workflow.active ? 'activate' : 'deactivate'} workflow`)
                        workflow.active = !workflow.active;
                    }
                });
            },
            nzCancelText: 'Cancel',
            nzOnCancel: () => {
                console.log('Cancelled')
                workflow.active = !workflow.active;

            },
        });
        e.preventDefault();
        e.stopPropagation();

    }

    /**
     * Export workflow as .ffw file
     */
    exportWorkflow(workflow: Workflow, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.workflowService.exportWorkflow(workflow);
        this.message.success(`Workflow "${workflow.name}" exported successfully`);
    }

    /**
     * Open import modal
     */
    openImportModal(): void {
        this.isImportModalVisible = true;
    }

    /**
     * Close import modal
     */
    closeImportModal(): void {
        this.isImportModalVisible = false;
    }

    /**
     * Handle import completion
     */
    onImportComplete(workflow: Workflow): void {
        this.closeImportModal();
        this.loadWorkflows();
    }
}
