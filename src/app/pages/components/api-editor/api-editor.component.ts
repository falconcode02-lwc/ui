
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { HttpService } from '../../../service/http-service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { EditorActionService } from '../../../service/editor-action-service';
import { CodeEditor } from '@acrodata/code-editor';

@Component({
    selector: 'api-editor',
    styleUrl: 'api-editor.component.scss',
    templateUrl: 'api-editor.component.html',
    imports: [NzFormModule, ReactiveFormsModule, FormsModule, CommonModule, NzSelectModule, NzInputModule, NzRadioModule, NzButtonModule, NzCardModule, NzSplitterModule, CodeEditor],
})


export class APIEditorComponent implements OnInit {
    apiForm!: FormGroup;
    @Input() version: string = '1';
    @Input() id: number = 0;

    testRequestPayload: string = '';
    testResponsePayload: string = '';

    constructor(private fb: FormBuilder, private message: NzMessageService, private httpService: HttpService,
        private actionService: EditorActionService) { }

    ngOnInit(): void {
        this.apiForm = this.fb.group({
            name: ['', Validators.required],
            url: ['', [Validators.required]],
            method: ['GET', Validators.required],
            headers: ['{}'],
            payload: [''],
            resultModel: [''],
            readTimeout: [5000, Validators.min(0)],
            socketTimeout: [5000, Validators.min(0)],
            mode: ['sync']
        });
    }
    ngAfterViewInit() {
        //this.actionService.setEnabledDelay('deploy', true, 1);
        //this.actionService.setEnabledDelay('play', true, 100);
        this.actionService.registerAction({
            id: 'testapi',
            label: 'Test',
            icon: 'play-circle',
            tooltip: 'Test API',
            style: 'default',
            visible: true,
            enabled: true,
            action: () => ('')
        });
    }

    onSubmit(): void {
        if (this.apiForm.invalid) {
            this.message.error('Please fill in all required fields correctly.');
            return;
        }
        const formValue = this.apiForm.value;
        this.httpService.saveAPIData({
            ...formValue,
            headers: JSON.parse(formValue.headers),
            classType: 'api',
            id: this.id,
            version: this.version

        }).subscribe((e: any) => {
            console.log(e);
            console.log('API Config:', formValue);
            this.message.success('API configuration saved successfully!');
        });
    }

    setValue(value: any) {
        let val = {
            name: value.name,
            url: value.url,
            method: value.method,
            headers: JSON.stringify(value.headers),
            payload: value.payload,
            resultModel: value.resultModel,
            readTimeout: value.readTimeout,
            socketTimeout: value.socketTimeout,
            mode: value.mode,
        }
        this.id = value.id;
        this.apiForm.setValue(val);
        //this.apiForm.controls['name'].disable(); 
    }




    sendTestRequest(): void {
        if (this.apiForm.invalid) {
            this.message.error('Please fill in all required fields correctly.');
            return;
        }
        let url = this.apiForm.value.url;
        let method = this.apiForm.value.method;
        let headers = {};
        try {
            headers = JSON.parse(this.apiForm.value.headers);
        } catch (e) {
            this.message.error('Invalid headers JSON');
            return;
        }
        let payload = this.testRequestPayload;
        let body: any = undefined;
        if (payload && (method !== 'GET' && method !== 'DELETE')) {
            try {
                body = JSON.parse(payload);
            } catch (e) {
                this.message.error('Invalid request payload JSON');
                return;
            }
        }
        this.testResponsePayload = '';
        this.httpService.testAPI({
            url,
            method,
            headers,
            body
        }).subscribe({
            next: (res: any) => {
                this.testResponsePayload = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
            },
            error: (err: any) => {
                this.testResponsePayload = typeof err === 'string' ? err : JSON.stringify(err, null, 2);
                this.message.error('API test failed');
            }
        });
    }

    onReset(): void {
        this.apiForm.reset({ method: 'GET', readTimeout: 5000, socketTimeout: 5000, mode: 'sync' });
    }

    ngOnDestroy() {
        this.actionService.removeAction('testapi');

    }
}
