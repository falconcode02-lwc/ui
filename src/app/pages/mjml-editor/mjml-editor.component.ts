import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CodeEditorModule } from '@acrodata/code-editor';
import { oneDark } from '@codemirror/theme-one-dark';

import { v4 as uuidv4 } from 'uuid';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';

interface EmailBlock {
  id: string;
  type: 'text' | 'button' | 'image' | 'divider' | 'spacer' | 'columns' | 'hero' | 'navbar' | 'social';
  icon: string;
  label: string;
  properties: any;
  children?: EmailBlock[];
}

interface BlockTemplate {
  type: string;
  icon: string;
  label: string;
  description: string;
  category: 'layout' | 'content';
}

@Component({
  selector: 'app-mjml-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    NzButtonModule,
    NzIconModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzTabsModule,
    CodeEditorModule,
    NzDividerModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzDropDownModule,
    NzMenuModule,
      NzPageHeaderModule,
      NzSpaceModule
  ],
  templateUrl: './mjml-editor.component.html',
  styleUrls: ['./mjml-editor.component.scss']
})
export class MjmlEditorComponent {
  // Editor state
  blocks = signal<EmailBlock[]>([]);
  selectedBlock = signal<EmailBlock | null>(null);
  showPreview = signal(false);
  showMjmlCode = signal(true); // Always show code tab
  previewHtml = signal('');
  previewMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  mjmlCodeText = ''; // Regular property for ngModel binding
  editorTheme = oneDark;
  selectedTabIndex = signal(2); // 0=Preview, 1=MJML Code, 2=Properties
  
  // History for undo/redo
  history = signal<EmailBlock[][]>([[]]);
  historyIndex = signal(0);
  
  canUndo = computed(() => this.historyIndex() > 0);
  canRedo = computed(() => this.historyIndex() < this.history().length - 1);

  // Store the last selection for rich text formatting
  private savedSelection: Range | null = null;
  showFloatingToolbar = signal<boolean>(false);
  floatingToolbarPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Block templates organized by category
  blockTemplates: { [key: string]: BlockTemplate[] } = {
    content: [
      { type: 'text', icon: 'font-size', label: 'Text', description: 'Text paragraph', category: 'content' },
      { type: 'button', icon: 'link', label: 'Button', description: 'Call-to-action button', category: 'content' },
      { type: 'divider', icon: 'minus', label: 'Divider', description: 'Horizontal line', category: 'content' },
      { type: 'spacer', icon: 'column-height', label: 'Spacer', description: 'Vertical spacing', category: 'content' }
    ],
    layout: [
      { type: 'columns', icon: 'column-width', label: 'Columns', description: 'Multi-column layout', category: 'layout' },
      { type: 'hero', icon: 'picture', label: 'Hero', description: 'Hero banner section', category: 'layout' },
      { type: 'navbar', icon: 'menu', label: 'Navbar', description: 'Navigation bar', category: 'layout' },
      { type: 'image', icon: 'file-image', label: 'Image', description: 'Single image', category: 'layout' },
      { type: 'social', icon: 'share-alt', label: 'Social', description: 'Social media icons', category: 'layout' }
    ]
  };

  activeCategoryIndex = signal<number>(0); // 0=Content, 1=Layout, 2=Media

  constructor(private message: NzMessageService) {
    // Hide floating toolbar on click outside
    document.addEventListener('mousedown', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.floating-toolbar') && !target.closest('[contenteditable]')) {
        this.showFloatingToolbar.set(false);
      }
    });

    // Watch for block changes and update preview
    effect(() => {
      const blocks = this.blocks();
      const preview = this.showPreview();
      
      if (preview && blocks.length > 0) {
        // Delay to ensure DOM is ready
        setTimeout(() => {
          this.updatePreview();
        }, 100);
      }
    });

    // Watch for block changes and update MJML code
    effect(() => {
      const blocks = this.blocks();
      const mjml = this.generateMjml();
      this.mjmlCodeText = mjml;
    });
  }

  // Create a new block from template
  createBlock(type: string): EmailBlock {
    const id = uuidv4();
    const baseBlock = {
      id,
      type: type as any,
      icon: this.getIconForType(type),
      label: this.getLabelForType(type)
    };

    switch (type) {
      case 'text':
        return {
          ...baseBlock,
          properties: {
            content: 'Enter your text here',
            fontSize: '14px',
            color: '#000000',
            align: 'left',
            fontWeight: 'normal',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '25px',
            paddingRight: '25px'
          }
        };
      case 'button':
        return {
          ...baseBlock,
          properties: {
            content: 'Click Me',
            href: 'https://example.com',
            backgroundColor: '#ff6d5a',
            color: '#ffffff',
            borderRadius: '4px',
            align: 'center',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '25px',
            paddingRight: '25px'
          }
        };
      case 'image':
        return {
          ...baseBlock,
          properties: {
            src: 'https://via.placeholder.com/600x300',
            alt: 'Image',
            width: '600px',
            align: 'center',
            href: '',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '25px',
            paddingRight: '25px'
          }
        };
      case 'divider':
        return {
          ...baseBlock,
          properties: {
            borderColor: '#cccccc',
            borderWidth: '1px',
            borderStyle: 'solid',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '25px',
            paddingRight: '25px'
          }
        };
      case 'spacer':
        return {
          ...baseBlock,
          properties: {
            height: '20px'
          }
        };
      case 'columns':
        return {
          ...baseBlock,
          properties: {
            backgroundColor: 'transparent',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '0px',
            paddingRight: '0px'
          },
          children: [
            {
              id: uuidv4(),
              type: 'text' as any,
              icon: 'font-size',
              label: 'Column 1',
              properties: {
                width: '50%'
              },
              children: []
            },
            {
              id: uuidv4(),
              type: 'text' as any,
              icon: 'font-size',
              label: 'Column 2',
              properties: {
                width: '50%'
              },
              children: []
            }
          ]
        };
      case 'hero':
        return {
          ...baseBlock,
          properties: {
            mode: 'fluid-height',
            backgroundUrl: 'https://via.placeholder.com/600x400',
            backgroundColor: '#2a2a2a',
            height: '400px',
            paddingTop: '100px',
            paddingBottom: '100px',
            paddingLeft: '25px',
            paddingRight: '25px'
          },
          children: [
            {
              id: uuidv4(),
              type: 'text',
              icon: 'font-size',
              label: 'Hero Text',
              properties: {
                content: 'Hero Title',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center',
                fontWeight: 'bold'
              }
            }
          ]
        };
      case 'navbar':
        return {
          ...baseBlock,
          properties: {
            backgroundColor: '#ffffff',
            hamburger: 'hamburger',
            paddingTop: '10px',
            paddingBottom: '10px'
          },
          children: []
        };
      case 'social':
        return {
          ...baseBlock,
          properties: {
            mode: 'horizontal',
            iconSize: '20px',
            align: 'center',
            paddingTop: '10px',
            paddingBottom: '10px',
            socialLinks: [
              { name: 'facebook', href: 'https://facebook.com' },
              { name: 'twitter', href: 'https://twitter.com' },
              { name: 'linkedin', href: 'https://linkedin.com' }
            ]
          }
        };
      default:
        return baseBlock as EmailBlock;
    }
  }

  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      text: 'font-size',
      button: 'link',
      image: 'file-image',
      divider: 'minus',
      spacer: 'column-height',
      columns: 'column-width',
      hero: 'picture',
      navbar: 'menu',
      social: 'share-alt'
    };
    return icons[type] || 'question';
  }

  getLabelForType(type: string): string {
    const labels: { [key: string]: string } = {
      text: 'Text',
      button: 'Button',
      image: 'Image',
      divider: 'Divider',
      spacer: 'Spacer',
      columns: 'Columns',
      hero: 'Hero',
      navbar: 'Navbar',
      social: 'Social'
    };
    return labels[type] || 'Block';
  }

  // Drag and drop handlers
  onBlockDrop(event: CdkDragDrop<EmailBlock[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const block = this.createBlock(event.previousContainer.data[event.previousIndex].type);
      this.blocks.update(blocks => {
        const newBlocks = [...blocks];
        newBlocks.splice(event.currentIndex, 0, block);
        return newBlocks;
      });
      this.saveHistory();
    }
  }

  onTemplateDrag(event: CdkDragDrop<any>) {
    if (event.previousContainer !== event.container) {
      const templateType = event.item.data.type;
      const block = this.createBlock(templateType);
      
      this.blocks.update(blocks => {
        const newBlocks = [...blocks];
        newBlocks.splice(event.currentIndex, 0, block);
        return newBlocks;
      });
      
      this.saveHistory();
      this.message.success(`${this.getLabelForType(templateType)} added`);
    }
  }

  // Block operations
  selectBlock(block: EmailBlock) {
    this.selectedBlock.set(block);
    // Switch to Properties tab when a block is selected
    this.selectedTabIndex.set(2); // Properties tab
  }

  duplicateBlock(block: EmailBlock) {
    const newBlock = JSON.parse(JSON.stringify(block));
    newBlock.id = uuidv4();
    if (newBlock.children) {
      newBlock.children = newBlock.children.map((child: EmailBlock) => ({
        ...child,
        id: uuidv4()
      }));
    }

    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === block.id);
    if (index !== -1) {
      this.blocks.update(blocks => {
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
      });
      this.saveHistory();
      this.message.success('Block duplicated');
    }
  }

  deleteBlock(block: EmailBlock | string, event?: any) {
    const blockId = typeof block === 'string' ? block : block.id;
    
    // First try to delete from top level
    let found = false;
    this.blocks.update(blocks => {
      const filtered = blocks.filter(b => b.id !== blockId);
      if (filtered.length !== blocks.length) {
        found = true;
        return filtered;
      }
      
      // If not found at top level, search in nested blocks (columns)
      const newBlocks = JSON.parse(JSON.stringify(blocks));
      for (const parentBlock of newBlocks) {
        if (parentBlock.children) {
          for (const column of parentBlock.children) {
            if (column.children) {
              const originalLength = column.children.length;
              column.children = column.children.filter((child: EmailBlock) => child.id !== blockId);
              if (column.children.length !== originalLength) {
                found = true;
                break;
              }
            }
          }
        }
      }
      return newBlocks;
    });
    
    if (found) {
      if (this.selectedBlock()?.id === blockId) {
        this.selectedBlock.set(null);
      }
      this.saveHistory();
      this.message.success('Block deleted');
    }
     event.stopPropagation();
  }

  moveBlock(blockId: string, direction: 'up' | 'down') {
    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    this.blocks.update(blocks => {
      const newBlocks = [...blocks];
      moveItemInArray(newBlocks, index, newIndex);
      return newBlocks;
    });
    this.saveHistory();
  }

  // Handle drop into column
  onColumnDrop(event: CdkDragDrop<EmailBlock[]>, parentBlock: EmailBlock, column: EmailBlock) {
    if (event.previousContainer !== event.container) {
      // Dropping from template or from another location
      let newBlock: EmailBlock;
      
      if (event.item.data && event.item.data.type) {
        // Dropping from template
        newBlock = this.createBlock(event.item.data.type);
      } else {
        // Dropping an existing block
        newBlock = event.previousContainer.data[event.previousIndex];
      }

      // Add to column's children
      if (!column.children) {
        column.children = [];
      }

      this.blocks.update(blocks => {
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        const targetParent = this.findBlockById(newBlocks, parentBlock.id);
        if (targetParent && targetParent.children) {
          const targetColumn = targetParent.children.find(c => c.id === column.id);
          if (targetColumn) {
            if (!targetColumn.children) {
              targetColumn.children = [];
            }
            targetColumn.children.splice(event.currentIndex, 0, newBlock);
          }
        }
        return newBlocks;
      });

      this.saveHistory();
      this.message.success('Block added to column');
    } else {
      // Reordering within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.saveHistory();
    }
  }

  // Add a new block to a column using the button
  addBlockToColumn(parentBlock: EmailBlock, column: EmailBlock, blockType: string) {
    const newBlock = this.createBlock(blockType);

    this.blocks.update(blocks => {
      const newBlocks = JSON.parse(JSON.stringify(blocks));
      const targetParent = this.findBlockById(newBlocks, parentBlock.id);
      if (targetParent && targetParent.children) {
        const targetColumn = targetParent.children.find(c => c.id === column.id);
        if (targetColumn) {
          if (!targetColumn.children) {
            targetColumn.children = [];
          }
          targetColumn.children.push(newBlock);
        }
      }
      return newBlocks;
    });

    this.saveHistory();
    this.message.success(`${this.getLabelForType(blockType)} added to column`);
  }

  // Add a new column to a columns block
  addColumnToBlock(block: EmailBlock, afterIndex: number) {
    if (!block.children) {
      block.children = [];
    }

    const newColumn: EmailBlock = {
      id: uuidv4(),
      type: 'text' as any,
      icon: 'font-size',
      label: `Column ${block.children.length + 1}`,
      properties: {
        width: `${100 / (block.children.length + 1)}%`
      },
      children: []
    };

    this.blocks.update(blocks => {
      const newBlocks = JSON.parse(JSON.stringify(blocks));
      const targetBlock = this.findBlockById(newBlocks, block.id);
      if (targetBlock && targetBlock.children) {
        targetBlock.children.splice(afterIndex + 1, 0, newColumn);
      }
      return newBlocks;
    });

    this.saveHistory();
    this.message.success('Column added');
  }

  // Remove a column from a columns block
  removeColumnFromBlock(block: EmailBlock, columnIndex: number) {
    if (!block.children || block.children.length <= 1) {
      this.message.warning('Cannot remove the last column');
      return;
    }

    this.blocks.update(blocks => {
      const newBlocks = JSON.parse(JSON.stringify(blocks));
      const targetBlock = this.findBlockById(newBlocks, block.id);
      if (targetBlock && targetBlock.children) {
        targetBlock.children.splice(columnIndex, 1);
      }
      return newBlocks;
    });

    this.saveHistory();
    this.message.success('Column removed');
  }

  // History management
  saveHistory() {
    const current = JSON.parse(JSON.stringify(this.blocks()));
    const history = this.history();
    const index = this.historyIndex();
    
    // Remove any history after current index
    const newHistory = history.slice(0, index + 1);
    newHistory.push(current);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      this.historyIndex.set(index + 1);
    }
    
    this.history.set(newHistory);
  }

  undo() {
    if (this.canUndo()) {
      this.historyIndex.update(i => i - 1);
      const state = this.history()[this.historyIndex()];
      this.blocks.set(JSON.parse(JSON.stringify(state)));
      this.message.info('Undo');
    }
  }

  redo() {
    if (this.canRedo()) {
      this.historyIndex.update(i => i + 1);
      const state = this.history()[this.historyIndex()];
      this.blocks.set(JSON.parse(JSON.stringify(state)));
      this.message.info('Redo');
    }
  }

  // Property updates
  updateBlockProperty(block: EmailBlock, property: string, value: any) {
    this.blocks.update(blocks => {
      const newBlocks = JSON.parse(JSON.stringify(blocks));
      const targetBlock = this.findBlockById(newBlocks, block.id);
      if (targetBlock) {
        targetBlock.properties[property] = value;
        
        // Update selected block to reflect changes
        if (this.selectedBlock()?.id === block.id) {
          this.selectedBlock.set(targetBlock);
        }
      }
      return newBlocks;
    });
    
    // Trigger preview update if needed
    if (this.showPreview()) {
      this.updatePreview();
    }
  }

  // Save selection when user selects text
  saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedSelection = selection.getRangeAt(0).cloneRange();
      
      // Show floating toolbar if text is selected
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position toolbar above the selection
        this.floatingToolbarPosition.set({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + (rect.width / 2)
        });
        this.showFloatingToolbar.set(true);
      } else {
        this.showFloatingToolbar.set(false);
      }
    } else {
      this.showFloatingToolbar.set(false);
    }
  }

  // Restore saved selection
  restoreSelection() {
    const selection = window.getSelection();
    if (this.savedSelection && selection) {
      selection.removeAllRanges();
      selection.addRange(this.savedSelection);
    }
  }

  // Rich text formatting methods
  formatSelectedText(command: string) {
    this.restoreSelection();
    document.execCommand(command, false);
    this.saveSelection();
    // Keep toolbar visible after formatting
    setTimeout(() => this.showFloatingToolbar.set(true), 10);
  }

  formatSelectedTextColor(color: string) {
    this.restoreSelection();
    document.execCommand('foreColor', false, color);
    this.saveSelection();
    // Keep toolbar visible after formatting
    setTimeout(() => this.showFloatingToolbar.set(true), 10);
  }

  clearFormatting() {
    this.restoreSelection();
    document.execCommand('removeFormat', false);
    this.saveSelection();
    // Keep toolbar visible after formatting
    setTimeout(() => this.showFloatingToolbar.set(true), 10);
  }

  findBlockById(blocks: EmailBlock[], id: string): EmailBlock | null {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = this.findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Preview
  togglePreview() {
    this.showPreview.update(v => !v);
    if (this.showPreview()) {
      this.updatePreview();
    }
  }

  async updatePreview() {
    try {
      const mjml2html = (await import('mjml-browser')).default;
      const mjmlCode = this.generateMjml();
      const result = mjml2html(mjmlCode, {
        validationLevel: 'soft',
        minify: false
      });
      
      this.previewHtml.set(result.html);
    } catch (error) {
      console.error('Preview error:', error);
      this.message.error('Failed to generate preview');
    }
  }

  generateMjml(): string {
    let mjml = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f5f5f5">
`;

    this.blocks().forEach(block => {
      mjml += this.blockToMjml(block, 2);
    });

    mjml += `  </mj-body>
</mjml>`;
    return mjml;
  }

  blockToMjml(block: EmailBlock, indent: number): string {
    const space = ' '.repeat(indent);
    const props = block.properties;
    let mjml = '';

    const padding = `padding-top="${props.paddingTop || '10px'}" padding-bottom="${props.paddingBottom || '10px'}" padding-left="${props.paddingLeft || '25px'}" padding-right="${props.paddingRight || '25px'}"`;

    switch (block.type) {
      case 'text':
        const fontFamily = props.fontFamily ? `font-family="${props.fontFamily}"` : '';
        const fontStyle = props.fontStyle ? `font-style="${props.fontStyle}"` : '';
        mjml = `${space}<mj-section ${padding}>
${space}  <mj-column>
${space}    <mj-text font-size="${props.fontSize}" color="${props.color}" align="${props.align}" font-weight="${props.fontWeight || 'normal'}" ${fontFamily} ${fontStyle}>
${space}      ${props.content}
${space}    </mj-text>
${space}  </mj-column>
${space}</mj-section>\n`;
        break;

      case 'button':
        mjml = `${space}<mj-section ${padding}>
${space}  <mj-column>
${space}    <mj-button href="${props.href}" background-color="${props.backgroundColor}" color="${props.color}" border-radius="${props.borderRadius}" align="${props.align}">
${space}      ${props.content}
${space}    </mj-button>
${space}  </mj-column>
${space}</mj-section>\n`;
        break;

      case 'image':
        const imageHref = props.href ? `href="${props.href}"` : '';
        mjml = `${space}<mj-section ${padding}>
${space}  <mj-column>
${space}    <mj-image src="${props.src}" alt="${props.alt}" width="${props.width}" align="${props.align}" ${imageHref} />
${space}  </mj-column>
${space}</mj-section>\n`;
        break;

      case 'divider':
        mjml = `${space}<mj-section ${padding}>
${space}  <mj-column>
${space}    <mj-divider border-color="${props.borderColor}" border-width="${props.borderWidth}" border-style="${props.borderStyle || 'solid'}" />
${space}  </mj-column>
${space}</mj-section>\n`;
        break;

      case 'spacer':
        mjml = `${space}<mj-section>
${space}  <mj-column>
${space}    <mj-spacer height="${props.height}" />
${space}  </mj-column>
${space}</mj-section>\n`;
        break;

      case 'columns':
        mjml = `${space}<mj-section background-color="${props.backgroundColor}" ${padding}>
`;
        block.children?.forEach(column => {
          const columnWidth = column.properties.width || 'auto';
          mjml += `${space}  <mj-column width="${columnWidth}">
`;
          // Add nested blocks within the column
          if (column.children && column.children.length > 0) {
            column.children.forEach(childBlock => {
              const childProps = childBlock.properties;
              switch (childBlock.type) {
                case 'text':
                  const childFontFamily = childProps.fontFamily ? `font-family="${childProps.fontFamily}"` : '';
                  const childFontStyle = childProps.fontStyle ? `font-style="${childProps.fontStyle}"` : '';
                  mjml += `${space}    <mj-text font-size="${childProps.fontSize}" color="${childProps.color}" align="${childProps.align}" font-weight="${childProps.fontWeight || 'normal'}" ${childFontFamily} ${childFontStyle}>
${space}      ${childProps.content}
${space}    </mj-text>
`;
                  break;
                case 'button':
                  mjml += `${space}    <mj-button href="${childProps.href}" background-color="${childProps.backgroundColor}" color="${childProps.color}" border-radius="${childProps.borderRadius}" align="${childProps.align}">
${space}      ${childProps.content}
${space}    </mj-button>
`;
                  break;
                case 'image':
                  const childImageHref = childProps.href ? `href="${childProps.href}"` : '';
                  mjml += `${space}    <mj-image src="${childProps.src}" alt="${childProps.alt}" width="${childProps.width}" align="${childProps.align}" ${childImageHref} />
`;
                  break;
                case 'divider':
                  mjml += `${space}    <mj-divider border-color="${childProps.borderColor}" border-width="${childProps.borderWidth}" border-style="${childProps.borderStyle || 'solid'}" />
`;
                  break;
                case 'spacer':
                  mjml += `${space}    <mj-spacer height="${childProps.height}" />
`;
                  break;
              }
            });
          }
          mjml += `${space}  </mj-column>
`;
        });
        mjml += `${space}</mj-section>\n`;
        break;

      case 'hero':
        mjml = `${space}<mj-hero mode="${props.mode}" background-url="${props.backgroundUrl}" background-color="${props.backgroundColor}" height="${props.height}" ${padding}>
`;
        block.children?.forEach(child => {
          mjml += `${space}  <mj-text font-size="${child.properties.fontSize}" color="${child.properties.color}" align="${child.properties.align}" font-weight="${child.properties.fontWeight || 'normal'}">
${space}    ${child.properties.content}
${space}  </mj-text>
`;
        });
        mjml += `${space}</mj-hero>\n`;
        break;

      case 'social':
        mjml = `${space}<mj-section ${padding}>
${space}  <mj-column>
${space}    <mj-social mode="${props.mode}" icon-size="${props.iconSize}" align="${props.align}">
`;
        props.socialLinks?.forEach((link: any) => {
          mjml += `${space}      <mj-social-element name="${link.name}" href="${link.href}" />
`;
        });
        mjml += `${space}    </mj-social>
${space}  </mj-column>
${space}</mj-section>\n`;
        break;
    }

    return mjml;
  }

  // Export
  async exportHtml() {
    try {
      const mjml2html = (await import('mjml-browser')).default;
      // Use the current MJML code text (which may have been manually edited)
      const mjmlCode = this.mjmlCodeText || this.generateMjml();
      const result = mjml2html(mjmlCode);

      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-${Date.now()}.html`;
      link.click();
      URL.revokeObjectURL(url);
      this.message.success('HTML exported successfully');
    } catch (error) {
      this.message.error('Failed to export HTML');
    }
  }

  exportMjml() {
    // Use the current MJML code text (which may have been manually edited)
    const mjml = this.mjmlCodeText || this.generateMjml();
    const blob = new Blob([mjml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-${Date.now()}.mjml`;
    link.click();
    URL.revokeObjectURL(url);
    this.message.success('MJML exported successfully');
  }

  clearCanvas() {
    this.blocks.set([]);
    this.selectedBlock.set(null);
    this.saveHistory();
    this.message.success('Canvas cleared');
  }

  // Copy MJML code to clipboard
  copyMjmlCode() {
    const mjml = this.mjmlCodeText;
    if (!mjml) {
      this.message.warning('No MJML code to copy');
      return;
    }

    navigator.clipboard.writeText(mjml).then(() => {
      this.message.success('MJML code copied to clipboard');
    }).catch(() => {
      this.message.error('Failed to copy to clipboard');
    });
  }

  // Update blocks from manually edited MJML code
  async updateFromMjmlCode() {
    try {
      const mjmlCode = this.mjmlCodeText;
      
      if (!mjmlCode || !mjmlCode.trim()) {
        this.message.warning('MJML code is empty');
        return;
      }

      // Validate MJML by trying to compile it
      const mjml2html = (await import('mjml-browser')).default;
      const result = mjml2html(mjmlCode, {
        validationLevel: 'soft',
        minify: false
      });

      if (result.errors && result.errors.length > 0) {
        console.warn('MJML validation warnings:', result.errors);
        const errorMessages = result.errors.map(e => e.message).join(', ');
        this.message.warning(`MJML has warnings: ${errorMessages.substring(0, 100)}...`);
      }

      // Update preview with the manually edited code
      this.previewHtml.set(result.html);
      
      // Note: Parsing MJML back to visual blocks is complex
      // The edited code will be used when exporting
      // Visual blocks won't reflect manual changes
      this.message.success('MJML code validated and preview updated! Export will use this code.');
      
    } catch (error: any) {
      console.error('MJML validation error:', error);
      this.message.error(`Invalid MJML: ${error.message || 'Syntax error'}`);
    }
  }

  trackByBlockId(index: number, block: EmailBlock): string {
    return block.id;
  }
}
