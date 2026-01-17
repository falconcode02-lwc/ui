import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from "@angular/forms";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzSpaceModule } from "ng-zorro-antd/space";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzTagModule } from "ng-zorro-antd/tag";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzPageHeaderModule } from "ng-zorro-antd/page-header";
import { NzListModule } from "ng-zorro-antd/list";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { NzMessageService } from "ng-zorro-antd/message";
import { ProjectService } from "./project-service";
import { Project } from "./project-model";
import { ContextService } from "../../service/context.service";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    NzPageHeaderModule,
    NzListModule,
    NzEmptyModule,
    NzDropDownModule,
    NzPopconfirmModule,
  ],
  templateUrl: "./project-component.html",
  styleUrl: "./project-component.scss",
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchText: string = "";
  loading = false;
  isModalVisible = false;
  isEditing = false;
  currentId: string | null = null;
  projectForm!: FormGroup;
  private workspaceSub?: Subscription;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private contextService: ContextService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      code: ["", Validators.required],
      name: ["", Validators.required],
      icon: [""],
      description: [""],
      accessibility: ["PUBLIC", Validators.required],
    });

    // Subscribe to global workspace changes
    this.workspaceSub = this.contextService.workspace$.subscribe(() => {
      this.loadProjects();
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (list) => {
        this.projects = list;
        this.filteredProjects = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message.error("Failed to load projects");
      },
    });
  }

  search(): void {
    const keyword = this.searchText.toLowerCase();
    this.filteredProjects = this.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.code.toLowerCase().includes(keyword) ||
        (p.description && p.description.toLowerCase().includes(keyword)),
    );
  }

  openCreate(): void {
    this.isEditing = false;
    this.currentId = null;
    this.projectForm.reset({
      code: "",
      name: "",
      icon: "",
      description: "",
      accessibility: "PUBLIC",
    });
    this.isModalVisible = true;
  }

  openEdit(p: Project): void {
    this.isEditing = true;
    this.currentId = p.id || null;
    this.projectForm.patchValue({
      code: p.code,
      name: p.name,
      icon: p.icon || "",
      description: p.description || "",
      accessibility: p.accessibility || "PUBLIC",
    });
    this.isModalVisible = true;
  }

  handleOk(): void {
    if (this.projectForm.invalid) {
      Object.values(this.projectForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const payload: Project = this.projectForm.value;

    if (this.isEditing && this.currentId) {
      this.projectService.update(this.currentId, payload).subscribe({
        next: () => {
          this.message.success("Project updated successfully");
          this.isModalVisible = false;
          this.loadProjects();
        },
        error: () => this.message.error("Failed to update project"),
      });
    } else {
      this.projectService.create(payload).subscribe({
        next: () => {
          this.message.success("Project created successfully");
          this.isModalVisible = false;
          this.loadProjects();
        },
        error: () => this.message.error("Failed to create project"),
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  deleteProject(p: Project): void {
    if (!p.id) return;
    this.projectService.delete(p.id).subscribe({
      next: () => {
        this.message.success("Project deleted successfully");
        this.loadProjects();
      },
      error: () => this.message.error("Failed to delete project"),
    });
  }

  startWorkflow(p: Project): void {
    if (!p.id) return;
    this.projectService.startWorkflow(p.id).subscribe({
      next: () => this.message.success("Workflow started successfully"),
      error: () => this.message.error("Failed to start workflow"),
    });
  }

  /**
   * Navigate to workflows with this project selected
   */
  navigateToWorkflows(project: Project): void {
    // Set project in global context
    this.contextService.setProject(project.code);

    // Navigate to workflows with query params
    this.router.navigate(["/workflow"], {
      queryParams: {
        workspace: this.contextService.getWorkspace(),
        project: project.code,
      },
    });
  }

  ngOnDestroy(): void {
    if (this.workspaceSub) {
      this.workspaceSub.unsubscribe();
    }
  }
}
