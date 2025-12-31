import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ProjectService } from './project-service';
import { Project } from './project-model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzSpaceModule,
    NzIconModule,
    NzCardModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
  ],
  templateUrl: './project-component.html',
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  isModalVisible = false;
  isEditing = false;
  currentId: string | null = null;
  projectForm!: FormGroup;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      icon: [''],
      description: [''],
      accessibility: ['PUBLIC', Validators.required],
    });
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (list) => {
        this.projects = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Failed to load projects');
      },
    });
  }

  openCreate(): void {
    this.isEditing = false;
    this.currentId = null;
    this.projectForm.reset({
      code: '',
      name: '',
      icon: '',
      description: '',
      accessibility: 'PUBLIC',
    });
    this.isModalVisible = true;
  }

  openEdit(p: Project): void {
    this.isEditing = true;
    this.currentId = p.id || null;
    this.projectForm.patchValue({
      code: p.code,
      name: p.name,
      icon: p.icon || '',
      description: p.description || '',
      accessibility: p.accessibility || 'PUBLIC',
    });
    this.isModalVisible = true;
  }

  handleOk(): void {
    if (this.projectForm.invalid) {
      Object.values(this.projectForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const payload: Project = this.projectForm.value;

    if (this.isEditing && this.currentId) {
      this.projectService.update(this.currentId, payload).subscribe({
        next: () => {
          alert('✅ Project updated');
          this.isModalVisible = false;
          this.loadProjects();
        },
        error: () => alert('❌ Update failed'),
      });
    } else {
      this.projectService.create(payload).subscribe({
        next: () => {
          alert('✅ Project created');
          this.isModalVisible = false;
          this.loadProjects();
        },
        error: () => alert('❌ Create failed'),
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  deleteProject(p: Project): void {
    if (!p.id || !confirm('Delete this project?')) return;
    this.projectService.delete(p.id).subscribe({
      next: () => {
        alert('✅ Deleted');
        this.loadProjects();
      },
      error: () => alert('❌ Delete failed'),
    });
  }

  startWorkflow(p: Project): void {
    if (!p.id) return;
    this.projectService.startWorkflow(p.id).subscribe({
      next: () => alert('✅ Workflow started'),
      error: () => alert('❌ Start failed'),
    });
  }
}
