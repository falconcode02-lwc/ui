import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { WorkflowService } from '../../../service/workflow.service';
import { WorkflowImportData, ValidationResult, Workflow } from '../../../model/workflow-model';

@Component({
    selector: 'app-workflow-import',
    templateUrl: './workflow-import.component.html',
    styleUrls: ['./workflow-import.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzStepsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzUploadModule,
        NzAlertModule,
        NzListModule,
        NzTagModule,
        NzIconModule,
        NzResultModule
    ]
})
export class WorkflowImportComponent implements OnInit {
    @Output() onImportComplete = new EventEmitter<Workflow>();
    @Output() onCancel = new EventEmitter<void>();

    currentStep = 0;
    metadataForm!: FormGroup;
    importedData: WorkflowImportData | null = null;
    validationResult: ValidationResult | null = null;
    fileList: NzUploadFile[] = [];
    importing = false;

    constructor(
        private fb: FormBuilder,
        private workflowService: WorkflowService,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.metadataForm = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],
            code: ['', [Validators.required]],
            controller: ['']  // Controller is optional
        });
    }

    /**
     * Handle file upload before upload
     */
    beforeUpload = (file: NzUploadFile): boolean => {
        // Check file extension
        if (!file.name.endsWith('.ffw')) {
            this.message.error('Please upload a valid .ffw file');
            return false;
        }

        // Read file content
        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const content = e.target.result;
                this.importedData = JSON.parse(content) as WorkflowImportData;

                // Pre-fill form with imported metadata
                this.metadataForm.patchValue({
                    name: this.importedData.metadata.name,
                    description: this.importedData.metadata.description,
                    code: this.importedData.metadata.code,
                    controller: this.importedData.metadata.controller
                });

                this.fileList = [file];
                this.message.success('File loaded successfully');
            } catch (error) {
                this.message.error('Invalid file format');
                console.error('Error parsing file:', error);
            }
        };
        reader.readAsText(file as any);

        return false; // Prevent auto upload
    };

    /**
     * Remove uploaded file
     */
    removeFile = (file: NzUploadFile): boolean => {
        this.fileList = [];
        this.importedData = null;
        this.metadataForm.reset();
        return true;
    };

    /**
     * Go to next step
     */
    nextStep(): void {
        if (this.currentStep === 0) {
            // Validate step 1
            if (!this.importedData) {
                this.message.error('Please upload a workflow file');
                return;
            }

            if (this.metadataForm.invalid) {
                Object.values(this.metadataForm.controls).forEach(control => {
                    control.markAsDirty();
                    control.updateValueAndValidity();
                });
                this.message.error('Please fill in all required fields');
                return;
            }

            // Update imported data with form values
            this.importedData.metadata = {
                ...this.importedData.metadata,
                name: this.metadataForm.value.name,
                description: this.metadataForm.value.description,
                code: this.metadataForm.value.code,
                controller: this.metadataForm.value.controller
            };

            // Validate workflow
            this.workflowService.validateWorkflowImport(this.importedData).subscribe({
                next: (result) => {
                    this.validationResult = result;
                    this.currentStep++;
                },
                error: () => {
                    this.message.error('Failed to validate workflow');
                }
            });
        } else if (this.currentStep === 1) {
            // Move to step 3
            this.currentStep++;
        }
    }

    /**
     * Go to previous step
     */
    previousStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
        }
    }

    /**
     * Finish import and create workflow
     */
    finishImport(): void {
        if (!this.importedData) {
            this.message.error('No workflow data to import');
            return;
        }

        this.importing = true;

        const workflow: Workflow = {
            id: 0, // New workflow
            name: this.importedData.metadata.name,
            description: this.importedData.metadata.description,
            code: this.importedData.metadata.code,
            controller: this.importedData.metadata.controller,
            version: 1, // Start with version 1 for imported workflows
            active: false, // Start as inactive
            workflowJsonRaw: JSON.stringify(this.importedData.workflowJsonRaw),
            workflowJson: JSON.stringify(this.importedData.workflowJson)
        };

        this.workflowService.create(workflow).subscribe({
            next: (createdWorkflow) => {
                this.importing = false;
                this.message.success('Workflow imported successfully');
                this.onImportComplete.emit(createdWorkflow);
                this.resetImport();
            },
            error: (error) => {
                this.importing = false;
                this.message.error('Failed to import workflow');
                console.error('Import error:', error);
            }
        });
    }

    /**
     * Cancel import
     */
    cancel(): void {
        this.resetImport();
        this.onCancel.emit();
    }

    /**
     * Reset import state
     */
    private resetImport(): void {
        this.currentStep = 0;
        this.fileList = [];
        this.importedData = null;
        this.validationResult = null;
        this.metadataForm.reset();
    }
}
