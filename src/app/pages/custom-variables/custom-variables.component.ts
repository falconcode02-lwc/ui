import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CustomVariableService } from "../../service/custome-variable.service";

// Ng-Zorro modules
import { NzTableModule } from "ng-zorro-antd/table";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzSplitterModule } from "ng-zorro-antd/splitter";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzPageHeaderModule } from "ng-zorro-antd/page-header";
import { NzListModule } from "ng-zorro-antd/list";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzBadgeModule } from "ng-zorro-antd/badge";
import { NzTagModule } from "ng-zorro-antd/tag";
export interface CustomVariable {
  id: number;
  group: string;
  key: string;
  value: any;
}

@Component({
  selector: "app-custom-variables",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzDrawerModule,
    NzSplitterModule,
    NzPageHeaderModule,
    NzLayoutModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NzListModule,
    NzBadgeModule,
    NzTagModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./custom-variables.component.html",
  styleUrls: ["./custom-variables.component.scss"],
})
export class CustomVariablesComponent {
  variables: CustomVariable[] = [];
  nextId = 1;
  loading = false;
  filterText = "";
  filteredVariables: CustomVariable[] = [];
  selectedGroup: string | null = null;

  // group suggestions for autocomplete
  groupOptions: string[] = [];
  filteredGroupOptions: string[] = [];

  // Drawer / Form state
  drawerVisible = false;
  isEditMode = false;
  editingId: number | null = null;

  varForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private custVarService: CustomVariableService,
    private message: NzMessageService
  ) {
    this.varForm = this.fb.group({
      group: ["", Validators.required],
      key: ["", Validators.required],
      value: [""],
    });
    // groupOptions will be populated after we load data from service in ngOnInit
  }

  ngOnInit(): void {
    this.loading = true;
    this.custVarService.getMockBindings().subscribe((list) => {
      // Map service blocks to CustomVariable shape: use block.name as group, block.type as key, and config as value
      this.variables = list.map((b) => ({
        id: b.id,
        group: b.name || "default",
        key: b.type || "config",
        value: b.config,
      }));
      this.nextId = this.variables.reduce((m, v) => Math.max(m, v.id), 0) + 1;
      // populate group options from loaded data
      this.groupOptions = Array.from(
        new Set(this.variables.map((v) => v.group))
      );
      // select first group by default (or null for All)
      this.selectedGroup = null; // show All by default
      this.applyFilter();
      this.loading = false;
    });
  }

  selectGroupItem(group: string | null) {
    this.selectedGroup = group;
    // optionally clear text filter when selecting group
    // this.filterText = '';
    this.applyFilter();
  }

  applyFilter() {
    const term = (this.filterText || "").toString().trim().toLowerCase();
    let list = [...this.variables];
    if (this.selectedGroup) {
      list = list.filter((v) => v.group === this.selectedGroup);
    }
    if (!term) {
      this.filteredVariables = list;
      return;
    }
    this.filteredVariables = list.filter((v) => {
      const valStr = JSON.stringify(v.value || "").toLowerCase();
      return (
        (v.group || "").toLowerCase().includes(term) ||
        (v.key || "").toLowerCase().includes(term) ||
        valStr.includes(term)
      );
    });
  }

  openCreateDrawer() {
    this.isEditMode = false;
    this.editingId = null;
    this.varForm.reset();
    this.filteredGroupOptions = [];
    this.drawerVisible = true;
  }

  openEditDrawer(v: CustomVariable) {
    this.isEditMode = true;
    this.editingId = v.id;
    this.varForm.patchValue({
      group: v.group,
      key: v.key,
      value:
        typeof v.value === "object"
          ? JSON.stringify(v.value, null, 2)
          : String(v.value),
    });
    this.drawerVisible = true;
  }

  onGroupInput() {
    const val = (this.varForm.get("group")?.value || "").toString();
    if (!val) {
      this.filteredGroupOptions = [];
      return;
    }
    const low = val.toLowerCase();
    this.filteredGroupOptions = this.groupOptions
      .filter((g) => g.toLowerCase().includes(low) && g !== val)
      .slice(0, 10);
  }

  selectGroup(g: string) {
    this.varForm.get("group")?.setValue(g);
    this.filteredGroupOptions = [];
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.varForm.reset();
  }

  submitForm() {
    if (this.varForm.invalid) {
      this.varForm.markAllAsTouched();
      return;
    }

    const raw = this.varForm.value;
    let parsedValue: any = raw.value;
    // Try to parse JSON; if fails, keep as string
    try {
      parsedValue = JSON.parse(raw.value);
    } catch {
      // keep as-is
    }

    if (this.isEditMode && this.editingId != null) {
      const idx = this.variables.findIndex((x) => x.id === this.editingId);
      if (idx > -1) {
        this.variables[idx] = {
          id: this.editingId,
          group: raw.group,
          key: raw.key,
          value: parsedValue,
        };
      }
    } else {
      this.variables.push({
        id: this.nextId++,
        group: raw.group,
        key: raw.key,
        value: parsedValue,
      });
    }

    // ensure the group value is available as an option for autocomplete
    this.ensureGroupOption(raw.group);
    // refresh filtered list
    this.applyFilter();

    this.closeDrawer();
  }

  deleteVariable(id: number) {
    this.variables = this.variables.filter((v) => v.id !== id);
    this.applyFilter();
  }

  trackById(_: number, item: CustomVariable) {
    return item.id;
  }

  private ensureGroupOption(group?: string) {
    if (!group) return;
    if (!this.groupOptions.includes(group)) {
      this.groupOptions.push(group);
    }
  }

  // Get value type for display
  getValueType(value: any): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return "unknown";
  }

  // Get color for value type badge
  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      object: "blue",
      array: "purple",
      string: "green",
      number: "orange",
      boolean: "cyan",
      null: "default",
    };
    return colors[type] || "default";
  }

  // Copy value to clipboard
  copyToClipboard(value: any) {
    const text =
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.message.success("Copied to clipboard!");
      })
      .catch(() => {
        this.message.error("Failed to copy");
      });
  }

  // Get count of variables per group
  getGroupCount(group: string): number {
    return this.variables.filter((v) => v.group === group).length;
  }

  // Validate JSON in form - only if it looks like JSON
  validateJson(): boolean {
    const valueControl = this.varForm.get("value");
    const val = valueControl?.value || "";
    const trimmed = val.trim();

    // Empty is always valid
    if (!trimmed) return true;

    // Only validate as JSON if it starts with { or [ (looks like JSON)
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return true; // Accept as plain text
    }

    // If it looks like JSON, validate it
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  // Format JSON in form
  formatJson() {
    const valueControl = this.varForm.get("value");
    const val = valueControl?.value || "";
    if (!val.trim()) return;

    try {
      const parsed = JSON.parse(val);
      const formatted = JSON.stringify(parsed, null, 2);
      valueControl?.setValue(formatted);
      this.message.success("JSON formatted!");
    } catch {
      this.message.error("Invalid JSON - cannot format");
    }
  }

  // Get JSON validation status for visual feedback
  get jsonValidationStatus(): "success" | "error" | "" {
    const val = this.varForm.get("value")?.value || "";
    const trimmed = val.trim();
    if (!trimmed) return "";

    // Only show validation status if it looks like JSON
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return ""; // No validation feedback for plain text
    }

    return this.validateJson() ? "success" : "error";
  }
}
