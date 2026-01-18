import { Component, Input, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";

// Ng-Zorro (Ant Design) modules used by the login form
import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzGridModule } from "ng-zorro-antd/grid";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzSpaceModule } from "ng-zorro-antd/space";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzMessageService } from "ng-zorro-antd/message";

import { AuthService } from "../../service/auth.service";
import { LoginRequest } from "../../model/auth.model";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule,
    NzLayoutModule,
    NzIconModule,
    NzSpaceModule,
    NzAlertModule,
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  navigateToSignup() {
    this.router.navigate(["/signup"]);
  }
  loginForm: FormGroup;
  loading = false;
  errorMessage: string = "";
  remainingAttempts: number | null = null;
  accountLocked = false;

  /** Banner image for the right-hand side. Can be passed from route or parent. */
  @Input() bannerImage = "assets/bg.png";

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private message: NzMessageService,
  ) {
    this.loginForm = this.fb.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl("/dashboard");
      return;
    }

    // Allow passing a banner image via route data or keep the default.
    const dataImage =
      this.route.snapshot.data &&
      (this.route.snapshot.data as any)["bannerImage"];
    if (dataImage) {
      this.bannerImage = dataImage;
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.remainingAttempts = null;
    this.accountLocked = false;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.message.success("Login successful!");
          this.router.navigateByUrl("/dashboard");
        } else {
          this.handleLoginError(response);
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.error && error.error.message) {
          this.handleLoginError(error.error);
        } else {
          this.errorMessage =
            "An error occurred during login. Please try again.";
        }
      },
    });
  }

  private handleLoginError(response: any) {
    this.errorMessage = response.message || "Login failed";
    this.accountLocked = response.accountLocked || false;

    if (
      response.remainingAttempts !== undefined &&
      response.remainingAttempts !== null
    ) {
      this.remainingAttempts = response.remainingAttempts;

      if (this.remainingAttempts !== null && this.remainingAttempts > 0) {
        this.errorMessage += ` (${this.remainingAttempts} attempt${this.remainingAttempts !== 1 ? "s" : ""} remaining)`;
      }
    }
  }

  getAlertType(): "success" | "info" | "warning" | "error" {
    if (this.accountLocked) {
      return "error";
    }
    if (this.remainingAttempts !== null && this.remainingAttempts <= 1) {
      return "warning";
    }
    return "error";
  }
}
