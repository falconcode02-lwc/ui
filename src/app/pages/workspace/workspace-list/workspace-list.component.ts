import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { WorkspaceCreateComponent } from '../workspace-create/workspace-create.component';
import { WorkspaceEditComponent } from '../workspace-update/workspace-update.component';
import { WorkspaceService } from '../../../service/workspace.service';
import { Workspace } from '../../../model/workspace-model';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzModalModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzPageHeaderModule,
    NzEmptyModule,
    NzInputModule,
    NzSpaceModule,
  ],
})
export class WorkspaceListComponent implements OnInit {

  workspaces: Workspace[] = [];
  filteredWorkspaces: Workspace[] = [];

  loading = false;
  searchText = '';

  total = 0;
  page = 0;
  size = 20;

  // TEMP — replace later with org from auth/session
  // private readonly orgId = 'Test123';

  constructor(
    private service: WorkspaceService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(page: number = 0): void {
    this.loading = true;

    this.service
      .getWorkspaces(page, this.size)
      .subscribe({
        next: (res) => {
          this.workspaces = res.content;
          this.filteredWorkspaces = res.content;
          this.total = res.totalElements;
          this.page = res.number;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  search(): void {
    const text = this.searchText.trim().toLowerCase();

    if (!text) {
      this.filteredWorkspaces = [...this.workspaces];
      return;
    }

    this.filteredWorkspaces = this.workspaces.filter(w =>
      w.name?.toLowerCase().includes(text) ||
      w.orgId?.toLowerCase().includes(text) ||
      w.type?.toLowerCase().includes(text)
    );
  }

  edit(event: MouseEvent, w: Workspace): void {
    event.stopPropagation();   // 🔑 THIS

    const modalRef = this.modal.create({
      nzTitle: 'Edit Workspace',
      nzContent: WorkspaceEditComponent,
      nzData: w,
      nzFooter: null,
      nzWidth: 600,
      nzMaskClosable: false,
    });

    modalRef.afterClose.subscribe(result => {
      if (result === 'updated') {
        this.load(this.page);
      }
    });
  }

  delete(event: MouseEvent, w: Workspace): void {
    event.stopPropagation();

    if (!w.id) {
      console.error('Workspace ID missing', w);
      return;
    }

    this.modal.confirm({
      nzTitle: `Delete workspace "${w.name}"?`,
      nzContent: 'This action cannot be undone.',
      nzOkDanger: true,
      nzOnOk: () => {
        return this.service.deleteWorkspace(w.id).subscribe({
          next: () => {
            this.workspaces = this.workspaces.filter(x => x.id !== w.id);
            this.filteredWorkspaces = this.filteredWorkspaces.filter(x => x.id !== w.id);
          },
          error: (err) => {
            console.error('Failed to delete workspace', err);
            alert('Failed to delete workspace. Please try again.');
          }
        });
      }
    });
  }


  formatDate(arr?: number[]): string {
    if (!arr) return '';
    const [y, m, d, h, min] = arr;
    return `${d}-${m}-${y} ${h}:${min}`;
  }

  openCreateModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Create Workspace',
      nzContent: WorkspaceCreateComponent,
      nzFooter: null,
      nzWidth: 600,
      nzMaskClosable: false,
    });

    modalRef.afterClose.subscribe(result => {
      if (result === 'created') {
        this.load();
      }
    });
  }
}
