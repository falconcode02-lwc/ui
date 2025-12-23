import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { HttpService } from '../../service/http-service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { CodeEditor } from '@acrodata/code-editor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { languages } from '@codemirror/language-data';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { presetColors } from 'ng-zorro-antd/core/color';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '../../service/workflow.service';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface WorkflowStat {
  label: string;
  count: number;
  color: string;
  icon?: string;
}

@Component({
  standalone: true,
  selector: 'app-workflow-history',
  templateUrl: './workflow-history-compact.component.html',
  styleUrl: './workflow-history-compact.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    NzListModule,
    NzTagModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzEmptyModule,
    NzSplitterModule,
    CodeEditor,
    FormsModule,
    NzCollapseModule,
    ReactiveFormsModule,
    NzFlexModule,
    NzInputModule,
    NzTimelineModule,
    NzDividerModule,
    NzDescriptionsModule,
    NzPageHeaderModule,
    NzToolTipModule,
  ],

  styles: [``],
})
export class WorkflowHistoryCompactComponent implements AfterViewInit {
  colors = presetColors;
  selectEventID: string = '';
  workflowId: string = '';
  statusList: WorkflowStat[] = [];
  status = '';
  code = '';
  events: any[] = [];
  inputdata: any = '';
  resultdata: any = '';
  options: any = {
    language: 'java',
    theme: 'dark',
    setup: 'basic',
    disabled: false,
    readonly: false,
    placeholder: '',
    indentWithTab: true,
    indentUnit: '',
    lineWrapping: true, // Enable wrap text feature
    highlightWhitespace: false,
  };
  panels: any = [];
  extensions = [];

  compactEvents: any[] = [];
  languages = languages;
  counts: any = [];

  // Interactive features
  expandedEventIds: Set<string> = new Set();
  filterStatus: string = 'all';
  searchTerm: string = '';
  hoveredEventId: string = '';
  sortOrder: 'asc' | 'desc' = 'desc'; // Default: newest first
  workflowdefId: string = '';
  // Statistics
  stats = {
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    duration: 0,
  };

  constructor(
    private httpsService: HttpService,
    private message: NzMessageService,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private workflowservice: WorkflowService,
    private router: Router
  ) { }

  ngOnInit() {
    this.events = [];
    this.workflowId = this.route.snapshot.paramMap.get('id')!;
    if (this.workflowId) this.onSearchClick();
  }

  onSearchClick() {
    this.compactEvents = [];
    this.status = '';
    this.httpsService
      .getDashboardHistory(this.workflowId)
      .subscribe((d: any) => {
        debugger
        this.events = d.events;
        this.makeCompact();
        if (this.compactEvents.length > 0) {
          this.openModal(this.compactEvents[0]);
        }

        this.cdr.markForCheck();
      });
  }

  viewInEditor() {
    this.router.navigate(['/workflow/designer/' + this.workflowdefId, this.workflowId]);
  }
  makeCompact() {
    let compactInnerEvent = [];
    let newCompactEvents = [];
    let record = {};
    for (let i = 0; i < this.events.length; i++) {
      let evts: any = this.events[i];
      console.log(evts);

      if (evts.eventType === 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED') {
        let d =
          evts?.workflowExecutionStartedEventAttributes?.input?.payloads[0]
            .data;
        console.log(d);
        let k: any = this.tryDecodeIfBase64(d);
        let ds = JSON.parse(k);
        this.inputdata = this.pretty(ds);
        this.workflowdefId = ds.workflowDefId;

      } else if (evts.eventType === 'EVENT_TYPE_TIMER_STARTED') {
        let eventId = evts.eventId;
        let EVENT_TYPE_TIMER_STARTED: any = evts;

        let EVENT_TYPE_TIMER_FIRED: any = this.events.find((d) => {
          return (
            d.eventType === 'EVENT_TYPE_TIMER_FIRED' &&
            d.eventId == parseInt(eventId) + 1
          );
        });
        EVENT_TYPE_TIMER_STARTED.AType = 'TIMER';
        EVENT_TYPE_TIMER_STARTED.icon = 'clock-circle';

        let k = {
          ...EVENT_TYPE_TIMER_STARTED,
          details: [],
        };
        if (EVENT_TYPE_TIMER_STARTED) k.details.push(EVENT_TYPE_TIMER_STARTED);

        if (EVENT_TYPE_TIMER_FIRED) k.details.push(EVENT_TYPE_TIMER_FIRED);

        this.compactEvents.push(k);
      } else if (evts.eventType === 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED') {
        // console.log(evts[i]);
        let eventId = evts.eventId;
        let EVENT_TYPE_ACTIVITY_TASK_SCHEDULED: any = evts;

        EVENT_TYPE_ACTIVITY_TASK_SCHEDULED.AType = 'ACTIVITY';
        EVENT_TYPE_ACTIVITY_TASK_SCHEDULED.icon = 'function';

        let EVENT_TYPE_ACTIVITY_TASK_STARTED: any = this.events.find((d) => {
          return (
            d.eventType === 'EVENT_TYPE_ACTIVITY_TASK_STARTED' &&
            d.eventId == parseInt(eventId) + 1
          );
        });

        let EVENT_TYPE_ACTIVITY_TASK_COMPLETED: any = this.events.find((d) => {
          return (
            d.eventType === 'EVENT_TYPE_ACTIVITY_TASK_COMPLETED' &&
            d.eventId == parseInt(eventId) + 2
          );
        });

        if (!EVENT_TYPE_ACTIVITY_TASK_COMPLETED) {
          if (
            EVENT_TYPE_ACTIVITY_TASK_STARTED?.activityTaskStartedEventAttributes
              ?.lastFailure
          ) {
            EVENT_TYPE_ACTIVITY_TASK_SCHEDULED.error =
              EVENT_TYPE_ACTIVITY_TASK_STARTED?.activityTaskStartedEventAttributes?.lastFailure?.message;
          }
        }
        let fn =
          EVENT_TYPE_ACTIVITY_TASK_SCHEDULED
            .activityTaskScheduledEventAttributes?.activityType?.name;
        if (fn == 'CallCondition') {
          EVENT_TYPE_ACTIVITY_TASK_SCHEDULED.AType = 'If Condition';
          EVENT_TYPE_ACTIVITY_TASK_SCHEDULED.icon = 'sisternode';
        }

        let k = {
          ...EVENT_TYPE_ACTIVITY_TASK_SCHEDULED,
          details: [],
        };
        if (EVENT_TYPE_ACTIVITY_TASK_SCHEDULED)
          k.details.push(EVENT_TYPE_ACTIVITY_TASK_SCHEDULED);

        if (EVENT_TYPE_ACTIVITY_TASK_STARTED)
          k.details.push(EVENT_TYPE_ACTIVITY_TASK_STARTED);

        if (EVENT_TYPE_ACTIVITY_TASK_COMPLETED)
          k.details.push(EVENT_TYPE_ACTIVITY_TASK_COMPLETED);

        this.compactEvents.push(k);
        console.log(this.compactEvents);
      } else if (evts.eventType === 'EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED') {
        this.status = 'completed';
        let respay =
          evts?.workflowExecutionCompletedEventAttributes?.result?.payloads;
        if (respay && respay instanceof Array) {
          let arr = this.tryDecodeIfBase64(respay[0].data);
          this.resultdata = this.pretty(JSON.parse(arr || '{}'));
        }
      } else if (evts.eventType === 'EVENT_TYPE_WORKFLOW_EXECUTION_FAILED') {
        this.status = 'failed';
      } else {
        this.status = 'processing';
      }
      // else if (evts.eventType === 'EVENT_TYPE_WORKFLOW_TASK_SCHEDULED') {
      //     let eventId = evts.eventId;
      //     let EVENT_TYPE_WORKFLOW_TASK_SCHEDULED: any = evts;

      //     let EVENT_TYPE_WORKFLOW_TASK_STARTED: any = this.events.find(d => {
      //         return d.eventType === "EVENT_TYPE_WORKFLOW_TASK_STARTED" && d.eventId == (parseInt(eventId) + 1);
      //     });

      //     let EVENT_TYPE_WORKFLOW_TASK_COMPLETED: any = this.events.find(d => {
      //         return d.eventType === "EVENT_TYPE_WORKFLOW_TASK_COMPLETED" && d.eventId == (parseInt(eventId) + 1);
      //     })
      //     EVENT_TYPE_WORKFLOW_TASK_SCHEDULED.AType = 'Completed';
      //     EVENT_TYPE_WORKFLOW_TASK_SCHEDULED.icon = 'clock-circle';

      //     let k = {
      //         ...EVENT_TYPE_WORKFLOW_TASK_SCHEDULED,
      //         details: []
      //     }
      //     if (EVENT_TYPE_WORKFLOW_TASK_STARTED)
      //         k.details.push(EVENT_TYPE_WORKFLOW_TASK_STARTED);

      //     if (EVENT_TYPE_WORKFLOW_TASK_COMPLETED)
      //         k.details.push(EVENT_TYPE_WORKFLOW_TASK_COMPLETED);

      //     this.compactEvents.push(k);
      // }
    }
    console.log(this.compactEvents);
    this.calculateStats();
  }

  ngAfterViewInit() { }

  trackByIndex(_: number, item: any) {
    return item?.eventId ?? item?.id ?? _;
  }

  shortId(ev: any): string | null {
    const id = ev?.eventId ?? ev?.id ?? null;
    return id != null ? `#${id}` : null;
  }

  eventTime(ev: any): string {
    const t =
      ev?.eventTime ??
      ev?.timestamp ??
      ev?.timestampMillis ??
      ev?.event_time ??
      null;
    if (!t) return '';
    if (typeof t === 'number') {
      const ms = t > 1e12 ? t : t * 1000;
      return new Date(ms).toLocaleTimeString();
    }
    try {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString();
    } catch { }
    return String(t);
  }

  summary(ev: any): string {
    // lightweight summary: prefer a short attribute or decoded payload
    const userMeta = this.getNested(ev, ['userMetadata', 'summary']);
    if (userMeta) {
      const enc = ''; //this.tryDecodeIfBase64(this.getNested(userMeta, ['metadata', 'encoding']));
      const dat = this.tryDecodeIfBase64(this.getNested(userMeta, ['data']));
      return `${enc ?? 'user'} ${dat ?? '-'}`;
    }

    const attrs =
      ev?.workflowExecutionStartedEventAttributes ??
      ev?.activityTaskScheduledEventAttributes ??
      ev?.attributes ??
      ev?.payloads ??
      null;

    if (attrs) {
      const candidates = [
        'activityType',
        'name',
        'reason',
        'message',
        'input',
        'details',
      ];
      for (const k of candidates) {
        const v = this.getNested(attrs, [k]);
        if (v)
          return this.truncate(
            String(typeof v === 'object' ? JSON.stringify(v) : v),
            80
          );
      }
    }

    // try payloads array first element
    const payloads =
      this.getNested(ev, ['attributes', 'payloads']) ??
      this.getNested(ev, ['payloads']);
    if (Array.isArray(payloads) && payloads.length) {
      const p = payloads[0];
      const candidate = p?.data ?? p;
      if (typeof candidate === 'string') {
        return (
          this.tryDecodeIfBase64(candidate) ?? this.truncate(candidate, 80)
        );
      }
    }

    return '';
  }

  selectedEvent: any = {};
  openModal(ev: any) {
    this.selectedEvent = ev;
    this.selectEventID = ev.eventId;
    const body = this.pretty(ev);
    console.log(ev.details);
    this.panels = [...ev.details];
    console.log(this.panels);
    //this.code = body;
    this.cdr.detectChanges();
    // this.modal.create({
    //     nzTitle: `${ev?.eventType ?? ev?.type ?? 'Event'} ${ev?.eventId ? ('#' + ev.eventId) : ''}`,
    //     nzContent: `<pre style="white-space:pre-wrap;max-height:60vh;overflow:auto;font-size:12px">${this.escapeHtml(body)}</pre>`,
    //     nzWidth: 800,
    //     nzFooter: null
    // });
  }

  pretty(ev: any): string {
    try {
      return JSON.stringify(ev, null, 2);
    } catch {
      return String(ev);
    }
  }

  // ---------- small helpers ----------
  getNested(obj: any, path: string[]): any {
    let cur = obj;
    for (const p of path) {
      if (cur == null) return null;
      cur = cur[p];
    }
    return cur;
  }

  tryDecodeIfBase64(s: any): string | null {
    if (typeof s !== 'string') return null;
    const trimmed = s.trim();
    if (!trimmed) return null;
    const base64Regex =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (!base64Regex.test(trimmed)) return null;
    try {
      const decoded = atob(trimmed);
      try {
        const parsed = JSON.parse(decoded);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch {
        return decoded;
      }
    } catch {
      return null;
    }
  }

  truncate(s: string, len = 100) {
    return s.length > len ? s.slice(0, len - 1) + '…' : s;
  }

  escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  getInput(data: any) { }

  getOutPut(data: any) { }

  eventTime1(event: any): string {
    return new Date(event?.eventTime).toLocaleString();
  }

  summary1(event: any): string {
    return (
      event?.activityTaskScheduledEventAttributes?.activityType?.name || 'N/A'
    );
  }

  decodeSummary(base64Data: string): string {
    try {
      const decoded = atob(base64Data);
      return JSON.parse(decoded || '""');
    } catch {
      return base64Data;
    }
  }

  failureSummary(event: any): string {
    const failure = event?.activityTaskStartedEventAttributes?.lastFailure;
    if (!failure) return event?.error || 'No error';
    let msg = failure.message || '';
    if (failure?.cause?.message) msg += '\nCause: ' + failure.cause.message;
    if (failure?.cause?.source) msg += '\nSource: ' + failure.cause.source;
    return msg.trim();
  }

  colorForEvent(type: string): string {
    switch (type) {
      case 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED':
        return 'blue';
      case 'EVENT_TYPE_ACTIVITY_TASK_STARTED':
        return 'green';
      case 'EVENT_TYPE_ACTIVITY_TASK_COMPLETED':
        return 'purple';
      case 'EVENT_TYPE_ACTIVITY_TASK_FAILED':
        return 'red';
      default:
        return 'default';
    }
  }

  decodeActivityResult(payload: any): any {
    const base64Data = payload?.[0]?.data;
    if (!base64Data) return {};

    try {
      const jsonStr = atob(base64Data);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to decode activity result:', e);
      return { error: 'Invalid or undecodable data' };
    }
  }

  terminateWorkflow() {
    this.workflowservice
      .terminateWorkflows(this.workflowId, '')
      .subscribe((d) => {
        if (d.status === 'SUCCESS') {
          this.message.success('Successfully Terminated!', { nzDuration: 500 });
          this.onSearchClick();
        } else {
          this.message.error('Failed to terminate! ' + d.errorMessage, {
            nzDuration: 8000,
          });
        }
      });
  }

  // Interactive features
  toggleEventExpansion(eventId: string) {
    if (this.expandedEventIds.has(eventId)) {
      this.expandedEventIds.delete(eventId);
    } else {
      this.expandedEventIds.clear(); // Only one expanded at a time
      this.expandedEventIds.add(eventId);
    }
  }

  isEventExpanded(eventId: string): boolean {
    return this.expandedEventIds.has(eventId);
  }

  setHoveredEvent(eventId: string) {
    this.hoveredEventId = eventId;
  }

  clearHoveredEvent() {
    this.hoveredEventId = '';
  }

  getFilteredEvents() {
    let filtered = this.compactEvents;

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((ev) => {
        if (this.filterStatus === 'error') return ev.error;
        if (this.filterStatus === 'success')
          return (
            !ev.error &&
            ev.details?.some(
              (d: any) =>
                d.eventType?.includes('COMPLETED') ||
                d.eventType?.includes('TIMER_FIRED')
            )
          );
        return true;
      });
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ev) =>
          this.summary(ev)?.toLowerCase().includes(term) ||
          ev.eventType?.toLowerCase().includes(term) ||
          ev.AType?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const timeA = new Date(
        a.eventTime || a.details?.[0]?.eventTime
      ).getTime();
      const timeB = new Date(
        b.eventTime || b.details?.[0]?.eventTime
      ).getTime();
      return this.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  calculateStats() {
    this.stats.total = this.compactEvents.length;
    this.stats.completed = this.compactEvents.filter((ev) =>
      ev.details?.some(
        (d: any) =>
          d.eventType?.includes('COMPLETED') ||
          d.eventType?.includes('TIMER_FIRED')
      )
    ).length;
    this.stats.failed = this.compactEvents.filter((ev) => ev.error).length;
    this.stats.processing =
      this.stats.total - this.stats.completed - this.stats.failed;

    // Calculate total duration
    if (this.events.length > 0) {
      const timestamps = this.events
        .map((e) => new Date(e.eventTime).getTime())
        .filter((t) => !isNaN(t));

      if (timestamps.length > 0) {
        const start = Math.min(...timestamps);
        const end = Math.max(...timestamps);
        this.stats.duration = Math.max(0, end - start);
      } else {
        this.stats.duration = 0;
      }
    }
  }

  getEventDuration(event: any): string {
    if (!event.details || event.details.length < 2) return '';

    const timestamps = event.details
      .map((d: any) => new Date(d.eventTime).getTime())
      .filter((t: number) => !isNaN(t));

    if (timestamps.length < 2) return '';

    const start = Math.min(...timestamps);
    const end = Math.max(...timestamps);
    const duration = Math.max(0, end - start);

    return this.formatDuration(duration);
  }

  formatDuration(ms: number): string {
    if (ms < 0) ms = 0;
    if (ms < 1000) return `${ms}ms`;

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  getEventStatusColor(event: any): string {
    if (event.error) return 'error';
    if (
      event.details?.some(
        (d: any) =>
          d.eventType?.includes('COMPLETED') ||
          d.eventType?.includes('TIMER_FIRED')
      )
    )
      return 'success';
    return 'processing';
  }

  getEventIcon(event: any): string {
    return event.icon || 'clock-circle';
  }
}
