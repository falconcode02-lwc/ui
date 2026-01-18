import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzUploadModule } from "ng-zorro-antd/upload";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzGridModule } from "ng-zorro-antd/grid";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzSpaceModule } from "ng-zorro-antd/space";
import { NzSelectModule } from "ng-zorro-antd/select";

import { AuthService } from "../../service/auth.service";
import { UserService } from "../users/user.service";
import { User } from "../users/user-model";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzAvatarModule,
    NzUploadModule,
    NzIconModule,
    NzMenuModule,
    NzSwitchModule,
    NzGridModule,
    NzDividerModule,
    NzSpaceModule,
    NzSelectModule,
  ],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  accountForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationForm!: FormGroup;

  currentUser: any = null;
  userId: string | null = null;
  avatarUrl: string = "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
  loading = false;
  selectedSection: string = "personal";
  selectedMenuKeys: string[] = ["personal"];

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || !this.currentUser.userId) {
      this.message.error("Please login to view your profile");
      this.router.navigate(["/login"]);
      return;
    }

    this.userId = this.currentUser.userId;
    this.initializeForms();
    this.loadUserData();
  }

  initializeForms(): void {
    // Profile Information Form
    this.profileForm = this.fb.group({
      fullName: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      username: ["", [Validators.required]],
    });

    // Account Settings Form
    this.accountForm = this.fb.group({
      status: ["ACTIVE"],
    });

    // Password Change Form
    this.passwordForm = this.fb.group({
      currentPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    });

    // Notification Preferences Form
    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      workflowUpdates: [true],
      systemAlerts: [true],
      weeklyDigest: [false],
      marketingEmails: [false],
    });
  }

  loadUserData(): void {
    if (!this.userId) return;

    this.loading = true;
    this.userService.getById(this.userId).subscribe({
      next: (user: User) => {
        this.loading = false;
        // Populate profile form
        this.profileForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          username: user.username,
        });

        // Populate account form
        this.accountForm.patchValue({
          status: user.status,
        });

        // Update avatar with username seed
        this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
      },
      error: () => {
        this.loading = false;
        this.message.error("Failed to load user data");
      },
    });
  }

  // Sidebar Navigation
  selectSection(section: string): void {
    this.selectedSection = section;
    this.selectedMenuKeys = [section];
  }

  // Profile Form Methods
  saveProfile(): void {
    if (this.profileForm.invalid) {
      Object.values(this.profileForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    if (!this.userId) {
      this.message.error("User ID not found");
      return;
    }

    this.loading = true;
    const userData: User = {
      ...this.profileForm.value,
      status: this.accountForm.value.status,
    };

    this.userService.update(this.userId, userData).subscribe({
      next: () => {
        this.loading = false;
        this.message.success("Profile updated successfully!");
        // Update current user in auth service
        const updatedUser = {
          ...this.currentUser,
          ...this.profileForm.value,
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      },
      error: () => {
        this.loading = false;
        this.message.error("Failed to update profile");
      },
    });
  }

  // Account Settings Methods
  saveAccountSettings(): void {
    if (this.accountForm.invalid) {
      return;
    }

    if (!this.userId) {
      this.message.error("User ID not found");
      return;
    }

    this.loading = true;
    const userData: User = {
      ...this.profileForm.value,
      status: this.accountForm.value.status,
    };

    this.userService.update(this.userId, userData).subscribe({
      next: () => {
        this.loading = false;
        this.message.success("Account settings updated successfully!");
      },
      error: () => {
        this.loading = false;
        this.message.error("Failed to update account settings");
      },
    });
  }

  // Password Change Methods
  changePassword(): void {
    if (this.passwordForm.invalid) {
      Object.values(this.passwordForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.message.error("Passwords do not match!");
      return;
    }

    if (!this.userId) {
      this.message.error("User ID not found");
      return;
    }

    this.loading = true;
    const userData: User = {
      ...this.profileForm.value,
      password: newPassword,
      status: this.accountForm.value.status,
    };

    this.userService.update(this.userId, userData).subscribe({
      next: () => {
        this.loading = false;
        this.message.success("Password changed successfully!");
        this.passwordForm.reset();
      },
      error: () => {
        this.loading = false;
        this.message.error("Failed to change password");
      },
    });
  }

  // Notification Preferences Methods
  saveNotificationPreferences(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.message.success("Notification preferences updated successfully!");
    }, 1000);
  }

  // Avatar Upload Methods
  beforeUpload = (file: any): boolean => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      this.message.error("You can only upload JPG/PNG file!");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.message.error("Image must be smaller than 2MB!");
      return false;
    }

    // Convert to base64 and update avatar
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.avatarUrl = reader.result as string;
      this.message.success("Avatar updated successfully!");
    };

    return false; // Prevent auto upload
  };

  // Logout Method
  logout(): void {
    this.authService.logout();
    this.message.success("Logged out successfully!");
    this.router.navigate(["/login"]);
  }
}
