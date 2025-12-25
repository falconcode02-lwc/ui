import {
  Component,
  signal,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  effect,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { NzRadioModule } from "ng-zorro-antd/radio";
import { NzUploadModule } from "ng-zorro-antd/upload";
import { NzAffixModule } from "ng-zorro-antd/affix";

import { NzMessageService } from "ng-zorro-antd/message";
import { NzDatePickerModule } from "ng-zorro-antd/date-picker";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzDividerModule } from "ng-zorro-antd/divider";
import {
  KeyValueBuilderComponent,
  KeyValuePair,
} from "../form-builder/key-value-builder.component";
import { FormService } from "../../service/form.service";
import type { LanguageDescription } from "@codemirror/language";
import { minimalLanguages } from "../../helpers/minimal-languages";
import { CodeEditorModule } from "@acrodata/code-editor";
import { javascript } from "@codemirror/lang-javascript";
import { NzSpaceModule } from "ng-zorro-antd/space";
import { NzTabsModule } from "ng-zorro-antd/tabs";

interface DropdownOption {
  key: string;
  value: string;
}

interface VisibilityCondition {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
  value?: string;
  type?: "simple" | "code";
  code?: string;
}

interface EnableCondition {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
  value?: string;
  type?: "simple" | "code";
  code?: string;
}

interface ApiBinding {
  url: string;
  method: "GET" | "POST";
  keyProperty: string; // Path to key in response (e.g., 'data.id' or 'id')
  valueProperty: string; // Path to value in response (e.g., 'data.name' or 'name')
  bodyData?: any; // For POST requests
  headers?: { key: string; value: string }[]; // Custom headers
}

interface FormField {
  id: string;
  type: string;
  label: string;
  group?: string; // For grouping fields in sections
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
  layout?: "vertical" | "horizontal"; // Layout for radio and checkbox groups
  min?: number; // Minimum value for number input
  max?: number; // Maximum value for number input
  step?: number; // Step increment for number input (e.g., 0.01 for decimals)
  keyValuePairs?: KeyValuePair[]; // For keyvalue field type
  valueControlType?: "text" | "select" | "codeeditor" | "checkbox"; // For keyvalue field - type of value control
  valueBinding?: { type: "code"; code: string };
  optionsSource?: "static" | "api" | "code";
  optionsCode?: string; // For JS-based options
  checkedText?: string; // For switch - text when checked
  uncheckedText?: string; // For switch - text when unchecked
  checkedValue?: any; // Value when checked
  uncheckedValue?: any; // Value when unchecked
  visible?: boolean;
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

interface FormSchema {
  fields: FormField[];
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
  iconUrl?: any; // Optional image URL for form title
  icon?: any; // Optional nz-icon name for form title
  visible?: any;
  onInit?: string; // JavaScript code to execute when form loads
  onDestroy?: string; // JavaScript code to execute before form is destroyed
}

interface FormSection {
  title: string;
  icon?: string;
  fields: FormField[];
}

@Component({
  selector: "app-form-viewer",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzCardModule,
    NzCheckboxModule,
    NzRadioModule,
    NzUploadModule,
    NzDatePickerModule,
    NzToolTipModule,
    NzSwitchModule,
    NzSpinModule,
    NzDividerModule,
    CodeEditorModule,
    KeyValueBuilderComponent,
    NzAffixModule,
    NzSpaceModule,
    NzTabsModule,
  ],
  templateUrl: "./form-viewer.component.html",
  styleUrl: "./form-viewer.component.scss",
})
export class FormViewerComponent implements OnInit, OnDestroy {
  @Input() preloadedSchema?: FormSchema;
  @Input() hideHeaderActions: boolean = true;
  @Input() isPreview: boolean = false;
  // Optional callback: parent // Handle "Edit" click for autocomplete/select
  editAutocompleteOption(field: FormField) {
    const control = this.dynamicForm.get(field.id);
    const value = control?.value;
    if (value) {
      this.onAutoCompleteEditClick.emit({ field, value });
    } else {
      this.message.warning("Please select an option to edit");
    }
  }

  // Optional callback: parent can handle "Add New" for autocomplete/select and return created option
  @Input() onAutocompleteAddNew?: (payload: {
    field: FormField;
    search: string;
  }) =>
    | Promise<DropdownOption | string | void>
    | DropdownOption
    | string
    | void;
  @Output() formValuesChange = new EventEmitter<any>();
  @Output() onAutoCompleteAddNewClick = new EventEmitter<any>();
  @Output() onAutoCompleteEditClick = new EventEmitter<any>();

  formSection = signal<any | null>(null);
  formSchema = signal<FormSchema | null>(null);
  dynamicForm: FormGroup;
  submittedData = signal<any>(null);
  isJsonInputVisible = signal(false);
  isSetValuesVisible = signal(false);
  isLoading = signal(false);
  jsonInput = "";
  setValuesInput = "";
  fileListMap: { [key: string]: any[] } = {};
  dynamicOptions: { [fieldId: string]: DropdownOption[] } = {}; // Store API-loaded options
  // Track current search terms for selects/autocomplete
  private lastSearch: { [fieldId: string]: string } = {};

  // Code editor options
  options: any = {
    theme: "dark",
    language: "javascript",
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    setup: {
      lineNumbers: "on",
    },
    disabled: false,
    readonly: false,
    placeholder: "Enter code here...",
    indentWithTab: true,
    indentUnit: "2",
    lineWrapping: true,
    highlightWhitespace: true,
  };

  extensions = [javascript()];
  languages: LanguageDescription[] = minimalLanguages;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private formService: FormService
  ) {
    this.dynamicForm = this.fb.group({});

    // Watch for preloaded schema changes
    effect(() => {
      if (this.preloadedSchema) {
        this.loadForm(this.preloadedSchema);
      }
    });
  }

  ngOnDestroy() {
    // Execute onDestroy lifecycle hook if defined
    const schema = this.formSchema();
    if (schema?.onDestroy) {
      this.executeLifecycleHook(schema.onDestroy, "onDestroy");
    }
  }

  ngOnInit() {
    // Load preloaded schema if provided
    if (this.preloadedSchema) {
      this.loadForm(this.preloadedSchema);
      return;
    }

    // Load form by code from route parameter
    const code = this.route.snapshot.paramMap.get("code");
    if (code) {
      this.isLoading.set(true);
      this.formService.getByCode(code).subscribe({
        next: (form) => {
          try {
            const schema = JSON.parse(form.formJson);
            this.loadForm(schema);
            // Success message removed as requested
          } catch (error) {
            console.error("Error parsing form JSON:", error);
            this.message.error("Failed to parse form data.");
          } finally {
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error("Error loading form:", error);
          this.message.error(`Failed to load form with code: ${code}`);
          this.isLoading.set(false);
        },
      });
    }
  }

  // Load form from JSON input
  loadFormFromJson() {
    try {
      const schema = JSON.parse(this.jsonInput);
      this.loadForm(schema);
      this.isJsonInputVisible.set(false);
      this.message.success("Form loaded successfully!");
    } catch (error) {
      this.message.error("Invalid JSON format. Please check your input.");
    }
  }

  // Load form from file
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const schema = JSON.parse(e.target.result);
          this.loadForm(schema);
          this.message.success("Form loaded from file successfully!");
        } catch (error) {
          this.message.error("Invalid JSON file format.");
        }
      };
      reader.readAsText(file);
    }
  }

  // Load form schema and build reactive form
  loadForm(schema: FormSchema) {
    console.log("Loading form with schema:", schema);
    console.log("Schema onInit:", schema.onInit);
    console.log("Schema onDestroy:", schema.onDestroy);
    this.formSchema.set(schema);

    this.submittedData.set(null);

    // Group fields by sections
    const groupedFields: { [key: string]: FormField[] } = {};
    const groupOrder: string[] = [];

    schema.fields.forEach((field) => {
      const groupName = field.group || "Parameters";
      if (!groupedFields[groupName]) {
        groupedFields[groupName] = [];
        groupOrder.push(groupName);
      }
      groupedFields[groupName].push(field);
    });

    const sections: FormSection[] = groupOrder.map((groupName) => ({
      title: groupName,
      icon: "form", // Default icon
      fields: groupedFields[groupName],
    }));

    this.formSection.set(sections);

    // Build reactive form controls
    const group: any = {};
    schema.fields.forEach((field) => {
      const validators = field.required ? [Validators.required] : [];

      if (field.type === "email") {
        validators.push(Validators.email);
      }

      // Get default value or empty
      let defaultValue =
        field.defaultValue !== undefined ? field.defaultValue : "";

      // For switch, default to uncheckedValue or false if no default value provided
      if (field.type === "switch" && field.defaultValue === undefined) {
        defaultValue =
          field.uncheckedValue !== undefined ? field.uncheckedValue : false;
      }

      // For multi-select, use empty array as default if no default value
      if (
        (field.type === "select" || field.type === "autocomplete") &&
        field.multiple &&
        !field.defaultValue
      ) {
        defaultValue = [];
      }

      // For keyvalue field, use keyValuePairs or empty array
      if (field.type === "keyvalue") {
        defaultValue = field.keyValuePairs || [];
      }

      if (field.type === "checkbox" && field.options) {
        // For checkbox groups, create array of boolean controls
        const checkboxGroup: any = {};
        field.options.forEach((option) => {
          const optionText = typeof option === "string" ? option : option.value;
          checkboxGroup[this.sanitizeKey(optionText)] = [false];
        });
        group[field.id] = this.fb.group(checkboxGroup);
      } else if (field.type === "divider" || field.type === "button") {
        // Skip form controls for divider and button - they're not form inputs
      } else {
        group[field.id] = [defaultValue, validators];
      }

      // Fetch options from API if binding is configured
      if (
        field.apiBinding &&
        (field.type === "select" ||
          field.type === "autocomplete" ||
          field.type === "radio" ||
          field.type === "checkbox")
      ) {
        this.fetchOptionsFromApi(field);
      }
    });

    this.dynamicForm = this.fb.group(group);

    // Apply default enabled state after form is created
    schema.fields.forEach((field) => {
      if (field.defaultEnabled === false) {
        const control = this.dynamicForm.get(field.id);
        if (control) {
          control.disable();
        }
      }
    });

    // Subscribe to form value changes to handle dynamic enable/disable and API dependencies
    this.dynamicForm.valueChanges.subscribe(() => {
      // Emit form values for external listeners
      const formValues = this.prepareFormData();
      this.formValuesChange.emit(formValues);

      schema.fields.forEach((field) => {
        if (field.enableCondition) {
          const control = this.dynamicForm.get(field.id);
          if (control) {
            const shouldBeEnabled = this.evaluateEnableCondition(field);
            if (shouldBeEnabled && control.disabled) {
              control.enable({ emitEvent: false });
            } else if (!shouldBeEnabled && control.enabled) {
              control.disable({ emitEvent: false });
            }
          }
        }

        // Reload API options if field has template expressions in API binding
        if (
          field.apiBinding &&
          (field.type === "select" ||
            field.type === "autocomplete" ||
            field.type === "radio" ||
            field.type === "checkbox")
        ) {
          const hasTemplates =
            this.hasTemplateExpressions(field.apiBinding.url) ||
            this.hasTemplateExpressions(field.apiBinding.bodyData);
          if (hasTemplates) {
            this.fetchOptionsFromApi(field);
          }
        }

        // Evaluate value binding
        if (field.valueBinding && field.valueBinding.code) {
          const calculatedValue = this.evaluateCode(field.valueBinding.code);
          const control = this.dynamicForm.get(field.id);
          if (control && control.value !== calculatedValue) {
            control.setValue(calculatedValue, { emitEvent: false });
          }
        }

        // Evaluate options code
        if (
          field.optionsCode &&
          (field.type === "select" ||
            field.type === "autocomplete" ||
            field.type === "radio" ||
            field.type === "checkbox")
        ) {
          const calculatedOptions = this.evaluateCode(field.optionsCode);
          if (Array.isArray(calculatedOptions)) {
            // Normalize options to DropdownOption format
            const normalizedOptions: DropdownOption[] = calculatedOptions.map(
              (opt: any) => {
                if (typeof opt === "string") {
                  return { key: opt, value: opt };
                }
                return opt;
              }
            );

            // Only update if options have changed to avoid infinite loops/flickering
            // Simple check based on length and first item, can be improved
            const currentOptions = this.dynamicOptions[field.id] || [];
            if (
              JSON.stringify(currentOptions) !==
              JSON.stringify(normalizedOptions)
            ) {
              this.dynamicOptions[field.id] = normalizedOptions;

              // For checkbox fields, rebuild the FormGroup if options changed
              if (field.type === "checkbox") {
                const checkboxGroup: any = {};
                normalizedOptions.forEach((option) => {
                  checkboxGroup[this.sanitizeKey(option.value)] = [false];
                });

                const existingGroup = this.dynamicForm.get(field.id);
                if (existingGroup) {
                  this.dynamicForm.removeControl(field.id);
                }
                this.dynamicForm.addControl(
                  field.id,
                  this.fb.group(checkboxGroup)
                );
              }
            }
          }
        }
      });
    });

    // Execute onInit lifecycle hook if defined
    // Delay execution to ensure form is fully rendered and visible
    console.log("Checking onInit hook, value:", schema.onInit);
    if (schema.onInit) {
      setTimeout(() => {
        this.executeLifecycleHook(schema.onInit!, "onInit");
      }, 500); // 500ms delay to ensure form is rendered and async operations complete
    }
  }

  // Check if a string contains template expressions
  hasTemplateExpressions(value: any): boolean {
    if (!value) return false;
    const str = typeof value === "string" ? value : JSON.stringify(value);
    return /\{\{[^}]+\}\}/.test(str);
  }

  // Submit form
  onSubmit() {
    // First validate requiredEither groups
    const requiredEitherErrors = this.validateRequiredEither();

    if (this.dynamicForm.valid && requiredEitherErrors.length === 0) {
      const formData = this.prepareFormData();
      const schema = this.formSchema();

      // If submit URL is provided, send data to API
      if (schema?.submitUrl) {
        fetch(schema.submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
          .then((response) => {
            if (response.ok) {
              this.submittedData.set(formData);
              this.message.success(
                schema.successMessage || "Form submitted successfully!"
              );
              console.log("Form Data:", formData);
            } else {
              throw new Error("Submission failed");
            }
          })
          .catch((error) => {
            console.error("Form submission error:", error);
            this.message.error(
              schema.errorMessage || "Failed to submit form. Please try again."
            );
          });
      } else {
        // No submit URL, just show success locally
        this.submittedData.set(formData);
        this.message.success(
          schema?.successMessage || "Form submitted successfully!"
        );
        console.log("Form Data:", formData);
      }
    } else {
      // Show requiredEither errors first
      if (requiredEitherErrors.length > 0) {
        requiredEitherErrors.forEach((error) => {
          this.message.error(error);
        });
        return;
      }

      Object.keys(this.dynamicForm.controls).forEach((key) => {
        const control = this.dynamicForm.get(key);
        if (control && control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.error("Please fill in all required fields correctly.");
    }
  }

  // Validate requiredEither groups
  validateRequiredEither(): string[] {
    const errors: string[] = [];
    const schema = this.formSchema();
    if (!schema) return errors;

    // Find all fields with requiredEither
    const fieldsWithRequiredEither = schema.fields.filter((field) =>
      this.hasRequiredEither(field)
    );

    // Group fields by their requiredEither relationships
    const eitherGroups: Map<string, FormField[]> = new Map();

    fieldsWithRequiredEither.forEach((field) => {
      if (!field.requiredEither) return;

      // Create a unique group key by combining all related field IDs
      const allFieldIds = [field.id, ...field.requiredEither].sort();
      const groupKey = allFieldIds.join("|");

      if (!eitherGroups.has(groupKey)) {
        eitherGroups.set(groupKey, []);
      }

      const group = eitherGroups.get(groupKey)!;

      // Add current field to the group if not already present
      if (!group.find((f) => f.id === field.id)) {
        group.push(field);
      }

      // Add all related fields to the group
      field.requiredEither.forEach((relatedFieldId) => {
        const relatedField = schema.fields.find((f) => f.id === relatedFieldId);
        if (relatedField && !group.find((f) => f.id === relatedField.id)) {
          group.push(relatedField);
        }
      });
    });

    // Validate each "either" group
    eitherGroups.forEach((group, groupKey) => {
      const hasAtLeastOne = group.some((field) => {
        const control = this.dynamicForm.get(field.id);
        const value = control?.value;

        // Check if field has value based on its type
        if (field.type === "select" && field.multiple) {
          return Array.isArray(value) && value.length > 0;
        } else if (field.type === "checkbox" || field.type === "radio") {
          if (typeof value === "object" && value !== null) {
            return Object.values(value).some((v) => v === true);
          }
          return value === true;
        } else if (field.type === "number") {
          return value !== null && value !== undefined && value !== "";
        } else if (Array.isArray(value)) {
          return value.length > 0;
        } else if (typeof value === "string") {
          return value.trim() !== "";
        } else {
          return value !== null && value !== undefined && value !== "";
        }
      });

      if (!hasAtLeastOne) {
        const fieldLabels = group.map((f) => f.label).join(" or ");
        errors.push(`Please provide at least one of: ${fieldLabels}`);
      }
    });

    return errors;
  }

  // Fetch options from API
  async fetchOptionsFromApi(field: FormField) {
    if (!field.apiBinding) return;

    const { url, method, keyProperty, valueProperty, bodyData, headers } =
      field.apiBinding;

    try {
      // Replace template expressions in URL with form values
      const processedUrl = this.replaceTemplateExpressions(url);

      // Build headers object
      const headersObj: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add custom headers with template replacement
      if (headers && headers.length > 0) {
        headers.forEach((header) => {
          if (header.key && header.value) {
            headersObj[header.key] = this.replaceTemplateExpressions(
              header.value
            );
          }
        });
      }

      const requestOptions: RequestInit = {
        method: method,
        headers: headersObj,
      };

      if (method === "POST" && bodyData) {
        // Replace template expressions in body data
        const processedBody = this.replaceTemplateExpressions(
          typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData)
        );
        requestOptions.body = processedBody;
      }

      const response = await fetch(processedUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract options from response using property paths
      const items = Array.isArray(data)
        ? data
        : this.getNestedProperty(data, "data") || [];

      const dropdownOptions: DropdownOption[] = items.map((item: any) => ({
        key: this.getNestedProperty(item, keyProperty)?.toString() || "",
        value: this.getNestedProperty(item, valueProperty)?.toString() || "",
      }));

      this.dynamicOptions[field.id] = dropdownOptions;

      // For checkbox fields, we need to rebuild the FormGroup with the new options
      if (field.type === "checkbox") {
        const checkboxGroup: any = {};
        dropdownOptions.forEach((option) => {
          checkboxGroup[this.sanitizeKey(option.value)] = [false];
        });

        // Replace the existing checkbox FormGroup with the new one
        const existingGroup = this.dynamicForm.get(field.id);
        if (existingGroup) {
          this.dynamicForm.removeControl(field.id);
        }
        this.dynamicForm.addControl(field.id, this.fb.group(checkboxGroup));
      }
    } catch (error) {
      console.error(`Failed to fetch options for field ${field.id}:`, error);
      this.message.error(`Failed to load options for ${field.label}`);
    }
  }

  // Get nested property from object using dot notation (e.g., 'data.id')
  getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  // Replace template expressions like {{fieldId}} with actual form values
  replaceTemplateExpressions(template: string): string {
    if (!template) return template;

    const formValues = this.dynamicForm.value;

    // Match {{fieldId}} patterns
    return template.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
      const trimmedFieldId = fieldId.trim();
      const value = formValues[trimmedFieldId];

      // Return the value or empty string if not found
      return value !== undefined && value !== null ? String(value) : "";
    });
  }

  // Prepare form data for submission
  prepareFormData() {
    const rawData = this.dynamicForm.value;
    const schema = this.formSchema();
    const formData: any = {};

    if (schema) {
      schema.fields.forEach((field) => {
        if (field.type === "checkbox" && field.options) {
          // Convert checkbox group to array of selected values
          const checkboxData = rawData[field.id];
          formData[field.id] = field.options
            .filter((option) => {
              const optionText =
                typeof option === "string" ? option : option.value;
              return checkboxData[this.sanitizeKey(optionText)];
            })
            .map((option) =>
              typeof option === "string" ? option : option.value
            );
        } else {
          formData[field.id] = rawData[field.id];
        }
      });
    }

    return formData;
  }

  // Reset form
  resetForm() {
    this.dynamicForm.reset();
    this.submittedData.set(null);
    this.message.info("Form has been reset.");
  }

  // Clear form schema
  clearForm() {
    this.formSchema.set(null);
    this.dynamicForm = this.fb.group({});
    this.submittedData.set(null);
    this.jsonInput = "";
  }

  // Public method to get current form values
  getFormValues(): any {
    return this.prepareFormData();
  }

  // Public method to check if form is valid
  isFormValid(): boolean {
    return this.dynamicForm.valid;
  }

  // Download submitted data as JSON
  downloadSubmittedData() {
    const data = this.submittedData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-submission-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  // Get error message for field
  getErrorMessage(fieldId: string): string {
    const control = this.dynamicForm.get(fieldId);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.hasError("required")) {
        return "This field is required";
      }
      if (control.hasError("email")) {
        return "Please enter a valid email address";
      }
    }
    return "";
  }

  // Check if field has error
  hasError(fieldId: string): boolean {
    const control = this.dynamicForm.get(fieldId);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Sanitize option text to use as form control key
  sanitizeKey(text: string): string {
    return text.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }

  // Get options for a field (static or from API)
  getFieldOptions(field: FormField): (string | DropdownOption)[] {
    // If field has API binding and options are loaded, use dynamic options
    if (
      field.optionsSource === "api" &&
      field.apiBinding &&
      this.dynamicOptions[field.id]
    ) {
      return this.dynamicOptions[field.id];
    }

    // If options source is code
    if (field.optionsSource === "code" && field.optionsCode) {
      try {
        const form = this.prepareFormData();
        const fn = new Function("form", field.optionsCode);
        const result = fn(form);
        return Array.isArray(result) ? result : [];
      } catch (e) {
        console.error("Error evaluating options code:", e);
        return [];
      }
    }

    // Otherwise use static options
    return field.options || [];
  }

  // Toggle JSON input visibility
  toggleJsonInput() {
    this.isJsonInputVisible.update((v) => !v);
  }

  // Toggle Set Values visibility
  toggleSetValues() {
    this.isSetValuesVisible.update((v) => !v);
  }

  // Set form values from JSON
  setFormValues() {
    try {
      const values = JSON.parse(this.setValuesInput);

      if (typeof values !== "object" || values === null) {
        this.message.error("Invalid JSON: Expected an object");
        return;
      }

      // Set values for each field
      Object.keys(values).forEach((fieldId) => {
        const control = this.dynamicForm.get(fieldId);
        if (control) {
          control.setValue(values[fieldId]);
          control.markAsTouched();
        } else {
          console.warn(`Field "${fieldId}" not found in form`);
        }
      });

      this.message.success("Form values updated successfully!");
      this.isSetValuesVisible.set(false);
      this.setValuesInput = "";
    } catch (error) {
      this.message.error("Invalid JSON format. Please check your input.");
      console.error("Error parsing values JSON:", error);
    }
  }

  // Capture current search term for a field
  onSelectSearch(term: string, field: FormField) {
    this.lastSearch[field.id] = term;
  }

  // Reset a single field (for select and radio)
  resetField(fieldId: string) {
    const control = this.dynamicForm.get(fieldId);
    if (control) {
      const schema = this.formSchema();
      const field = schema?.fields.find((f) => f.id === fieldId);

      if (field?.multiple) {
        // For multi-select, reset to empty array
        control.setValue([]);
      } else {
        // For single select and radio, reset to null
        control.setValue(null);
      }
      control.markAsTouched();
    }
  }

  // Add new option for autocomplete/select fields, supporting external callback
  async addNewAutocompleteOption(field: FormField) {
    if (this.onAutoCompleteAddNewClick) {
      this.onAutoCompleteAddNewClick.emit({ ...field });
    }
  }

  // Execute button action
  executeButtonAction(field: FormField) {
    if (!field.customJs) return;

    try {
      const form = this.prepareFormData();
      const api = {
        fetch: (url: string, options?: any) =>
          fetch(url, options).then((res) => res.json()),
      };

      // Create a function with form and api as arguments
      const fn = new Function("form", "api", field.customJs);
      fn(form, api);
    } catch (error) {
      console.error("Error executing button action:", error);
      this.message.error("Failed to execute button action");
    }
  }

  // Execute lifecycle hook (onInit or onDestroy)
  executeLifecycleHook(code: string, hookName: string) {
    if (!code) return;

    try {
      const formData = this.prepareFormData();

      // Create a Proxy to intercept property assignments on the form object
      // This allows: form.fieldName = "value" to set form control values
      const formProxy = new Proxy(formData, {
        get: (target, prop) => {
          // Return the current value from formData
          return target[prop as string];
        },
        set: (target, prop, value) => {
          const fieldId = prop as string;
          const control = this.dynamicForm.get(fieldId);

          if (control) {
            // Set the value in the form control
            control.setValue(value);
            console.log(`Set ${fieldId} = ${JSON.stringify(value)}`);
          } else {
            console.warn(`Field '${fieldId}' not found in form`);
          }

          // Update the target object as well
          target[fieldId] = value;
          return true;
        },
      });

      const api = {
        fetch: (url: string, options?: any) =>
          fetch(url, options).then((res) => res.json()),
      };

      // Create a function with form (as Proxy), api, alert, console, and window as arguments
      // This allows the user's code to access common browser APIs and set form values
      const fn = new Function(
        "form",
        "api",
        "alert",
        "console",
        "window",
        code
      );
      fn(formProxy, api, window.alert.bind(window), console, window);
      console.log(`Lifecycle hook '${hookName}' executed successfully`);
    } catch (error) {
      console.error(`Error executing lifecycle hook '${hookName}':`, error);
      this.message.error(`Failed to execute ${hookName} hook`);
    }
  }

  // Apply a created option to either static or dynamic list and set selected value
  private applyNewOption(field: FormField, option: DropdownOption) {
    // If API-bound, prefer dynamicOptions list; else mutate field.options
    if (field.apiBinding) {
      const list = this.dynamicOptions[field.id] || [];
      list.push(option);
      this.dynamicOptions[field.id] = [...list];
    } else {
      if (!field.options || !Array.isArray(field.options)) {
        field.options = [];
      }
      // Ensure key/value structure
      const isKV =
        field.options.length === 0 ||
        (typeof field.options[0] === "object" &&
          "key" in (field.options[0] as any));
      if (isKV) {
        (field.options as DropdownOption[]).push(option);
      } else {
        // Convert to string list if needed
        (field.options as any[]).push(option.value);
      }
    }

    // Set current selection
    const ctrl = this.dynamicForm.get(field.id);
    if (!ctrl) return;
    if (field.multiple) {
      const current = Array.isArray(ctrl.value) ? ctrl.value.slice() : [];
      current.push(option.key || option.value);
      ctrl.setValue(current);
    } else {
      ctrl.setValue(option.key || option.value);
    }
    ctrl.markAsDirty();
    ctrl.markAsTouched();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  // Reset checkbox group
  resetCheckboxGroup(field: FormField) {
    const checkboxGroup = this.dynamicForm.get(field.id);
    if (checkboxGroup) {
      // Get options from either API or static
      const options = this.getFieldOptions(field);

      // Set all checkboxes to false
      options.forEach((option) => {
        const optionText =
          typeof option === "string"
            ? option
            : (option as DropdownOption).value;
        const control = checkboxGroup.get(this.sanitizeKey(optionText));
        if (control) {
          control.setValue(false);
        }
      });
      checkboxGroup.markAsTouched();
    }
  }

  // Check if any checkbox in group is selected
  hasAnyCheckboxSelected(field: FormField): boolean {
    const checkboxGroup = this.dynamicForm.get(field.id);
    if (!checkboxGroup) {
      return false;
    }

    // Get options from either API or static
    const options = this.getFieldOptions(field);

    return options.some((option) => {
      const optionText =
        typeof option === "string" ? option : (option as DropdownOption).value;
      const control = checkboxGroup.get(this.sanitizeKey(optionText));
      return control?.value === true;
    });
  }

  // Sample form for demo
  loadSampleForm() {
    const sampleSchema: FormSchema = {
      title: "Contact Form",
      description: "Please fill out this contact form",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
          icon: "user",
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "Enter your email",
          required: true,
          icon: "mail",
        },
        {
          id: "phone",
          type: "number",
          label: "Phone Number",
          placeholder: "Enter your phone number",
          required: false,
          icon: "phone",
        },
        {
          id: "message",
          type: "textarea",
          label: "Message",
          placeholder: "Enter your message",
          required: true,
          icon: "message",
        },
        {
          id: "category",
          type: "select",
          label: "Category",
          required: true,
          options: ["General Inquiry", "Support", "Feedback", "Other"],
          icon: "tags",
        },
      ],
    };

    this.loadForm(sampleSchema);
    this.message.success("Sample form loaded!");
  }

  // Handle file upload with validation
  beforeUpload = (field: FormField, file: any): boolean => {
    const fieldId = field.id;

    // Validate file size
    if (field.maxFileSize) {
      const maxSizeBytes = field.maxFileSize * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSizeBytes) {
        this.message.error(
          `File size exceeds maximum allowed size of ${field.maxFileSize}MB`
        );
        return false;
      }
    }

    // Validate file extension
    if (field.allowedExtensions && field.allowedExtensions.length > 0) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));
      const isAllowed = field.allowedExtensions.some(
        (ext) => fileExtension === ext.toLowerCase()
      );

      if (!isAllowed) {
        this.message.error(
          `File type not allowed. Allowed types: ${field.allowedExtensions.join(
            ", "
          )}`
        );
        return false;
      }
    }

    // Validate file count
    if (!this.fileListMap[fieldId]) {
      this.fileListMap[fieldId] = [];
    }

    const maxCount = field.maxFileCount || 1;
    if (this.fileListMap[fieldId].length >= maxCount) {
      this.message.error(`Maximum ${maxCount} file(s) allowed`);
      return false;
    }

    // Ensure file has a UID for nz-upload tracking
    if (!file.uid) {
      file.uid = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }

    // Add file to the list with proper structure
    this.fileListMap[fieldId] = [...this.fileListMap[fieldId], file];

    // Update form control with file list
    const fileList = this.fileListMap[fieldId];
    this.dynamicForm.get(fieldId)?.setValue(maxCount === 1 ? file : fileList);

    // Return false to prevent automatic upload
    return false;
  };

  // Handle file change event (for removing files)
  handleFileChange(event: any, field: FormField): void {
    const fieldId = field.id;

    if (event.type === "removed") {
      // Remove file from the list
      const removedFile = event.file;
      if (this.fileListMap[fieldId]) {
        // Create new array reference for change detection
        this.fileListMap[fieldId] = this.fileListMap[fieldId].filter(
          (f: any) => f.uid !== removedFile.uid
        );

        // Update form control
        const maxCount = field.maxFileCount || 1;
        const fileList = this.fileListMap[fieldId];
        const control = this.dynamicForm.get(fieldId);

        if (control) {
          if (fileList.length === 0) {
            control.setValue(null);
            control.markAsPristine();
            control.markAsUntouched();
          } else {
            control.setValue(maxCount === 1 ? fileList[0] : fileList);
            control.markAsDirty();
            control.markAsTouched();
          }
        }
      }
    }
  }

  // Get accepted file extensions for nz-upload
  getAcceptedExtensions(field: FormField): string {
    if (!field.allowedExtensions || field.allowedExtensions.length === 0) {
      return "*";
    }
    return field.allowedExtensions.join(",");
  }

  // Get file list for a field
  getFileList(fieldId: string): any[] {
    return this.fileListMap[fieldId] || [];
  }

  // Custom upload request with progress tracking
  customUploadRequest = (field: FormField, item: any): any => {
    if (!field.uploadUrl) {
      return;
    }

    const formData = new FormData();
    formData.append("file", item.file as any);

    // Replace template expressions in URL
    let uploadUrl = field.uploadUrl;
    const formValues = this.dynamicForm.value;
    uploadUrl = uploadUrl.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
      const trimmedFieldId = fieldId.trim();
      const value = formValues[trimmedFieldId];
      return value !== undefined && value !== null ? String(value) : "";
    });

    // Build headers
    const headers: any = {};
    if (field.uploadHeaders && field.uploadHeaders.length > 0) {
      field.uploadHeaders.forEach((header) => {
        if (header.key && header.value) {
          // Replace template expressions in header values
          let headerValue = header.value.replace(
            /\{\{([^}]+)\}\}/g,
            (match, fieldId) => {
              const trimmedFieldId = fieldId.trim();
              const value = formValues[trimmedFieldId];
              return value !== undefined && value !== null ? String(value) : "";
            }
          );
          headers[header.key] = headerValue;
        }
      });
    }

    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        item.onProgress({ percent }, item.file);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          item.onSuccess(response, item.file, xhr);
          this.message.success(`File uploaded successfully`);
        } catch (e) {
          item.onSuccess(xhr.responseText, item.file, xhr);
          this.message.success(`File uploaded successfully`);
        }
      } else {
        item.onError(
          new Error(`Upload failed with status ${xhr.status}`),
          item.file
        );
        this.message.error(`Upload failed: ${xhr.statusText}`);
      }
    };

    xhr.onerror = () => {
      item.onError(new Error("Upload failed"), item.file);
      this.message.error("Upload failed. Please try again.");
    };

    xhr.open("POST", uploadUrl, true);

    // Set headers
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.send(formData);

    return {
      abort() {
        xhr.abort();
      },
    };
  };

  // Check if field should be visible based on condition
  isFieldVisible(field: FormField): boolean {
    // Check default visibility first
    if (field.defaultVisible === false) {
      // If explicitly set to false, check condition to potentially show it
      if (!field.visibilityCondition) {
        return false;
      }
    } else {
      // Default is true, check condition to potentially hide it
      if (!field.visibilityCondition) {
        return true;
      }
    }

    const condition = field.visibilityCondition;

    // Handle JS Code condition
    if (condition.type === "code" && condition.code) {
      console.log("Evaluating visibility code for field", condition.code);
      let result = this.evaluateCode(condition.code);
      field.defaultVisible = result;
      console.log("Result:", result);
      return !!result;
    }
    const dependentFieldValue = this.dynamicForm.get(condition.fieldId)?.value;

    switch (condition.operator) {
      case "equals":
        return dependentFieldValue === condition.value;
      case "notEquals":
        return dependentFieldValue !== condition.value;
      case "contains":
        return (
          dependentFieldValue &&
          String(dependentFieldValue).includes(condition.value || "")
        );
      case "isEmpty":
        return !dependentFieldValue || dependentFieldValue === "";
      case "isNotEmpty":
        return !!dependentFieldValue && dependentFieldValue !== "";
      default:
        return field.defaultVisible !== false;
    }
  }

  // Evaluate enable condition
  evaluateEnableCondition(field: FormField): boolean {
    // Check default enabled state first
    if (field.defaultEnabled === false) {
      // If explicitly set to false, check condition to potentially enable it
      if (!field.enableCondition) {
        return false;
      }
    } else {
      // Default is true, check condition to potentially disable it
      if (!field.enableCondition) {
        return true;
      }
    }

    const condition = field.enableCondition;

    // Handle JS Code condition
    if (condition.type === "code" && condition.code) {
      return !!this.evaluateCode(condition.code);
    }

    const dependentFieldValue = this.dynamicForm.get(condition.fieldId)?.value;

    switch (condition.operator) {
      case "equals":
        return dependentFieldValue === condition.value;
      case "notEquals":
        return dependentFieldValue !== condition.value;
      case "contains":
        return (
          dependentFieldValue &&
          String(dependentFieldValue).includes(condition.value || "")
        );
      case "isEmpty":
        return !dependentFieldValue || dependentFieldValue === "";
      case "isNotEmpty":
        return !!dependentFieldValue && dependentFieldValue !== "";
      default:
        return field.defaultEnabled !== false;
    }
  }

  // Check if field should be enabled based on condition (for template binding)
  isFieldEnabled(field: FormField): boolean {
    return this.evaluateEnableCondition(field);
  }

  // Handle keyvalue pairs change
  onKeyValuePairsChange(fieldId: string, pairs: KeyValuePair[]) {
    const control = this.dynamicForm.get(fieldId);
    if (control) {
      control.setValue(pairs);
      control.markAsTouched();
      control.markAsDirty();
    }
  }

  // Get keyvalue pairs for a field
  getKeyValuePairs(field: FormField): KeyValuePair[] {
    const control = this.dynamicForm.get(field.id);
    const value = control?.value;

    if (Array.isArray(value)) {
      return value;
    }

    return field.keyValuePairs || [];
  }

  // Check if field has requiredEither configuration
  hasRequiredEither(field: FormField): boolean {
    return (
      field.requiredEither !== undefined &&
      Array.isArray(field.requiredEither) &&
      field.requiredEither.length > 0
    );
  }

  // Get formatted text for requiredEither fields
  getRequiredEitherText(field: FormField): string {
    if (!field.requiredEither || field.requiredEither.length === 0) {
      return "";
    }

    const schema = this.formSchema();
    if (!schema) return "";

    // Get labels for related fields
    const labels = field.requiredEither.map((fieldId) => {
      const relatedField = schema.fields.find((f) => f.id === fieldId);
      return relatedField ? relatedField.label : fieldId;
    });

    // Format based on number of fields
    if (labels.length === 1) {
      return labels[0];
    } else if (labels.length === 2) {
      return labels.join(" or ");
    } else {
      // For 3+ fields: "Field1, Field2, or Field3"
      return (
        labels.slice(0, -1).join(", ") + ", or " + labels[labels.length - 1]
      );
    }
  }

  // Get individual field label by ID
  getFieldLabel(fieldId: string): string {
    const schema = this.formSchema();
    if (!schema) return fieldId;

    const field = schema.fields.find((f) => f.id === fieldId);
    return field ? field.label : fieldId;
  }

  /**
   * Programmatically set visibility of a field by its id.
   * This updates the formSchema signal with a new object so the view refreshes immediately.
   */
  public setFieldVisibility(fieldId: string, visible: boolean): void {
    const schema = this.formSchema();
    if (!schema) return;
    const updatedFields = schema.fields.map((f) =>
      f.id === fieldId ? { ...f, defaultVisible: visible } : f
    );
    this.formSchema.set({ ...schema, fields: updatedFields });
  }

  public setFieldOptionsValue(fieldId: string, value: any): void {
    const schema = this.formSchema();
    if (!schema) return;
    const updatedFields = schema.fields.map((f) =>
      f.id === fieldId ? { ...f, options: value } : f
    );
    this.formSchema.set({ ...schema, fields: updatedFields });
  }

  // Evaluate JS code safely
  private evaluateCode(code: string): any {
    try {
      debugger;
      // Create a function with 'form' as argument
      // form contains all current field values
      const formValues = this.dynamicForm.getRawValue();
      const func = new Function("form", code);
      return func(formValues);
    } catch (error) {
      console.warn("Error evaluating JS code:", error);
      return null;
    }
  }
}
