# MJML Email Builder

A drag-and-drop email template builder using MJML (Mailjet Markup Language) for creating responsive email templates.

## Features

### 📧 Email Components
- **Text**: Customizable text blocks with font size, color, alignment, and weight
- **Button**: Call-to-action buttons with custom colors, links, and styling
- **Image**: Responsive images with alt text and alignment
- **Divider**: Horizontal separators with custom color and width
- **Spacer**: Vertical spacing control
- **Social**: Social media links with icons (Facebook, Twitter, LinkedIn, Instagram, YouTube, GitHub)

### 🎨 Component Properties
Each component can be customized with:
- **Spacing**: Individual padding control (top, bottom, left, right)
- **Typography**: Font size, weight, color, and alignment
- **Colors**: Background and text colors with color picker
- **Dimensions**: Width, height, border radius
- **Links**: URLs for buttons and social icons

### 🔄 Drag and Drop
- Drag components from the left panel to the canvas
- Reorder components by dragging within the canvas
- Visual feedback during dragging
- Drop zone indicator when canvas is empty

### 👁️ Preview Modes
1. **MJML Code**: View the generated MJML markup
2. **Visual Preview**: See how the email will look (simulated)

### 💾 Export & Import
- **Export MJML**: Download the generated MJML code as a `.mjml` file
- **Copy MJML**: Copy MJML code to clipboard
- **Import MJML**: Load existing MJML templates (coming soon)

### ⚙️ Template Configuration
- Background color
- Max width (default: 600px for email compatibility)
- Font family

## Usage

### Adding Components
1. Drag a component from the left panel
2. Drop it onto the canvas
3. Click on the component to edit properties in the right drawer

### Editing Components
1. Select a component by clicking on it
2. Modify properties in the right drawer:
   - Spacing (padding)
   - Component-specific properties
3. Changes are reflected in real-time

### Managing Components
- **Duplicate**: Click the copy icon to duplicate a component
- **Delete**: Click the delete icon to remove a component
- **Reorder**: Drag and drop components to reorder them

### Exporting
1. Click the **Preview** button to view generated code
2. Switch between "MJML Code" and "Visual Preview" tabs
3. Click **Export** to download the MJML file
4. Click **Copy** to copy MJML to clipboard

## MJML Structure

The builder generates valid MJML code with the following structure:

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section>
      <mj-column>
        <!-- Components here -->
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

## Converting MJML to HTML

To convert the generated MJML to HTML for sending emails:

### Using MJML CLI
```bash
npm install -g mjml
mjml email-template.mjml -o email.html
```

### Using MJML API
```javascript
const mjml2html = require('mjml');
const htmlOutput = mjml2html(mjmlString);
console.log(htmlOutput.html);
```

### Using Online Tools
- [MJML.io Try It Live](https://mjml.io/try-it-live)
- Paste your MJML code and get HTML output

## Component Examples

### Text Block
```xml
<mj-text padding="10px 25px" font-size="14px" color="#000000" align="left">
  Your text content here
</mj-text>
```

### Button
```xml
<mj-button background-color="#ff6d5a" color="#ffffff" 
           border-radius="4px" href="https://example.com">
  Click Me
</mj-button>
```

### Image
```xml
<mj-image src="https://example.com/image.jpg" 
          alt="Description" width="600px" align="center" />
```

### Social Links
```xml
<mj-social mode="horizontal" icon-size="20px">
  <mj-social-element name="facebook" href="https://facebook.com" />
  <mj-social-element name="twitter" href="https://twitter.com" />
</mj-social>
```

## Best Practices

### Email Compatibility
- Maximum width: 600px (standard for email clients)
- Use web-safe fonts: Arial, Helvetica, Georgia, Times New Roman
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

### Responsive Design
- MJML automatically generates responsive HTML
- Images scale to fit mobile screens
- Buttons are touch-friendly on mobile

### Content Guidelines
- Keep subject lines under 50 characters
- Use clear call-to-action buttons
- Optimize images (compress before use)
- Include alt text for all images

## Technical Details

### Dependencies
- Angular 18+ with Signals
- Angular CDK (Drag & Drop)
- ng-zorro-antd (UI components)
- uuid (unique component IDs)

### Component Interface
```typescript
interface MjmlComponent {
  id: string;
  type: 'text' | 'button' | 'image' | 'divider' | 'spacer' | 'social';
  icon: string;
  label: string;
  properties: {
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    content?: string;
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    // ... other properties
  };
}
```

## Future Enhancements

- [ ] Import MJML files
- [ ] Multi-column layouts (sections)
- [ ] Image upload and management
- [ ] Template library with pre-built designs
- [ ] Server-side MJML to HTML conversion
- [ ] Email testing across clients
- [ ] Undo/redo functionality
- [ ] Component groups and nesting
- [ ] Custom CSS injection
- [ ] Variable/placeholder support

## Resources

- [MJML Official Documentation](https://documentation.mjml.io/)
- [MJML Components Reference](https://documentation.mjml.io/#components)
- [Email Client Support Guide](https://www.caniemail.com/)
- [MJML GitHub Repository](https://github.com/mjmlio/mjml)

## Support

For issues or feature requests, please check the main project documentation or create an issue in the repository.
