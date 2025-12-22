import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { CodeEditor } from "@acrodata/code-editor";
import { languages } from '@codemirror/language-data';
import { v4 as uuidv4 } from 'uuid';

interface MjmlComponent {
  id: string;
  type: 'text' | 'button' | 'image' | 'divider' | 'spacer' | 'social' | 'column' | 'section' | 'raw';
  icon: string;
  label: string;
  children?: MjmlComponent[];
  properties: {
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    content?: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    backgroundColor?: string;
    borderRadius?: string;
    href?: string;
    src?: string;
    width?: string;
    height?: string;
    alt?: string;
    borderColor?: string;
    borderWidth?: string;
    spacerHeight?: string;
    mode?: 'horizontal' | 'vertical';
    iconSize?: string;
    socialLinks?: Array<{ name: string; href: string }>;
    fullWidth?: boolean;
  };
}

interface ComponentTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-mjml-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDividerModule,
    NzDrawerModule,
    NzFormModule,
    NzCheckboxModule,
    NzEmptyModule,
    NzResizableModule,
    NzDropDownModule,
    CodeEditor
  ],
  templateUrl: './mjml-builder.component.html',
  styleUrls: ['./mjml-builder.component.scss']
})
export class MjmlBuilderComponent {
  private message = inject(NzMessageService);

  // Code editor configuration
  languages = languages;
  extensions: any = [];
  editorOptions: any = {
    language: 'html',
    theme: 'dark',
    setup: 'basic',
    disabled: false,
    readonly: false,
    placeholder: 'MJML code will appear here...',
    indentWithTab: true,
    indentUnit: '',
    lineWrapping: true,
    highlightWhitespace: false,
  };

  // Signals
  components = signal<MjmlComponent[]>([]);
  selectedComponent = signal<MjmlComponent | null>(null);
  isPropertiesDrawerVisible = signal(false);
  showCodeEditor = signal(false);
  showPreview = signal(true);
  mjmlCode = signal<string>('');
  previewHtml = signal<string>('');
  previewWidth = 400;
  private updateDebounceTimer: any;

  constructor() {
    // Watch for component changes and update preview
    effect(() => {
      // Access components signal to track changes
      const comps = this.components();
      // Debounce the preview update
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = setTimeout(() => {
        this.updateMjmlCode();
      }, 300);
    });
  }

  ngOnInit() {
    // Initial preview update
    this.updatePreview();
  }

  // Component Templates
  componentTemplates: ComponentTemplate[] = [
    { type: 'text', label: 'Text', icon: 'font-size', description: 'Text block' },
    { type: 'button', label: 'Button', icon: 'link', description: 'Call-to-action button' },
    { type: 'image', label: 'Image', icon: 'picture', description: 'Image block' },
    { type: 'divider', label: 'Divider', icon: 'minus', description: 'Horizontal line' },
    { type: 'spacer', label: 'Spacer', icon: 'column-height', description: 'Vertical spacing' },
    { type: 'social', label: 'Social', icon: 'share-alt', description: 'Social media links' },
    { type: 'section', label: 'Section', icon: 'layout', description: 'Container row' },
    { type: 'column', label: 'Column', icon: 'column-width', description: 'Column layout' },
    { type: 'raw', label: 'Raw HTML', icon: 'code', description: 'Custom HTML code' }
  ];

  // Drag and Drop
  canDropInCanvas = (drag: CdkDrag, drop: CdkDropList): boolean => {
    const item = drag.data;
    // If dragging from templates, check if it's a column
    if (item && item.type === 'column') {
      //this.message.warning('Columns must be placed inside sections');
      return false;
    }
    return true;
  };

  onDrop(event: CdkDragDrop<MjmlComponent[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Adding from template or moving between containers
      const template = event.previousContainer.data[event.previousIndex] as any;
      
      // Validate: Don't allow standalone columns in root (they should be inside sections)
      if (template.type === 'column' && event.container.id === 'canvas') {
      //  this.message.warning('Columns must be placed inside sections. Drag a Section first, then add columns to it.');
        return;
      }
      
      const newComponent = this.createComponentFromTemplate(template.type);
      event.container.data.splice(event.currentIndex, 0, newComponent);
    }
    this.components.set([...this.components()]);
    this.updateMjmlCode();
  }

  onColumnDrop(event: CdkDragDrop<MjmlComponent[]>, parent: MjmlComponent) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const template = event.previousContainer.data[event.previousIndex] as any;
      
      // Validate: columns can't accept sections or other columns
      if (parent.type === 'column' && (template.type === 'column' || template.type === 'section')) {
        this.message.warning('Columns can only contain content components');
        return;
      }
      
      const newComponent = this.createComponentFromTemplate(template.type);
      if (!parent.children) parent.children = [];
      parent.children.splice(event.currentIndex, 0, newComponent);
    }
    this.components.set([...this.components()]);
    this.updateMjmlCode();
  }

  onSectionDrop(event: CdkDragDrop<MjmlComponent[]>, parent: MjmlComponent) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const template = event.previousContainer.data[event.previousIndex] as any;
      
      // Validate: sections can only accept columns
      if (parent.type === 'section' && template.type !== 'column') {
        this.message.warning('Sections can only contain columns');
        return;
      }
      
      const newComponent = this.createComponentFromTemplate(template.type);
      if (!parent.children) parent.children = [];
      parent.children.splice(event.currentIndex, 0, newComponent);
    }
    this.components.set([...this.components()]);
    this.updateMjmlCode();
  }

  createComponentFromTemplate(type: string): MjmlComponent {
    const baseComponent: MjmlComponent = {
      id: uuidv4(),
      type: type as any,
      icon: this.componentTemplates.find(t => t.type === type)?.icon || 'question',
      label: this.componentTemplates.find(t => t.type === type)?.label || type,
      properties: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '25px',
        paddingRight: '25px'
      }
    };

    switch (type) {
      case 'text':
        baseComponent.properties = { ...baseComponent.properties, content: 'Your text here', fontSize: '14px', color: '#ffffff', align: 'left', fontWeight: 'normal' };
        break;
      case 'button':
        baseComponent.properties = { ...baseComponent.properties, content: 'Click Me', href: 'https://example.com', backgroundColor: '#ff6d5a', color: '#ffffff', borderRadius: '4px', align: 'center' };
        break;
      case 'image':
        baseComponent.properties = { ...baseComponent.properties, src: 'https://via.placeholder.com/600x200', alt: 'Image', width: '600px', align: 'center' };
        break;
      case 'divider':
        baseComponent.properties = { ...baseComponent.properties, borderColor: '#000000', borderWidth: '1px' };
        break;
      case 'spacer':
        baseComponent.properties = { ...baseComponent.properties, spacerHeight: '20px' };
        break;
      case 'social':
        baseComponent.properties = { 
          ...baseComponent.properties, 
          mode: 'horizontal', 
          iconSize: '20px', 
          align: 'center',
          socialLinks: [
            { name: 'facebook', href: 'https://facebook.com' },
            { name: 'twitter', href: 'https://twitter.com' }
          ]
        };
        break;
      case 'section':
        baseComponent.properties = { ...baseComponent.properties, backgroundColor: 'transparent', fullWidth: false };
        baseComponent.children = [];
        break;
      case 'column':
        baseComponent.properties = { ...baseComponent.properties, backgroundColor: 'transparent' };
        baseComponent.children = [];
        break;
      case 'raw':
        baseComponent.properties = { ...baseComponent.properties, content: '<p>Your custom HTML here</p>' };
        break;
    }

    return baseComponent;
  }

  selectComponent(component: MjmlComponent) {
    this.selectedComponent.set(component);
    this.isPropertiesDrawerVisible.set(true);
  }

  closePropertiesDrawer() {
    this.isPropertiesDrawerVisible.set(false);
    this.selectedComponent.set(null);
  }

  onPropertyChange() {
    // Trigger signal update to refresh preview
    this.components.set([...this.components()]);
  }

  deleteComponent(id: string) {
    const newComponents = this.components().filter(c => c.id !== id);
    this.components.set(newComponents);
    this.updateMjmlCode();
  }

  deleteChildComponent(parent: MjmlComponent, childId: string) {
    if (parent.children) {
      parent.children = parent.children.filter(c => c.id !== childId);
      this.components.set([...this.components()]);
      this.updateMjmlCode();
    }
  }

  addSocialLink() {
    const comp = this.selectedComponent();
    if (comp && comp.properties.socialLinks) {
      comp.properties.socialLinks.push({ name: 'facebook', href: 'https://facebook.com' });
      this.components.set([...this.components()]);
    }
  }

  removeSocialLink(index: number) {
    const comp = this.selectedComponent();
    if (comp && comp.properties.socialLinks) {
      comp.properties.socialLinks.splice(index, 1);
      this.components.set([...this.components()]);
    }
  }

  toggleCodeEditor() {
    this.showCodeEditor.set(!this.showCodeEditor());
    if (this.showCodeEditor()) {
      this.updateMjmlCode();
    }
  }

  togglePreview() {
    this.showPreview.set(!this.showPreview());
    if (this.showPreview()) {
      this.updatePreview();
    }
  }

  onPreviewResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.previewResizeId);
    this.previewResizeId = requestAnimationFrame(() => {
      this.previewWidth = width!;
    });
  }

  private previewResizeId = -1;

  updateMjmlCode() {
    this.mjmlCode.set(this.generateMjml());
    this.updatePreview();
  }

  async updatePreview() {
    if (!this.showPreview()) return;
    
    try {
      const mjml2html = (await import('mjml-browser')).default;
      const mjmlCode = this.generateMjml();
      const result = mjml2html(mjmlCode);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('MJML preview has errors:', result.errors);
      }
      
      this.previewHtml.set(result.html);
    } catch (error) {
      console.error('Failed to generate preview with mjml-browser, using fallback:', error);
      // Fallback: Create a styled HTML preview without mjml-browser
      this.previewHtml.set(this.generateFallbackPreview());
    }
  }

  generateFallbackPreview(): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, Helvetica, sans-serif;
      background: #f4f4f4;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .section {
      width: 100%;
      display: block;
    }
    .column-container {
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    .column {
      display: table-cell;
      vertical-align: top;
    }
    .text-block {
      display: block;
      margin: 0;
      line-height: 1.5;
    }
    .button-wrapper {
      display: block;
    }
    .button-block {
      display: inline-block;
      padding: 12px 24px;
      text-decoration: none;
      font-weight: 500;
      border: none;
      cursor: pointer;
    }
    .image-wrapper {
      display: block;
      line-height: 0;
    }
    .image-block {
      display: block;
      max-width: 100%;
      height: auto;
      border: 0;
      outline: none;
    }
    .divider-block {
      width: 100%;
      border: none;
      border-top-style: solid;
      margin: 0;
    }
    .spacer-block {
      display: block;
      width: 100%;
    }
    .social-block {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .social-link {
      display: inline-block;
      text-decoration: none;
      padding: 8px;
      background: #3b5998;
      color: white;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="email-container">
`;

    this.components().forEach(component => {
      html += this.componentToPreviewHtml(component);
    });

    html += `
  </div>
</body>
</html>`;
    return html;
  }

  componentToPreviewHtml(component: MjmlComponent): string {
    const props = component.properties;
    const padding = `${props.paddingTop || '10px'} ${props.paddingRight || '25px'} ${props.paddingBottom || '10px'} ${props.paddingLeft || '25px'}`;
    let html = '';

    switch (component.type) {
      case 'text':
        html = `<div class="text-block" style="padding: ${padding}; font-size: ${props.fontSize || '14px'}; color: ${props.color || '#ffffff'}; text-align: ${props.align || 'left'}; font-weight: ${props.fontWeight || 'normal'};">${props.content || 'Your text here'}</div>`;
        break;
      case 'button':
        html = `<div class="button-wrapper" style="padding: ${padding}; text-align: ${props.align || 'center'};"><a href="${props.href || '#'}" class="button-block" style="background-color: ${props.backgroundColor || '#ff6d5a'}; color: ${props.color || '#ffffff'}; border-radius: ${props.borderRadius || '4px'};">${props.content || 'Click Me'}</a></div>`;
        break;
      case 'image':
        html = `<div class="image-wrapper" style="padding: ${padding}; text-align: ${props.align || 'center'};"><img src="${props.src || 'https://via.placeholder.com/600x200'}" alt="${props.alt || 'Image'}" class="image-block" style="width: ${props.width || '100%'};" /></div>`;
        break;
      case 'divider':
        html = `<hr class="divider-block" style="padding: ${padding}; border-top-width: ${props.borderWidth || '1px'}; border-top-color: ${props.borderColor || '#000000'};" />`;
        break;
      case 'spacer':
        html = `<div class="spacer-block" style="height: ${props.spacerHeight || '20px'};"></div>`;
        break;
      case 'social':
        html = `<div class="social-block" style="padding: ${padding}; justify-content: ${props.align === 'center' ? 'center' : props.align === 'right' ? 'flex-end' : 'flex-start'}; flex-direction: ${props.mode === 'vertical' ? 'column' : 'row'};">`;
        if (props.socialLinks && props.socialLinks.length > 0) {
          props.socialLinks.forEach((link: any) => {
            html += `<a href="${link.href || '#'}" class="social-link" style="font-size: ${props.iconSize || '20px'};">${link.name || 'Social'}</a>`;
          });
        } else {
          html += `<a href="#" class="social-link">Facebook</a>`;
        }
        html += `</div>`;
        break;
      case 'section':
        html = `<div class="section" style="padding: ${padding}; background-color: ${props.backgroundColor || 'transparent'};">`;
        if (component.children && component.children.length > 0) {
          html += '<div class="column-container">';
          component.children.forEach(child => {
            html += this.componentToPreviewHtml(child);
          });
          html += '</div>';
        } else {
          html += '<div style="padding: 20px; text-align: center; color: #999;">Empty section - add columns</div>';
        }
        html += `</div>`;
        break;
      case 'column':
        html = `<div class="column" style="padding: ${padding}; background-color: ${props.backgroundColor || 'transparent'};">`;
        if (component.children && component.children.length > 0) {
          component.children.forEach(child => {
            html += this.componentToPreviewHtml(child);
          });
        } else {
          html += '<div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">Empty column</div>';
        }
        html += `</div>`;
        break;
      case 'raw':
        html = props.content || '';
        break;
    }

    return html;
  }

  generateMjml(): string {
    let mjml = '<mjml>\n  <mj-head>\n    <mj-attributes>\n      <mj-all font-family="Arial, sans-serif" />\n    </mj-attributes>\n  </mj-head>\n  <mj-body>\n';
    
    this.components().forEach(component => {
      mjml += this.componentToMjml(component, 2);
    });
    
    mjml += '  </mj-body>\n</mjml>';
    return mjml;
  }

  componentToMjml(component: MjmlComponent, indent: number): string {
    const space = ' '.repeat(indent);
    let mjml = '';
    const props = component.properties;

    const padding = `padding-top="${props.paddingTop}" padding-bottom="${props.paddingBottom}" padding-left="${props.paddingLeft}" padding-right="${props.paddingRight}"`;

    switch (component.type) {
      case 'text':
        mjml = `${space}<mj-text font-size="${props.fontSize}" color="${props.color}" align="${props.align}" font-weight="${props.fontWeight}" ${padding}>\n${space}  ${props.content}\n${space}</mj-text>\n`;
        break;
      case 'button':
        mjml = `${space}<mj-button href="${props.href}" background-color="${props.backgroundColor}" color="${props.color}" border-radius="${props.borderRadius}" align="${props.align}" ${padding}>\n${space}  ${props.content}\n${space}</mj-button>\n`;
        break;
      case 'image':
        mjml = `${space}<mj-image src="${props.src}" alt="${props.alt}" width="${props.width}" align="${props.align}" ${padding} />\n`;
        break;
      case 'divider':
        mjml = `${space}<mj-divider border-color="${props.borderColor}" border-width="${props.borderWidth}" ${padding} />\n`;
        break;
      case 'spacer':
        mjml = `${space}<mj-spacer height="${props.spacerHeight}" />\n`;
        break;
      case 'social':
        mjml = `${space}<mj-social mode="${props.mode}" icon-size="${props.iconSize}" align="${props.align}" ${padding}>\n`;
        props.socialLinks?.forEach(link => {
          mjml += `${space}  <mj-social-element name="${link.name}" href="${link.href}" />\n`;
        });
        mjml += `${space}</mj-social>\n`;
        break;
      case 'section':
        mjml = `${space}<mj-section background-color="${props.backgroundColor}" full-width="${props.fullWidth ? 'full-width' : ''}" ${padding}>\n`;
        component.children?.forEach(child => {
          mjml += this.componentToMjml(child, indent + 2);
        });
        mjml += `${space}</mj-section>\n`;
        break;
      case 'column':
        mjml = `${space}<mj-column background-color="${props.backgroundColor}" ${padding}>\n`;
        component.children?.forEach(child => {
          mjml += this.componentToMjml(child, indent + 2);
        });
        mjml += `${space}</mj-column>\n`;
        break;
      case 'raw':
        mjml = `${space}<mj-raw>\n${space}  ${props.content}\n${space}</mj-raw>\n`;
        break;
    }

    return mjml;
  }

  exportMjml() {
    const mjmlCode = this.generateMjml();
    const blob = new Blob([mjmlCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.mjml';
    a.click();
    window.URL.revokeObjectURL(url);
    this.message.success('MJML exported successfully!');
  }

  async exportHtml() {
    try {
      // Dynamic import of mjml-browser
      const mjml2html = (await import('mjml-browser')).default;
      const mjmlCode = this.generateMjml();
      const result = mjml2html(mjmlCode);
      
      if (result.errors && result.errors.length > 0) {
        this.message.error('MJML compilation has errors');
        console.error(result.errors);
        return;
      }

      const blob = new Blob([result.html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email-template.html';
      a.click();
      window.URL.revokeObjectURL(url);
      this.message.success('HTML exported successfully!');
    } catch (error) {
      this.message.error('Failed to export HTML. Make sure mjml-browser is installed.');
      console.error(error);
    }
  }

  importMjml(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.mjmlCode.set(content);
      this.message.success('MJML imported successfully! Use code editor to view.');
      this.showCodeEditor.set(true);
    };
    reader.readAsText(file);
  }

  getPadding(props: any): string {
    return `${props.paddingTop} ${props.paddingRight} ${props.paddingBottom} ${props.paddingLeft}`;
  }

  trackByComponentId(index: number, component: MjmlComponent): string {
    return component.id;
  }

  trackByTemplateType(index: number, template: ComponentTemplate): string {
    return template.type;
  }

  getAllDropZoneIds(): string[] {
    const ids: string[] = ['canvas', 'componentTemplates'];
    this.components().forEach(comp => {
      if (comp.type === 'section' || comp.type === 'column') {
        ids.push(`${comp.type}-${comp.id}`);
        comp.children?.forEach(child => {
          if (child.type === 'column') {
            ids.push(`column-${child.id}`);
          }
        });
      }
    });
    return ids;
  }

  // Action bar helpers
  clearCanvas() {
    this.components.set([]);
    this.selectedComponent.set(null);
    this.updateMjmlCode();
    this.message.info('Canvas cleared');
  }

  addSection() {
    const newSection = this.createComponentFromTemplate('section');
    this.components.set([...this.components(), newSection]);
    this.updateMjmlCode();
    this.message.success('Section added');
  }

  addColumnToSection(section: MjmlComponent) {
    const newColumn = this.createComponentFromTemplate('column');
    if (!section.children) section.children = [];
    section.children.push(newColumn);
    this.components.set([...this.components()]);
    this.updateMjmlCode();
    this.message.success('Column added to section');
  }

  addContentToColumn(column: MjmlComponent, type: string) {
    const newContent = this.createComponentFromTemplate(type);
    if (!column.children) column.children = [];
    column.children.push(newContent);
    this.components.set([...this.components()]);
    this.updateMjmlCode();
    this.message.success(`${type} added to column`);
  }

  addComponent(type: string) {
    const target = this.selectedComponent();
    const newComp = this.createComponentFromTemplate(type);

    // Decide where to add based on selection and type
    if (!target) {
      // No selection: add to root
      this.components.set([...this.components(), newComp]);
      this.updateMjmlCode();
      return;
    }

    if (target.type === 'section') {
      if (type !== 'column') {
        this.message.warning('Sections can only contain columns');
        return;
      }
      target.children = target.children || [];
      target.children.push(newComp);
      this.components.set([...this.components()]);
      this.updateMjmlCode();
      return;
    }

    if (target.type === 'column') {
      if (type === 'section' || type === 'column') {
        this.message.warning('Columns can only contain content components');
        return;
      }
      target.children = target.children || [];
      target.children.push(newComp);
      this.components.set([...this.components()]);
      this.updateMjmlCode();
      return;
    }

    // Selected is a content component: add new component at root level
    this.components.set([...this.components(), newComp]);
    this.updateMjmlCode();
  }

  deleteSelected() {
    const sel = this.selectedComponent();
    if (!sel) return;
    const { list, index } = this.findParentListAndIndex(sel.id);
    if (index > -1) {
      list.splice(index, 1);
      this.components.set([...this.components()]);
      this.selectedComponent.set(null);
      this.updateMjmlCode();
    }
  }

  duplicateSelected() {
    const sel = this.selectedComponent();
    if (!sel) return;
    const { list, index } = this.findParentListAndIndex(sel.id);
    if (index > -1) {
      const clone = this.deepCloneWithNewIds(sel);
      list.splice(index + 1, 0, clone);
      this.components.set([...this.components()]);
      this.updateMjmlCode();
      this.message.success('Component duplicated');
    }
  }

  moveSelected(direction: 'up' | 'down') {
    const sel = this.selectedComponent();
    if (!sel) return;
    const { list, index } = this.findParentListAndIndex(sel.id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    moveItemInArray(list, index, newIndex);
    this.components.set([...this.components()]);
    this.updateMjmlCode();
  }

  moveComponentInCanvas(id: string, direction: 'up' | 'down') {
    const { list, index } = this.findParentListAndIndex(id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    moveItemInArray(list, index, newIndex);
    this.components.set([...this.components()]);
    this.updateMjmlCode();
  }

  private findParentListAndIndex(id: string): { parent: MjmlComponent | null, list: MjmlComponent[], index: number } {
    // Search at root first
    let idx = this.components().findIndex(c => c.id === id);
    if (idx > -1) {
      return { parent: null, list: this.components(), index: idx };
    }

    // Depth-first search for child lists
    const stack: Array<MjmlComponent> = [...this.components()];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.children && node.children.length) {
        const childIdx = node.children.findIndex(c => c.id === id);
        if (childIdx > -1) {
          return { parent: node, list: node.children, index: childIdx };
        }
        stack.push(...node.children);
      }
    }
    return { parent: null, list: this.components(), index: -1 };
  }

  private deepCloneWithNewIds(comp: MjmlComponent): MjmlComponent {
    const cloned: MjmlComponent = {
      ...comp,
      id: uuidv4(),
      properties: { ...comp.properties },
      children: comp.children ? comp.children.map(child => this.deepCloneWithNewIds(child)) : undefined
    };
    return cloned;
  }
}
