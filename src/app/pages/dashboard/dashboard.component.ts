import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../service/http-service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { WorkflowService } from '../../service/workflow.service';
import { RouterModule } from '@angular/router';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { constants } from '../../environments/constats'

interface WorkflowStat {
    id: string,
    label: string;
    count: any;
    color: string;
    icon?: string;
}


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, FormsModule, CommonModule, NzGridModule, NzCardModule, NzLayoutModule,
        NzMenuModule,   // Add the Menu module
        NzIconModule,   // Add the Icon module
        NzGridModule,   // Add the Grid module for flexible layouts
        NzCardModule,   // Add the Card module for dashboard widgets
        NzSkeletonModule,
    NzTableModule,
    // UI for filters
    NzSelectModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzSpaceModule,
    NzDatePickerModule,
    NzDividerModule,
    RouterModule,
    NzTagModule
    ]

    ,
    styles: [` 


  `]
})
export class DashboardComponent implements AfterViewInit {
    constants = constants;
    statusList: WorkflowStat[] = [];
    listOfData: any = [];

    counts: any = [];
    // filtering
    selectedStatuses: string[] = [];
    selectedWorkflowType: string = '';
    currentQuery: string = '';

    // advanced optional filters (hidden by default)
    showAdvancedFilters: boolean = false;
    taskQueue: string = '';
    runId: string = '';
    workflowIdFilter: string = '';
    parentWorkflowId: string = '';
    parentRunId: string = '';
    /** ISO datetime string or Date — used as CloseTime >= value */
    closeTimeFrom: string | Date | null = null;

    // protected onAdjustCellSizeWhileDraggingChange(event: boolean): void {
    //     this.adjustCellSizeWhileDragging.set(event);

    // }

    constructor(private httpsService: HttpService, private message: NzMessageService, private serviceWrkflw: WorkflowService) {
    }

    ngOnInit() {

        this.statusList = [
            { id: 'ALL', label: 'All', count: -1, color: '#ff18f7ff', icon: 'windows' },
            { id: 'RUNNING', label: 'Running', count: -1, color: '#1890ff', icon: 'loading' },
            { id: 'COMPLETED', label: 'Completed', count: -1, color: '#52c41a', icon: 'check' },
            { id: 'FAILED', label: 'Failed', count: -1, color: '#ff4d4f', icon: 'close' },
            { id: 'TERMINATED', label: 'Terminated', count: -1, color: '#faad14', icon: 'stop' },
            { id: 'TIMED_OUT', label: 'Timed out', count: -1, color: '#bfbfbf', icon: 'clock-circle' },
            { id: 'CANCELED', label: 'Canceled', count: -1, color: '#ffe186ff', icon: 'close-square' },
            { id: 'CONTINUED_AS_NEW', label: 'Continue As New', count: - 1, color: '#30ceeeff', icon: 'block' }
        ];
        let data: any = {};
        // Mock data (replace with API call)
        this.httpsService.getDashboardCount().subscribe(((a: any) => {
            // let keys = Object.keys(a);
            // for (let i = 0; i < keys.length; i++) {
            //     const el = keys[i];
            //     this.counts.push({ key: el, value: a[el] })

            // }
            data = a;

            let total = (data.RUNNING || 0) + (data.COMPLETED || 0) + (data.FAILED || 0) + (data.TERMINATED || 0) + (data.TIMED_OUT || 0) + (data.CANCELED || 0) + (data.CONTINUED_AS_NEW || 0);


            this.statusList[0].count = total;
            this.statusList[1].count = data.RUNNING;
            this.statusList[2].count = data.COMPLETED;
            this.statusList[3].count = data.FAILED;
            this.statusList[4].count = data.TERMINATED;
            this.statusList[5].count = data.TIMED_OUT;
            this.statusList[6].count = data?.CANCELED;
            this.statusList[7].count = data?.CONTINUED_AS_NEW;


            // initialize tokens and load first page using server-side pagination
            this.tokensByPage = { 1: '' };
                this.loadWorkflows(1);
            //this.setupChart(data);
        }))



    }

    onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
        //console.log(listOfCurrentPageData)
        // this.loadWorkflows();
    }
    nextToken = '';
    pageIndex = 1;
    pageSize = 50;
    // map of page->nextPageToken to support jumping back/forth
    private tokensByPage: Record<number, string> = { 1: '' };
    private isLoadingPage = false;
    private currentPage = 1;
    // load specific page (1-based). If token is provided it will be used; otherwise tokensByPage will be consulted.
    loadWorkflows(page: number = 1): Promise<void> {
        if (this.isLoadingPage) return Promise.resolve();
        this.isLoadingPage = true;
        const token = this.tokensByPage[page] ?? '';
        this.pageIndex = page;
        this.pageSize = this.pageSize || 50;
        return new Promise((resolve) => {
            // pass token (already stored as base64) to API
                // pass currentQuery (server filter) to API
                this.serviceWrkflw.getWorkflows('default', this.currentQuery || '', this.pageSize, token).subscribe(d => {
                this.listOfData = d.items || [];
                // store next token for the following page
                if (d.nextPageToken) {
                    // ensure we store the token in base64 form
                    try {
                        this.tokensByPage[page + 1] = this.toBase64(String(d.nextPageToken));
                    } catch (e) {
                        // fallback to raw token if encoding fails
                        this.tokensByPage[page + 1] = String(d.nextPageToken);
                    }
                }
                this.nextToken = d.nextPageToken || '';
                this.currentPage = page;
                this.isLoadingPage = false;
                resolve();
            }, () => {
                this.isLoadingPage = false;
                resolve();
            })
        });
    }

    // handle page index change from the table
    async onPageIndexChange(newIndex: number) {
        if (newIndex === this.currentPage) return;
        // if we already have token for that page, just load it
        if (this.tokensByPage[newIndex]) {
            await this.loadWorkflows(newIndex);
            return;
        }
        // if user is moving forward, fetch pages sequentially until we reach target
        if (newIndex > this.currentPage) {
            for (let p = this.currentPage + 1; p <= newIndex; p++) {
                await this.loadWorkflows(p);
            }
            return;
        }
        // if user requested an earlier page but token not known, reload from start sequentially
        // clear tokens and re-fetch from page 1 until target
        this.tokensByPage = { 1: '' };
        await this.loadWorkflows(1);
        for (let p = 2; p <= newIndex; p++) {
            await this.loadWorkflows(p);
        }
    }

    async onPageSizeChange(size: number) {
        this.pageSize = size;
        // reset paging tokens and reload from page 1
        this.tokensByPage = { 1: '' };
        await this.loadWorkflows(1);
    }

    colorForEvent(type: string): string {
        let val = type.replace('WORKFLOW_EXECUTION_STATUS_', '');
        return this.statusList.find(a => a.id == val)?.color || 'gray';
    }

    statusName(type: string): string {
        let val = type.replace('WORKFLOW_EXECUTION_STATUS_', '');
        return this.statusList.find(a => a.id == val)?.label || '-';
    }
    statusIcon(type: string): string {
        let val = type.replace('WORKFLOW_EXECUTION_STATUS_', '');
        return this.statusList.find(a => a.id == val)?.icon || '-';
    }

    ngAfterViewInit() {

    }

    /**
     * Encode a token into base64 safely for transport/storage.
     */
    private toBase64(value: string): string {
        try {
            // Use encodeURIComponent to support unicode then btoa
            return btoa(encodeURIComponent(value));
        } catch (e) {
            try {
                return btoa(value);
            } catch (ex) {
                return value;
            }
        }
    }

    /** Build the server query string from selected filters. Supports advanced optional filters. */
    private buildQuery(): string {
        const parts: string[] = [];
        // statuses
        if (this.selectedStatuses && this.selectedStatuses.length) {
            const statusParts = this.selectedStatuses.map(s => `ExecutionStatus=\"${s}\"`);
            parts.push(`(${statusParts.join(' OR ')})`);
        }

        // WorkflowType: support comma-separated values in the input (e.g. "a,gh")
        if (this.selectedWorkflowType && this.selectedWorkflowType.trim()) {
            const wfTypes = this.selectedWorkflowType.split(',').map(w => w.trim()).filter(Boolean);
            if (wfTypes.length === 1) {
                parts.push(`\`WorkflowType\`=\"${wfTypes[0]}\"`);
            } else if (wfTypes.length > 1) {
                const wfParts = wfTypes.map(w => `\`WorkflowType\`=\"${w}\"`);
                parts.push(`(${wfParts.join(' OR ')})`);
            }
        }

        // Advanced optional filters
        if (this.taskQueue && this.taskQueue.trim()) {
            parts.push(`\`TaskQueue\`=\"${this.taskQueue.trim()}\"`);
        }
        if (this.runId && this.runId.trim()) {
            parts.push(`\`RunId\`=\"${this.runId.trim()}\"`);
        }
        if (this.workflowIdFilter && this.workflowIdFilter.trim()) {
            parts.push(`\`WorkflowId\`=\"${this.workflowIdFilter.trim()}\"`);
        }
        if (this.parentWorkflowId && this.parentWorkflowId.trim()) {
            parts.push(`\`ParentWorkflowId\`=\"${this.parentWorkflowId.trim()}\"`);
        }
        if (this.parentRunId && this.parentRunId.trim()) {
            parts.push(`\`ParentRunId\`=\"${this.parentRunId.trim()}\"`);
        }
        if (this.closeTimeFrom) {
            let iso: string;
            if (this.closeTimeFrom instanceof Date) {
                iso = (this.closeTimeFrom as Date).toISOString();
            } else {
                iso = String(this.closeTimeFrom);
            }
            parts.push(`\`CloseTime\`>="${iso}"`);
        }

        return parts.join(' AND ');
    }

    /** Apply filters and reload data from page 1. */
    applyFilters(): void {
        this.currentQuery = this.buildQuery();
        // reset tokens and reload
        this.tokensByPage = { 1: '' };
        this.loadWorkflows(1);
    }

    /** Clear filters and reload. */
    clearFilters(): void {
        this.selectedStatuses = [];
        this.selectedWorkflowType = '';
        this.currentQuery = '';
        // clear advanced
        this.showAdvancedFilters = false;
        this.taskQueue = '';
        this.runId = '';
        this.workflowIdFilter = '';
        this.parentWorkflowId = '';
        this.parentRunId = '';
        this.closeTimeFrom = null;
        this.tokensByPage = { 1: '' };
        this.loadWorkflows(1);
    }
}
