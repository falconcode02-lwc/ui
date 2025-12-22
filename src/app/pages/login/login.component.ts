import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

// Ng-Zorro (Ant Design) modules used by the login form
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzSpaceModule } from 'ng-zorro-antd/space';
@Component({
  selector: 'app-login',
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
    NzSpaceModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  /** Banner image for the right-hand side. Can be passed from route or parent. */
  @Input() bannerImage = 'assets/bg.png';

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Allow passing a banner image via route data or keep the default.
  const dataImage = this.route.snapshot.data && (this.route.snapshot.data as any)['bannerImage'];
    if (dataImage) {
      this.bannerImage = dataImage;
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // Handle login logic here
      console.log('Login data:', this.loginForm.value);
      // Simulate successful login and navigate to dashboard (inside app shell)
      this.router.navigateByUrl('/dashboard');
    }
  }
}
