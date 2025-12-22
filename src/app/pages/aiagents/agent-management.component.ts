import { Component, Input } from '@angular/core';
import { HttpService } from '../../service/http-service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'agent-management',
  templateUrl: './agent-management.component.html',
  styleUrls: ['./agent-management.component.scss'],
  imports: [NzFormModule, ReactiveFormsModule, FormsModule, CommonModule, NzSelectModule, NzInputModule, NzRadioModule, NzButtonModule, NzCardModule,
    NzModalModule, NzListModule, NzSplitterModule, NzTableModule, NzIconModule, NzSpaceModule,
    NzPageHeaderModule, NzDropDownModule, NzPaginationModule, NzEmptyModule, NzPopconfirmModule
  ]
})
export class AgentManagementComponent {
  isEditMode: boolean = false;
  editingAgentId: string | null = null;
  editModalVisible: boolean = false;
  editAgentForm: import('@angular/forms').FormGroup;
  ngOnInit() {
    this.editAgentForm = this.fb.group({
      agentId: [''],
      model: [''],
      provider: [''],
      secretName: ['']
    });
  }
  editAgent(agent: any): void {
    this.isEditMode = true;
    this.editingAgentId = agent.agentId;
    this.agentForm.setValue({
      agentId: agent.agentId,
      model: agent.model,
      provider: agent.config?.provider || '',
      secretName: agent.config?.['openai.secretName'] || ''
    });
  }

  closeEditModal(): void {
    this.editModalVisible = false;
    this.editingAgentId = null;
  }

  updateAgent(): void {
    if (this.agentForm.invalid || !this.editingAgentId) {
      this.message.error('Please fill all required fields');
      return;
    }
    const formValue = this.agentForm.value;
    const agentRequest = {
      agentId: formValue.agentId,
      model: formValue.model,
      config: {
        provider: formValue.provider,
        'openai.secretName': formValue.secretName
      }
    };
    this.httpService.updateAgent(this.editingAgentId, agentRequest).subscribe({
      next: () => {
        this.message.success('Agent updated successfully');
        this.listAgents();
        this.cancelEdit();
      },
      error: () => {
        this.message.error('Failed to update agent');
      }
    });
  }
  cancelEdit(): void {
    this.isEditMode = false;
    this.editingAgentId = null;
    this.agentForm.reset();
  }

  deleteAgent(agent: any): void {
    this.httpService.deleteAgent(agent.agentId).subscribe({
      next: () => {
        this.message.success('Agent deleted successfully');
        this.listAgents();
      },
      error: () => {
        this.message.error('Failed to delete agent');
      }
    });
  }
  agents: any[] = [];
  paginatedAgents: any[] = [];
  searchQuery: string = '';
  pageIndex = 1;
  pageSize = 10;
  providerConfigs: Array<{ name: string }> = [];
  secretOptions: Array<{ name: string }> = [];
  agentForm: import('@angular/forms').FormGroup;

  constructor(private httpService: HttpService, private message: NzMessageService, private fb: FormBuilder) {
    this.agentForm = this.fb.group({
      agentId: [''],
      model: [''],
      provider: [''],
      secretName: ['']
    });
    this.editAgentForm = this.fb.group({
      agentId: [''],
      model: [''],
      provider: [''],
      secretName: ['']
    });
    this.listAgents();
    this.fetchProviderConfigs();
    this.fetchSecretOptions();
  }

  listAgents(): void {
    this.httpService.listAgents().subscribe({
      next: (data: any) => {
        this.agents = Array.isArray(data) ? data : [];
        this.updatePaginatedAgents();
      },
      error: () => {
        this.agents = [];
        this.message.error('Failed to load agents');
      }
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedAgents();
  }

  onSearchChange(query: string): void {
    this.pageIndex = 1;
    this.updatePaginatedAgents();
  }

  updatePaginatedAgents(): void {
    let filtered = this.agents;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = this.agents.filter(a =>
        (a.agentId && a.agentId.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q))
      );
    }
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    this.paginatedAgents = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  fetchProviderConfigs(): void {
    this.httpService.getProviderConfigs().subscribe({
      next: (data: any) => {
        this.providerConfigs = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.providerConfigs = [];
        this.message.error('Failed to load provider configs');
      }
    });
  }

  fetchSecretOptions(): void {
    this.httpService.listSecrets().subscribe({
      next: (data: any) => {
        this.secretOptions = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.secretOptions = [];
        this.message.error('Failed to load secrets');
      }
    });
  }

  createAgent(): void {
    if (this.agentForm.invalid) {
      this.message.error('Please fill all required fields');
      return;
    }
    const formValue = this.agentForm.value;
    const agentRequest = {
      agentId: formValue.agentId,
      model: formValue.model,
      config: {
        provider: formValue.provider,
        'openai.secretName': formValue.secretName
      }
    };
    this.httpService.createAgent(agentRequest).subscribe({
      next: () => {
        this.message.success('Agent created successfully');
        this.listAgents();
        this.agentForm.reset();
      },
      error: () => {
        this.message.error('Failed to create agent');
      }
    });
  }
}
