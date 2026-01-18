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
import { UserService } from "./user.service";
import { User } from "./user-model";

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
  ],
  templateUrl: "./users.component.html",
  styleUrl: "./users.component.scss",
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchText: string = "";
  loading = false;
  isModalVisible = false;
  isEditing = false;
  currentUserId: string | null = null;
  userForm!: FormGroup;

  constructor(
    private userService: UserService,
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
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: () => {
        this.message.error("Failed to load users");
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
    });
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
    });
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

    const payload: User = this.userForm.value;
    if (this.isEditing && this.currentUserId) {
      this.userService.update(this.currentUserId, payload).subscribe({
        next: () => {
          this.message.success("User updated successfully");
          this.isModalVisible = false;
          this.loadUsers();
        },
        error: () => this.message.error("Failed to update user"),
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.message.success("User created successfully");
          this.isModalVisible = false;
          this.loadUsers();
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
          this.loadUsers();
        },
        error: () => this.message.error("Failed to delete user"),
      });
    }
  }
}
