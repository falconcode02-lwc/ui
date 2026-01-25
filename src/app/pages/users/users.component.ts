import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from "@angular/forms";
import { forkJoin } from "rxjs";
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
import { NzMessageService } from "ng-zorro-antd/message";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzListModule } from "ng-zorro-antd/list";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzTransferModule, TransferItem } from "ng-zorro-antd/transfer";
import { UserService } from "./user.service";
import { User } from "./user-model";
import { RoleService } from "../roles/role.service";
import { Role } from "../roles/role-model";
import { WorkspaceService } from "../../service/workspace.service";
import { ProjectService } from "../projects/project-service";
import { Workspace } from "../../model/workspace-model";
import { Project } from "../projects/project-model";

@Component({
  selector: "app-users",
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
    NzPopconfirmModule,
    NzToolTipModule,
    NzDropDownModule,
    NzListModule,
    NzEmptyModule,
    NzTransferModule,
    NzDividerModule,
  ],
  templateUrl: "./users.component.html",
  styleUrl: "./users.component.scss",
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  allWorkspaces: Workspace[] = [];
  allProjects: Project[] = [];
  workspaceTransferData: TransferItem[] = [];
  projectTransferData: TransferItem[] = [];
  filteredProjectTransferData: TransferItem[] = [];
  searchText: string = "";
  loading = false;
  isModalVisible = false;
  isEditing = false;
  currentUserId: string | null = null;
  userForm!: FormGroup;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private workspaceService: WorkspaceService,
    private projectService: ProjectService,
    private fb: FormBuilder,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      username: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      fullName: ["", [Validators.required]],
      status: ["ACTIVE", [Validators.required]],
      password: ["", [Validators.minLength(6)]],
      roleId: [null, [Validators.required]],
      workspaceIds: [[]],
      projectIds: [[]],
    });
    this.refreshData();
  }

  refreshData(): void {
    this.loading = true;
    forkJoin({
      users: this.userService.getAll(),
      roles: this.roleService.getAll(),
      workspaces: this.workspaceService.getWorkspaces(0, 1000), // Get all workspaces
      projects: this.projectService.getListAll(),
    }).subscribe({
      next: ({ users, roles, workspaces, projects }) => {
        this.roles = roles;
        this.allWorkspaces = workspaces.content;
        this.allProjects = projects;
        this.users = users.map((user) => ({
          ...user,
          roleName: this.roles.find((r) => r.roleId === user.roleId)?.roleName,
        }));
        this.filteredUsers = [...this.users];
        this.prepareTransferData();
        this.loading = false;
      },
      error: () => {
        this.message.error("Failed to load user data");
        this.loading = false;
      },
    });
  }

  search(): void {
    const keyword = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(
      (u) =>
        u.username.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        u.fullName.toLowerCase().includes(keyword),
    );
  }

  openCreate(): void {
    this.isEditing = false;
    this.currentUserId = null;
    this.userForm.reset({
      username: "",
      email: "",
      fullName: "",
      status: "ACTIVE",
      password: "",
      roleId: null,
      workspaceIds: [],
      projectIds: [],
    });
    this.resetTransferData();
    this.filterProjectsByWorkspace();
    // Make password required for new users
    this.userForm
      .get("password")
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get("password")?.updateValueAndValidity();
    this.isModalVisible = true;
  }

  openEdit(user: User): void {
    this.isEditing = true;
    this.currentUserId = user.userId || null;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      password: "",
      roleId: user.roleId,
      workspaceIds: user.workspaceIds || [],
      projectIds: user.projectIds || [],
    });
    this.updateTransferDataFromUser(user);
    this.filterProjectsByWorkspace();
    // Make password optional for editing (only set if user wants to change it)
    this.userForm.get("password")?.setValidators([Validators.minLength(6)]);
    this.userForm.get("password")?.updateValueAndValidity();
    this.isModalVisible = true;
  }

  handleOk(): void {
    if (this.userForm.invalid) {
      Object.values(this.userForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    // Sync transfer data to form before submission
    this.syncFormWithTransfer();

    const payload: User = this.userForm.value;
    if (this.isEditing && this.currentUserId) {
      this.userService.update(this.currentUserId, payload).subscribe({
        next: () => {
          this.message.success("User updated successfully");
          this.isModalVisible = false;
          this.refreshData();
        },
        error: () => this.message.error("Failed to update user"),
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.message.success("User created successfully");
          this.isModalVisible = false;
          this.refreshData();
        },
        error: () => this.message.error("Failed to create user"),
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  deleteUser(user: User): void {
    if (user.userId) {
      this.userService.delete(user.userId).subscribe({
        next: () => {
          this.message.success("User deleted successfully");
          this.refreshData();
        },
        error: () => this.message.error("Failed to delete user"),
      });
    }
  }

  // --- Transfer Component Helpers ---

  private prepareTransferData(): void {
    this.workspaceTransferData = this.allWorkspaces.map((ws) => ({
      key: ws.id!,
      title: ws.name,
      description: ws.description,
      direction: "left",
    }));

    this.projectTransferData = this.allProjects.map((p) => ({
      key: p.id!,
      title: p.name,
      description: p.workspaceCode,
      direction: "left",
    }));

    this.filterProjectsByWorkspace();
  }

  private resetTransferData(): void {
    this.workspaceTransferData.forEach((i) => (i.direction = "left"));
    this.projectTransferData.forEach((i) => (i.direction = "left"));
  }

  private updateTransferDataFromUser(user: User): void {
    const wsIds = user.workspaceIds || [];
    const pIds = user.projectIds || [];

    this.workspaceTransferData.forEach((i) => {
      i.direction = wsIds.includes(i["key"]) ? "right" : "left";
    });

    this.projectTransferData.forEach((i) => {
      i.direction = pIds.includes(i["key"]) ? "right" : "left";
    });
  }

  private syncFormWithTransfer(): void {
    const wsIds = this.workspaceTransferData
      .filter((i) => i.direction === "right")
      .map((i) => i["key"]);

    const pIds = this.projectTransferData
      .filter((i) => i.direction === "right")
      .map((i) => i["key"]);

    this.userForm.patchValue({
      workspaceIds: wsIds,
      projectIds: pIds,
    });
  }

  handleTransferChange(ret: any, type: "workspace" | "project"): void {
    if (type === "workspace") {
      this.filterProjectsByWorkspace();
    }
  }

  private filterProjectsByWorkspace(): void {
    // Get selected workspace codes
    const selectedWorkspaceIds = this.workspaceTransferData
      .filter((i) => i.direction === "right")
      .map((i) => i["key"]);

    const selectedWorkspaceCodes = this.allWorkspaces
      .filter((ws) => selectedWorkspaceIds.includes(ws.id))
      .map((ws) => ws.code);

    // If a workspace is unselected, we should also move its projects back to 'left'
    this.projectTransferData.forEach((pItem) => {
      const project = this.allProjects.find((p) => p.id === pItem["key"]);
      if (project && !selectedWorkspaceCodes.includes(project.workspaceCode)) {
        pItem.direction = "left";
      }
    });

    // Update the filtered list shown in the transfer component
    this.filteredProjectTransferData = this.projectTransferData.filter(
      (pItem) => {
        const project = this.allProjects.find((p) => p.id === pItem["key"]);
        return (
          project && selectedWorkspaceCodes.includes(project.workspaceCode)
        );
      },
    );
  }
}
