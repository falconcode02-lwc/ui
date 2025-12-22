import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core'; 
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormBuilder, FormGroup, FormArray, Validators,FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { BrowserModule } from '@angular/platform-browser';

@Component({
    standalone: true,
    imports: [NzFormModule, CommonModule, FormsModule, ReactiveFormsModule, NzInputModule,
    NzButtonModule],
    selector: 'const-editor',
    templateUrl: 'constant.component.html'
})

export class ConstantEditorComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      constantName: ['', Validators.required],
      pairs: this.fb.array([this.createPair()])
    });
  }

get pairs(): FormArray {
  return this.form.get('pairs') as FormArray;
}

  createPair(): FormGroup {
    return this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  addPair(): void {
    this.pairs.push(this.createPair());
  }

  removePair(index: number): void {
    this.pairs.removeAt(index);
  }

  // Optional: submit handler
  save(): void {
    console.log('Form data:', this.form.value);
  }
}