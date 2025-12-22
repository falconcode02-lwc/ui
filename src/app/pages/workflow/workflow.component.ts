import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  viewChild,
  signal,
  ChangeDetectorRef,
  computed,
  Pipe,
  PipeTransform,
  inject,
  Injectable,
  Injector,
  effect,
  TemplateRef,
  untracked,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import Drawflow from 'drawflow';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';

import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageComponent, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { HttpService } from '../../service/http-service';
import { Mutator } from '@foblex/mutator';
import { QueueService } from '../../classes/Queue';

import { CommonModule } from '@angular/common';
import {
  FCanvasComponent,
  FFlowModule,
  EFConnectionBehavior,
  EFMarkerType,
  FCreateNodeEvent,
  FCreateConnectionEvent,
  FFlowComponent,
  FNodeIntersectedWithConnections,
  FReassignConnectionEvent,
  FDropToGroupEvent,
  FZoomDirective,
  FMoveNodesEvent,
  F_CONNECTION_BUILDERS,
  EFResizeHandleType,
  FCanvasChangeEvent,
  EFZoomDirection,
} from '@foblex/flow';

import { N8nBezierBuilder } from '../../classes/N8nBezierConnection';

import { FormViewerComponent } from '../form-viewer/form-viewer.component';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { v4 as uuidv4 } from 'uuid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { WorkflowFormComponent } from './workflow-form/workflow-form.component';
import { WorkflowService } from '../../service/workflow.service';
import { Workflow } from '../../model/workflow-model';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorStatusService } from '../../service/editor-status-service';
import { minimalLanguages } from '../../helpers/minimal-languages';
import type { LanguageDescription } from '@codemirror/language';
import { CodeEditor } from '@acrodata/code-editor';
import { IPoint, IRect } from '@foblex/2d';
import {
  NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import {
  NzDropdownMenuComponent,
  NzDropDownModule,
  NzContextMenuServiceModule,
  NzContextMenuService,
} from 'ng-zorro-antd/dropdown';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';
import { PluginDetailComponent } from '../components/plugin-detail/plugin-detail.component';
import { MarketplaceComponent } from '../marketplace/marketplace.component';
import { BreadcrumbService } from '../../service/breadcrumb.service';
import { PluginService } from '../../service/plugin.service';
import { PluginBlock, ToolboxSection } from '../../model/plugin-model';

@Pipe({
  name: 'filter',
  pure: false,
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filter: (item: any) => boolean): any {
    if (!items || !filter) {
      return items;
    }
    return items.filter((item) => filter(item));
  }
}

@Injectable()
class FlowState extends Mutator<any> {}

const DEFAULT_STATE = {
  nodes: [],
  connections: [],
  groups: [],
  stickynotes: [],
};

const connectionBuilders = {
  ['offset_straight']: new N8nBezierBuilder(),
};

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NzFloatButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzSplitterModule,
    FormViewerComponent,
    NzGridModule,
    NzCardModule,
    NzDividerModule,
    CommonModule,
    FFlowModule,
    FormsModule,
    CommonModule,
    FilterPipe,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzDrawerModule,
    NzPopconfirmModule,
    NzModalModule,
    NzInputModule,
    NzSpinModule,
    NzTagModule,
    WorkflowFormComponent,
    NzPopoverModule,
    CodeEditor,
    NzSegmentedModule,
    NzBadgeModule,
    NzContextMenuServiceModule,
    NzDropDownModule,
    NzFormModule,
    ReactiveFormsModule,
    MarkdownModule,
    PluginDetailComponent,
    MarketplaceComponent,
  ],
  providers: [
    FlowState,
    { provide: F_CONNECTION_BUILDERS, useValue: connectionBuilders },
    QueueService,
    MarkdownService,
  ],
  styles: [
    `
      .workflow-canvas {
        width: 100%;
        height: 100%;
        position: relative;
      }
    `,
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class WorkflowEditorComponent implements AfterViewInit, OnDestroy {
  protected readonly state = inject(FlowState);
  private readonly _injector = inject(Injector);
  notes = `### Add Notes`;
  setReadOnly = false;

  // @ViewChild('editor', { static: true }) editorRef!: ElementRef;

  @ViewChild('workflowform', { static: false })
  workflowformRef!: WorkflowFormComponent;

  @ViewChild('FFlowComponent', { static: false })
  public fFlowComponent!: FFlowComponent;

  @ViewChild('propertyPanel', { static: false })
  propertyPanel!: FormViewerComponent;

  @ViewChild('secretPropertyPanel', { static: false })
  secretPropertyPanel!: FormViewerComponent;

  @ViewChild('FFlowComponent', { static: false }) flowCanvas!: ElementRef;

  @ViewChild('customMessageTemplate', { static: true })
  customTemplate!: TemplateRef<{
    $implicit: NzNotificationComponent;
    data: string;
  }>;

  @ViewChild('menu', { static: true }) menu!: NzDropdownMenuComponent;

  @ViewChild(FCanvasComponent, { static: true })
  public fCanvasComponent!: FCanvasComponent;

  @ViewChild(FZoomDirective, { static: true })
  public fZoomDirective!: FZoomDirective;

  protected readonly eResizeHandleType = EFResizeHandleType;

  isPropertyPanelVisible: boolean = false;
  isRenameModalVisible: boolean = false;
  isEditOpen: boolean = false;
  isBlockDrawerVisible: boolean = false;
  blockSearchTerm: string = ''; // Search term for workflow blocks
  showMinimap: boolean = false;
  minimapTimer: any = null;
  isMinimapHovered: boolean = false;
  workflowId: any = 0;
  workflowCode: any = '';
  runningId: any = '';
  controllers: any = [];
  selectedWorkflow: Workflow = {
    id: 0,
    active: true,
    code: '',
    name: '',
    workflowJsonRaw: '{}',
    workflowJson: '{}',
    controller: '',
    version: 1,
    description: '',
  };
  apiRequest = '';
  isRunWorkflowOpen: boolean = false;
  isShortcutsHelpVisible: boolean = false;
  options = ['New', 'Update'];
  runOptionSelected: any = 'New';
  languages: LanguageDescription[] = minimalLanguages.slice();

  // Agent UI state
  agentModalVisible = false;
  agentMemoryModalVisible = false;
  agentToolModalVisible = false;
  currentAgentNode: any = null;
  agentForm!: FormGroup;
  memoryForm!: FormGroup;
  toolForm!: FormGroup;
  agentMemoryList: any[] = [];

  // Plugin detail modal state
  isPluginDetailVisible: boolean = false;
  selectedPluginId: number | null = null;

  // Marketplace modal state
  isMarketplaceVisible: boolean = false;

  public eConnectionBehaviour = EFConnectionBehavior;

  protected readonly eMarkerType = EFMarkerType;
  protected adjustCellSizeWhileDragging = signal(false);
  protected updateNodeService = signal<any>({
    nodes: [],
    connections: [],
    groups: [],
    stickynotes: [],
  });

  public readonly nodes = computed(() => this.updateNodeService().nodes);
  public readonly connections = computed(
    () => this.updateNodeService().connections
  );
  public readonly groups = computed(() => this.updateNodeService().groups);
  public readonly stickynotes = computed(
    () => this.updateNodeService().stickynotes
  );
  private _isChangeAfterLoadedResetAndCenter = true;

  private _listenStateChanges(): void {
    effect(
      () => {
        this.state.changes();
        untracked(() => this._applyChanges());
      },
      { injector: this._injector }
    );
  }

  private _applyChanges(): void {
    // console.log(this.state.getSnapshot())

    this.updateNodeService.set(this.state.getSnapshot());
    if (!this.updateNodeService()) {
      return;
    }
    this._reCenterCanvasIfUndedToFirstStep();
    // this._applySelectionChanges(this.updateNodeService()!);
  }

  private _reCenterCanvasIfUndedToFirstStep(): void {
    if (!this.state.canUndo() && !this._isChangeAfterLoadedResetAndCenter) {
      this.onLoaded();
    }
  }
  private readonly _flow = viewChild(FFlowComponent);
  private readonly _canvas = viewChild.required(FCanvasComponent);

  // private _applySelectionChanges({ selection }: any): void {
  //     this._flow()?.select(selection?.nodes || [], selection?.connections || []
  //         , false);
  // }

  protected changeCanvasTransform(event: FCanvasChangeEvent): void {
    this._ifCanvasChangedFromInitialReCenterUpdateInitialState(event);
  }

  private _ifCanvasChangedFromInitialReCenterUpdateInitialState(
    event: FCanvasChangeEvent
  ): void {
    if (this._isChangeAfterLoadedResetAndCenter) {
      this._isChangeAfterLoadedResetAndCenter = false;
      this.state.patchBase({ transform: { ...event } });
      return;
    }
    this.state.update({
      transform: this.createTransformObject(event),
    });
  }
  createTransformObject({ position, scale }: FCanvasChangeEvent) {
    return { position, scale };
  }

  // Undo/Redo state management
  private historyStack: any[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;
  private isUndoRedoOperation: boolean = false;

  protected readonly fCanvas = viewChild(FCanvasComponent);

  isSpinning = true;
  isLoadingPlugins = false;
  toolbox: ToolboxSection[] = [
    {
      name: 'Core',
      blocks: [
        {
          name: 'Start',
          icon: 'arrow-right',
          type: 'start',
          description: 'Entry point for workflow execution',
          iconColor: '',
          visible: false,
          input: false,
          output: true,
          isPlugin: false,
        },
        {
          name: 'Activity',
          icon: 'function',
          type: 'function',
          description: 'Execute custom functions or business logic',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },

        // {
        //     name: 'AI Agent',
        //     icon: 'robot',
        //     type: 'aiagent',
        //     description: 'Integrate AI agents with custom prompts and tools',
        //     iconColor: '',
        //     visible: true,
        //     input: true,
        //     output: true,
        //     isPlugin: false
        // },
        {
          name: 'If',
          icon: 'sisternode',
          type: 'condition',
          description: 'Branch workflow based on true/false condition',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
        {
          name: 'Switch',
          icon: 'share-alt',
          type: 'switches',
          description: 'Route workflow based on multiple conditions',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
        {
          name: 'Input',
          icon: 'user-switch',
          type: 'signal',
          description: 'Wait for external input or signal to continue',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
        {
          name: 'Wait',
          icon: 'clock-circle',
          type: 'wait',
          description: 'Pause workflow execution for specified duration',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
        {
          name: 'Child WF',
          icon: 'gateway',
          type: 'childwf',
          description: 'Execute another workflow as a sub-process',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
        // {
        //     name: 'Callback',
        //     icon: 'arrow-down',
        //     type: 'callback',
        //     visible: true,
        //     input: true,
        //     output: true
        // },

        {
          name: 'Group',
          icon: 'group',
          type: 'group',
          description: 'Organize and group related workflow nodes together',
          iconColor: '',
          visible: true,
          input: true,
          output: true,
          isPlugin: false,
        },
      ],
    },

    // , {
    //     "name": "Utility", "blocks": [{
    //         name: 'API',
    //         icon: 'api',
    //         type: 'api',
    //         visible: true,
    //         input: true,
    //         output: true
    //     }

    // ]
    // }
  ];

  noteColors = [
    {
      bgColor: '#51461f94',
      darkColor: '#c89d00!important',
    },
    {
      bgColor: '#32511f94',
      darkColor: '#6c6c6c!important',
    },
    {
      bgColor: '#341f5194',
      darkColor: '#692bc0!important',
    },
    {
      bgColor: '#1f4d5194',
      darkColor: '#0f8f9a!important',
    },
    {
      bgColor: '#4d1f3594',
      darkColor: '#d946aa!important',
    },
    {
      bgColor: '#1f2f5194',
      darkColor: '#3b82f6!important',
    },
    {
      bgColor: '#1f514d94',
      darkColor: '#14b8a6!important',
    },
    {
      bgColor: '#4d511f94',
      darkColor: '#84cc16!important',
    },
    {
      bgColor: '#514d1f94',
      darkColor: '#eab308!important',
    },
    {
      bgColor: '#511f2f94',
      darkColor: '#ef4444!important',
    },
    {
      bgColor: '#511f4d94',
      darkColor: '#a855f7!important',
    },
    {
      bgColor: '#1f514294',
      darkColor: '#06b6d4!important',
    },
    {
      bgColor: '#42511f94',
      darkColor: '#22c55e!important',
    },
    {
      bgColor: '#51421f94',
      darkColor: '#f97316!important',
    },
  ];

  findVisibleTool(tool: any): any {
    return tool.visible == true;
  }

  filterBlocksBySearch(tool: any): any {
    if (!this.blockSearchTerm.trim()) {
      return tool.visible == true;
    }
    const searchLower = this.blockSearchTerm.toLowerCase();
    return (
      tool.visible == true &&
      (tool.name?.toLowerCase().includes(searchLower) ||
        tool.description?.toLowerCase().includes(searchLower) ||
        tool.type?.toLowerCase().includes(searchLower))
    );
  }

  hasSearchResults(): boolean {
    if (!this.blockSearchTerm.trim()) {
      return true;
    }
    return this.toolbox.some((sec) =>
      sec.blocks.some((block: any) => this.filterBlocksBySearch(block))
    );
  }

  canvas: any[] = [];
  private editor!: Drawflow;
  gridSize = 20;
  // nodes: any[] = [];
  // connections: any[] = [];
  loadFromJson(json: any) {
    if (!json) return;

    let nodess = JSON.parse(JSON.stringify(json.nodes || []));
    let connectionss = JSON.parse(JSON.stringify(json.connections || []));
    let groupss = JSON.parse(JSON.stringify(json.groups || []));
    let stickynotes = JSON.parse(JSON.stringify(json.stickynotes || []));

    // this.state.initialize({
    //     nodes: [...nodess],
    //     connections: [...connectionss],
    //     groups: [...groupss],
    //     stickynotes: [...stickynotes]
    // });

    //  this._listenStateChanges();
    this.updateNodeService.update((flow: any) => ({
      ...flow,
      nodes: [...nodess],
      connections: [...connectionss],
      groups: [...groupss],
      stickynotes: [...stickynotes],
    }));

    // allow template to update DOM then center/fit
    setTimeout(() => {
      this.onFitToScreen();
    }, 0);
  }

  ngOnInit() {
    this.workflowId = this.route.snapshot.paramMap.get('id')!;
    this.runningId = this.route.snapshot.paramMap.get('id')!;
    const runid = this.route.snapshot.paramMap.get('runid');

    if (runid) {
      this.startExecutionPolling(runid);
    }
    if (this.workflowId) {
      setTimeout(() => {
        this.getWorkflowByID(this.workflowId);
      }, 100);
    } else {
      this.statusService.updateMsg('Workflow Version: ' + 1);
      this.loadFromJson(this.workflowJson);
      this.isEditOpen = true;
    }

    let data = localStorage.getItem('wfdata');
    if (data) {
      this.workflowJson = JSON.parse(data);
    }

    // Load plugins on initialization
    this.loadPlugins();
  }

  /**
   * Load all plugins from the API
   */
  loadPlugins(): void {
    this.isLoadingPlugins = true;
    this.pluginService.getAllPlugins().subscribe({
      next: (plugins: PluginBlock[]) => {
        console.log('Loaded plugins:', plugins);
        plugins.forEach((p) => {
          console.log(`Plugin ${p.name}:`, {
            isPlugin: p.isPlugin,
            pluginData: p.pluginData,
            hasId: p.pluginData?.id !== undefined,
          });
        });

        // Add plugins to toolbox as a new section
        const pluginSection: ToolboxSection = {
          name: 'Plugins',
          blocks: plugins,
        };

        // Check if Plugins section already exists
        const existingPluginIndex = this.toolbox.findIndex(
          (section) => section.name === 'Plugins'
        );
        if (existingPluginIndex >= 0) {
          this.toolbox[existingPluginIndex] = pluginSection;
        } else {
          this.toolbox.push(pluginSection);
        }

        this.isLoadingPlugins = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading plugins:', error);
        this.message.error('Failed to load plugins');
        this.isLoadingPlugins = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  /**
   * Search plugins when user types in search box
   */
  searchPluginsFromAPI(): void {
    if (!this.blockSearchTerm.trim()) {
      // If search is empty, reload all plugins
      this.loadPlugins();
      return;
    }

    this.isLoadingPlugins = true;
    this.pluginService.searchPlugins(this.blockSearchTerm).subscribe({
      next: (plugins: PluginBlock[]) => {
        // Update plugins section with search results
        const pluginSection: ToolboxSection = {
          name: 'Plugins',
          blocks: plugins,
        };

        const existingPluginIndex = this.toolbox.findIndex(
          (section) => section.name === 'Plugins'
        );
        if (existingPluginIndex >= 0) {
          this.toolbox[existingPluginIndex] = pluginSection;
        } else {
          this.toolbox.push(pluginSection);
        }

        this.isLoadingPlugins = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error searching plugins:', error);
        this.isLoadingPlugins = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  workflowJson = {
    nodes: [
      {
        id: '377141e2-08cc-4990-9903-a3228fdd5f29',
        type: 'start',
        position: { x: 286, y: 208 },
        input: false,
        output: true,
        meta: { class: '', icon: 'arrow-right', html: 'Start' },
        data: {
          id: '377141e2-08cc-4990-9903-a3228fdd5f29',
          name: 'Start Node',
          call: '',
          conditionCall: null,
          waitSeconds: null,
          timeoutSeconds: 120,
          maximumAttempts: 10,
          initialIntervalSeconds: 4,
          maximumIntervalSeconds: 10,
          backoffCoefficient: 2,
        },
      },
    ],
    connections: [],
    groups: [],
  };

  selectedNode: any = {};

  propertySchema = [
    {
      type: 'input',
      label: 'ID',
      name: 'id',
      placeholder: 'ID',
      required: true,
      visiblefor: [],
      disabled: true,
    },
    {
      type: 'input',
      label: 'Name',
      name: 'name',
      placeholder: 'Name',
      required: true,
      visiblefor: [
        'function',
        'wait',
        'start',
        'condition',
        'switches',
        'signal',
        'aiagent',
        'childwf',
      ],
    },
    {
      type: 'multiselect',
      label: 'Function',
      name: 'call',
      options: [],
      required: true,
      visiblefor: ['function'],
    },
    {
      type: 'select',
      label: 'Workflow',
      name: 'childwf',
      options: [],
      required: true,
      visiblefor: ['childwf'],
    },
    {
      type: 'input',
      label: 'True Label',
      name: 'truelabel',
      placeholder: 'Name',
      required: false,
      visiblefor: ['condition'],
    },
    {
      type: 'input',
      label: 'False Label',
      name: 'falselabel',
      placeholder: 'Name',
      required: false,
      visiblefor: ['condition'],
    },
    {
      type: 'select',
      label: 'Condition',
      name: 'conditionCall',
      options: [],
      required: false,
      visiblefor: ['condition'],
      requiredEither: ['conditionInline'],
    },
    {
      type: 'keyval',
      label: 'Switch Conditions',
      name: 'switchval',
      options: [],
      required: true,
      visiblefor: ['switches'],
    },
    {
      type: 'editor',
      label: 'Inline Condition',
      name: 'conditionInline',
      language: 'json',
      options: [],
      required: false,
      visiblefor: ['condition', 'signal'],
      requiredEither: ['conditionCall'],
    },
    {
      type: 'select',
      label: 'Agent',
      name: 'aiagent',
      dataplace: 'metaData',
      options: [],
      required: true,
      visiblefor: ['aiagent'],
    },
    {
      type: 'editor',
      label: 'Prompt Text',
      name: 'aipromt',
      language: 'handlebars',
      dataplace: 'metaData',
      options: [],
      required: true,
      visiblefor: ['aiagent'],
    },
    {
      type: 'select',
      label: 'Memory',
      name: 'aimemo',
      dataplace: 'metaData',
      options: [],
      required: false,
      visiblefor: ['aiagent'],
    },
    {
      type: 'multiselect',
      label: 'Tools',
      name: 'aitools',
      dataplace: 'metaData',
      options: [],
      required: false,
      visiblefor: ['aiagent'],
    },
    {
      type: 'input',
      label: 'Output State Key',
      name: 'outputstatekey',
      dataplace: 'metaData',
      placeholder: 'Enter key to store data',
      required: true,
      visiblefor: ['aiagent'],
    },
    {
      type: 'number',
      label: 'Wait Time in Seconds',
      name: 'waitSeconds',
      placeholder: 'Enter in Seconds',
      visiblefor: ['wait'],
    },
    {
      type: 'number',
      label: 'Timeout',
      name: 'timeoutSeconds',
      placeholder: 'Enter in Seconds',
      visiblefor: ['function', 'aiagent'],
    },
    {
      type: 'number',
      label: 'Max Attempts',
      name: 'maximumAttempts',
      placeholder: 'Enter in Seconds',
      visiblefor: ['function', 'aiagent'],
    },
    {
      type: 'number',
      label: 'Interval Sec.',
      name: 'initialIntervalSeconds',
      placeholder: 'Enter in Seconds',
      visiblefor: ['function', 'aiagent'],
    },
    {
      type: 'number',
      label: 'Max Interval Sec.',
      name: 'maximumIntervalSeconds',
      placeholder: 'Enter in Seconds',
      visiblefor: ['function', 'aiagent'],
    },
    {
      type: 'number',
      label: 'Increament By',
      name: 'backoffCoefficient',
      placeholder: 'Eg. 2.0',
      visiblefor: ['function', 'aiagent'],
    },
  ];

  constructor(
    public changeDetectorRef: ChangeDetectorRef,
    private httpsService: HttpService,
    private message: NzMessageService,
    private workflowService: WorkflowService,
    private route: ActivatedRoute,
    private statusService: EditorStatusService,
    private router: Router,
    private notification: NzNotificationService,
    private queue: QueueService,
    private nzDropdownService: NzContextMenuService,
    private fb: FormBuilder,
    private nzContextMenuService: NzContextMenuService,
    private breadcrumbService: BreadcrumbService,
    private pluginService: PluginService
  ) {}

  /**
   * Handle keyboard shortcuts
   * Ctrl+S / Cmd+S: Save workflow
   * Ctrl+B / Cmd+B: Toggle block drawer
   * Ctrl+M / Cmd+M: Add note
   * Ctrl+L / Cmd+L: Fit to screen
   * Ctrl+ArrowUp / Cmd+ArrowUp: Zoom in
   * Ctrl+ArrowDown / Cmd+ArrowDown: Zoom out
   * Ctrl+E / Cmd+E: Edit workflow
   * Ctrl+R / Cmd+R: Run workflow
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl+S / Cmd+S: Save workflow
    if (ctrlKey && event.key === 's') {
      event.preventDefault();
      if (!this.isWorkflowRunning) {
        this.saveWorkflow();
      }
      return;
    }

    // Ctrl+B / Cmd+B: Toggle block drawer
    if (
      ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      (event.key === 'B' || event.key === 'b')
    ) {
      event.preventDefault();
      if (!this.isWorkflowRunning) {
        this.toggleBlockDrawer();
      }
      return;
    }

    // Ctrl+M / Cmd+M: Add note (M for Markdown)
    if (ctrlKey && !event.shiftKey && !event.altKey && event.key === 'm') {
      event.preventDefault();
      if (!this.isWorkflowRunning) {
        this.addNotes();
      }
      return;
    }

    // Ctrl+L / Cmd+L: Fit to screen
    if (ctrlKey && !event.shiftKey && !event.altKey && event.key === 'l') {
      event.preventDefault();
      this.onFitToScreen();
      return;
    }

    // Ctrl+ArrowUp / Cmd+ArrowUp: Zoom in
    if (ctrlKey && event.key === 'ArrowUp') {
      event.preventDefault();
      this.canvzoom('zoom-in');
      return;
    }

    // Ctrl+ArrowDown / Cmd+ArrowDown: Zoom out
    if (ctrlKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.canvzoom('zoom-out');
      return;
    }

    // Ctrl+E / Cmd+E: Edit workflow
    if (ctrlKey && event.key === 'e') {
      event.preventDefault();
      if (!this.isWorkflowRunning) {
        this.edit();
      }
      return;
    }

    // Ctrl+R / Cmd+R: Run workflow
    if (ctrlKey && event.key === 'r') {
      event.preventDefault();
      if (this.selectedWorkflow.id !== 0 && !this.isWorkflowRunning) {
        this.runWorkflow('open');
      }
      return;
    }
    // Ctrl+R / Cmd+R: Run workflow
    if (ctrlKey && event.key === 'a') {
      event.preventDefault();
      this.fFlowComponent.selectAll();
      return;
    }
    // Escape: Close property panel or drawers
    if (event.key === 'Escape') {
      if (this.isPropertyPanelVisible) {
        this.onPropertyPanelClose();
        event.preventDefault();
      } else if (this.isBlockDrawerVisible) {
        this.closeBlockDrawer();
        event.preventDefault();
      } else if (this.isEditOpen) {
        this.handleEditCancel();
        event.preventDefault();
      } else if (this.isRunWorkflowOpen) {
        this.handleCloseRunWorkflow();
        event.preventDefault();
      }
      return;
    }

    // Delete: Delete selected node (when no input is focused)
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // const target = event.target as HTMLElement;
      // const isInputField = target.tagName === 'INPUT' ||
      //     target.tagName === 'TEXTAREA' ||
      //     target.isContentEditable;
      // let nodeIds = this.fFlowComponent.getSelection().fNodeIds;

      // if (nodeIds.length > 0) {
      //     event.preventDefault();
      //     for (let i = 0; i < nodeIds.length; i++) {
      //         const el = nodeIds[i];
      //         const node = this.nodes().find((a: any) => a.id == el)
      //         this.confirmDelete(node);
      //     }

      // }
      return;
    }

    // Ctrl+Z / Cmd+Z: Undo (if state management supports it)
    if (ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (this.state.canUndo()) {
        this.state.undo();
      }
      return;
    }

    // Ctrl+Shift+Z or Ctrl+Y / Cmd+Shift+Z or Cmd+Y: Redo
    if (
      (ctrlKey && event.shiftKey && (event.key === 'Z' || event.key === 'z')) ||
      (ctrlKey && event.key === 'y')
    ) {
      event.preventDefault();
      if (this.state.canRedo()) {
        this.state.redo();
      }
      return;
    }

    // Ctrl+/ or Cmd+/: Show keyboard shortcuts help
    if (ctrlKey && event.key === '/') {
      event.preventDefault();
      this.showShortcutsHelp();
      return;
    }

    // F1: Show keyboard shortcuts help (alternative)
    if (event.key === 'F1') {
      event.preventDefault();
      this.showShortcutsHelp();
      return;
    }
  }

  /**
   * Show keyboard shortcuts help dialog
   */
  showShortcutsHelp(): void {
    this.isShortcutsHelpVisible = true;
  }

  /**
   * Close keyboard shortcuts help dialog
   */
  closeShortcutsHelp(): void {
    this.isShortcutsHelpVisible = false;
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.nzContextMenuService.create($event, menu);
  }

  /**
   * Check if icon is an external URL
   */
  isExternalIcon(icon: string): boolean {
    if (!icon) return false;
    return (
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('data:')
    );
  }

  /**
   * Convert propertySchema to form-viewer format
   */

  propFormSchema: any = {};

  getFormSchemaForNode(): any {
    if (!this.selectedNode || !this.selectedNode.type) {
      return null;
    }

    const nodeType = this.selectedNode.type;

    console.log('=== DEBUG: Selected Node ===');
    console.log('Full Node:', JSON.stringify(this.selectedNode, null, 2));
    console.log('Node Type:', nodeType);
    console.log('Node Data:', this.selectedNode.data);
    console.log('Node Meta:', this.selectedNode.meta);
    console.log('Data isPlugin:', this.selectedNode.data?.isPlugin);
    console.log('Meta isPlugin:', this.selectedNode.meta?.isPlugin);
    console.log('Data pluginData:', this.selectedNode.data?.pluginData);
    console.log('Meta pluginData:', this.selectedNode.meta?.pluginData);

    // Check if this is a plugin node - check multiple ways:
    // 1. Check if type starts with "plugin_"
    // 2. Check if isPlugin flag is set in data or meta
    // 3. Check if pluginData exists in data or meta
    const isPluginByType = nodeType.startsWith('plugin');
    const isPluginByFlag =
      this.selectedNode.data?.isPlugin === true ||
      this.selectedNode.meta?.isPlugin === true;
    const isPluginNode = isPluginByType || isPluginByFlag;
    const pluginData =
      this.selectedNode.data?.pluginData || this.selectedNode.meta?.pluginData;

    console.log('=== RESULT ===');
    console.log('Is Plugin Node:', isPluginNode);
    console.log('Plugin Data:', pluginData);
    console.log('Plugin Properties:', pluginData?.plugin_properties);

    let fields: any[] = [];

    // If it's a plugin node but pluginData is missing, try to fetch it from the plugin service
    let effectivePluginData = pluginData;
    if (isPluginNode && !pluginData) {
      console.log('Plugin data missing, searching in toolbox...');
      // Extract plugin_id from type (e.g., "plugin_slack_connector" -> "slack_connector")
      const pluginId = nodeType.replace('plugin', '');

      // Search for the plugin in the toolbox
      for (const section of this.toolbox) {
        if (section.name === 'Plugins') {
          const pluginBlock = section.blocks.find(
            (block: any) => block.type === nodeType
          );
          if (pluginBlock && pluginBlock.pluginData) {
            console.log('Found plugin in toolbox:', pluginBlock);
            effectivePluginData = pluginBlock.pluginData;
            break;
          }
        }
      }
    }

    console.log('Effective Plugin Data:', effectivePluginData);

    // If it's a plugin node with plugin_properties, use those
    if (
      isPluginNode &&
      effectivePluginData?.plugin_properties &&
      effectivePluginData.plugin_properties.length > 0
    ) {
      fields = effectivePluginData.plugin_properties.map((prop: any) => {
        const formField: any = {
          ...prop,
          icon: this.getIconForFieldType(prop.type),
        };

        // Add options for select
        if (prop.options && prop.options.length > 0) {
          formField.options = prop.options;
        }

        // Add language for code editor
        if (prop.type === 'codeeditor' && prop.language) {
          formField.language = prop.language.toLowerCase();
        }

        // Set default value from selectedNode or from prop
        if (this.selectedNode.data) {
          let dataValue = this.selectedNode.data[prop.id];
          if (!dataValue) {
            if (this.selectedNode.data?.data) {
              dataValue = this.selectedNode.data?.data[prop.id];
            }
          }
          if (dataValue !== undefined && dataValue !== null) {
            formField.defaultValue = dataValue;
          } else if (prop.defaultValue !== undefined) {
            formField.defaultValue = prop.defaultValue;
          }
        }

        return formField;
      });
    } else {
      // Use regular propertySchema for non-plugin nodes
      fields = this.propertySchema
        .filter((field: any) => {
          // If visiblefor is empty or undefined, show for all types
          if (!field.visiblefor || field.visiblefor.length === 0) {
            return true;
          }
          // Otherwise check if current node type is in the visiblefor array
          return field.visiblefor.includes(nodeType);
        })
        .map((field: any) => {
          // Map old schema format to form-viewer format
          const formField: any = {
            id: field.name,
            type: this.mapFieldType(field.type),
            label: field.label,
            placeholder: field.placeholder || '',
            required: field.required || false,
            icon: this.getIconForFieldType(field.type),
            defaultEnabled: !field.disabled,
            defaultVisible: true, // All fields visible by default
          };

          // Add options for select/multiselect
          if (field.options && field.options.length > 0) {
            formField.options = field.options;
          }

          // Add multiple flag for multiselect
          if (field.type === 'multiselect') {
            formField.multiple = true;
          }

          // Add language for editor type
          if (field.type === 'editor' && field.language) {
            formField.language = field.language.toLowerCase();
          }

          // Configure keyvalue field type
          if (field.type === 'keyval') {
            formField.valueControlType = 'codeeditor'; // Default to code editor for switch conditions
            formField.language = 'json'; // Default language for code editor type (JQ for conditions)
            if (formField.key == 'default') formField.defaultVisible = false; // Hide the switch conditions field by default
          }

          // Set default value from selectedNode
          if (this.selectedNode.data) {
            const dataValue =
              field.dataplace === 'metaData'
                ? this.selectedNode.data.metaData?.[field.name]
                : this.selectedNode.data[field.name];

            if (dataValue !== undefined && dataValue !== null) {
              // For keyvalue type, set as keyValuePairs
              if (field.type === 'keyval') {
                // If dataValue is an array of key-value pairs, use it
                if (Array.isArray(dataValue)) {
                  formField.keyValuePairs = dataValue;
                } else if (typeof dataValue === 'object') {
                  // Convert object to array of key-value pairs
                  formField.keyValuePairs = Object.entries(dataValue).map(
                    ([key, value]) => ({
                      id: `pair_${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}`,
                      key: key,
                      value: value,
                    })
                  );
                }
              } else {
                formField.defaultValue = dataValue;
              }
            }
          }

          return formField;
        });
    }

    // Pass iconUrl and icon for form-viewer title
    const iconUrl = this.getNodeIconUrl(this.selectedNode) || undefined;
    const icon = !iconUrl ? this.getNodeIconName(this.selectedNode) : undefined;
    return {
      title: `${this.selectedNode.data?.name || 'Node'} Properties`,
      fields: fields,
      showResetButton: false,
      showSubmitButton: false,
      iconUrl,
      icon,
      onInit: effectivePluginData?.plugin_properties_opt?.onInit || '',
      onDestroy: effectivePluginData?.plugin_properties_opt?.onDestroy || '',
    };
  }

  getFormSchemaForSecret() {
    debugger;
    let secretsField = [
      ...[
        {
          id: 'secretName',
          type: 'text',
          label: 'Name',
          placeholder: 'Enter name',
          required: true,
          icon: 'font-size',
          defaultVisible: true,
          defaultEnabled: true,
          defaultValue: this.selectedNode?.data?.name,
          info: 'Enter unique name',
          secondaryText: 'Required unique name',
        },
      ],
      ...this.selectedNode?.meta?.pluginData?.plugin_secrets,
    ];

    console.log('secretssss', secretsField);
    console.log(
      'this.selectedNode?.meta?.pluginData?.plugin_secrets_opt?.onInit',
      this.selectedNode?.meta?.pluginData?.plugin_secrets_opt?.onInit
    );
    return {
      // title: `${this.selectedNode.data?.name || 'Node'} Properties`,
      fields: secretsField,
      onInit:
        this.selectedNode?.meta?.pluginData?.plugin_secrets_opt?.onInit || '',
      onDestroy:
        this.selectedNode?.meta?.pluginData?.plugin_secrets_opt?.onDestroy ||
        '',
      showResetButton: false,
      showSubmitButton: false,
    };
  }

  /**
   * Previous/Next node helpers for the property panel
   */
  getIncomingConnections(node: any): any[] {
    try {
      if (!node) return [];
      return (this.connections() || []).filter((c: any) => {
        const tgt = (c.targetPortId || '').split('_')[0];
        return tgt === node.id;
      });
    } catch {
      return [];
    }
  }

  getOutgoingConnections(node: any): any[] {
    try {
      if (!node) return [];
      return (this.connections() || []).filter((c: any) => {
        const src = (c.sourcePortId || '').split('_')[0];
        return src === node.id;
      });
    } catch {
      return [];
    }
  }

  getPreviousNodes(node: any): any[] {
    const conns = this.getIncomingConnections(node);
    const allNodes = this.nodes() || [];
    return conns
      .map((c: any) => (c.sourcePortId || '').split('_')[0])
      .map((nid: string) => allNodes.find((nd: any) => nd.id === nid))
      .filter(Boolean);
  }

  showPropePanel = false;

  getNextNodes(node: any): any[] {
    const conns = this.getOutgoingConnections(node);
    const allNodes = this.nodes() || [];
    return conns
      .map((c: any) => (c.targetPortId || '').split('_')[0])
      .map((nid: string) => allNodes.find((nd: any) => nd.id === nid))
      .filter(Boolean);
  }

  getNodeDisplayName(node: any): string {
    return node?.data?.name || node?.meta?.html || node?.id || '';
  }

  getNodeIconName(node: any): string {
    const icon = node?.meta?.icon;
    return this.isExternalIcon(icon) ? 'api' : icon || 'api';
  }

  /** Resolve a display icon URL for a node (external image if available) */
  getNodeIconUrl(node: any): string | null {
    try {
      const direct = node?.meta?.icon || node?.data?.icon;
      if (typeof direct === 'string' && this.isExternalIcon(direct))
        return direct;

      const p = this.getPluginData(node) || {};
      const candidates: any[] = [
        p.plugin_icon,
        p.icon,
        p.logo,
        p.image,
        p.iconUrl,
        p.logoUrl,
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && this.isExternalIcon(c)) return c;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Accent color for node icon/border */
  getNodeAccentColor(node: any): string {
    const p = this.getPluginData(node) || {};
    // Prefer explicit color fields if present
    const color =
      node?.meta?.iconColor ||
      node?.data?.iconColor ||
      p.iconColor ||
      p.color ||
      p.brandColor;
    if (typeof color === 'string' && color.trim()) return color;
    // Fallback by type (light best-effort mapping)
    const type = (node?.type || '').toLowerCase();
    const map: Record<string, string> = {
      plugin: '#1890ff',
      aiagent: '#722ed1',
      condition: '#fa8c16',
      switches: '#13c2c2',
      childwf: '#2f54eb',
    };
    return map[type] || '#8c8c8c';
  }

  getNodeDescription(node: any): string {
    // Prefer meta description if available
    if (node?.meta?.description) return node.meta.description;

    // Plugin nodes: try plugin data
    const p = node?.meta?.pluginData || node?.data?.pluginData;
    if (p) {
      // Common fields to try
      const desc =
        p.plugin_description || p.description || p.summary || p.plugin_summary;
      if (desc) return desc;
    }

    // Core nodes: find in toolbox by type (best-effort)
    const t = node?.type;
    if (t && Array.isArray(this.toolbox)) {
      for (const sec of this.toolbox) {
        const found = (sec.blocks || []).find((b: any) => b.type === t);
        if (found && found.description) return found.description;
      }
    }
    return '';
  }

  /** Whether node is a plugin node */
  isPluginNode(node: any): boolean {
    if (!node) return false;
    return (
      node.type?.startsWith('plugin') ||
      node.data?.isPlugin === true ||
      node.meta?.isPlugin === true
    );
  }

  /** Get plugin data object safely from node or toolbox */
  getPluginData(node: any): any | null {
    if (!node) return null;
    let p = node?.data?.pluginData || node?.meta?.pluginData || null;
    if (!p) {
      // Try toolbox lookup by type
      const t = node?.type;
      if (t && Array.isArray(this.toolbox)) {
        for (const sec of this.toolbox) {
          const found = (sec.blocks || []).find((b: any) => b.type === t);
          if (found && found.pluginData) {
            p = found.pluginData;
            break;
          }
        }
      }
    }
    return p;
  }

  /** Get plugin info summary for UI (best-effort across possible field names) */
  getPluginInfo(node: any): {
    id?: any;
    name?: string;
    version?: string;
    author?: string;
  } {
    const p = this.getPluginData(node) || {};
    const id = p.id ?? p.plugin_id ?? p.pluginId ?? p.pluginID;
    const name = p.plugin_name ?? p.name ?? p.pluginName ?? p.title;
    const version = p.plugin_version ?? p.version ?? p.pluginVersion;
    const author = p.plugin_author ?? p.author ?? p.pluginAuthor;
    return { id, name, version, author };
  }

  /** Select node inside property panel (prev/next click) */
  selectNode(node: any): void {
    this.showPropePanel = false;
    if (!node) return;
    this.onMoreClick(node, false);
    // Reuse existing logic to ensure dependent UI (like agents/secrets) updates

    // Keep the modal open; just refresh view

    // Allow schema to recompute, then push data into the form component
    setTimeout(() => {
      try {
        this.showPropePanel = true;
        if (this.propertyPanel && node?.type && node?.data) {
          // Set form values for the newly selected node
          if (typeof (this.propertyPanel as any).setData === 'function') {
            (this.propertyPanel as any).setData(node.type, node.data);
          }
        }
      } catch {
        /* no-op */
      }
      this.changeDetectorRef.detectChanges();
    }, 200);
  }

  /**
   * Map old field type to form-viewer field type
   */
  private mapFieldType(type: string): string {
    const typeMap: { [key: string]: string } = {
      input: 'text',
      multiselect: 'select',
      select: 'select',
      number: 'number',
      editor: 'codeeditor',
      keyval: 'keyvalue', // Map keyval to keyvalue field type
    };
    return typeMap[type] || 'text';
  }

  /**
   * Get icon for field type
   */
  private getIconForFieldType(type: string): string {
    const iconMap: { [key: string]: string } = {
      input: 'edit',
      select: 'select',
      multiselect: 'select',
      number: 'number',
      editor: 'code',
      keyval: 'unordered-list',
      keyvalue: 'unordered-list',
    };
    return iconMap[type] || 'form';
  }

  public onLoaded(): void {
    this._canvas().resetScaleAndCenter(false);
  }

  public onFitToScreen(): void {
    // setTimeout(() => {
    //this.fZoomDirective.setZoom({ x: 80, y: 150 }, 0.4, EFZoomDirection.ZOOM_OUT, true);
    //this._canvas().fitToScreen({ x: 80, y: 150 }, true);
    setTimeout(() => {
      ///this._canvas().resetScaleAndCenter(true);
      this._canvas().fitToScreen({ x: 80, y: 150 }, true);
      setTimeout(() => {
        if (this._canvas().getScale() > 1) {
          this._canvas().resetScaleAndCenter(true);
        }
        setTimeout(() => {
          this.isSpinning = false;
          this.changeDetectorRef.markForCheck();
        }, 600);
      }, 100);
    }, 200);

    // }, 100);
  }

  protected onAdjustCellSizeWhileDraggingChange(event: boolean): void {
    this.adjustCellSizeWhileDragging.set(event);
    console.log(event);
  }
  ngAfterViewInit() {
    setTimeout(() => {
      // this.loadFromJson(this.workflowJson);
      this.adjustCellSizeWhileDragging.set(true);
      this.getAllFunctions();
      this.getAllActiveWorkflow();
      if (this.workflowJson.nodes.length > 20) {
        this.onLoaded();
      }
    }, 100);
  }

  onFormUpdate(updatedJson: any) {
    // console.log('form value >>>> ', updatedJson);
    // console.log('Selected node before update:', this.selectedNode);
    if (!this.selectedNode || !this.selectedNode.data) {
      return;
    }

    // Check if this is a plugin node
    const isPluginNode = this.selectedNode.type == 'plugin';

    // Preserve existing critical data and fields that shouldn't be modified
    const existingId = this.selectedNode.data.id;
    const existingName = this.selectedNode.data.name;
    const existingIsPlugin = this.selectedNode.data.isPlugin;
    const existingPluginData = this.selectedNode.data.pluginData;
    const existingMetaData = { ...(this.selectedNode.data.metaData || {}) };
    const existingSwitchval = this.selectedNode.data.switchval;
    const existingTimeoutSeconds = this.selectedNode.data.timeoutSeconds;
    const existingMaximumAttempts = this.selectedNode.data.maximumAttempts;
    const existingInitialIntervalSeconds =
      this.selectedNode.data.initialIntervalSeconds;
    const existingMaximumIntervalSeconds =
      this.selectedNode.data.maximumIntervalSeconds;
    const existingBackoffCoefficient =
      this.selectedNode.data.backoffCoefficient;

    // Update node data with form values
    Object.keys(updatedJson).forEach((key) => {
      // For plugin nodes, all form fields go directly into data
      if (isPluginNode) {
        if (
          key == 'id' ||
          key == 'timeoutSeconds' ||
          key == 'maximumAttempts' ||
          key == 'initialIntervalSeconds' ||
          key == 'initialIntervalSeconds' ||
          key == 'backoffCoefficient' ||
          key == 'maximumIntervalSeconds' ||
          key == 'name'
        ) {
          this.selectedNode.data[key] = updatedJson[key];
        } else {
          if (!this.selectedNode.data['data']) {
            this.selectedNode.data['data'] = {};
          }
          this.selectedNode.data['data'][key] = updatedJson[key];
        }
      } else {
        // For regular nodes, check if this field should go in metaData
        const fieldSchema = this.propertySchema.find(
          (f: any) => f.name === key
        );

        if (fieldSchema?.dataplace === 'metaData') {
          // Initialize metaData if it doesn't exist
          if (!this.selectedNode.data.metaData) {
            this.selectedNode.data.metaData = {};
          }
          this.selectedNode.data.metaData[key] = updatedJson[key];
        } else {
          // Update regular data field
          this.selectedNode.data[key] = updatedJson[key];
        }
      }
    });

    // Restore critical data that should not be overwritten
    this.selectedNode.data.id = existingId;

    // Restore name if not provided in form
    if (!updatedJson.name && existingName) {
      this.selectedNode.data.name = existingName;
    }

    // Restore plugin data for plugin nodes
    if (isPluginNode) {
      this.selectedNode.data.isPlugin = existingIsPlugin;
      this.selectedNode.data.pluginData = existingPluginData;
    }

    // Restore workflow configuration fields if not in the form
    if (
      updatedJson.timeoutSeconds === undefined &&
      existingTimeoutSeconds !== undefined
    ) {
      this.selectedNode.data.timeoutSeconds = existingTimeoutSeconds;
    }
    if (
      updatedJson.maximumAttempts === undefined &&
      existingMaximumAttempts !== undefined
    ) {
      this.selectedNode.data.maximumAttempts = existingMaximumAttempts;
    }
    if (
      updatedJson.initialIntervalSeconds === undefined &&
      existingInitialIntervalSeconds !== undefined
    ) {
      this.selectedNode.data.initialIntervalSeconds =
        existingInitialIntervalSeconds;
    }
    if (
      updatedJson.maximumIntervalSeconds === undefined &&
      existingMaximumIntervalSeconds !== undefined
    ) {
      this.selectedNode.data.maximumIntervalSeconds =
        existingMaximumIntervalSeconds;
    }
    if (
      updatedJson.backoffCoefficient === undefined &&
      existingBackoffCoefficient !== undefined
    ) {
      this.selectedNode.data.backoffCoefficient = existingBackoffCoefficient;
    }
    if (
      updatedJson.switchval === undefined &&
      existingSwitchval !== undefined
    ) {
      this.selectedNode.data.switchval = existingSwitchval;
    }

    // Preserve existing metaData fields that weren't in the form
    if (this.selectedNode.data.metaData) {
      Object.keys(existingMetaData).forEach((key) => {
        // Only restore if not explicitly updated in the form
        if (
          updatedJson[key] === undefined &&
          existingMetaData[key] !== undefined
        ) {
          this.selectedNode.data.metaData[key] = existingMetaData[key];
        }
      });
    }

    // console.log('Selected node after update:', this.selectedNode);

    // Trigger change detection
    //this.changeDetectorRef.detectChanges();
  }

  public onCreateNode(event: FCreateNodeEvent) {
    let newid = uuidv4();
    let item: any = event.data;
    console.log('=== CREATING NODE ===');
    console.log('Full item:', JSON.stringify(item, null, 2));
    console.log('Item type:', item.type);
    console.log('Icon:', item.icon);
    console.log('isExternalIcon:', item.isExternalIcon);
    console.log('isPlugin:', item.isPlugin);
    console.log('pluginData:', item.pluginData);

    if (item.type == 'group') {
      this.addGroup({
        id: newid,
        position: event.rect,
        name: 'Group Title',
      });
    } else {
      const nodeData = {
        id: newid,
        type: item.type,
        position: event.rect,
        input: item.input,
        output: item.output,
        runstatus: 'success',
        runCounter: 0,
        meta: {
          class: '',
          icon: item.icon,
          html: item.name,
          isExternalIcon: item.isExternalIcon || false,
          isPlugin: item.isPlugin || false,
          pluginData: item.pluginData || null,
        },
        data: {
          id: newid,
          name: item.name,
          waitSeconds: item.type == 'wait' ? 2 : null,
          timeoutSeconds: 120,
          maximumAttempts: 10,
          initialIntervalSeconds: 4,
          maximumIntervalSeconds: 10,
          backoffCoefficient: 2,
          // Add plugin data to data object as well for form-viewer access
          isPlugin: item.isPlugin || false,
          // pluginData: item.pluginData || null
        },
      };

      console.log('Node data being added:', nodeData);
      console.log('Node meta:', nodeData.meta);

      this.addNode(nodeData);
    }
    console.log('Node added to canvas:', event);
    // if (event.data && typeof event.data === 'object') {
    //     const nodeData = event.data as NodeModel;
    //     // Create a copy of the node with updated position and category
    //     const updatedNode: NodeModel = {
    //         ...nodeData,
    //         position: {
    //             x: event.rect.x,
    //             y: event.rect.y,
    //         },
    //         category: 'web', // Change category from 'vscode' to 'web'
    //     };

    //     // Call the flow service to update the node
    //     this.flowService.updateNode(updatedNode);

    //     console.log('Node added to canvas:', updatedNode);
  }

  public onConnectionAdded(event: FCreateConnectionEvent): void {
    console.log(event);

    if (event.fOutputId && event.fInputId) {
      this.updateNodeService.update((flow: any) => ({
        ...flow,
        connections: [
          ...flow.connections,
          {
            sourcePortId: event.fOutputId,
            targetPortId: event.fInputId,
            id: uuidv4(),
          },
        ],
      }));
      this.dragStartedNodes = [event.fInputId];
      this.onDragEnded(null);

      // this.changeDetectorRef.detectChanges();
      console.log(this.connections);
    }
  }

  /**
   * Adds a new sticky note to the workflow canvas.
   *
   * Creates a sticky note with markdown content at the center of the current canvas view.
   * The note is assigned a unique ID, default size (200x200), and the first color from
   * the available color palette.
   *
   * @remarks
   * - The note position is calculated based on the current canvas center viewport
   * - Default note content is taken from the `this.notes` property
   * - The note uses the first color scheme from `this.noteColors` array
   * - Updates the flow state by appending to the existing stickynotes array
   */
  addNotes() {
    let position = this.getCanvasCenterPosition();
    let stickynote = {
      id: uuidv4(),
      note: this.notes,
      position: position,
      size: { width: 200, height: 200 },
      color: {
        bgColor: this.noteColors[0].bgColor,
        darkColor: this.noteColors[0].darkColor,
      },
    };
    this.updateNodeService.update((flow: any) => ({
      ...flow,
      stickynotes: [...flow.stickynotes, stickynote],
    }));
  }

  deleteNode() {
    let nodeIds = this.fFlowComponent.getSelection().fNodeIds;

    if (nodeIds.length > 0) {
      for (let i = 0; i < nodeIds.length; i++) {
        const el = nodeIds[i];
        const node = this.nodes().find((a: any) => a.id == el);
        this.confirmDelete(node);
      }
    }
  }

  onNoteColorChange(item: any) {
    this.selectedNote.color = {
      bgColor: item.bgColor,
      darkColor: item.darkColor,
    };
  }

  addNode(node: any) {
    debugger;
    if (node.type === 'switches') {
      let switchDefault = {
        id: node.id + '_default',
        key: 'default',
        value: '1 = 1',
        idx: -1,
        visible: false,
      };
      node.data.switchval = [switchDefault];
    }

    if (node.type.startsWith('plugin_')) {
      let callval = node.type.replace('plugin_', '');

      node.data.call = [callval];
      node.type = 'plugin';
      // let switchDefault = { id: node.id + '_default', key: 'default', value: '1 = 1', idx: -1, visible: false };
      // node.data.switchval = [switchDefault];
    }

    this.updateNodeService.update((flow: any) => ({
      ...flow,
      nodes: [...flow.nodes, node],
    }));

    // this.state.create({})
  }

  addGroup(group: any) {
    this.updateNodeService.update((flow: any) => ({
      ...flow,
      groups: [...flow.groups, group],
    }));
  }

  public onNodeIntersectedWithConnection(
    event: FNodeIntersectedWithConnections
  ): void {
    const node = this.nodes().find((x: any) => x.id === event.fNodeId);
    const connection = this.connections().find(
      (x: any) => x.id === event.fConnectionIds[0]
    );

    const previousInputId = connection!.targetPortId;
    // connection!.inputId = event.fNodeId;

    connection.targetPortId = event.fNodeId;

    this.updateNodeService.update((flow: any) => ({
      ...flow,
      connections: [
        ...flow.connections,
        {
          sourcePortId: event.fNodeId,
          targetPortId: previousInputId,
          id: uuidv4(),
        },
      ],
    }));
    // this.connections().push({
    //     id: '2',
    //     outputId: event.fNodeId,
    //     inputId: previousInputId
    // });

    this.changeDetectorRef.detectChanges();
  }

  public onConnectionDropped(event: FReassignConnectionEvent): void {
    if (!event.newTargetId) {
      this.removeConnection(event);
    } else {
      this.reassignConnection(event);
    }
    this.changeDetectorRef.detectChanges();
  }

  removeConnection(event: FReassignConnectionEvent): void {
    if (event.connectionId) {
      this.removeConnectionById(event.connectionId);
      this.changeDetectorRef.detectChanges();
      return;
    }
    const connectionIndex = this.findConnectionIndex(
      event.oldSourceId,
      event.oldTargetId
    );
    if (connectionIndex === -1) {
      throw new Error('Connection not found');
    }
    this.connections().splice(connectionIndex, 1);
  }

  removeNode(nodeID: string): void {
    const nodeIndex = this.findNodeIndex(nodeID);
    if (nodeIndex === -1) {
      throw new Error('Connection not found');
    }
    this.nodes().splice(nodeIndex, 1);
  }

  removeNote(noteID: string) {
    const nodeIndex = this.findNoteIndex(noteID);
    if (nodeIndex === -1) {
      throw new Error('Connection not found');
    }
    this.stickynotes().splice(nodeIndex, 1);
  }

  removeConnectionById(connectionID: string) {
    const connectionIndex = this.connections().findIndex(
      (x: any) => x.id === connectionID
    );
    if (connectionIndex === -1) {
      throw new Error('Connection not found');
    }
    this.connections().splice(connectionIndex, 1);
  }

  findConnectionIndex(outputId: string, inputId: string): number {
    return this.connections().findIndex(
      (x: any) =>
        x.sourcePortId.startsWith(outputId) &&
        x.targetPortId.startsWith(inputId)
    );
  }

  findConnectionsByNode(nodeID: string): number {
    return this.connections().filter(
      (x: any) =>
        x.sourcePortId.startsWith(nodeID) || x.targetPortId.startsWith(nodeID)
    );
  }

  findNodeIndex(nodeId: string): number {
    return this.nodes().findIndex((x: any) => x.id === nodeId);
  }

  findNoteIndex(noteId: string): number {
    return this.stickynotes().findIndex((x: any) => x.id === noteId);
  }

  reassignConnection(event: FReassignConnectionEvent): void {
    this.removeConnection(event);
    this.connections().push({
      sourcePortId: event.oldSourceId,
      targetPortId: event.newTargetId!,
    });
  }

  // protected reassignConnection(event: FReassignConnectionEvent): void {

  //     if (!event.newTargetId && !event.newSourceId) {
  //         return;
  //     }

  //     this.updateNodeService.update((x) => {
  //         const connection = x.connections().find(
  //             (c: any) => c.source === event.oldSourceId && c.target === event.oldTargetId,
  //         );
  //         if (!connection) {
  //             throw new Error('Connection not found');
  //         }
  //         connection.source = event.newSourceId || connection.source;
  //         connection.target = event.newTargetId || connection.target;

  //         return [...x];
  //     });
  // }

  protected onDropToGroup(event: FDropToGroupEvent): void {
    if (!event.fTargetNode) {
      return;
    }

    const groups = this.groups();

    const isGroup = groups.find((x: any) => x.id === event.fTargetNode);
    if (!isGroup) return;

    const nodes = this.nodes();

    event.fNodes.forEach((id) => {
      const group = groups.find((x: any) => x.id === id);
      if (group) {
        group.parentId = event.fTargetNode;
      } else {
        const node = nodes.find((x: any) => x.id === id);
        if (node) {
          node!.parentId = event.fTargetNode;
        }
      }
    });

    this.updateNodeService.update((flow: any) => ({
      ...flow,
      groups: [...groups],
    }));

    this.updateNodeService.update((flow: any) => ({
      ...flow,
      nodes: [...nodes],
    }));
    //this.changeDetectorRef.detectChanges();
  }
  onDuplicateClick() {
    let nodeIds = this.fFlowComponent.getSelection().fNodeIds;
    if (nodeIds.length > 0) {
      for (let index = 0; index < nodeIds.length; index++) {
        const element = nodeIds[index];
        let node = this.nodes().find((x: any) => x.id === element);
        let newNode = JSON.parse(JSON.stringify(node));
        newNode.id = uuidv4();
        newNode.data.id = newNode.id;
        let newndpos = newNode.position;
        newndpos.y += 90;
        newndpos.x += 90;
        (newNode.position = newndpos), this.addNode(newNode);
      }
    }

    // let node = this.nodes().find((x: any) => x.id === nodeIds[0]);
    // let newNode = JSON.parse(JSON.stringify(node));
    // newNode.id = uuidv4();
    // newNode.data.id = newNode.id;
    // let newndpos = newNode.position;
    // newndpos.y += 90;
    // newndpos.x += 90;
    // (newNode.position = newndpos), this.addNode(newNode);
  }

  onMoreClick(node: any, directClick = true) {
    debugger;
    if (node == undefined) {
      let nodeIds: any = this.fFlowComponent.getSelection().fNodeIds;
      node = this.nodes().find((x: any) => x.id === nodeIds[0]);
    }
    if (directClick) this.showPropePanel = true;
    if (node.type == 'aiagent') {
      // Load agents first, then open property panel
      const list = this.getDdlControl('aiagent');
      if (list && (!list.options || list.options.length === 0)) {
        // Agents not loaded yet, load them first
        this.httpsService.listAgents().subscribe(
          (d: any) => {
            console.log('Agent list received:', d);
            let agentOption: any = [];
            if (Array.isArray(d)) {
              for (let i = 0; i < d.length; i++) {
                const element = d[i];
                agentOption.push(element.agentId);
              }
              this.bindDdlControl('aiagent', agentOption);
              // Now open the property panel after agents are loaded
              this.isPropertyPanelVisible = true;
              this.selectedNode = node;
              this.changeDetectorRef.detectChanges();
            } else {
              console.error('Agent list is not an array:', d);
              // Still open the panel even if there's an error
              this.isPropertyPanelVisible = true;
              this.selectedNode = node;
            }
            this.changeDetectorRef.detectChanges();
          },
          (error) => {
            console.error('Error loading agents:', error);
            // Still open the panel even if there's an error
            this.isPropertyPanelVisible = true;
            this.selectedNode = node;
          }
        );
        return; // Don't continue, wait for the subscription to complete
      } else {
        // Agents already loaded, just call getAgentList to ensure they're up to date
        this.getAgentList();
      }
    }
    this.isPropertyPanelVisible = true;
    this.selectedNode = node;
    if (
      node?.meta?.pluginData?.plugin_secrets &&
      node?.meta?.pluginData?.plugin_secrets.length > 0
    ) {
      this.bindSecrets(node?.data?.call[0]);
    } else if (node.type == 'plugin') {
      setTimeout(() => {
        this.propertyPanel.setFieldVisibility('secret', false);
        this.propertyPanel.setFieldOptionsValue('secret', []);
      }, 200);
    }

    // Center the clicked node on the canvas (keep current zoom level)
    try {
      const nid = node?.id || node?.data?.id;
      const currentScale =
        this.fCanvasComponent &&
        typeof this.fCanvasComponent.getScale === 'function'
          ? this.fCanvasComponent.getScale()
          : 1.0;
      if (nid) {
        this.zoomNodeToCenter(nid, currentScale, true);
      }
    } catch (e) {
      console.warn('center/zoom failed', e);
    }

    // setTimeout(() => {
    //     this.propertyPanelRef.isLoading = true;
    //     this.propertyPanelRef.onLoad();
    //     if (this.propertyPanelRef) {
    //         if (this.selectedNode?.data?.id) {
    //             this.propertyPanelRef.setData(this.selectedNode.type, this.selectedNode.data);
    //             this.changeDetectorRef.markForCheck();
    //         }
    //         else {
    //             this.propertyPanelRef?.reset();
    //         }
    //         //this.changeDetectorRef.detectChanges();
    //     }
    //     this.propertyPanelRef.isLoading = false;

    // }, 200)
  }

  bindSecrets(type: any) {
    debugger;
    if (this.selectedNode?.meta?.pluginData?.plugin_secrets) {
      this.httpsService.listSecretsByType(type).subscribe((d) => {
        console.log('listSecretsByType', d);
        if (d && d.length > 0) {
          this.availableSecrets = d; // Store full secret objects
          let k = d;
          let scr = [];
          for (let i = 0; i < d.length; i++) {
            const element = d[i];
            scr.push({ key: element.name, value: element.name });
          }
          setTimeout(() => {
            this.propertyPanel.setFieldVisibility('secret', true);
            this.propertyPanel.setFieldOptionsValue('secret', scr);
          }, 300);
        } else {
          this.availableSecrets = [];
          setTimeout(() => {
            this.propertyPanel.setFieldVisibility('secret', true);
            this.propertyPanel.setFieldOptionsValue('secret', []);
          }, 300);
        }
        // setTimeout(() => {

        // }, 500);
      });
    }
  }

  autoCompleteEditClick(evt: any) {
    debugger;
    console.log('Edit secret:', evt);
    const secretName = evt.value;
    const secret = this.availableSecrets.find((s) => s.name === secretName);

    if (secret) {
      console.log('Found secret:', secret);
      this.isSecretEditMode = true;
      this.currentSecretId = secret.id;

      try {
        if (typeof secret.value === 'string') {
          //  this.secretFormData = JSON.parse(secret.value);
        } else {
          this.secretFormData = secret.value;
        }

        // Ensure secretName is set in form data
        this.secretFormData['secretName'] = secret.name;

        this.openSecretManagerForm = true;

        // Wait for modal to open and form to initialize
        setTimeout(() => {
          if (this.secretPropertyPanel) {
            // We need to set the form values
            // Since FormViewer doesn't expose a direct setValues method that takes an object,
            // we might need to rely on preloadedSchema or similar mechanism,
            // OR we can use the fact that secretFormData is bound to onFormSecretUpdate
            // But onFormSecretUpdate is an output.

            // Actually, FormViewer has a `loadForm` method but it takes a schema.
            // It also has `dynamicForm` which is public.

            // Let's try to patch the values
            this.secretPropertyPanel.dynamicForm.patchValue(
              this.secretFormData
            );
          }
        }, 100);
      } catch (e) {
        console.error('Error parsing secret value', e, secret.value);
        this.message.error('Failed to load secret data');
      }
    } else {
      this.message.warning('Secret not found');
    }
  }

  /**
   * Center a node (or group) by id on the canvas and optionally set scale.
   * Uses FCanvasComponent APIs: centerGroupOrNode and setScale.
   * @param nodeId id of the node/group to center
   * @param scale desired scale after centering (optional)
   * @param animated animate the centering (optional)
   */
  public zoomNodeToCenter(
    nodeId: string,
    scale: number = 1.0,
    animated: boolean = true
  ): void {
    // Prefer the explicit view child if available
    const canvas =
      this.fCanvasComponent || (this._canvas ? this._canvas() : null);
    if (!canvas) return;

    // center the node/group first
    try {
      if (typeof canvas.centerGroupOrNode === 'function') {
        canvas.centerGroupOrNode(nodeId, animated);
      }
    } catch (e) {
      console.warn('centerGroupOrNode not available or failed', e);
    }

    // after centering, apply requested scale. Small timeout to allow center animation to start.
    const delay = animated ? 280 : 0;
    setTimeout(() => {
      try {
        if (typeof canvas.setScale === 'function') {
          canvas.setScale(scale);
        } else if (typeof canvas.setZoom === 'function') {
          // fallback to deprecated API if present
          canvas.setZoom(scale);
        }
      } catch (e) {
        console.warn('setScale/setZoom failed', e);
      }
    }, delay);
  }

  onPropertyPanelClose() {
    this.isPropertyPanelVisible = false;

    //   this.changeDetectorRef.detectChanges();
  }

  exportJSON() {
    console.log(this.normalizeWorkflow(this.exportRaw()));
  }

  getNodeById(id: string) {
    return this.nodes().filter((x: any) => x.id.startsWith(id));
  }

  exportRaw() {
    for (const el of this.nodes()) {
      delete el['runstatus'];
      delete el['runCounter'];
    }
    for (const con of this.connections()) {
      delete con['cls'];
    }
    const expo = {
      nodes: this.nodes(),
      connections: this.connections(),
      groups: this.groups(),
      stickynotes: this.stickynotes(),
    };
    // localStorage.setItem('wfdata', JSON.stringify(expo));
    // console.log(JSON.stringify(expo));
    // this.message
    //     .success('Saved to Local storage', { nzDuration: 3000 });
    return expo;
  }

  normalizeWorkflow(rawJson: any) {
    const { nodes = [], connections = [] } = rawJson;
    // Build lookup for each node
    const nodeMap: any = {};
    // console.log('L:L:LL:L ',this.connections());
    nodes.forEach((node: any) => {
      if (node.data?.switchval) {
        //console.log('tttt')
        for (let i = 0; i < node.data?.switchval.length; i++) {
          const el = node.data?.switchval[i];
          // console.log('||{|{|{|{', el)
          //delete el['visible'];
          el.next = [];
          const id = el.id;
          this.connections().forEach((d: any) => {
            const srcid = d.sourcePortId;
            const trgid = d.targetPortId;
            //console.log(id, srcid, trgid);
            if (id == srcid) {
              el.next.push(trgid);
            }
          });
        }
      }

      let dataExtend: any = {};

      if (node.type != 'plugin') {
        this.propertySchema.forEach((d: any) => {
          let placeKey = d?.dataplace;
          if (placeKey && node?.data[placeKey]) {
            if (!dataExtend[placeKey]) dataExtend[placeKey] = {};
            let dd: any = {};
            dd[d.name] = node.data[placeKey][d.name];
            dataExtend[placeKey] = { ...dataExtend[placeKey], ...dd };
          }
        });
      } else {
      }

      let switchFinalVal: any = null;

      if (node.data?.switchval) {
        switchFinalVal = node.data?.switchval.map((swh: any) => ({
          value: swh.value,
          key: swh.key,
          id: swh.id,
          idx: swh.idx,
          visible: swh.visible,
          next: swh.next,
        }));
      }

      nodeMap[node.id] = {
        id: node.id,
        type: node.type,
        name: node.data?.name || node.name || '',
        call: node.data?.call || null,
        conditionCall: node.data?.conditionCall || null,
        switchval: switchFinalVal,
        conditionInline: node.data?.conditionInline || '',
        signalName: node.data?.signal,
        ...dataExtend,
        pluginprop: node.data?.data,
        config: {
          timeoutSeconds: node.data?.timeoutSeconds || null,
          waitSeconds: node.data?.waitSeconds || 1,
          maximumAttempts: node.data?.maximumAttempts || null,
          initialIntervalSeconds: node.data?.initialIntervalSeconds || null,
          maximumIntervalSeconds: node.data?.maximumIntervalSeconds || null,
          backoffCoefficient: node.data?.backoffCoefficient || null,
        },
        next: null,
        nextFalse: null,
      };
      console.log('{}{}{}{}{}{}{>>>> ', nodeMap);
    });

    // Map connections into nodes
    connections.forEach((conn: any) => {
      const { sourcePortId, targetPortId } = conn;
      const sourceNodeId = sourcePortId.replace(/_true|_false/, '');
      const isFalse = sourcePortId.endsWith('_false');

      const sourceNode = nodeMap[sourceNodeId];
      if (sourceNode) {
        if (isFalse) sourceNode.nextFalse = targetPortId;
        else sourceNode.next = targetPortId;
      }
    });

    // Remove null/empty config
    Object.values(nodeMap).forEach((node: any) => {
      if (Object.values(node.config).every((v) => v === null))
        delete node.config;
    });

    console.log(nodeMap);
    // Convert to final flattened array
    return {
      workflow: Object.values(nodeMap),
    };
  }

  getAllFunctions() {
    this.httpsService.getFunctions().subscribe((d: any) => {
      console.log(d);
      let functionOption: any = [];
      let conditionOption: any = [];
      let controllerOption: any = [];

      for (let i = 0; i < d.length; i++) {
        const element = d[i];
        if (element.classType == 'function') {
          functionOption.push(element.className);
        } else if (element.classType == 'condition') {
          conditionOption.push(element.className);
        } else if (element.classType == 'controller') {
          this.controllers?.push(element.className);
        }
      }
      this.bindDdlControl('call', functionOption);
      this.bindDdlControl('conditionCall', conditionOption);
    });
  }

  getAgentList() {
    let list = this.getDdlControl('aiagent');
    // Check if list exists and if options are not already loaded
    if (list && (!list.options || list.options.length === 0)) {
      this.httpsService.listAgents().subscribe(
        (d: any) => {
          console.log('Agent list received:', d);
          let agentOption: any = [];
          if (Array.isArray(d)) {
            for (let i = 0; i < d.length; i++) {
              const element = d[i];
              agentOption.push(element.agentId);
            }
            this.bindDdlControl('aiagent', agentOption);
            // Trigger change detection
            this.changeDetectorRef.detectChanges();
          } else {
            console.error('Agent list is not an array:', d);
          }
        },
        (error) => {
          console.error('Error loading agents:', error);
        }
      );
    }
  }

  bindDdlControl(key: string, value: any) {
    let conditionCall: any = this.propertySchema.find((s) => {
      return s.name == key;
    });
    conditionCall.options = value;
  }

  getDdlControl(key: string): any {
    return (
      this.propertySchema.find((s) => {
        return s.name == key;
      }) || []
    );
  }

  openSecretManagerForm = false;
  autoCompleteAddNewClick(evt: any) {
    this.openSecretManagerForm = true;
  }

  availableSecrets: any[] = [];
  isSecretEditMode: boolean = false;
  currentSecretId: string | number | null = null;

  handleSecretManagerOk() {
    if (this.secretPropertyPanel.isFormValid()) {
      let secretName = this.secretFormData['secretName'];

      let payload = {
        name: secretName,
        type: this.selectedNode?.data?.call[0],
        value: JSON.stringify(this.secretFormData),
        metadata: '',
      };

      if (this.isSecretEditMode && this.currentSecretId) {
        this.httpsService
          .updateSecret(this.currentSecretId, payload)
          .subscribe({
            next: (res: any) => {
              this.openSecretManagerForm = false;
              this.bindSecrets(this.selectedNode?.data?.call[0]);
              this.message.success('Credential updated');
              this.isSecretEditMode = false;
              this.currentSecretId = null;
            },
            error: (err: any) => {
              this.message.error('Update failed');
            },
          });
      } else {
        this.httpsService.createSecret(payload).subscribe({
          next: (res: any) => {
            this.openSecretManagerForm = false;
            this.bindSecrets(this.selectedNode?.data?.call[0]);
            this.message.success('Credential created');
          },
          error: (err: any) => {
            this.message.error('Create failed');
          },
        });
      }
    }
  }

  handleSecretManagerCancel() {
    this.openSecretManagerForm = false;
    this.isSecretEditMode = false;
    this.currentSecretId = null;
    this.secretFormData = {};
  }
  secretFormData: any = {};
  onFormSecretUpdate(e: any) {
    this.secretFormData = e;
  }

  getAllActiveWorkflow() {
    this.workflowService.getActiveWorkflow().subscribe((d: any) => {
      console.log(d);

      let childwf: any = this.propertySchema.find((s) => {
        return s.name == 'childwf';
      });

      for (let i = 0; i < d.length; i++) {
        const element = d[i];
        childwf.options?.push(element.code);
      }
    });
  }

  prevNode = '';
  startExecutionPolling(id: any) {
    this.getWorkflowStatus(id);
    this.queue.clear();
    if (this.executionStatusInterval) {
      clearInterval(this.executionStatusInterval);
    }
    this.executionStatusInterval = setInterval(() => {
      this.getWorkflowStatus(id);
    }, 4000);

    if (!this.dequeueInterval) {
      this.dequeueInterval = setInterval(() => {
        this.runDeque();
      }, 50);
    }
  }

  runWorkflow(runworkflow: any) {
    if (runworkflow == 'open') {
      this.handleValueChange('New');
      this.isRunWorkflowOpen = true;
    } else {
      if (this.runOptionSelected == 'New') {
        if (this.isWorkflowRunning) {
          this.message.warning('Workflow is in running state');
          return;
        }
      }
      let that = this;
      let loadingId = this.message.loading('Executing...', {
        nzDuration: 2000,
      });
      // let loadingId = this.message
      //     .loading('Creating....', { nzDuration: 0 }).messageId;

      let workflow = this.normalizeWorkflow(this.exportRaw());
      console.log(workflow);
      let req: any = null;

      if (this.runOptionSelected == 'New') {
        req = this.httpsService.executeWorkflow(this.apiRequest);
      } else {
        req = this.httpsService.executeWorkflowUpdateflow(this.apiRequest);
      }

      req.subscribe(
        (d: any) => {
          that.message.remove(loadingId.messageId);
          if (d.status == 'SUCCESS') {
            this.isRunWorkflowOpen = false;
            this.runUpdateOptionCode = this.runUpdateOptionCode.replace(
              'generatedID',
              d.workflowId
            );

            if (!this.isWorkflowRunning) {
              this.notification.success('Success', this.customTemplate, {
                nzData: { message: 'Successfully started', id: d.workflowId },
                nzDuration: 20000,
                nzPlacement: 'bottomRight',
              });
              this.startExecutionPolling(d.workflowId);
            } else {
              this.notification.success('Success', this.customTemplate, {
                nzData: { message: 'Successfully update', id: d.workflowId },
                nzDuration: 5000,
                nzPlacement: 'bottomRight',
              });
            }
            // this.message.success(this.customTemplate, { nzData: d.workflowId, nzDuration: 10000 });
            console.log(d);
          } else {
            that.message.error(d.message, { nzDuration: 5000 });
          }
        },
        (e: any) => {
          this.notification.error('Opps!', 'Something went wrong!!', {
            nzDuration: 20000,
            nzPlacement: 'bottomRight',
          });
        }
      );
    }
  }

  handleCloseRunWorkflow() {
    this.isRunWorkflowOpen = false;
  }

  onDrawerOpened() {
    alert('');
  }

  cancel(): void {}

  refDeleteId: any;
  refDeleteType: any;
  onDelete(referenceID: any, type: any) {
    this.refDeleteId = referenceID;
    this.refDeleteType = type;
  }

  confirmDelete(n: any): void {
    if (n.type == 'start') {
      return;
    }

    if (!n.data) {
      this.removeConnectionById(n.id);
      return;
    }
    let _connections: any = this.findConnectionsByNode(n.id);
    for (let i = 0; i < _connections.length; i++) {
      const el = _connections[i];
      this.removeConnectionById(el.id);
    }
    this.removeNode(n.id);

    this.changeDetectorRef.detectChanges();
    // if (this.refDeleteType == 'node') {

    // }
  }

  renameRef: any;
  renameValue: any;

  openRename(val: any, type: any) {
    if (type == 'group') {
      this.renameRef = val;
      this.renameValue = val.name;
    }

    this.isRenameModalVisible = true;
  }

  handleOk(): void {
    this.renameRef.name = this.renameValue;
    this.isRenameModalVisible = false;
  }

  handleCancel(): void {
    this.isRenameModalVisible = false;
  }

  canvzoom(option: any): void {
    if (option == 'zoom-out') {
      this.fZoomDirective.zoomOut();
    } else if (option == 'zoom-in') {
      this.fZoomDirective.zoomIn();
    } else if (option == 'expand') {
      this.onFitToScreen();
    }
    this.showMinimapTemporarily();
  }

  clearCanvas() {
    this.workflowJson = {
      nodes: [
        {
          id: '377141e2-08cc-4990-9903-a3228fdd5f29',
          type: 'start',
          position: { x: 286, y: 208 },
          input: false,
          output: true,
          meta: { class: '', icon: 'arrow-right', html: 'Start' },
          data: {
            id: '377141e2-08cc-4990-9903-a3228fdd5f29',
            name: 'Start Node',
            call: '',
            conditionCall: null,
            waitSeconds: null,
            timeoutSeconds: 120,
            maximumAttempts: 10,
            initialIntervalSeconds: 4,
            maximumIntervalSeconds: 10,
            backoffCoefficient: 2,
          },
        },
      ],
      connections: [],
      groups: [],
    };

    this.loadFromJson(this.workflowJson);
  }

  // Undo/Redo functionality
  saveStateToHistory() {
    if (this.isUndoRedoOperation) {
      return; // Don't save state during undo/redo operations
    }

    const currentState = {
      nodes: JSON.parse(JSON.stringify(this.nodes())),
      connections: JSON.parse(JSON.stringify(this.connections())),
      groups: JSON.parse(JSON.stringify(this.groups())),
      stickynotes: JSON.parse(JSON.stringify(this.stickynotes())),
    };

    // Remove any states after current index (when user makes new change after undo)
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);

    // Add new state
    this.historyStack.push(currentState);

    // Limit history size
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
    } else {
      this.historyIndex++;
    }
  }

  edit() {
    this.isEditOpen = true;
    setTimeout(() => {
      if (this.workflowformRef) {
        this.workflowformRef.setFormValue(this.selectedWorkflow);
      }
    }, 100);
  }

  handleEditOk() {
    if (this.workflowformRef) {
      this.workflowformRef.onSubmit();
    }
    this.isEditOpen = false;
  }

  handleEditCancel() {
    this.isEditOpen = false;
  }

  toggleBlockDrawer() {
    this.isBlockDrawerVisible = !this.isBlockDrawerVisible;
    this.changeDetectorRef.markForCheck();
  }

  closeBlockDrawer() {
    this.isBlockDrawerVisible = false;
    this.blockSearchTerm = ''; // Clear search when closing drawer
    this.changeDetectorRef.markForCheck();
  }

  onWrapperClick(event: MouseEvent) {
    // Close drawer when clicking on the canvas/wrapper area
    if (this.isBlockDrawerVisible) {
      this.closeBlockDrawer();
    }
  }

  onCanvasMove() {
    this.showMinimapTemporarily();
  }

  onCanvasZoom() {
    this.showMinimapTemporarily();
  }

  onMinimapHover(isHovering: boolean) {
    this.isMinimapHovered = isHovering;

    if (isHovering) {
      // Clear any pending hide timer when hovering and remove fade-out class
      if (this.minimapTimer) {
        clearTimeout(this.minimapTimer);
        this.minimapTimer = null;
      }
      setTimeout(() => {
        const minimapElement = document.querySelector(
          '.any-container-or-without-container'
        );
        if (minimapElement) {
          minimapElement.classList.remove('minimap-fade-out');
        }
      }, 0);
    } else {
      // When leaving hover, start hide timer
      this.showMinimapTemporarily();
    }
  }

  showMinimapTemporarily(isStartTimer = true) {
    this.showMinimap = true;
    this.changeDetectorRef.markForCheck();

    // Remove fade-out class after DOM updates
    setTimeout(() => {
      const minimapElement = document.querySelector(
        '.any-container-or-without-container'
      );
      if (minimapElement) {
        minimapElement.classList.remove('minimap-fade-out');
      }
    }, 0);

    // Clear existing timer
    if (this.minimapTimer) {
      clearTimeout(this.minimapTimer);
    }

    if (isStartTimer) {
      // Only hide if not being hovered
      this.minimapTimer = setTimeout(() => {
        if (!this.isMinimapHovered) {
          // Add fade out class, then remove minimap after animation
          const minimapElement = document.querySelector(
            '.any-container-or-without-container'
          );
          if (minimapElement) {
            minimapElement.classList.add('minimap-fade-out');
            setTimeout(() => {
              this.showMinimap = false;
              this.changeDetectorRef.markForCheck();
            }, 300); // Match animation duration
          }
        }
      }, 2000);
    }
  }

  onItemClick(item: any) {
    debugger;
    this.isBlockDrawerVisible = false;
    let newid = uuidv4();
    // compute the visible canvas center in flow/world coordinates

    let position = this.getCanvasCenterPosition();
    const nodeData = {
      id: newid,
      type: item.type,
      position: position,
      input: item.input,
      output: item.output,
      runstatus: 'success',
      runCounter: 0,
      meta: {
        class: '',
        icon: item.icon,
        html: item.name,
        isExternalIcon: item.isExternalIcon || false,
        isPlugin: item.isPlugin || false,
        pluginData: item.pluginData || null,
      },
      data: {
        id: newid,
        name: item.name,
        waitSeconds: item.type == 'wait' ? 2 : null,
        timeoutSeconds: 120,
        maximumAttempts: 10,
        initialIntervalSeconds: 4,
        maximumIntervalSeconds: 10,
        backoffCoefficient: 2,
        // Add plugin data to data object as well for form-viewer access
        isPlugin: item.isPlugin || false,
        // pluginData: item.pluginData || null
      },
    };
    this.addNode(nodeData);
    // this.addNode({
    //     id: newid,
    //     type: item.type,
    //     // place node at computed center
    //     position: { x: Math.round(position.x), y: Math.round(position.y) },
    //     input: item.input,
    //     output: item.output,
    //     runstatus: "success",
    //     runCounter: 0,
    //     "meta": {
    //         "class": "",
    //         "icon": item.icon,
    //         "html": item.name,
    //         "isExternalIcon": item.isExternalIcon || false,
    //         "isPlugin": item.isPlugin || false,
    //         "pluginData": item.pluginData || null
    //     },
    //     "data": {
    //         "id": newid,
    //         "name": item.name,
    //         waitSeconds: item.type == 'wait' ? 2 : null,
    //         timeoutSeconds: 120,
    //         maximumAttempts: 10,
    //         switchval: [],
    //         initialIntervalSeconds: 4,
    //         maximumIntervalSeconds: 10,
    //         backoffCoefficient: 2,
    //         isPlugin: item.isPlugin || false,
    //         // pluginData: item.pluginData || null
    //     }
    // });

    // ensure the node is present in the DOM and then center it in the canvas
    // setTimeout(() => {
    //     try {
    //         this.zoomNodeToCenter(newid, 1.0, true);
    //     } catch (e) {
    //         console.warn('center new node failed', e);
    //     }
    // }, 80);
  }

  getCanvasCenterPosition() {
    let position = { x: 0, y: 0, width: 0, height: 0 };
    try {
      const canvas = this.fCanvasComponent;
      // this.fCanvasComponent.getPosition()
      if (canvas) {
        // Get pan and scale
        const pan =
          typeof canvas.getPosition === 'function'
            ? canvas.getPosition()
            : { x: 0, y: 0 };
        const scale =
          typeof canvas.getScale === 'function' ? canvas.getScale() : 1;
        const host =
          (canvas as any).hostElement || (canvas as any).fCanvasHost || null;
        const width = host ? host.clientWidth : window.innerWidth || 800;
        const height = host ? host.clientHeight : window.innerHeight || 600;
        //this.message.info(`${pan.x} ${pan.y}, ${scale}, ${width}, ${height}`, {nzDuration: 40000})
        //console.log('pan-scale ', pan, scale, width, height);
        // convert screen center to world/flow coordinates: (screen - pan) / scale
        position.x = (width / 2 - pan.x) / (scale || 1);
        position.y = (height / 2 - pan.y) / (scale || 1);
        position.width = width / 2;
        position.height = height / 2;
      }
    } catch (e) {
      console.warn('failed to compute canvas center, falling back to 0,0', e);
    }
    return position;
  }

  onFormWorkflowUpdate(d: any) {
    // this.workflowFormValue = d;
    this.selectedWorkflow.name = d.name;
    this.breadcrumbService.updateBreadcrumbFields('workflow-id', {
      label: d.name,
    });
    this.selectedWorkflow.code = d.code;
    this.selectedWorkflow.controller = d.controller;
    this.selectedWorkflow.description = d.description;

    // this.statusService.updateMsg('Workflowname : ' + d.name);
  }

  workflowFormValue: any = {};

  /**
   * Validate workflow nodes before saving
   * Returns object with validation errors and first invalid node
   * Uses propertySchema to dynamically validate based on required fields
   * Also validates plugin nodes based on their plugin_properties
   */
  validateWorkflowNodes(): { errors: string[]; firstInvalidNode: any | null } {
    const errors: string[] = [];
    let firstInvalidNode: any = null;
    const nodes = this.nodes();

    // Helper to safely retrieve a plugin field value from multiple possible locations
    const getPluginFieldValue = (node: any, propId: string) => {
      // Prefer direct storage on node.data
      if (node?.data && propId in node.data) return node.data[propId];
      // Sometimes nested under data.data
      if (node?.data?.data && propId in node.data.data)
        return node.data.data[propId];
      // Fallback to meta.pluginData?.values if such structure exists
      if (node?.meta?.pluginData && propId in node.meta.pluginData)
        return node.meta.pluginData[propId];
      return undefined;
    };

    nodes.forEach((node: any) => {
      const nodeName = node.data?.name || node.id;
      const nodeType = node.type;
      let hasError = false;

      const isPluginNode =
        nodeType.startsWith('plugin') ||
        node.data?.isPlugin === true ||
        node.meta?.isPlugin === true;

      if (isPluginNode) {
        let pluginData = node.data?.pluginData || node.meta?.pluginData;

        if (!pluginData) {
          // Try toolbox fallback
          for (const section of this.toolbox) {
            if (section.name === 'Plugins') {
              const pluginBlock = section.blocks.find(
                (block: any) => block.type === nodeType
              );
              if (pluginBlock?.pluginData) {
                pluginData = pluginBlock.pluginData;
                break;
              }
            }
          }
        }

        if (
          pluginData?.plugin_properties &&
          Array.isArray(pluginData.plugin_properties)
        ) {
          const requiredProps = pluginData.plugin_properties.filter(
            (p: any) => p.required === true && p.defaultVisible === true
          );
          debugger;
          requiredProps.forEach((prop: any) => {
            const value = getPluginFieldValue(node, prop.id);
            let isValid = false;

            switch (prop.type) {
              case 'select':
              case 'multiselect':
                if (Array.isArray(value)) {
                  isValid = value.length > 0;
                } else {
                  isValid =
                    value !== undefined && value !== null && value !== '';
                }
                break;
              case 'number':
                isValid =
                  value !== undefined &&
                  value !== null &&
                  value !== '' &&
                  !isNaN(value);
                break;
              case 'codeeditor':
              case 'text':
              case 'textarea':
                isValid =
                  value !== undefined &&
                  value !== null &&
                  String(value).trim() !== '';
                break;
              case 'checkbox':
                // Checkbox required: presence of boolean (false is acceptable)
                isValid = value !== undefined && value !== null;
                break;
              default:
                isValid = value !== undefined && value !== null && value !== '';
                break;
            }

            // Accept defaultValue from definition if value missing but default exists
            if (
              !isValid &&
              prop.defaultValue !== undefined &&
              prop.defaultValue !== null
            ) {
              isValid = true;
            }

            if (!isValid) {
              errors.push(
                `"${nodeName}" (Plugin) is missing required field: ${prop.label}`
              );
              hasError = true;
            }
          });

          // requiredEither groups
          const withEither = pluginData.plugin_properties.filter(
            (p: any) =>
              Array.isArray(p.requiredEither) && p.requiredEither.length > 0
          );
          const eitherGroups: Map<string, any[]> = new Map();
          withEither.forEach((prop: any) => {
            const groupKey = [prop.id, ...prop.requiredEither].sort().join('|');
            const existing = eitherGroups.get(groupKey) || [];
            if (!existing.find((f) => f.id === prop.id)) existing.push(prop);
            prop.requiredEither.forEach((rid: string) => {
              const related = pluginData.plugin_properties.find(
                (pp: any) => pp.id === rid
              );
              if (related && !existing.find((f) => f.id === related.id))
                existing.push(related);
            });
            eitherGroups.set(groupKey, existing);
          });

          eitherGroups.forEach((group) => {
            const hasOne = group.some((prop: any) => {
              const val = getPluginFieldValue(node, prop.id);
              if (prop.type === 'select' || prop.type === 'multiselect') {
                return Array.isArray(val)
                  ? val.length > 0
                  : val !== undefined && val !== null && val !== '';
              } else if (prop.type === 'number') {
                return (
                  val !== undefined && val !== null && val !== '' && !isNaN(val)
                );
              } else if (
                prop.type === 'codeeditor' ||
                prop.type === 'text' ||
                prop.type === 'textarea'
              ) {
                return (
                  val !== undefined && val !== null && String(val).trim() !== ''
                );
              } else {
                return val !== undefined && val !== null && val !== '';
              }
            });
            if (!hasOne) {
              const labels = group.map((p: any) => p.label).join(' or ');
              errors.push(
                `"${nodeName}" (Plugin) must have at least one of: ${labels}`
              );
              hasError = true;
            }
          });
        }
      } else {
        // Validate regular nodes using propertySchema
        const requiredFields = this.propertySchema.filter((field: any) => {
          // Check if field is required and visible for this node type
          return (
            field.required &&
            field.visiblefor &&
            field.visiblefor.includes(nodeType)
          );
        });

        // Validate each required field
        requiredFields.forEach((field: any) => {
          const fieldName = field.name;
          const fieldLabel = field.label;
          let fieldValue;

          // Check if field is in metaData or direct data
          if (field.dataplace === 'metaData') {
            const metaData = node.data?.metaData || {};
            fieldValue = metaData[fieldName] || node.data?.[fieldName];
          } else {
            fieldValue = node.data?.[fieldName];
          }

          // Validate based on field type
          let isValid = false;

          if (field.type === 'multiselect' || field.type === 'select') {
            // For select/multiselect, check if array has items or value is not empty
            if (Array.isArray(fieldValue)) {
              isValid = fieldValue.length > 0;
            } else {
              isValid = fieldValue != null && fieldValue !== '';
            }
          } else if (field.type === 'number') {
            // For numbers, check if value exists and is greater than 0
            isValid = fieldValue != null && fieldValue > 0;
          } else if (field.type === 'editor' || field.type === 'input') {
            // For text/editor fields, check if not empty
            isValid = fieldValue != null && String(fieldValue).trim() !== '';
          } else if (field.type === 'keyval') {
            // For keyval fields, check if array exists and has items
            isValid = Array.isArray(fieldValue) && fieldValue.length > 0;
          } else {
            // Default: just check if value exists
            isValid = fieldValue != null && fieldValue !== '';
          }

          // If validation fails, add error message
          if (!isValid) {
            errors.push(
              `"${nodeName}" is missing required field: ${fieldLabel}`
            );
            hasError = true;
          }
        });

        // Handle "requiredEither" validation - at least one field from a group must be filled
        const fieldsWithRequiredEither = this.propertySchema.filter(
          (field: any) => {
            return (
              field.requiredEither &&
              Array.isArray(field.requiredEither) &&
              field.requiredEither.length > 0 &&
              field.visiblefor &&
              field.visiblefor.includes(nodeType)
            );
          }
        );

        // Group fields by their requiredEither relationships
        const eitherGroups: Map<string, any[]> = new Map();
        fieldsWithRequiredEither.forEach((field: any) => {
          // Create a unique group key by combining all related field names
          const allFieldNames = [field.name, ...field.requiredEither].sort();
          const groupKey = allFieldNames.join('|');

          if (!eitherGroups.has(groupKey)) {
            eitherGroups.set(groupKey, []);
          }
          const group = eitherGroups.get(groupKey)!;

          // Add current field to the group if not already present
          if (!group.find((f) => f.name === field.name)) {
            group.push(field);
          }

          // Add all related fields to the group
          field.requiredEither.forEach((relatedFieldName: string) => {
            const relatedField = this.propertySchema.find(
              (f: any) => f.name === relatedFieldName
            );
            if (
              relatedField &&
              !group.find((f) => f.name === relatedField.name)
            ) {
              group.push(relatedField);
            }
          });
        });

        // Validate each "either" group
        eitherGroups.forEach((group, groupKey) => {
          const hasAtLeastOne = group.some((field: any) => {
            let fieldValue;
            if (field.dataplace === 'metaData') {
              const metaData = node.data?.metaData || {};
              fieldValue = metaData[field.name] || node.data?.[field.name];
            } else {
              fieldValue = node.data?.[field.name];
            }

            // Check if field has value based on its type
            if (field.type === 'multiselect' || field.type === 'select') {
              return Array.isArray(fieldValue)
                ? fieldValue.length > 0
                : fieldValue != null && fieldValue !== '';
            } else if (field.type === 'number') {
              return fieldValue != null && fieldValue > 0;
            } else if (field.type === 'editor' || field.type === 'input') {
              return fieldValue != null && String(fieldValue).trim() !== '';
            } else {
              return fieldValue != null && fieldValue !== '';
            }
          });

          if (!hasAtLeastOne) {
            const fieldLabels = group.map((f: any) => f.label).join(' or ');
            errors.push(
              `"${nodeName}" must have at least one of: ${fieldLabels}`
            );
            hasError = true;
          }
        });
      }

      // Capture the first invalid node
      if (hasError && !firstInvalidNode) {
        firstInvalidNode = node;
      }
    });

    return { errors, firstInvalidNode };
  }

  saveWorkflow() {
    let formValue = this.selectedWorkflow;

    if (!formValue?.name && !formValue?.code) {
      this.isEditOpen = true;
      return;
    }

    // Validate workflow nodes
    const validationResult = this.validateWorkflowNodes();
    if (validationResult.errors.length > 0) {
      // Show all validation errors
      const errorMessage = validationResult.errors.join('<br/>');
      this.notification.error(
        'Validation Failed',
        `Please fix the following issues:
                <br/><br/>${errorMessage}`,
        {
          nzDuration: 10000,
          nzPlacement: 'topRight',
        }
      );

      // Navigate to the first invalid node and open its properties
      if (validationResult.firstInvalidNode) {
        const invalidNode = validationResult.firstInvalidNode;
        this.selectNode(invalidNode);
        // Close property panel if open to ensure clean state
        // this.isPropertyPanelVisible = false;
        // this.changeDetectorRef.detectChanges();

        // Wait for DOM to update, then zoom to the node

        //try {
        // Center and zoom to the invalid node with emphasis
        //  this.zoomNodeToCenter(invalidNode.id, 1.5, true);

        // Open the property panel after centering animation completes
        // setTimeout(() => {
        // Set selected node data and open panel
        // this.selectedNode = invalidNode;
        // this.isPropertyPanelVisible = true;

        // // Trigger change detection to ensure UI updates
        // this.changeDetectorRef.detectChanges();

        // // Mark for check to ensure Angular updates the view
        // this.changeDetectorRef.markForCheck();

        // } catch (e) {
        //     console.warn('Failed to navigate to invalid node', e);
        //     // Even if zoom fails, still try to open the property panel
        //     this.selectedNode = invalidNode;
        //     // this.isPropertyPanelVisible = true;
        //     // this.changeDetectorRef.detectChanges();
        // }
      }

      return;
    }

    let workf: Workflow = {
      id: this.selectedWorkflow?.id || 0,
      active: true,
      code: formValue.code,
      name: formValue.name,
      controller: formValue.controller,
      workflowJsonRaw: JSON.stringify(this.exportRaw()),
      workflowJson: JSON.stringify(this.normalizeWorkflow(this.exportRaw())),
      version: 1,
      description: formValue.description,
    };

    this.workflowService.create(workf).subscribe((d) => {
      this.message.success('Saved Successfully.', { nzDuration: 3000 });
      this.selectedWorkflow = d;
      this.statusService.updateMsg('Workflow Version: ' + d.version);
    });
    // this.workflowformRef.onSubmit()
  }

  getWorkflowByID(id: any) {
    this.workflowService.getById(id).subscribe((d: any) => {
      console.log(d);
      this.workflowFormValue = d;
      this.selectedWorkflow = d;
      this.statusService.updateMsg('Workflow Version: ' + d.version);

      // Update or add workflow name to breadcrumb with key
      this.breadcrumbService.upsertBreadcrumb({
        key: 'workflow-id', // Unique key for this workflow
        label: d.name || 'Workflow',
        icon: 'edit',
        iconTheme: 'outline',
        onClick: () => {
          console.log('Breadcrumb clicked - opening edit panel');
          this.edit();
          this.changeDetectorRef.markForCheck();
        },
      });

      this.loadFromJson(JSON.parse(d.workflowJsonRaw));
    });
  }
  runUpdateOptionCode = `{
    "workflowCode":"selectedWorkflowcode",
    "workflowId":"generatedID",
    "userInput":{ 
        "name":"eaxample name"
            }
    }`;

  runNewOptionCode = `{
    "workflowCode":"selectedWorkflowcode",
    "input":{ 
        "name":"eaxample name"
    },
        "state":{}
    }`;
  handleValueChange(e: string | number): void {
    this.runOptionSelected = e;
    if (e == 'Update') {
      this.apiRequest =
        this.runUpdateOptionCode.replaceAll(
          'selectedWorkflowcode',
          this.selectedWorkflow?.code
        ) + '';
    } else if (e == 'New') {
      this.apiRequest =
        this.runNewOptionCode.replaceAll(
          'selectedWorkflowcode',
          this.selectedWorkflow?.code
        ) + '';
    }
  }

  dragStartedNodes: any = [];
  onDragStarted(e: any) {
    console.log(e);
    if (e.fEventType == 'move-node') {
      this.dragStartedNodes = e.fData.fNodeIds;
      console.log(e.fData.fNodeIds);
    } else if (e.fEventType == 'canvas-move') {
      this.showMinimapTemporarily(false);
    }
  }

  onNodeDrag(event: any) {
    console.log('Node position changed:', event);
  }

  onDragEnded(e: any) {
    console.log(e);
    this.showMinimapTemporarily();
    if (this.dragStartedNodes.length > 0) {
      let conn: any = this.findConnectionsByNode(this.dragStartedNodes[0]);
      let conne = conn.find((d: any) => {
        return d.targetPortId.startsWith(this.dragStartedNodes[0]);
      });
      let conne2 = conn.find((d: any) => {
        return d.sourcePortId.startsWith(this.dragStartedNodes[0]);
      });
      if (!conne) return;
      //let liveconnection = this.connections().find((d: any) => { return d.connectionId === connection.connectionId })
      let trgNodePos = this.nodes().find((d: any) =>
        d.id.startsWith(conne.targetPortId)
      );
      if (conne2) {
        let t_trgNodePos = this.nodes().find((d: any) =>
          d.id.startsWith(conne2.targetPortId)
        );

        if (t_trgNodePos.position.x > trgNodePos.position.x) {
          conne2.type = 'offset_straight';
        } else {
          conne2.type = 'segment';
        }
      }

      if (conne) {
        let srcNodePos = this.nodes().find((d: any) =>
          conne.sourcePortId.startsWith(d.id)
        );
        if (srcNodePos.position.x < trgNodePos.position.x) {
          conne.type = 'offset_straight';
        } else {
          conne.type = 'segment';
        }
        console.log('liveconnection>>', srcNodePos, trgNodePos);
      }
      // connection.type = 'segment';

      console.log(this.dragStartedNodes);
      this.dragStartedNodes = [];
    }
  }

  onNodeMoved(e: any) {
    // console.log(e);
  }

  protected moveNodes(event: FMoveNodesEvent): void {
    console.log('moveNodes', event);
    // let nodeMove =

    // this.state.update({
    //     nodes: this.createMoveNodesChangeObject([{
    //         id:
    //     }])
    // });
  }

  createMoveNodesChangeObject(nodes: { id: string; node: any }[]) {
    return Object.fromEntries(nodes.map(({ id, node }) => [id, { node }]));
  }
  gotoWorkflow(d: any) {
    this.router.navigate(['workflow-history-compact/' + d.id]);
  }

  hoveredConnection: any = null;
  mousePos = { x: 0, y: 0 };
  confirmDeleteConnection(connectionId: any) {
    this.removeConnectionById(connectionId);
  }

  onConnectionHover(connection: any, event: MouseEvent) {
    this.hoveredConnection = connection;
    // this.mousePos = { x: event.clientX, y: event.clientY };
  }

  onConnectionMove(event: MouseEvent) {
    if (this.hoveredConnection) {
      this.mousePos = { x: event.clientX, y: event.clientY };
    }
  }

  onConnectionLeave() {
    this.hoveredConnection = null;
  }

  executionStatusInterval: any = undefined;
  dequeueInterval: any = undefined;
  lastRunningId = '';
  runningIndex = 0;
  isWorkflowRunning = false;
  getWorkflowStatus(workflowId: any) {
    this.isWorkflowRunning = true;
    this.workflowService
      .getWorkflowStepsStatus('', workflowId)
      .subscribe((d: any) => {
        if (d.status == 'SUCCESS') {
          let result = d.result;
          if (result.status == 'Completed') {
            if (this.executionStatusInterval)
              clearInterval(this.executionStatusInterval);
            this.isWorkflowRunning = false;
            setTimeout(() => {
              this.canvzoom('expand');
            }, 1500);
            this.notification.success(
              'Success',
              'Workflow executed successfully',
              {
                nzData: d.workflowId,
                nzDuration: 20000,
                nzPlacement: 'bottomRight',
              }
            );
          }

          // if (this.lastRunningId) {
          //     let index = this.nodes().findIndex((k: any) => { return k.id == this.lastRunningId });
          //     if (index > -1) {
          //         this.runningIndex = index - 1
          //     }
          // }

          for (
            let i = this.runningIndex;
            i < result.nodeResultList.length;
            i++
          ) {
            const element = result.nodeResultList[i];
            this.queue.enqueue(element);
            this.lastRunningId = element.id;
            this.zoomNodeToCenter(element.id, 0.9, true);

            //this.fFlowComponent.getPositionInFlow()
          }
        }
        this.changeDetectorRef.detectChanges();
      });
  }

  async runDeque() {
    let element = this.queue.dequeue();

    if (element) {
      console.log(element);
      let node = this.nodes().find((k: any) => {
        return k.id == element.id;
      });

      //if (node.id === '388cf982-3e29-4363-b85a-5412fe67d907' || node.id == '48a9083d-bcf8-4c90-bfcf-7119a483430d') ;
      if (
        node.runstatus != element.status ||
        node.runCounter != element.runCounter
      ) {
        this.delay(1);
        node.runstatus = element.status;
        node.runCounter = element.runCounter;
        if (node.runstatus === 'FAILED') {
          this.notification.blank('Error', element.error, {
            nzKey: node.id,
            nzDuration: 0,
          });
        }
        if (this.prevNode != '') {
          let connct = this.connections().filter(
            (a: any) =>
              a.sourcePortId.split('_')[0] == this.prevNode &&
              a.targetPortId.split('_')[0] == node.id
          );
          console.log(this.prevNode, node.id, connct.id);
          if (connct)
            if (connct.length) {
              for (let i = 0; i < connct.length; i++) {
                connct[i].cls = 'success';
              }
            } else {
              connct.cls = 'success';
            }
        }

        this.changeDetectorRef.markForCheck();
        console.log(element);
        this.prevNode = node.id;
      }
    }
  }

  ngOnDestroy() {
    if (this.executionStatusInterval) {
      clearInterval(this.executionStatusInterval);
    }

    if (this.dequeueInterval) {
      clearInterval(this.dequeueInterval);
    }
    this.statusService.updateMsg('');
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  selectedforDelete = {};
  openMenu(event: MouseEvent, node: any): void {
    this.selectedforDelete = node;
    event.preventDefault();
    this.nzDropdownService.create(event, this.menu);
  }

  isNoteEditModal = false;
  selectedNote = { note: '', color: { bgColor: '', darkColor: '' } };
  editNote(e: Event, stknote: any) {
    this.selectedNote = stknote;
    this.isNoteEditModal = true;
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  /**
   * Open plugin detail modal
   * @param pluginId Database ID of the plugin
   * @param event Optional event to stop propagation
   */
  openPluginDetail(pluginId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    console.log('Opening plugin detail for ID:', pluginId);
    this.selectedPluginId = pluginId;
    this.isPluginDetailVisible = true;
    console.log('Modal should be visible:', this.isPluginDetailVisible);
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Close plugin detail modal
   */
  closePluginDetail() {
    this.isPluginDetailVisible = false;
    this.selectedPluginId = null;
  }

  /**
   * Open marketplace modal
   */
  openMarketplace() {
    this.isMarketplaceVisible = true;
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Close marketplace modal
   */
  closeMarketplace() {
    this.isMarketplaceVisible = false;
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Handle plugin installation from marketplace
   */
  onPluginInstalled(plugin: any) {
    console.log('Plugin installed:', plugin);
    this.message.success(`${plugin.pluginName} installed successfully!`);
    // Reload plugins to show the newly installed plugin
    this.loadPlugins();
  }

  /**
   * Handle block icon load error
   * @param block The block item that failed to load its icon
   */
  onBlockIconError(block: any) {
    console.warn(
      `Icon failed to load for block: ${block.name}, using fallback icon`
    );
    // Mark the block to use fallback icon
    block.iconError = true;
    block.isExternalIcon = false;
    // Force update the toolbox array to trigger change detection
    this.toolbox = [...this.toolbox];
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Handle node icon load error on canvas
   * @param node The node that failed to load its icon
   */
  onNodeIconError(node: any) {
    console.warn(
      `Icon failed to load for node: ${
        node.meta?.html || node.id
      }, using fallback icon`
    );
    // Mark the node to use fallback icon
    node.iconError = true;
    // Update the nodes array to trigger change detection
    this.updateNodeService.update((flow: any) => ({
      ...flow,
      nodes: [...flow.nodes],
    }));
    this.changeDetectorRef.markForCheck();
  }
}
