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
  selector: 'app-workspace-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
  ],
  templateUrl: './workspace-create.component.html',
})
export class WorkspaceCreateComponent implements OnInit {

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: WorkspaceService,
    private modalRef: NzModalRef
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      orgId: ['ORG-12345'],
      code: ['', [Validators.required, Validators.pattern(/\S+/)]],
      name: ['', [Validators.required, Validators.pattern(/\S+/)]],
      description: ['', Validators.pattern(/\S+/)],
      icon: ['', Validators.pattern(/\S+/)],
      type: ['',[Validators.required, Validators.pattern(/\S+/)]]
    });
  }

  // submit(): void {
  //   if (this.form.invalid) return;

  //   this.service.createWorkspace(this.form.value).subscribe({
  //     next: () => {
  //       console.log('Workspace created');
  //       this.form.reset();
  //     }
  //   });
  // }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // 🔑 force errors to show
      return;
    }

    this.service.createWorkspace(this.form.value).subscribe({
      next: () => {
        this.modalRef.close('created');
      },
      error: (err) => {
        console.error('Create failed', err);
      }
    });
  }


  cancel(): void {
    this.modalRef.close();
  }
}
