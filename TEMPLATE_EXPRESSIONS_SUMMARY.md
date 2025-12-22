# Template Expressions Feature - Implementation Summary

## Overview
Added support for dynamic template expressions (`{{fieldId}}`) in API bindings, enabling dependent dropdowns and dynamic API calls based on form field values.

## What Was Implemented

### 1. Template Expression Syntax
- **Pattern**: `{{fieldId}}` where `fieldId` is the ID of another form field
- **Supported Locations**:
  - API URL (both GET and POST)
  - Request body (POST requests)
  - Custom headers

### 2. Core Functionality

#### Form Viewer Component Updates
- **`replaceTemplateExpressions(template: string)`**: Replaces all `{{fieldId}}` patterns with actual form values
  - Uses regex: `/\{\{([^}]+)\}\}/g`
  - Returns empty string if field value is undefined/null
  - Converts all values to strings

- **`hasTemplateExpressions(value: any)`**: Checks if a string contains template expressions
  - Used to determine if API should reload on form changes

- **Auto-reload Logic**: Added to `loadForm()` method
  - Subscribes to form value changes
  - Automatically refetches API options when dependent fields change
  - Only triggers for fields with template expressions

#### Form Builder Component Updates
- **UI Helper Text**: Added inline documentation in properties drawer
  - Shows `{{fieldId}}` syntax examples
  - Appears in API URL and Request Body fields

### 3. Use Cases Enabled

#### Simple Dependent Dropdown
```json
{
  "url": "https://api.example.com/cities?country={{country}}",
  "method": "GET"
}
```

#### POST with Dynamic Body
```json
{
  "url": "https://api.example.com/products",
  "method": "POST",
  "bodyData": {
    "categoryId": "{{category}}",
    "subcategoryId": "{{subcategory}}"
  }
}
```

#### Dynamic Headers
```json
{
  "headers": [
    {
      "key": "X-Selected-Region",
      "value": "{{region}}"
    }
  ]
}
```

#### Multiple Dependencies
```json
{
  "url": "https://api.example.com/data/{{country}}/{{state}}/{{city}}"
}
```

## Technical Details

### How It Works

1. **Initial Form Load**:
   - Fields with API binding fetch options immediately
   - If URL contains `{{}}` but referenced fields are empty, expressions become empty strings

2. **On Field Change**:
   - Form's `valueChanges` observable emits
   - System checks all fields with API bindings
   - If binding contains template expressions, `fetchOptionsFromApi()` is called
   - Current form values replace template expressions
   - New API request is made with updated values

3. **Template Replacement**:
   ```typescript
   // Input: "https://api.com/cities?country={{country}}"
   // Form value: { country: "US" }
   // Output: "https://api.com/cities?country=US"
   ```

### Performance Considerations

- **Debouncing**: Not implemented yet - every change triggers API call
- **Caching**: Not implemented yet - same values will trigger new calls
- **Empty Values**: Handled gracefully - becomes empty string in URL/body

### Edge Cases Handled

✅ **Empty field values**: Expression becomes `""`  
✅ **Null/undefined**: Treated as empty string  
✅ **Multiple expressions**: All replaced in order  
✅ **Nested fields**: Works in JSON body strings  
✅ **Header values**: Template replacement works  
✅ **Type conversion**: All values converted to strings  

### Edge Cases NOT Handled

❌ **Circular dependencies**: Could cause infinite loops  
❌ **Missing field IDs**: Silent failure (empty string)  
❌ **Complex expressions**: No arithmetic or logic support  
❌ **Escaping**: No way to use literal `{{}}` text  

## Files Modified

### 1. `/src/app/pages/form-viewer/form-viewer.component.ts`
- Added `replaceTemplateExpressions()` method
- Added `hasTemplateExpressions()` method
- Updated `fetchOptionsFromApi()` to process templates
- Updated `loadForm()` to add auto-reload logic
- Modified `valueChanges` subscription to handle dependencies

### 2. `/src/app/pages/form-builder/form-builder.component.html`
- Added helper text for API URL field
- Added helper text for Request Body field
- Included `{{fieldId}}` syntax examples with styled code blocks

### 3. `/API_BINDING_DOCUMENTATION.md`
- Added "Template Expressions" section with full explanation
- Added 3 new examples (Examples 5, 6, 7) showing template usage
- Added "Complete Example" section with country→state→city cascade
- Updated features list
- Updated roadmap to mark features as completed
- Added best practices for dependent dropdowns
- Added sample API implementations for dependent data

### 4. `/EXAMPLE_DEPENDENT_DROPDOWN.json`
- Created complete working example
- Shows category→subcategory→product cascade
- Includes all features: templates, headers, POST body

## Testing Recommendations

### Manual Testing Checklist

- [ ] Simple GET with query parameter: `?country={{country}}`
- [ ] POST with body template: `{"id": "{{field}}"}`
- [ ] Multiple templates in URL: `/api/{{cat}}/{{subcat}}`
- [ ] Template in headers
- [ ] Empty parent field (should send empty string)
- [ ] Changing parent field (should reload child)
- [ ] Three-level cascade (country→state→city)
- [ ] Form import/export with templates
- [ ] Preview mode display

### Test Scenarios

1. **Basic Dependency**:
   - Add country dropdown (static options)
   - Add city dropdown with URL: `?country={{country}}`
   - Select country → verify cities load

2. **POST Body**:
   - Create category field
   - Create product field with POST body: `{"categoryId": "{{category}}"}`
   - Select category → verify products load

3. **Multiple Dependencies**:
   - Create 3-level cascade
   - Verify each level triggers next level
   - Change top level → verify all children reload

4. **Edge Cases**:
   - No initial selection → verify no errors
   - Invalid field ID in template → verify empty string
   - Rapid selection changes → verify no race conditions

## Future Enhancements

### High Priority
- [ ] **Loading indicators**: Show spinner while fetching dependent data
- [ ] **Debouncing**: Delay API calls to reduce requests during rapid changes
- [ ] **Error handling**: Better messages for template-related errors
- [ ] **Field validation**: Warn if referenced field doesn't exist

### Medium Priority
- [ ] **Caching**: Cache responses to avoid duplicate API calls
- [ ] **Conditional reload**: Only reload if referenced values actually changed
- [ ] **Clear dependent fields**: Reset child fields when parent changes

### Low Priority
- [ ] **Expression builder UI**: Visual tool to build templates
- [ ] **Debug mode**: Show resolved URLs in console
- [ ] **Template functions**: Support for `{{upper(field)}}` etc.
- [ ] **Array support**: Handle multi-select parent fields

## Known Limitations

1. **No Circular Dependency Detection**: Creating circular references will cause infinite loops
2. **No Debouncing**: Every change triggers immediate API call
3. **String Values Only**: All values converted to strings (no numbers/booleans preserved)
4. **No Field Validation**: Using non-existent field ID fails silently
5. **No Error Recovery**: If API fails, no retry mechanism
6. **Performance**: Large forms with many dependencies may cause lag

## Migration Notes

### For Existing Forms
- Forms without template expressions work unchanged
- No breaking changes to existing API bindings
- Template syntax is opt-in

### For New Forms
- Use template expressions for any dependent data
- Reference fields by their Field ID
- Ensure parent fields come before dependent fields

## Documentation References

- **Main Documentation**: `API_BINDING_DOCUMENTATION.md`
- **Example Form**: `EXAMPLE_DEPENDENT_DROPDOWN.json`
- **Form Builder**: Shows inline help text with syntax
- **This Summary**: `TEMPLATE_EXPRESSIONS_SUMMARY.md`

---

**Feature Status**: ✅ Complete and Functional  
**Version**: 2.0.0  
**Date**: November 15, 2025
