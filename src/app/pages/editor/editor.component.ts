import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CodeEditor } from "@acrodata/code-editor";

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { minimalLanguages } from '../../helpers/minimal-languages';
import type { LanguageDescription } from '@codemirror/language';
import { java } from '@codemirror/lang-java';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { customCompletion } from '../../helpers/javaAutocomplete';
import { javaLint } from '../../helpers/javaLint';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeFlatDataSource, NzTreeFlattener, NzTreeViewModule } from 'ng-zorro-antd/tree-view';

import { CdkTreeModule, FlatTreeControl } from '@angular/cdk/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { HttpService } from '../../service/http-service';
import { CommonModule } from '@angular/common';
import { DBEditorComponent } from './dbeditor/dbeditor.component';
import { APIEditorComponent } from '../components/api-editor/api-editor.component';
import { ConstantEditorComponent } from "./constants/constant.component";
import { NzMessageService } from 'ng-zorro-antd/message';
import { Visibility, NodeType } from './enums'
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { AutoScrollBottomDirective } from '../../directive/AutoScrollBottomDirective'
import { EditorActionService } from '../../service/editor-action-service';
import { EditorAction } from '../../model/editor-action-model';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { EditorStatusService } from '../../service/editor-status-service';
import { environment } from '../../environments/environment';
// import { MonacoEditorComponent } from '../../common/editor-component/editor.component';
import { constants } from './../../environments/constats';
import { arrayToDate } from '../../common/dateformat';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { metadataAutoloadExtension } from '../../helpers/fetchMetadataExtension';
import { ApiMetadataService } from '../../service/api-metadata-service';
import { firstValueFrom } from 'rxjs';

@Component({
    standalone: true,
    imports: [CodeEditor, FormsModule, NzSplitterModule, NzTreeViewModule, CdkTreeModule, NzIconModule, NzButtonModule, NzToolTipModule, NzSpaceModule, CommonModule, DBEditorComponent, ConstantEditorComponent, NzDrawerModule, AutoScrollBottomDirective, APIEditorComponent, NzInputModule, ReactiveFormsModule, NzEmptyModule, NzAutocompleteModule, NzListModule, NzTypographyModule, NzBadgeModule, NzTabsModule, NzSegmentedModule],
    styleUrls: ['editor.component.scss'],
    exportAs: 'editor-component',
    selector: 'editor-component',
    templateUrl: 'editor.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})



export class EditorComponent implements OnInit {

    constants = constants;
    tabs: any = [];
    tabContent: any = {};
    selectedIndex = 0;
    @ViewChild(CodeEditor) codeEditor!: CodeEditor;
    @ViewChild('dbcomp') dbComp!: DBEditorComponent;
    @ViewChild('apicomp') apicomp!: APIEditorComponent;

    cursorInfo = { line: 1, word: 0 };
    isRefreshTabContent = false;
    // @ViewChild('logBox') private logBox!: ElementRef;
    closeTab({ index }: { index: number }): void {
        this.isRefreshTabContent = true;
        let tabName = this.tabs[index];
        console.log(tabName, this.tabContent)
        delete this.tabContent[tabName.name];
        console.log(this.tabContent)
        this.tabs.splice(index, 1);

    }

    newTab(className: any, classType: any): number {

        let tab = this.getTabIndexByName(className);
        if (tab) {
            return tab.index;
        }
        this.tabs.push({ name: className, type: classType, icon: this.icons[classType] });
        this.selectedIndex = this.tabs.length;
        return this.selectedIndex - 1;
    }

    getTabIndexByName(className: any) {
        return this.tabs
            .map((item: any, index: number) => ({ ...item, index }))
            .find((item: any) => item.name === className);
    }


    logs: any = [];

    public VisibilityEnum = Visibility;
    public NodeTypeEnum = NodeType;
    disableOnRootSelected: boolean = false;
    selectedClassType: any = NodeType.none;
    fileVersion = '';
    apiEditorVal: any = {};
    actions: any = []
    vis: Visibility = Visibility.none;
    selectedNodeId = 0;
    parseCodeVisible: boolean = false;
    parsedCode: any = "";
    extensions: any = [
        // java(),
        // autocompletion({
        //     override: [customCompletion]
        // }),
        // metadataAutoloadExtension(() => this.metaService.load().toPromise()),

    ];

    classExt: any = {}
    icons: any = {}
    folders: any = []; //= TREE_DATA;

    async ngAfterViewInit() {
        const metadata = await firstValueFrom(this.metaService.load());

        console.log(metadata);
        this.extensions = [
            // java(),
            // autocompletion({
            //     override: [customCompletion]
            // }),
            metadataAutoloadExtension(() => Promise.resolve(metadata)),
            // javaLint
        ]
    }



    code: string = '// Select a function from the left panel to view/edit its code';


    // Provide a mutable array for the editor input
    languages: LanguageDescription[] = minimalLanguages.slice();
    options: any = {
        language: 'java',
        theme: 'dark',
        setup: 'basic',
        disabled: false,
        readonly: false,
        placeholder: 'Enter expression',
        indentWithTab: true,
        indentUnit: '',
        lineWrapping: true, // Enable wrap text feature
        highlightWhitespace: false,
    };

    // Keep UI state
    expandedKeys = new Set<number>();
    selectedKey: number | null = null;



    allFiles: any = [];
    selectedFile: any = {};
    listFiles: any = [];
    listChildFiles: any = []

    selectNode(node: any): void {
        this.selectedKey = node.id;
    }

    isSelected(node: any): boolean {
        return this.selectedKey === node.id;
    }




    constructor(private httpService: HttpService, private message: NzMessageService, private actionService: EditorActionService,
        private chref: ChangeDetectorRef, private statusService: EditorStatusService,
        private metaService: ApiMetadataService


    ) {
        this.classExt[NodeType[NodeType.function]] = 'func';
        this.classExt[NodeType[NodeType.condition]] = 'cond';
        this.classExt[NodeType[NodeType.controller]] = 'contr';
        this.classExt[NodeType[NodeType.model]] = 'mod';
        this.classExt[NodeType[NodeType.object]] = 'obj';
        this.classExt[NodeType[NodeType.constants]] = 'const';
        this.classExt[NodeType[NodeType.api]] = 'api';
        this.classExt[NodeType[NodeType.plugin]] = 'plugin';



        this.icons[NodeType[NodeType.function]] = 'java';
        this.icons[NodeType[NodeType.condition]] = 'sisternode';
        this.icons[NodeType[NodeType.controller]] = 'api';
        this.icons[NodeType[NodeType.model]] = 'product';
        this.icons[NodeType[NodeType.object]] = 'insert-row-above';
        this.icons[NodeType[NodeType.constants]] = 'borderless-table';
        this.icons[NodeType[NodeType.api]] = 'api';
        this.icons[NodeType[NodeType.plugin]] = 'appstore-add';

        this.bindTreeView(0, true);
    }

    execute(action: EditorAction): void {
        if (action.enabled && action.action) {
            action.action();
        } else {
            console.warn(`${action.id} action is disabled or missing handler`);
        }
    }

    ngOnInit() {



        this.actionService.actionsObservable.subscribe(actions => {
            this.actions = actions;
        });
        // this.actionService.registerAction({
        //     id: 'add',
        //     label: 'Add',
        //     icon: 'plus',
        //     tooltip: 'Add New',
        //     style: 'default',
        //     visible: true,
        //     enabled: false,
        //     action: () => this.handleNewClick()
        // });
        this.actionService.registerAction({
            id: 'deploy',
            label: 'Deploy',
            icon: 'cloud-upload',
            tooltip: 'Upload',
            style: 'default',
            visible: true,
            enabled: false,
            action: () => this.handleDeployClick('')
        });



        // this.actionService.registerAction({
        //     id: 'play',
        //     label: 'Run',
        //     icon: 'play-circle',
        //     tooltip: 'Run',
        //     style: 'default',
        //     visible: true,
        //     enabled: false,
        //     action: () => this.handleNewClick()
        // });
        this.actionService.registerAction({
            id: 'compile',
            label: 'Compile',
            icon: 'container',
            tooltip: 'Compile',
            style: 'default',
            visible: true,
            enabled: false,
            action: () => this.handleDeployClick('onlyCompile')
        });
        this.actionService.registerAction({
            id: 'help',
            label: 'Help',
            icon: 'info-circle',
            tooltip: 'Help',
            style: 'default',
            visible: true,
            enabled: false,
            action: () => {
                window.open(environment.docUrl + '/docs/getting-started/code-editor/' + this.selectedFile.classType, '_blank');
            }
        });
    }


    //ngAfterViewInit(): void {
    // setTimeout(() => {
    //     this.treeControl.expand(this.getNode('Functions')!);
    //     this.treeControl.expand(this.getNode('Conditions')!);
    //     this.treeControl.expand(this.getNode('Data Models')!);
    //     this.treeControl.expand(this.getNode('Objects')!);
    // }, 200);
    // }


    isViewVisible = false;
    ngAfterViewChecked() {
        if (this.codeEditor?.view) {
            this.isViewVisible = true;
        } else {
            this.isViewVisible = false;
        }
        // console.log(this.isViewVisible)
        // if (this.vis == Visibility.codeeditor) {
        //     this.bindEditorEvents();
        //     console.log(this.codeEditor)
        // }
        if (!this.cursorListener && this.isViewVisible) {
            this.bindEditorEvents();
        } else {
            if (this.cursorListener && !this.isViewVisible) {
                //const editorView = this.codeEditor.view!;
                this.cursorListener = null;
                this.statusService.clearStatus();
                // editorView.dispatch({
                //     effects: StateEffect.appendConfig.of([]),
                // });
            }

        }
    }
    cursorListener: any = null;
    bindEditorEvents() {
        const editorView = this.codeEditor.view!;
        this.cursorListener = EditorView.updateListener.of((update) => {
            if (update.selectionSet) {
                const pos = editorView.state.selection.main.head;
                const line = editorView.state.doc.lineAt(pos);
                const column = pos - line.from + 1;
                const textBeforeCursor = line.text.slice(0, column - 1);
                const words: any = textBeforeCursor.trim().split(/\s+/).filter(Boolean);
                // console.log(`Line: ${line.number}`);
                this.statusService.updateStatus({
                    line: line.number,
                    column: column,
                    wordCount: words.length
                });
            }
        });

        // Attach listener only once
        editorView.dispatch({
            effects: StateEffect.appendConfig.of([this.cursorListener]),
        });
    }

    selectedFolder: any = {};
    selectItem(item: any) {
        item.level = 0;
        this.handleNodeClick(item);
    }


    selectSubItem(item: any) {
        this.vis = Visibility.none;

        this.handleNodeClick(item);


        this.selectedFile = item;
    }





    onTabClick(e: any) {
        debugger
        let node = this.tabContent[this.tabs[e].name];
        console.log('this >> ', node)
        if (node) {
            this.vis = Visibility.none;
            this.handleNodeClick(node.node);
        }
    }

    onTabIndexChange(e: any) {

        if (this.isRefreshTabContent && this.selectedIndex > -1) {
            this.onTabClick(this.selectedIndex);


        }

        if (this.selectedIndex == -1) {
            this.vis = Visibility.none;
            this.actionService.setEnabledDelayMultiple(['compile', 'deploy', 'help'], false, 0);
            this.selectedNodeId = 0;
            this.selectedFile = {};

        }
    }

    handleNodeClick(node: any) {



        this.selectNode(node);
        this.selectedFile = {};
        this.options.disabled = true;
        // this.actionService.setEnabledDelay('deploy', false, 0);
        // this.actionService.setEnabledDelay('compile', false, 0);
        this.actionService.setEnabledDelay('add', false, 0);
        console.log('Node clicked:', node);
        if (node) {

            if (node.level === 0) {

                //     this.disableOnRootSelected = false;
                //    this.code = '// Select a function from the left panel to view/edit its code';
                this.selectedClassType = NodeType[node.classTypeKey] || NodeType.none;
                //     this.vis = Visibility.none;
                this.selectedNodeId = 0;
                this.actionService.setEnabledDelay('add', true, 100);
                this.selectedFile = {};
                this.selectedFolder = node;
                this.bindChild();


                //this.actionService.setEnabled('deploy', false); 
                //this.code = '// Select a function from the left panel to view/edit its code';
            } else {

                this.newTab(node.className, node.classType);
                if (!this.tabContent[node.className]) {
                    this.tabContent[node.className] = {
                        node: node,
                        resCode: null,
                        resColumns: null,
                        code: null
                    }
                } else {
                    let tab = this.getTabIndexByName(node.className);
                    this.selectedIndex = tab.index;
                }
                this.actionService.setEnabledDelay('deploy', true, 100);
                this.selectedNodeId = node.id;
                this.disableOnRootSelected = true;
                //this.selectListSelection.toggle(node);
                if (node.classType == NodeType[NodeType.function] || node.classType == NodeType[NodeType.model] || node.classType == NodeType[NodeType.controller] || node.classType == NodeType[NodeType.condition] || node.classType == NodeType[NodeType.switch] || node.classType == NodeType[NodeType.plugin]) {
                    this.actionService.setEnabledDelayMultiple(['compile', 'deploy', 'help'], true, 100);
                    this.vis = Visibility.codeeditor;

                    if (this.tabContent[node.className]?.resCode) {

                        let res = this.tabContent[node.className]['resCode'];

                        this.selectedFile = res;
                        this.options.disabled = false;
                        this.fileVersion = res.version.toString();
                        this.code = this.tabContent[node.className]['code'];
                        //this.code = this.base64ToUtf8(this.selectedFile.rawClass);
                    } else {
                        this.httpService.getDataById(node.id).subscribe((res: any) => {
                            res.modifiedTime = arrayToDate(res.modifiedTime);
                            res.createdTime = arrayToDate(res.createdTime);
                            res.compiledTime = arrayToDate(res.compiledTime);
                            this.tabContent[node.className]['resCode'] = res;
                            console.log(res);

                            this.selectedFile = res;

                            this.options.disabled = false;
                            this.fileVersion = res.version.toString();
                            this.code = this.base64ToUtf8(this.selectedFile.rawClass);
                            this.tabContent[node.className].code = this.code
                        });
                    }

                } else if (node.classType == NodeType[NodeType.constants]) {
                    this.vis = Visibility.consteditor;
                } else if (node.classType == NodeType[NodeType.api]) {
                    debugger
                    this.vis = Visibility.apieditor;
                    console.log('api')

                    if (this.tabContent[node.className]?.resCode) {
                        let res = this.tabContent[node.className]['resCode'];
                        this.selectedFile = res;
                        this.options.disabled = false;
                        this.fileVersion = res.version.toString();
                        let value = JSON.parse(res.rawProcessClass);
                        value.id = node.id;
                        value.version = this.fileVersion;
                        setTimeout(() => {
                            this.apicomp.setValue(value)
                        }, 100);



                    } else {
                        this.httpService.getDataById(node.id).subscribe((res: any) => {
                            console.log(res);
                            res.modifiedTime = arrayToDate(res.modifiedTime);
                            res.createdTime = arrayToDate(res.createdTime);
                            res.compiledTime = arrayToDate(res.compiledTime);

                            this.tabContent[node.className]['resCode'] = res;

                            this.selectedFile = res;
                            this.options.disabled = false;
                            this.fileVersion = res.version.toString();
                            let value = JSON.parse(res.rawProcessClass);
                            value.id = node.id;
                            value.version = this.fileVersion;
                            console.log(value);

                            setTimeout(() => {
                                this.apicomp.setValue(value)
                            }, 100);


                        });
                    }
                } else
                    if (node.classType == NodeType[NodeType.object]) {
                        this.vis = Visibility.dbview;
                        setTimeout(() => {

                            this.actionService.setEnabledDelay('deploy', true, 100);
                            debugger
                            if (this.tabContent[node.className]?.resColumns) {
                                console.log('DB >> > ', this.tabContent[node.className])

                                this.dbComp.setColumns(this.tabContent[node.className]['resColumns']);

                            } else {
                                this.httpService.getColumns(node.className).subscribe((res: any) => {
                                    this.tabContent[node.className]['resColumns'] = res;
                                    console.log(res);
                                    this.dbComp.setColumns(res);
                                });
                            }

                        }, 100);
                    }
            }


        }
        this.chref.detectChanges();
    }

    bindChild() {
        this.bindTreeView('');
        this.httpService.getDataFiles(this.selectedFolder?.classTypeKey).subscribe((res: any) => {
            this.listChildFiles = res;
        });
    }

    addNew(e: any) {
        if (!this.selectedFolder?.classTypeKey) {
            this.message.error("Please select folder to add", { nzDuration: 2000 });
            return;
        }
        let newClass = this.selectedFolder.classType + '>' + 'New';
        this.newTab(newClass, this.selectedFolder?.classTypeKey);
        this.code = ``;
        this.vis = Visibility.none;
        setTimeout(() => {

            this.handleNewClick(newClass);
        }, 400)

    }

    bindTreeView(key: any, refresh: boolean = true) {
        if (!refresh) {
            return
        }
        this.httpService.getData().subscribe((res: any) => {
            this.folders = res;
        });
    }

    handleNewClick(newClass: any) {
        this.selectedFile = {
            id: 0,
            className: newClass,
            classType: NodeType[this.selectedClassType],
            rawClass: '',
            version: 1
        };

        this.tabContent[newClass] = {
            node: this.selectedFile,
            resCode: null,
            resColumns: null,
            code: null
        }
        this.options.disabled = false;
        this.fileVersion = '1';
        if (this.selectedClassType == NodeType.model) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `public class <Model Name>
{

}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;
        } else if (this.selectedClassType == NodeType.function) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `@FFunction
public class <Function Name> extends Function {
  
  @usedb;
  
  @onload
  void init() {
    @println("inititated");
  }
  
  
@run public FunctionResponse invoke(FRequest req) {


    @new FunctionResponse c;
    c.setStatus(FunctionStatus.SUCCESS);
    c.setMessage("Successfully complete");
    return c;
  }
}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;

        } else if (this.selectedClassType == NodeType.plugin) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `@FPlugin
public class HelloWorldPlugin extends Function {

  @Autowired
  PluginManagerService pluginService;
  
  @onload
  void init() {
      @new PluginDto plugin;
      plugin.setVersion("1.0.4");
      plugin.setPluginId("com.plugin.xxxx");
      plugin.setPluginName("Hello World");
      plugin.setPluginDesc("Hello World Description");
      plugin.setPluginAuthor("Pratik Naik");
      plugin.setPluginDocument("xxx"); 
plugin.setIcon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKjSURBVFiF7ZRBSJNhHMZ//+9bmy5lYR7SVVpEYEtqqyAMdCMveqkMJBMKrNBLWYdIOnWoIIjIIEo7dIgOIXToFCbqSaQUhdA6hEZqFoHpZi3n3NvBOdp085sODOq5vfyf93me9/98fPAf/zpEgYzbc+qVcAGwAx0hQpe3jH59m0oj9YpC4DaCGxgF7kkpjTJqz7kkwp0Yvl+gPnd0/FGKzM8hNALpMaOLMmbPGUbIX+rihk2259YM/bR0DkyvyNjtyMDlbaZ8pCoOZVhDyIsnoOt6BWLuVR7nnqTNi10F6ObXTKQdT0DL1wBZRmsn0K3ce+sNm3ucp9BVDyEK0JU5AVVMBjXTELmrPK4DqJm6eJUotyMDsTwEVW00rPbEcXJKLbuEiEV1vEpUsasAMXcbNVdA06+8Ka2h+LqtpqyJSYvNaOhFlURWDg4jAt9D6zjm20/dj9024YZfAdh9n3nQdp59X/oixI32LCzWhBU+DUeI/+rtPqj6EDn2Bm1U+lwMhawAaAuDscxcKo48476zlqQqSaLv5pmtFE0VRcyjAgAENRM3D16hpqyJGVParFHhxBkJ+dFnK6dd1E4XEoi2jDmF0ZpfSsmJVt1vWd+/Wn/vT0vvrskSvWUmZ8n5kgEARjI3a3mHX15FuMX8R7sCqOYd5duufZxLj+sTdwDgNVvnpL2vATgKTCTh7EVUpXT0134zSzARMWGABUhH3wt0zQl0GaD3oJuc0t7fYkTbUAAAaev9hLKVJK5ENZMdOCRtb4aM6hr9Fc+H6OwMAg3K4+wCHgNZ4ZEXUWeNvvpPGN5AVJDoSpJaeUoCQLiS7IAn2ZXHIqkKFoVoGQis5j6sYgOpgsaKfzIpgdKA92sY4J2GUjXA4BqYD6JCZ9bA9z/+MvwGygPbKKluEr8AAAAASUVORK5CYII=");
      plugin.setProps({
                      "title": "Untitled Form",
                      "description": "",
                      "height": "100%",
                      "width": "100%",
                      "submitUrl": "",
                      "successMessage": "Form submitted successfully!",
                      "errorMessage": "Failed to submit form. Please try again.",
                      "submitButtonLabel": "Submit",
                      "resetButtonLabel": "Reset",
                      "showResetButton": true,
                      "fields": [
                        {
                        "id": "name",
                        "type": "text",
                        "label": "Key",
                        "placeholder": "Enter text input",
                        "required": true,
                        "icon": "font-size",
                        "defaultVisible": true,
                        "defaultEnabled": true
                      },
                      {
                        "id": "874c1ba4-99ff-4d36-8f27-69d3f28619f2",
                        "type": "textarea",
                        "label": "Props",
                        "placeholder": "Enter text area",
                        "required": false,
                        "icon": "align-left",
                        "defaultVisible": true,
                        "defaultEnabled": true
                      }
                    ]});

      pluginService.register(plugin);
    }
  
  
    @run 
    public FunctionResponse invoke(FRequest req) { 
      @new FunctionResponse c;
      c.setStatus(FunctionStatus.SUCCESS);
      c.setMessage("Successfully complete");
      return c;
    }


}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;

        } else if (this.selectedClassType == NodeType.condition) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `@FCondition
public class <Condition Name> extends Condition {
  
  @usedb;
  
  @onload
  void init() {
    @println("inititated");
  }
  
  
@run public ConditionResponse invoke(FRequest req) {


    @new ConditionResponse c;
    c.setStatus(ConditionStatus.TRUE);
    c.setMessage("Successfully complete");
    return c;
  }
}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;
        } else if (this.selectedClassType == NodeType.controller) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `@FController
public class <Controller Name> extends Controller {
  
  @usedb;
  
  @onload
  void init() {
    @println("inititated");
  }
  
  
@run public CreateResponse invokeCreate(FCreateRequest req) {


    @new CreateResponse c;
    c.setStatus(ControllerStatus.SUCCESS);
    c.setMessage("Successfully complete");
    return c;
  }

@run public InputResponse invokeInput(FInputRequest req) {


    @new InputResponse c;
    c.setStatus(ControllerStatus.SUCCESS);
    c.setMessage("Successfully complete");
    return c;
  }
}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;
        } else if (this.selectedClassType == NodeType.switch) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.codeeditor;
            this.code = `@FSwitchCondition
public class <Condition Name> implements ISwitchCondition {
  
  @usedb;
  
  @onload
  void init() {
    @println("inititated");
  }
  
  
@run public SwitchConditionResponse invoke(FRequest req) {


  
    @new SwitchCondition condition;
    condition.put(1, ConditionStatus.TRUE);
    condition.put(2, ConditionStatus.TRUE);
    condition.put(3, ConditionStatus.TRUE);
    condition.put(4, ConditionStatus.TRUE);
    

    @new SwitchConditionResponse c;
    c.setStatus(condition);
    c.setMessage("Successfully complete");
    return c;
  }
}`;
            this.selectedFile.rawClass = this.code;
            this.tabContent[newClass].resCode = this.selectedFile;
        } else if (this.selectedClassType == NodeType.object) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.dbview;
            setTimeout(() => {
                this.tabContent[newClass].resColumns = this.dbComp.getData();
            }, 200);


        } else if (this.selectedClassType == NodeType.api) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.apieditor;
        }
        else if (this.selectedClassType == NodeType.scheduler) {
            this.actionService.setEnabledDelay('deploy', true, 100);
            this.vis = Visibility.none;
        }

        this.disableOnRootSelected = true;
    }

    // onNodeClick(event: any): void {
    //     event.event.stopPropagation();
    //     console.log('Node clicked:', event.node);
    //     const node = event.node;
    //     if (node) {
    //        // this.selectListSelection.toggle(node);
    //         if (node.level === 0) {
    //             this.disableOnRootSelected = false;
    //             this.code = '// Select a function from the left panel to view/edit its code';
    //         } else {
    //             this.disableOnRootSelected = true;

    //         }
    //     }
    // }

    handleDeployClick(compileType: any) {
        if (this.vis === Visibility.apieditor) {
            this.apicomp.onSubmit();
            return;
        }
        if (this.vis === Visibility.dbview) {
            debugger
            this.dbComp.compile().then((e: any) => {
                this.bindChild();
                this.tabs[this.selectedIndex].name = e.className;
            }).catch((e: any) => {

            });

            return;
        }
        let loadingId = this.message
            .loading('Compiling...', { nzDuration: 0 }).messageId;

        if (compileType != "onlyCompile") { this.addInfo('Deploying...') };
        this.alldisabled(true);
        this.selectedFile.rawClass = this.utf8ToBase64(this.code);
        this.httpService.savePostData({
            encodedFile: this.selectedFile.rawClass,
            classType: this.selectedFile.classType,
            id: this.selectedFile.id,
            compileType: compileType,
            version: this.fileVersion
        }).subscribe((e: any) => {
            // console.log(e);
            this.message.remove(loadingId);
            if (compileType == "onlyCompile") {
                this.parseCodeVisible = true;
                this.parsedCode = e.message;
            } else {
                debugger
                if (e && e.status == "Success") {
                    this.message.success("Whoaaa! Compiled " + (compileType == "onlyCompile" ? "" : " & Deployed successfully"), { nzDuration: 5000 });
                    this.addInfo('File list...');

                    if (this.selectedFile.id == 0) {
                        this.bindChild();
                        this.selectedFile.id = e.id;
                        this.tabs[this.selectedIndex].name = e.className;

                        this.selectedFile.className = e.className;
                        this.handleNodeClick(this.selectedFile);
                    }



                    this.fileVersion = e.version;
                    this.selectedFile.version = e.version;
                    this.selectedFile.modifiedTime = arrayToDate(e.modifiedTime);
                    this.addInfo('Deployed successfully.');
                } else if (e && e.status == "Failed") {
                    if (e.id && e.id == -1) {
                        this.message.warning("No change in file");
                    } else {
                        this.message.error("Oh no! Failed to deploy!");
                    }
                    this.addError('Deployment failed.');
                    this.addError('Error: ' + e.message);

                }
            }
            this.alldisabled(false);

        });
    }



    logsHtml = '';
    log(e: any) {
        //   console.log(e);
        this.tabContent[this.selectedFile.className]['code'] = e;
    }



    addInfo(line: string) {
        //   this.logsHtml += new Date().toLocaleTimeString() + ` : <span  class='info'>INFO: ${line}</span><br/>`;


        this.logs = [...this.logs, new Date().toLocaleDateString() + ` : <span  class='info'>INFO: ${line}</span><br/>`];

    }

    addError(line: string) {
        // this.logsHtml += new Date().toLocaleTimeString() + ` : <span class='error'>ERROR: ${line}</span><br/>`;

        this.logs = [...this.logs, new Date().toLocaleDateString() + ` : <span class='error'>ERROR: ${line}</span><br/>`];

    }

    addWarn(line: string) {

        this.logs = [...this.logs, new Date().toLocaleDateString() + ` : <span class='warn'>WARN: ${line}</span><br/>`];

        // this.logsHtml += new Date().toLocaleTimeString() + ` : <span class='warn'>WARN: ${line}</span><br/>`;

    }

    clearLogs() {
        this.logs = [];

    }

    alldisabled(l: any) {
        this.actionService.setEnabled('', l);
    }

    base64ToUtf8(str: any) {
        return atob(str);
    }

    utf8ToBase64(str: any) {
        return btoa(str);
    }


    generateGettersSetters(code: string) {
        const fieldRegex = /private\s+([A-Za-z0-9_<>,]+)\s+([a-zA-Z0-9_]+);/g;
        let match;
        let gettersSetters = '';

        while ((match = fieldRegex.exec(code)) !== null) {
            const type = match[1].trim();
            const field = match[2].trim();
            const capField = field.charAt(0).toUpperCase() + field.slice(1);

            gettersSetters += ` public ${type} get${capField}() {
        return ${field};
    }

    public void set${capField}(${type} ${field}) {
        this.${field} = ${field};
    }
                `;
        }
        this.code = this.code.replace(/}\s*$/, gettersSetters + "\n}");
    }
    closeParseWindow() {
        this.parseCodeVisible = false;
    }

    inputValue?: string;
    filteredOptions: any = [];
    searchOptions: any = [];
    onChange(value: string): void {

        this.filteredOptions = this.searchOptions.filter((option: any) => option.className.toLowerCase().indexOf(value.toLowerCase()) !== -1);
        console.log(this.filteredOptions)
    }

    onSelect(id: any) {
        console.log(id)
        debugger
        let opt: any = this.searchOptions.find((option: any) => option.className == id.nzValue);

        this.handleNodeClick({
            disabled: false, expandable: true,
            id: opt.id,
            level: 1,
            name: opt.className,
            type: opt.type,
        })

    }


    getChildCount(nodeKey: any): number {
        debugger
        // const parent: any = this.treeControl.dataNodes.filter(n => { return  n.type == NodeType[nodeKey] && n.level == NodeType.condition; });

        return parent?.length ?? 0;
    }

    ngOnDestroy() {
        this.statusService.clearStatus();
    }
}