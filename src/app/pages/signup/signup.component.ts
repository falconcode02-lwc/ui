import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";

import { UserService } from "../users/user.service";
import { User } from "../users/user-model";

@Component({
  selector: "app-signup",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzCheckboxModule,
  ],
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.scss"],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading = false;
  errorMessage: string = "";
  successMessage: string = "";

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      fullName: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      Object.values(this.signupForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const { password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.successMessage = "";

    const userData: User = {
      username: this.signupForm.value.username,
      email: this.signupForm.value.email,
      fullName: this.signupForm.value.fullName,
      password: this.signupForm.value.password,
      status: "ACTIVE",
    };

    this.userService.create(userData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage =
          "Account created successfully! Redirecting to login...";
        this.message.success("Account created successfully!");
        setTimeout(() => {
          this.router.navigate(["/login"]);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || "Failed to create account. Please try again.";
        this.message.error("Failed to create account");
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(["/login"]);
  }
}
