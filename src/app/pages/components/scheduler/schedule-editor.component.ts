import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import cronParser from 'cron-parser';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Scheduler, SchedulerService } from '../../../service/scheduler.service';
import { WorkflowService } from '../../../service/workflow.service';
import { languages } from '@codemirror/language-data';
import { CodeEditor } from '@acrodata/code-editor';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
    selector: 'app-scheduler-form',
    templateUrl: './schedule-editor.component.html',
    styleUrls: ['./schedule-editor.component.scss'],
    imports: [NzFormModule, NzInputModule, NzSelectModule, ReactiveFormsModule, NzSwitchModule, NzButtonModule, NzCardModule, CommonModule, FormsModule, NzTimePickerModule, NzSplitterModule, NzTableModule, NzTagModule, CodeEditor, NzDividerModule, NzSpaceModule, NzPopconfirmModule, NzIconModule, NzPageHeaderModule, NzListModule, NzDropDownModule, NzPaginationModule, NzEmptyModule]
})
export class SchedulerFormComponent implements OnInit {

    languages = languages;
    form!: FormGroup;
    schedulers: any[] = [];
    paginatedSchedulers: any[] = [];
    searchQuery: string = '';
    loading = false;

    // Pagination
    pageIndex = 1;
    pageSize = 10;
    selectedScheduler: any = null;
    workflows: any[] = [];

    generatedCron = '';
    nextRun: Date | null = null;
    nextRuns: Date[] = [];

    days = [
        { label: 'Sunday', value: 0 },
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
        { label: 'Saturday', value: 6 }
    ];

    months = Array.from({ length: 12 }, (_, i) => ({
        label: new Date(0, i).toLocaleString('default', { month: 'long' }),
        value: i + 1
    }));

    constructor(private fb: FormBuilder, private message: NzMessageService, private schedulerService: SchedulerService,
        private workflowService: WorkflowService) { }

    ngOnInit(): void {
        this.initForm();
        this.loadSchedulers();
        this.loadActiveWorkflows();
    }

    loadActiveWorkflows(): void {
        // this.workflowService.getActiveWorkflow().subscribe({
        //     next: (d: any) => {
        //         this.workflows = Array.isArray(d) ? d : (d?.result || []);
        //     },
        //     error: () => {
        //         this.workflows = [];
        //     }
        // });
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', Validators.required],
            workflowCode: [''],
            frequency: ['daily', Validators.required],
            hourInterval: [1],
            minuteInterval: [1],
            secondInterval: [1],
            time: [new Date()],
            daysOfWeek: [[]],
            dayOfMonth: [1],
            months: [[]],
            cron: [''],
            request: [`{
    "workflowCode":"test-1",
    "input":{ 
        "name":"eaxample name"
    },
        "state":{}
    }`],
            enabled: [true]
        });

        this.form.valueChanges.subscribe(value => {
            // console.log('Form changed:', value);
            this.updateCron();
        });
    }

    loadSchedulers(): void {
        this.loading = true;
        this.schedulerService.getAll().subscribe({
            next: data => {
                this.schedulers = data;
                this.updatePaginatedSchedulers();
                this.loading = false;
            },
            error: err => {
                this.message.error('Failed to load schedulers');
                this.loading = false;
            }
        });
    }


    selectScheduler(item: any): void {
        this.form.get('name')?.disable();
        this.selectedScheduler = item;
        this.form.patchValue(item);
        this.generatedCron = item.cron;
        this.message.info(`Editing "${item.name}"`);
    }

    toggleScheduler(item: Scheduler): void {
        if (!item.id) return;
        this.schedulerService.toggle(item.id, !item.enabled).subscribe(() => {
            this.message.success(`Scheduler ${item.enabled ? 'disabled' : 'enabled'}`);
            this.loadSchedulers();
        });
    }

    createNew(): void {
        this.form.get('name')?.enable();
        this.selectedScheduler = null;
        this.form.reset({ frequency: 'daily', enabled: true, hourInterval: 1, minuteInterval: 1, secondInterval: 1, time: new Date() });
        this.generatedCron = '';
        this.nextRun = null;
    }

    onFrequencyChange(e: any): void {
        this.updateCron();
    }

    updateCron(): void {
        const f = this.form.value;
        const h = new Date(f.time).getHours();
        const m = new Date(f.time).getMinutes();
        debugger
        switch (f.frequency) {
            case 'minutely':
                // every N minutes
                this.generatedCron = `*/${f.minuteInterval || 1} * * * *`;
                break;
            case 'secondly':
                // every N seconds (6-field cron)
                this.generatedCron = `*/${f.secondInterval || 1} * * * * *`;
                break;
            case 'hourly':
                this.generatedCron = `0 */${f.hourInterval || 1} * * *`;
                break;
            case 'daily':
                this.generatedCron = `${m} ${h} * * *`;
                break;
            case 'weekly':
                const w = f.daysOfWeek?.length ? f.daysOfWeek.join(',') : '0';
                this.generatedCron = `${m} ${h} * * ${w}`;
                break;
            case 'monthly':
                const mo = f.months?.length ? f.months.join(',') : '*';
                this.generatedCron = `${m} ${h} ${f.dayOfMonth || 1} ${mo} *`;
                break;
            case 'custom':
                this.generatedCron = f.cron;
                break;
        }

        this.updatePreview();
    }

    updatePreview(): void {

        try {
            console.log(this.generatedCron);
            // If the user selected secondly frequency, compute next runs by adding seconds
            const f = this.form.value;
            if (f.frequency === 'secondly') {
                const n = Number(f.secondInterval) || 1;
                const now = new Date();
                this.nextRuns = [];
                for (let i = 1; i <= 5; i++) {
                    this.nextRuns.push(new Date(now.getTime() + n * 1000 * i));
                }
                this.nextRun = this.nextRuns.length ? this.nextRuns[0] : null;
                return;
            }

            // fallback to cron-parser for minute/hour/day/month/custom schedules
            const interval = cronParser.parse(this.generatedCron);
            this.nextRun = interval.next().toDate();
            // next 5 runs
            this.nextRuns = [this.nextRun];
            for (let i = 1; i < 5; i++) {
                this.nextRuns.push(interval.next().toDate());
            }
        } catch {
            this.nextRun = null;
            this.nextRuns = [];
        }
    }

    // onSubmit(): void {
    //     const payload = { ...this.form.value, cron: this.generatedCron };
    //     console.log('Saved:', payload);
    //     this.message.success(this.selectedScheduler ? 'Scheduler updated!' : 'Scheduler created!');
    // }

    onReset(): void {
        this.form.reset({ frequency: 'daily', enabled: true, hourInterval: 1, minuteInterval: 1, secondInterval: 1, time: new Date() });
        this.generatedCron = '';
        this.nextRun = null;
    }

    onSubmit(): void {
        const scheduler = this.preparePayload() as Scheduler;
        scheduler.cron = this.generatedCron;
        this.preparePayload();
        // attach selected workflow code if present
        const wf = this.form.value.workflowCode;
        if (wf) scheduler.request = scheduler.request || '';

        if (this.selectedScheduler?.id) {
            this.schedulerService.update(this.selectedScheduler.id, scheduler).subscribe(() => {
                this.message.success('Scheduler updated');
                this.form.reset()
                this.loadSchedulers();
            });
        } else {
            this.schedulerService.create(scheduler).subscribe(() => {
                this.form.reset()
                this.message.success('Scheduler created');
                this.loadSchedulers();
            });
        }
    }

    preparePayload(): any {
        const f = this.form.value;
        return {
            ...f,
            daysOfWeek: Array.isArray(f.daysOfWeek) ? f.daysOfWeek.join(',') : null,
            months: Array.isArray(f.months) ? f.months.join(',') : null,
            time: undefined // backend doesn’t need it
        };
    }

    /** Delete a scheduler */
    delete(item: Scheduler): void {
        if (item.id) {
            this.schedulerService.delete(item.id).subscribe(() => {
                this.message.warning('Scheduler deleted');
                this.loadSchedulers();
            });
        }
    }

    onPageChange(page: number): void {
        this.pageIndex = page;
        this.updatePaginatedSchedulers();
    }

    onSearchChange(query: string): void {
        this.pageIndex = 1;
        this.updatePaginatedSchedulers();
    }

    updatePaginatedSchedulers(): void {
        let filtered = this.schedulers;
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = this.schedulers.filter(s => s.name && s.name.toLowerCase().includes(q));
        }
        const startIndex = (this.pageIndex - 1) * this.pageSize;
        this.paginatedSchedulers = filtered.slice(startIndex, startIndex + this.pageSize);
    }
}
