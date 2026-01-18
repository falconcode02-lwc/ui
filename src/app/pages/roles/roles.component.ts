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
import { NzMessageService } from "ng-zorro-antd/message";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzListModule } from "ng-zorro-antd/list";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { RoleService } from "./role.service";
import { Role, RolePermissions } from "./role-model";

@Component({
  selector: "app-roles",
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
    NzCheckboxModule,
    NzDividerModule,
  ],
  templateUrl: "./roles.component.html",
  styleUrl: "./roles.component.scss",
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  searchText: string = "";
  loading = false;
  isModalVisible = false;
  isEditing = false;
  currentRoleId: string | null = null;
  roleForm!: FormGroup;

  // Permissions state
  permissions: RolePermissions = {
    workspace: { view: false, edit: false },
    project: { view: false, edit: false, delete: false },
    workflow: {
      view: false,
      edit: false,
      create: false,
      transfer: false,
      delete: false,
    },
    plugin: { view: false, edit: false, deploy: false, delete: false },
  };

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.roleForm = this.fb.group({
      roleName: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(2000)]],
    });
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (data) => {
        this.roles = data.map((role) => {
          if (role.permissions && typeof role.permissions === "string") {
            try {
              role.permissions = JSON.parse(role.permissions);
            } catch (e) {
              role.permissions = this.getDefaultPermissions();
            }
          }
          return role;
        });
        this.filteredRoles = this.roles;
        this.loading = false;
      },
      error: () => {
        this.message.error("Failed to load roles");
        this.loading = false;
      },
    });
  }

  search(): void {
    const keyword = this.searchText.toLowerCase();
    this.filteredRoles = this.roles.filter(
      (r) =>
        r.roleName.toLowerCase().includes(keyword) ||
        (r.description && r.description.toLowerCase().includes(keyword)),
    );
  }

  openCreate(): void {
    this.isEditing = false;
    this.currentRoleId = null;
    this.roleForm.reset({
      roleName: "",
      description: "",
    });
    this.permissions = this.getDefaultPermissions();
    this.isModalVisible = true;
  }

  openEdit(role: Role): void {
    this.isEditing = true;
    this.currentRoleId = role.roleId || null;
    this.roleForm.patchValue({
      roleName: role.roleName,
      description: role.description,
    });

    // Load permissions
    if (role.permissions && typeof role.permissions === "object") {
      this.permissions = {
        ...this.getDefaultPermissions(),
        ...role.permissions,
      };
    } else {
      this.permissions = this.getDefaultPermissions();
    }

    this.isModalVisible = true;
  }

  handleOk(): void {
    if (this.roleForm.invalid) {
      Object.values(this.roleForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const payload: Role = {
      ...this.roleForm.value,
      permissions: JSON.stringify(this.permissions),
    };

    if (this.isEditing && this.currentRoleId) {
      this.roleService.update(this.currentRoleId, payload).subscribe({
        next: () => {
          this.message.success("Role updated successfully");
          this.isModalVisible = false;
          this.loadRoles();
        },
        error: () => this.message.error("Failed to update role"),
      });
    } else {
      this.roleService.create(payload).subscribe({
        next: () => {
          this.message.success("Role created successfully");
          this.isModalVisible = false;
          this.loadRoles();
        },
        error: () => this.message.error("Failed to create role"),
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  deleteRole(role: Role): void {
    if (role.roleId) {
      this.roleService.delete(role.roleId).subscribe({
        next: () => {
          this.message.success("Role deleted successfully");
          this.loadRoles();
        },
        error: () => this.message.error("Failed to delete role"),
      });
    }
  }

  getDefaultPermissions(): RolePermissions {
    return {
      workspace: { view: false, edit: false },
      project: { view: false, edit: false, delete: false },
      workflow: {
        view: false,
        edit: false,
        create: false,
        transfer: false,
        delete: false,
      },
      plugin: { view: false, edit: false, deploy: false, delete: false },
    };
  }

  getPermissionsSummary(role: Role): string {
    if (!role.permissions || typeof role.permissions === "string") {
      return "No permissions set";
    }

    const perms = role.permissions as RolePermissions;
    const counts: string[] = [];

    if (perms.workspace) {
      const wsCount = Object.values(perms.workspace).filter((v) => v).length;
      if (wsCount > 0) counts.push(`Workspace: ${wsCount}`);
    }
    if (perms.project) {
      const prCount = Object.values(perms.project).filter((v) => v).length;
      if (prCount > 0) counts.push(`Project: ${prCount}`);
    }
    if (perms.workflow) {
      const wfCount = Object.values(perms.workflow).filter((v) => v).length;
      if (wfCount > 0) counts.push(`Workflow: ${wfCount}`);
    }
    if (perms.plugin) {
      const plCount = Object.values(perms.plugin).filter((v) => v).length;
      if (plCount > 0) counts.push(`Plugin: ${plCount}`);
    }

    return counts.length > 0 ? counts.join(", ") : "No permissions set";
  }

  // Select All functionality
  selectAllPermissions(): void {
    this.permissions = {
      workspace: { view: true, edit: true },
      project: { view: true, edit: true, delete: true },
      workflow: {
        view: true,
        edit: true,
        create: true,
        transfer: true,
        delete: true,
      },
      plugin: { view: true, edit: true, deploy: true, delete: true },
    };
  }

  clearAllPermissions(): void {
    this.permissions = this.getDefaultPermissions();
  }

  selectAllWorkspace(): void {
    this.permissions.workspace = { view: true, edit: true };
  }

  selectAllProject(): void {
    this.permissions.project = { view: true, edit: true, delete: true };
  }

  selectAllWorkflow(): void {
    this.permissions.workflow = {
      view: true,
      edit: true,
      create: true,
      transfer: true,
      delete: true,
    };
  }

  selectAllPlugin(): void {
    this.permissions.plugin = {
      view: true,
      edit: true,
      deploy: true,
      delete: true,
    };
  }

  isAllWorkspaceSelected(): boolean {
    return (
      this.permissions.workspace?.view === true &&
      this.permissions.workspace?.edit === true
    );
  }

  isAllProjectSelected(): boolean {
    return (
      this.permissions.project?.view === true &&
      this.permissions.project?.edit === true &&
      this.permissions.project?.delete === true
    );
  }

  isAllWorkflowSelected(): boolean {
    return (
      this.permissions.workflow?.view === true &&
      this.permissions.workflow?.edit === true &&
      this.permissions.workflow?.create === true &&
      this.permissions.workflow?.transfer === true &&
      this.permissions.workflow?.delete === true
    );
  }

  isAllPluginSelected(): boolean {
    return (
      this.permissions.plugin?.view === true &&
      this.permissions.plugin?.edit === true &&
      this.permissions.plugin?.deploy === true &&
      this.permissions.plugin?.delete === true
    );
  }

  toggleAllWorkspace(): void {
    const allSelected = this.isAllWorkspaceSelected();
    this.permissions.workspace = { view: !allSelected, edit: !allSelected };
  }

  toggleAllProject(): void {
    const allSelected = this.isAllProjectSelected();
    this.permissions.project = {
      view: !allSelected,
      edit: !allSelected,
      delete: !allSelected,
    };
  }

  toggleAllWorkflow(): void {
    const allSelected = this.isAllWorkflowSelected();
    this.permissions.workflow = {
      view: !allSelected,
      edit: !allSelected,
      create: !allSelected,
      transfer: !allSelected,
      delete: !allSelected,
    };
  }

  toggleAllPlugin(): void {
    const allSelected = this.isAllPluginSelected();
    this.permissions.plugin = {
      view: !allSelected,
      edit: !allSelected,
      deploy: !allSelected,
      delete: !allSelected,
    };
  }
}
