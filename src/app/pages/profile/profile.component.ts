import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
    selector: 'app-profile',
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
        NzSpaceModule
    ],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    profileForm!: FormGroup;
    accountForm!: FormGroup;
    passwordForm!: FormGroup;
    notificationForm!: FormGroup;

    avatarUrl: string = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
    loading = false;
    selectedSection: string = 'personal';
    selectedMenuKeys: string[] = ['personal'];

    constructor(
        private fb: FormBuilder,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.initializeForms();
    }

    initializeForms(): void {
        // Profile Information Form
        this.profileForm = this.fb.group({
            firstName: ['John', [Validators.required]],
            lastName: ['Doe', [Validators.required]],
            email: ['john.doe@example.com', [Validators.required, Validators.email]],
            phone: ['+1 234 567 8900'],
            bio: ['Software Developer passionate about creating amazing applications.'],
            location: ['San Francisco, CA'],
            website: ['https://johndoe.dev']
        });

        // Account Settings Form
        this.accountForm = this.fb.group({
            username: ['johndoe', [Validators.required]],
            language: ['English'],
            timezone: ['UTC-8 (Pacific Time)'],
            dateFormat: ['MM/DD/YYYY']
        });

        // Password Change Form
        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        });

        // Notification Preferences Form
        this.notificationForm = this.fb.group({
            emailNotifications: [true],
            workflowUpdates: [true],
            systemAlerts: [true],
            weeklyDigest: [false],
            marketingEmails: [false]
        });
    }

    // Sidebar Navigation
    selectSection(section: string): void {
        this.selectedSection = section;
        this.selectedMenuKeys = [section];
    }

    // Profile Form Methods
    saveProfile(): void {
        if (this.profileForm.valid) {
            this.loading = true;
            // Simulate API call
            setTimeout(() => {
                this.loading = false;
                this.message.success('Profile updated successfully!');
            }, 1000);
        } else {
            Object.values(this.profileForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }

    // Account Settings Methods
    saveAccountSettings(): void {
        if (this.accountForm.valid) {
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
                this.message.success('Account settings updated successfully!');
            }, 1000);
        }
    }

    // Password Change Methods
    changePassword(): void {
        if (this.passwordForm.valid) {
            const { newPassword, confirmPassword } = this.passwordForm.value;

            if (newPassword !== confirmPassword) {
                this.message.error('Passwords do not match!');
                return;
            }

            this.loading = true;
            setTimeout(() => {
                this.loading = false;
                this.message.success('Password changed successfully!');
                this.passwordForm.reset();
            }, 1000);
        } else {
            Object.values(this.passwordForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }

    // Notification Preferences Methods
    saveNotificationPreferences(): void {
        this.loading = true;
        setTimeout(() => {
            this.loading = false;
            this.message.success('Notification preferences updated successfully!');
        }, 1000);
    }

    // Avatar Upload Methods
    beforeUpload = (file: any): boolean => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            this.message.error('You can only upload JPG/PNG file!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            this.message.error('Image must be smaller than 2MB!');
            return false;
        }

        // Convert to base64 and update avatar
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.avatarUrl = reader.result as string;
            this.message.success('Avatar updated successfully!');
        };

        return false; // Prevent auto upload
    };
}
