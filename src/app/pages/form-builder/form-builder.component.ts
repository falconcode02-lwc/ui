import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { v4 as uuidv4 } from 'uuid';
import { FormViewerComponent } from '../form-viewer/form-viewer.component';
import { KeyValueBuilderComponent, KeyValuePair } from './key-value-builder.component';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FormService } from '../../service/form.service';
import { Form } from '../../model/form-model';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

interface DropdownOption {
  key: string;
  value: string;
}

interface VisibilityCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';
  value?: string;
  type?: 'simple' | 'code';
  code?: string;
}

interface EnableCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';
  value?: string;
  type?: 'simple' | 'code';
  code?: string;
}

interface ApiBinding {
  url: string;
  method: 'GET' | 'POST';
  keyProperty: string; // Path to key in response (e.g., 'data.id' or 'id')
  valueProperty: string; // Path to value in response (e.g., 'data.name' or 'name')
  bodyData?: any; // For POST requests
  headers?: { key: string; value: string }[]; // Custom headers
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  requiredEither?: string[]; // Array of field IDs - at least one field in this group must be filled
  options?: string[] | DropdownOption[];
  icon: string;
  info?: string; // Info text to display as tooltip next to label
  secondaryText?: string; // Secondary descriptive text below the label
  defaultValue?: any;
  defaultVisible?: boolean;
  defaultEnabled?: boolean;
  multiple?: boolean; // For select dropdown - allow multiple selection
  language?: string; // For code editor
  apiBinding?: ApiBinding; // For dynamic dropdown options from server
  visibilityCondition?: VisibilityCondition;
  enableCondition?: EnableCondition;
  layout?: 'vertical' | 'horizontal'; // Layout for radio and checkbox groups
  min?: number; // Minimum value for number input
  max?: number; // Maximum value for number input
  step?: number; // Step increment for number input (e.g., 0.01 for decimals)
  keyValuePairs?: KeyValuePair[]; // For keyvalue field type
  valueControlType?: 'text' | 'select' | 'codeeditor' | 'checkbox'; // For keyvalue field - type of value control
  valueBinding?: { type: 'code', code: string };
  optionsSource?: 'static' | 'api' | 'code';
  optionsCode?: string; // For JS-based options
  checkedText?: string; // For switch - text when checked
  uncheckedText?: string; // For switch - text when unchecked
  checkedValue?: any; // Value when checked
  uncheckedValue?: any; // Value when unchecked
  // File upload specific properties
  maxFileSize?: number; // In MB
  maxFileCount?: number;
  allowedExtensions?: string[]; // e.g. ['.jpg', '.png', '.pdf']
  showPreview?: boolean;
  uploadUrl?: string; // API endpoint for file upload
  uploadHeaders?: { key: string; value: string }[]; // Custom headers for upload
  customJs?: string; // Custom JS code for button action
  hideLabel?: boolean; // Hide label for button
}

interface FormConfig {
  title?: string;
  description?: string;
  height?: string;
  width?: string;
  submitUrl?: string;
  successMessage?: string;
  errorMessage?: string;
  submitButtonLabel?: string;
  resetButtonLabel?: string;
  showResetButton?: boolean;
  showSubmitButton?: boolean;
  onInit?: string; // JavaScript code to execute when form loads
  onDestroy?: string; // JavaScript code to execute before form is destroyed
}

interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzCardModule,
    NzDividerModule,
    NzCheckboxModule,
    NzRadioModule,
    NzDrawerModule,
    NzFormModule,
    NzToolTipModule,
    NzUploadModule,
    NzDatePickerModule,
    FormViewerComponent,
    KeyValueBuilderComponent,
    NzSpaceModule,
    NzPageHeaderModule,
    NzTabsModule,
    NzModalModule
  ],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss'
})
export class FormBuilderComponent implements OnInit {
  // Form metadata
  currentFormId: number = 0;
  formName = signal<string>('');
  formCode = signal<string>('');
  formDescription = signal<string>('');
  isFormMetadataModalVisible = signal(false);
  // Available field templates
  fieldTemplates: FieldTemplate[] = [
    { type: 'text', label: 'Text Input', icon: 'font-size', description: 'Single line text input' },
    { type: 'textarea', label: 'Text Area', icon: 'align-left', description: 'Multi-line text input' },
    { type: 'number', label: 'Number', icon: 'number', description: 'Numeric input field' },
    { type: 'email', label: 'Email', icon: 'mail', description: 'Email address input' },
    { type: 'password', label: 'Password', icon: 'lock', description: 'Password input field' },
    { type: 'date', label: 'Date', icon: 'calendar', description: 'Date picker' },
    { type: 'daterange', label: 'Date Range', icon: 'calendar', description: 'Date range picker (from-to)' },
    { type: 'codeeditor', label: 'Code Editor', icon: 'code', description: 'Code editor with syntax highlighting' },
    { type: 'select', label: 'Dropdown', icon: 'down-square', description: 'Select from options' },
    { type: 'autocomplete', label: 'Auto Complete', icon: 'search', description: 'Search with add-new option' },
    { type: 'radio', label: 'Radio Button', icon: 'check-circle', description: 'Single choice selection' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check-square', description: 'Multiple choice selection' },
    { type: 'switch', label: 'Switch', icon: 'swap', description: 'Toggle switch control' },
    { type: 'file', label: 'File Upload', icon: 'upload', description: 'File upload field' },
    { type: 'keyvalue', label: 'Key-Value Pairs', icon: 'unordered-list', description: 'Array of key-value pairs with dynamic controls' },
    { type: 'button', label: 'Button', icon: 'thunderbolt', description: 'Button with custom action' },
    { type: 'divider', label: 'Divider', icon: 'minus', description: 'Visual separator for form sections' }
  ];

  // Form fields in the canvas
  formFields = signal<FormField[]>([]);

  // Form configuration
  formConfig = signal<FormConfig>({
    title: 'Untitled Form',
    description: '',
    height: '100%',
    width: '100%',
    submitUrl: '',
    onInit:'',
    onDestroy:'',
    successMessage: 'Form submitted successfully!',
    errorMessage: 'Failed to submit form. Please try again.',
    submitButtonLabel: 'Submit',
    resetButtonLabel: 'Reset',
    showResetButton: true,
    showSubmitButton: true
  });

  // Selected field for editing
  selectedField = signal<FormField | null>(null);
  isPropertiesDrawerVisible = signal(false);
  hasVisibilityCondition = signal(false);
  hasEnableCondition = signal(false);
  hasApiBinding = signal(false);
  hasValueBinding = signal(false);
  isFormConfigDrawerVisible = signal(false);

  constructor(
    private formService: FormService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    debugger
    // Check if we're editing an existing form
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadForm(Number(id));
      }
    });
  }

  loadForm(id: number): void {
    debugger
    this.formService.getById(id).subscribe({
      next: (form) => {
        this.currentFormId = form.id;
        this.formName.set(form.name);
        this.formCode.set(form.code);
        this.formDescription.set(form.description);

        if (form.formJson) {
          const schema = typeof form.formJson === 'string' ? JSON.parse(form.formJson) : form.formJson;
          if (schema.fields && Array.isArray(schema.fields)) {
            this.formFields.set(schema.fields);

            // Import form config if present
            const config: FormConfig = {
              title: schema.title || form.name,
              description: schema.description || form.description,
              height: schema.height || '100%',
              width: schema.width || '100%',
              submitUrl: schema.submitUrl || '',
              successMessage: schema.successMessage || 'Form submitted successfully!',
              errorMessage: schema.errorMessage || 'Failed to submit form. Please try again.',
              submitButtonLabel: schema.submitButtonLabel || 'Submit',
              resetButtonLabel: schema.resetButtonLabel || 'Reset',
              showResetButton: schema.showResetButton !== undefined ? schema.showResetButton : true,
              showSubmitButton: schema.showSubmitButton !== undefined ? schema.showSubmitButton : true,
              onInit: schema.onInit || '',
              onDestroy: schema.onDestroy || ''
            };
            this.formConfig.set(config);
          }
        }
        this.message.success('Form loaded successfully');
      },
      error: () => {
        this.message.error('Failed to load form');
      }
    });
  }

  openSaveModal(): void {
    this.isFormMetadataModalVisible.set(true);
  }

  closeSaveModal(): void {
    this.isFormMetadataModalVisible.set(false);
  }

  saveForm(): void {
    if (!this.formName() || !this.formCode()) {
      this.message.error('Please provide form name and code');
      return;
    }

    const schema = {
      ...this.formConfig(),
      fields: this.formFields()
    };

    const formData: Partial<Form> = {
      id: this.currentFormId,
      name: this.formName(),
      code: this.formCode(),
      description: this.formDescription(),
      formJson: JSON.stringify(schema),
      version: 1,
      active: true
    };

    if (this.currentFormId) {
      // Update existing form
      this.formService.update(this.currentFormId, formData as Form).subscribe({
        next: () => {
          this.message.success('Form updated successfully');
          this.closeSaveModal();
        },
        error: () => {
          this.message.error('Failed to update form');
        }
      });
    } else {
      // Create new form
      this.formService.create(formData as Form).subscribe({
        next: (form) => {
          this.currentFormId = form.id;
          this.message.success('Form created successfully');
          this.closeSaveModal();
          // Navigate to edit mode with the new ID
          this.router.navigate(['/form-builder', form.id]);
        },
        error: () => {
          this.message.error('Failed to create form');
        }
      });
    }
  }

  navigateToFormList(): void {
    this.router.navigate(['/forms']);
  }

  // Add field to canvas
  onFieldDrop(event: CdkDragDrop<FormField[]>) {
    if (event.previousContainer === event.container) {
      // Reorder within canvas
      moveItemInArray(this.formFields(), event.previousIndex, event.currentIndex);
    } else {
      // Add new field from templates
      const template = this.fieldTemplates[event.previousIndex];
      let options: string[] | DropdownOption[] | undefined = undefined;
      let keyValuePairs: KeyValuePair[] | undefined = undefined;

      if (template.type === 'select') {
        // Dropdown uses key-value pairs
        options = [
          { key: 'option1', value: 'Option 1' },
          { key: 'option2', value: 'Option 2' },
          { key: 'option3', value: 'Option 3' }
        ];
      } else if (template.type === 'autocomplete') {
        // Autocomplete uses key-value pairs similar to select
        options = [
          { key: 'item1', value: 'Item 1' },
          { key: 'item2', value: 'Item 2' },
          { key: 'item3', value: 'Item 3' }
        ];
      } else if (template.type === 'radio' || template.type === 'checkbox') {
        // Radio and checkbox use simple strings
        options = ['Option 1', 'Option 2', 'Option 3'];
      } else if (template.type === 'keyvalue') {
        // Key-value field type
        keyValuePairs = [];
      }

      const newField: FormField = {
        id: uuidv4(),
        type: template.type,
        label: template.label,
        placeholder: `Enter ${template.label.toLowerCase()}`,
        required: false,
        options: options,
        icon: template.icon,
        defaultVisible: true,
        defaultEnabled: true,
        language: template.type === 'codeeditor' ? 'javascript' : undefined,
        keyValuePairs: keyValuePairs,
        valueControlType: template.type === 'keyvalue' ? 'text' : undefined,
        // Initialize file upload defaults
        maxFileSize: template.type === 'file' ? 5 : undefined, // Default 5MB
        maxFileCount: template.type === 'file' ? 1 : undefined, // Default 1 file
        allowedExtensions: template.type === 'file' ? [] : undefined, // Default all extensions
        showPreview: template.type === 'file' ? true : undefined,
        customJs: template.type === 'button' ? 'console.log(form);' : undefined
      };

      const fields = [...this.formFields()];
      fields.splice(event.currentIndex, 0, newField);
      this.formFields.set(fields);
    }
  }

  // Select field for editing
  selectField(field: FormField) {
    this.selectedField.set(field);
    this.hasVisibilityCondition.set(!!field.visibilityCondition);
    this.hasEnableCondition.set(!!field.enableCondition);
    this.hasApiBinding.set(!!field.apiBinding);
    this.hasValueBinding.set(!!field.valueBinding);

    // Initialize optionsSource if not set
    if ((field.type === 'select' || field.type === 'autocomplete' || field.type === 'radio' || field.type === 'checkbox') && !field.optionsSource) {
      if (field.apiBinding) {
        field.optionsSource = 'api';
      } else if (field.optionsCode) {
        field.optionsSource = 'code';
      } else {
        field.optionsSource = 'static';
      }
    }

    this.isPropertiesDrawerVisible.set(true);
  }

  // Delete field
  deleteField(fieldId: string) {
    this.formFields.set(this.formFields().filter(f => f.id !== fieldId));
    if (this.selectedField()?.id === fieldId) {
      this.selectedField.set(null);
      this.isPropertiesDrawerVisible.set(false);
    }
  }

  // Duplicate field
  duplicateField(field: FormField) {
    const newField: FormField = {
      ...JSON.parse(JSON.stringify(field)),
      id: uuidv4(),
      label: field.label + ' (Copy)'
    };
    const fields = [...this.formFields()];
    const index = fields.findIndex(f => f.id === field.id);
    fields.splice(index + 1, 0, newField);
    this.formFields.set(fields);
  }

  // Close properties drawer
  closePropertiesDrawer() {
    this.isPropertiesDrawerVisible.set(false);
    this.selectedField.set(null);
  }

  // Add option to select/radio/checkbox
  addOption() {
    const field = this.selectedField();
    if (field && field.options) {
      if (field.type === 'select' || field.type === 'autocomplete') {
        // For dropdowns, add key-value pairs
        (field.options as DropdownOption[]).push({
          key: `option${field.options.length + 1}`,
          value: `Option ${field.options.length + 1}`
        });
      } else {
        // For radio/checkbox, keep simple string arrays
        (field.options as string[]).push(`Option ${field.options.length + 1}`);
      }
    }
  }

  // Remove option
  removeOption(index: number) {
    const field = this.selectedField();
    if (field && field.options) {
      field.options.splice(index, 1);
    }
  }

  // Handle default key-value pairs change for keyvalue field type
  onDefaultKeyValuePairsChange(pairs: KeyValuePair[]) {
    const field = this.selectedField();
    if (field && field.type === 'keyvalue') {
      field.keyValuePairs = pairs;
    }
  }

  // Check if options are key-value pairs
  isDropdownOptions(options: any): options is DropdownOption[] {
    return options && options.length > 0 && typeof options[0] === 'object' && 'key' in options[0];
  }

  // Track by function for ngFor
  trackByFieldId(index: number, item: FormField | FieldTemplate): string {
    return 'id' in item ? item.id : item.type;
  }

  // Track by index for primitive arrays
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Export form JSON
  exportForm() {
    const schema = {
      ...this.formConfig(),
      fields: this.formFields()
    };
    const formJson = JSON.stringify(schema, null, 2);
    console.log('Form JSON:', formJson);

    // Download as file
    const blob = new Blob([formJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-schema-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Import form JSON
  importForm(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const schema = JSON.parse(e.target.result);

          // Check if it's a valid schema with fields
          if (schema.fields && Array.isArray(schema.fields)) {
            this.formFields.set(schema.fields);

            // Import form config if present
            const config: FormConfig = {
              title: schema.title || 'Untitled Form',
              description: schema.description || '',
              height: schema.height || '100%',
              width: schema.width || '100%',
              submitUrl: schema.submitUrl || '',
              successMessage: schema.successMessage || 'Form submitted successfully!',
              errorMessage: schema.errorMessage || 'Failed to submit form. Please try again.',
              submitButtonLabel: schema.submitButtonLabel || 'Submit',
              resetButtonLabel: schema.resetButtonLabel || 'Reset',
              showResetButton: schema.showResetButton !== undefined ? schema.showResetButton : true,
              onInit: schema.onInit || '',
              onDestroy: schema.onDestroy || ''
            };
            this.formConfig.set(config);

            console.log('Form imported successfully:', schema);
          } else if (Array.isArray(schema)) {
            // If it's just an array of fields (old format)
            this.formFields.set(schema);
            console.log('Form imported successfully (legacy format)');
          } else {
            console.error('Invalid form schema format');
          }
        } catch (error) {
          console.error('Error parsing form JSON:', error);
        }
      };
      reader.readAsText(file);

      // Reset file input
      event.target.value = '';
    }
  }

  // Clear all fields
  clearForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.formFields.set([]);
      this.selectedField.set(null);
      this.isPropertiesDrawerVisible.set(false);
    }
  }

  // Visibility condition helpers
  toggleVisibilityCondition() {
    const field = this.selectedField();
    if (field) {
      if (this.hasVisibilityCondition()) {
        field.visibilityCondition = {
          fieldId: '',
          operator: 'equals',
          value: ''
        };
      } else {
        delete field.visibilityCondition;
      }
    }
  }

  toggleEnableCondition() {
    const field = this.selectedField();
    if (field) {
      if (this.hasEnableCondition()) {
        field.enableCondition = {
          fieldId: '',
          operator: 'equals',
          value: ''
        };
      } else {
        delete field.enableCondition;
      }
    }
  }

  toggleApiBinding() {
    const field = this.selectedField();
    if (field) {
      if (this.hasApiBinding()) {
        field.apiBinding = {
          url: '',
          method: 'GET',
          keyProperty: 'id',
          valueProperty: 'name',
          headers: []
        };
      } else {
        delete field.apiBinding;
      }
    }
  }

  toggleValueBinding() {
    const field = this.selectedField();
    if (field) {
      if (this.hasValueBinding()) {
        field.valueBinding = {
          type: 'code',
          code: ''
        };
      } else {
        delete field.valueBinding;
      }
    }
  }

  toggleOptionsSource(source: string) {
    const field = this.selectedField();
    if (field) {
      // Reset bindings when switching source
      if (source === 'static') {
        this.hasApiBinding.set(false);
        delete field.apiBinding;
        delete field.optionsCode;
        if (!field.options) field.options = [];
      } else if (source === 'api') {
        this.hasApiBinding.set(true);
        field.apiBinding = {
          url: '',
          method: 'GET',
          keyProperty: 'id',
          valueProperty: 'name',
          headers: []
        };
        delete field.optionsCode;
      } else if (source === 'code') {
        this.hasApiBinding.set(false);
        delete field.apiBinding;
        field.optionsCode = '';
      }
    }
  }

  // Add header to API binding
  addApiHeader() {
    const field = this.selectedField();
    if (field?.apiBinding) {
      if (!field.apiBinding.headers) {
        field.apiBinding.headers = [];
      }
      field.apiBinding.headers.push({ key: '', value: '' });
    }
  }

  // Remove header from API binding
  removeApiHeader(index: number) {
    const field = this.selectedField();
    if (field?.apiBinding?.headers) {
      field.apiBinding.headers.splice(index, 1);
    }
  }

  // Add header to file upload
  addUploadHeader() {
    const field = this.selectedField();
    if (field && field.type === 'file') {
      if (!field.uploadHeaders) {
        field.uploadHeaders = [];
      }
      field.uploadHeaders.push({ key: '', value: '' });
    }
  }

  // Remove header from file upload
  removeUploadHeader(index: number) {
    const field = this.selectedField();
    if (field?.uploadHeaders) {
      field.uploadHeaders.splice(index, 1);
    }
  }

  getOtherFields(): FormField[] {
    const currentFieldId = this.selectedField()?.id;
    return this.formFields().filter(f => f.id !== currentFieldId);
  }

  needsValueInput(): boolean {
    const operator = this.selectedField()?.visibilityCondition?.operator;
    return operator !== 'isEmpty' && operator !== 'isNotEmpty';
  }

  needsEnableValueInput(): boolean {
    const operator = this.selectedField()?.enableCondition?.operator;
    return operator !== 'isEmpty' && operator !== 'isNotEmpty';
  }

  // Form Configuration
  openFormConfig() {
    this.isFormConfigDrawerVisible.set(true);
  }

  closeFormConfigDrawer() {
    this.isFormConfigDrawerVisible.set(false);
  }

  // Helper methods to update form config
  updateFormConfigField(field: keyof FormConfig, value: any) {
    debugger
    this.formConfig.update(c => ({ ...c, [field]: value }));
  }

  // Preview mode
  isPreviewMode = signal(false);

  // Computed schema for preview
  previewSchema = computed(() => ({
    ...this.formConfig(),
    fields: this.formFields()
  }));

  togglePreview() {
    this.isPreviewMode.update(v => !v);
  }
}
