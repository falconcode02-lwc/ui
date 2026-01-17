import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { WorkspaceService } from '../../../service/workspace.service';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-workspace-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './workspace-update.component.html',
})
export class WorkspaceEditComponent implements OnInit {

  form!: FormGroup;
  workspaceId!: string;

  constructor(
    private fb: FormBuilder,
    private service: WorkspaceService,
    private modalRef: NzModalRef
  ) { }

  ngOnInit(): void {
    // workspace passed while opening modal
    const workspace = this.modalRef.getConfig().nzData;

    this.workspaceId = workspace.id;

    this.form = this.fb.group({
      name: [workspace.name, Validators.required],
      icon: [workspace.icon],
      description: [workspace.description]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.service
      .updateWorkspace(this.workspaceId, this.form.value)
      .subscribe(() => {
        this.modalRef.close('updated');
      });
  }

  cancel(): void {
    this.modalRef.close();
  }
}

