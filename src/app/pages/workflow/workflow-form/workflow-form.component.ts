import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-workflow-form',
  templateUrl: './workflow-form.component.html',
  imports: [
    NzFormModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NzInputModule,
    NzButtonModule,
    NzSwitchModule,

    NzSelectModule,
  ],
})
export class WorkflowFormComponent implements OnInit, AfterViewInit {
  workflowForm!: FormGroup;
  @Input() controllers: any = [];
  @Input() workflowFormData: any;
  @Input() setReadOnly: boolean = false;
  @Output() formUpdated = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.workflowForm = this.fb.group({
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      controller: [''],
      workflow_json: [''],
    });
    if (this.setReadOnly) {
      this.workflowForm.disable();
    }
  }

  ngAfterViewInit() {
    if (this.workflowFormData?.id && this.workflowFormData?.id > 0) {
      this.workflowForm.reset({
        code: this.workflowFormData?.code,
        name: this.workflowFormData?.name,
        description: this.workflowFormData?.description,
        controller: this.workflowFormData?.controller,
      });
      this.workflowForm.get('code')?.disable();
    }
  }

  onSubmit(): void {
    if (this.workflowForm.valid) {
      const formValue = this.workflowForm.getRawValue();
      console.log('✅ Submitted:', formValue);
      // TODO: Call backend API here
      this.formUpdated.emit(formValue);
    }
  }
  setFormValue(val: any): void {
    this.workflowForm.reset(val);
  }

  onReset(): void {
    this.workflowForm.reset({
      code: '',
      name: '',
      description: '',
      controller: '',
      workflow_json: {},
    });
  }
}
