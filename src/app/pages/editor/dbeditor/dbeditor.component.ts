import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTableModule } from 'ng-zorro-antd/table';
import { Column, Table } from './dbeditor.interface';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { HttpService } from '../../../service/http-service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { EditorActionService } from '../../../service/editor-action-service';

@Component({
    selector: 'db-editor',
    templateUrl: 'dbeditor.component.html',
    styleUrls: ['dbeditor.component.scss'],
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    exportAs: 'db-editor',
    imports: [FormsModule,
        CommonModule,
        NzFormModule,
        NzTableModule,
        NzSelectModule,
        NzCheckboxModule,
        NzIconModule,
        NzInputModule,
        NzButtonModule,
        NzTabsModule
    ],
})

export class DBEditorComponent implements OnInit {



    constructor(private httpService: HttpService, private message: NzMessageService,
        private actionService: EditorActionService) { }

    ngOnInit() {
        console.log('this>>>')
        this.tablCos.push({
            name: 'id',
            type: 'INT',
            length: 0,
            isPrimary: true,
            isNullable: false,
            isAutoIncrement: true,
            isnew: true
        });
        this.table.columns = this.tablCos;
    }

    ngAfterViewInit() {
        //this.actionService.setEnabledDelay('deploy', true, 1);
        //this.actionService.setEnabledDelay('play', true, 100);
        this.actionService.registerAction({
            id: 'addField',
            label: 'Add Field',
            icon: 'file-add',
            tooltip: 'Add Field',
            style: 'default',
            visible: true,
            enabled: true,
            action: () => this.addColumn()
        });
    }


    table: Table = { id: 0, name: '', columns: [], classType: '' };
    @Input() classType = '';
    @Input() id = 0;
    tablCos: Column[] = [];
    generatedSql: string | null = null;

    addColumn() {
        this.tablCos.push({
            name: '',
            type: 'VARCHAR',
            length: 255,
            isPrimary: false,
            isNullable: false,
            isAutoIncrement: false,
            isnew: true
        });

        console.log(this.tablCos);
    }

    setColumns(data: any) {
        this.table = data;
        this.tablCos = data?.columns;

        console.log('inside >>>', this.tablCos)
    }

    compile() {
        let loadingId = this.message
            .loading('Executing...', { nzDuration: 0 }).messageId;
        this.table.columns = this.tablCos;
        this.table.id = this.id;
        this.table.classType = this.classType;
        let idExists = this.table.columns.find((a: Column) => {
            return a.name == 'id' && a.isPrimary == true && a.isNullable == false
        });



        return new Promise((resolve, reject) => {
            if (!idExists) {
                this.message.error("'id' with primary and not nullable column should be present in table ", { nzDuration: 5000 });
                reject('error');
                this.message.remove(loadingId);
                return;
            }
            this.httpService.executeDb(this.table).subscribe((e: any) => {
                console.log(e);
                this.message.remove(loadingId);
                if (e && e.status == "Success") {
                    e.className = this.table.name;
                    resolve(e)
                    this.message.success("Whoaaa! Done!", { nzDuration: 5000 });
                } else if (e && e.status == "Failed") {
                    reject(e)
                    this.message.error("Oh no! Failed to update! " + e.message, { nzDuration: 10000 });
                }


            });
        })
    }

    getData() {
        return this.table;
    }


    removeColumn(index: number) {
        this.tablCos.splice(index, 1);
    }

    ngOnDestroy() {
        this.actionService.removeAction('addField');

    }


}