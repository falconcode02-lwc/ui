# API Binding for Dropdown Fields - Documentation

## Overview

The Form Builder now supports **dynamic dropdown options** loaded from server APIs. This allows you to bind dropdown (select) fields to external data sources instead of manually entering static options.

## Features

- ✅ Support for both **GET** and **POST** HTTP methods
- ✅ Configurable **property paths** for key and value extraction
- ✅ **Nested property access** using dot notation (e.g., `data.id`, `user.profile.name`)
- ✅ Optional **request body** for POST requests
- ✅ **Template expressions** - Use `{{fieldId}}` to reference other field values in URL, body, or headers
- ✅ **Dependent dropdowns** - Automatically reload options when referenced fields change
- ✅ **Custom headers** - Support for authentication, API keys, and custom headers
- ✅ Automatic **error handling** with user-friendly messages
- ✅ Visual indicator in form preview showing API URL
- ✅ Works seamlessly with existing features (multi-select, validation, conditions)

---

## How to Configure API Binding

### Step 1: Add a Dropdown Field

1. Open the Form Builder
2. Drag and drop a **Dropdown** field onto the canvas
3. Click on the field to open the properties panel

### Step 2: Enable API Binding

1. In the properties panel, scroll to the **"API Binding"** section
2. Check the box **"Bind from Server API"**
3. Configure the following settings:

#### Required Settings

| Setting | Description | Example |
|---------|-------------|---------|
| **API URL** | The endpoint URL to fetch options from | `https://api.example.com/countries` |
| **HTTP Method** | Request method (GET or POST) | `GET` |
| **Key Property Path** | Path to the option key in response | `id` or `data.countryCode` |
| **Value Property Path** | Path to the display value in response | `name` or `data.countryName` |

#### Optional Settings

| Setting | Description | When to Use |
|---------|-------------|-------------|
| **Request Body (JSON)** | JSON data to send with POST request | Only for POST method |
| **Headers** | Custom HTTP headers (key-value pairs) | For authentication, API keys, etc. |

---

## Template Expressions

### Overview

Template expressions allow you to create **dynamic, dependent dropdowns** by referencing values from other form fields. Use the syntax `{{fieldId}}` anywhere in:

- API URL
- Request body (POST)
- Custom headers

### Syntax

```
{{fieldId}}
```

Where `fieldId` is the **Field ID** of another field in the form.

### Use Cases

| Use Case | Example | Description |
|----------|---------|-------------|
| **Query Parameter** | `?country={{country}}` | Pass selected value as URL parameter |
| **URL Path** | `/api/cities/{{country}}/regions` | Dynamic URL segments |
| **POST Body** | `{"parentId": "{{category}}"}` | Include in request payload |
| **Headers** | `X-Filter: {{status}}` | Pass as custom header |
| **Multiple Fields** | `?country={{country}}&state={{state}}` | Reference multiple fields |

### How It Works

1. **Initial Load**: When form loads, if field has `{{}}` expressions but referenced fields are empty, the expression becomes an empty string
2. **On Change**: When any referenced field value changes, the API request is automatically triggered again
3. **Real-time Updates**: Options reload immediately when dependencies change

### Important Notes

⚠️ **Field Order Matters**: Make sure referenced fields appear **before** the dependent field in the form

⚠️ **Empty Values**: If referenced field is empty, expression evaluates to empty string (`""`)

⚠️ **Type Conversion**: All values are converted to strings automatically

⚠️ **Multiple Dependencies**: If you reference multiple fields, changes to any of them will trigger a reload

### Best Practices

1. **Use Meaningful Field IDs**: `country` instead of `field1`
2. **Handle Empty States**: Your API should handle empty values gracefully
3. **Loading States**: Consider adding placeholder text like "Select country first"
4. **Default Values**: Set default values on parent fields to trigger initial load
5. **Testing**: Test all combinations of field selections

---

## API Response Format

### Expected Response Structure

The API can return data in two formats:

#### Format 1: Direct Array
```json
[
  { "id": 1, "name": "Option 1" },
  { "id": 2, "name": "Option 2" },
  { "id": 3, "name": "Option 3" }
]
```

#### Format 2: Nested in 'data' Property
```json
{
  "data": [
    { "id": 1, "name": "Option 1" },
    { "id": 2, "name": "Option 2" },
    { "id": 3, "name": "Option 3" }
  ],
  "meta": {
    "total": 3
  }
}
```

### Property Path Examples

The form viewer uses **dot notation** to extract values from nested objects:

| API Response | Key Property | Value Property | Result |
|--------------|--------------|----------------|--------|
| `{ "id": 1, "name": "USA" }` | `id` | `name` | Key: 1, Value: USA |
| `{ "data": { "code": "US", "title": "United States" } }` | `data.code` | `data.title` | Key: US, Value: United States |
| `{ "country": { "iso": "US", "label": { "en": "USA" } } }` | `country.iso` | `country.label.en` | Key: US, Value: USA |

---

## Complete Examples

### Example 1: Simple GET Request

**Scenario:** Load countries from a public API

**Configuration:**
```
API URL: https://restcountries.com/v3.1/all
HTTP Method: GET
Key Property: cca2
Value Property: name.common
```

**API Response:**
```json
[
  {
    "cca2": "US",
    "name": {
      "common": "United States"
    }
  },
  {
    "cca2": "CA",
    "name": {
      "common": "Canada"
    }
  }
]
```

**Result:** Dropdown shows "United States", "Canada", etc. with country codes as values.

---

### Example 2: POST Request with Filter

**Scenario:** Load active users from your API with filtering

**Configuration:**
```
API URL: https://api.yourapp.com/users
HTTP Method: POST
Key Property: userId
Value Property: fullName
Request Body: {"status": "active", "role": "member"}
```

**Request Sent:**
```json
POST https://api.yourapp.com/users
Content-Type: application/json

{
  "status": "active",
  "role": "member"
}
```

**API Response:**
```json
{
  "data": [
    { "userId": 101, "fullName": "John Doe" },
    { "userId": 102, "fullName": "Jane Smith" }
  ]
}
```

**Result:** Dropdown shows "John Doe", "Jane Smith" with user IDs as values.

---

### Example 3: Nested Data Structure

**Scenario:** Load products with nested properties

**Configuration:**
```
API URL: https://api.store.com/products
HTTP Method: GET
Key Property: product.sku
Value Property: product.details.name
```

**API Response:**
```json
[
  {
    "product": {
      "sku": "ABC123",
      "details": {
        "name": "Laptop Computer",
        "price": 999
      }
    }
  }
]
```

**Result:** Dropdown shows "Laptop Computer" with "ABC123" as the value.

---

### Example 4: Using Custom Headers for Authentication

**Scenario:** Load data from a protected API requiring authentication

**Configuration:**
```
API URL: https://api.yourapp.com/secure/data
HTTP Method: GET
Key Property: id
Value Property: name
Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - X-API-Key: your-api-key-here
```

**Request Sent:**
```
GET https://api.yourapp.com/secure/data
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-API-Key: your-api-key-here
```

**API Response:**
```json
[
  { "id": 1, "name": "Protected Item 1" },
  { "id": 2, "name": "Protected Item 2" }
]
```

**Result:** Dropdown shows authenticated data with proper authorization.

---

### Example 5: Dependent Dropdowns with Template Expressions

**Scenario:** Load cities based on selected country (dependent dropdown)

**Form Fields:**
1. **Country Dropdown** (field ID: `country`)
2. **City Dropdown** (field ID: `city`) - depends on country selection

**City Field Configuration:**
```
API URL: https://api.example.com/cities?country={{country}}
HTTP Method: GET
Key Property: id
Value Property: name
```

**How it works:**
1. User selects "USA" (value: `US`) from country dropdown
2. City field automatically makes request to: `https://api.example.com/cities?country=US`
3. Cities for USA are loaded
4. When user changes country, cities reload automatically

**With POST Request:**
```
API URL: https://api.example.com/cities
HTTP Method: POST
Body: {"countryCode": "{{country}}", "active": true}
```

**Request Sent:**
```json
POST https://api.example.com/cities
Content-Type: application/json

{
  "countryCode": "US",
  "active": true
}
```

---

### Example 6: Multiple Dependencies

**Scenario:** Load products based on category and subcategory

**Form Fields:**
1. **Category** (field ID: `category`)
2. **Subcategory** (field ID: `subcategory`)
3. **Product** (field ID: `product`)

**Product Field Configuration:**
```
API URL: https://api.store.com/products/{{category}}/{{subcategory}}
HTTP Method: GET
```

Or with POST:
```
Body: {
  "categoryId": "{{category}}",
  "subcategoryId": "{{subcategory}}",
  "status": "available"
}
```

**Behavior:**
- When category changes → products reload
- When subcategory changes → products reload
- Both values are used in the API request

---

### Example 7: Template Expressions in Headers

**Scenario:** Pass user selection as a custom header

**Configuration:**
```
Headers:
  - X-Selected-Region: {{region}}
  - Authorization: Bearer token123
```

**Usage:**
When user selects region "EMEA", header becomes:
```
X-Selected-Region: EMEA
```

---

### Example 8: Multiple Headers for API Requirements

**Scenario:** API requires multiple custom headers

**Configuration:**
```
Headers:
  - Authorization: Bearer token123
  - X-API-Key: abc123xyz
  - X-Client-Id: my-app
  - Accept-Language: en-US
```

**Use Cases:**
- Bearer tokens for OAuth/JWT authentication
- API keys for service identification
- Custom headers for versioning or routing
- Language preferences
- Client identification

---

## Form JSON Export/Import

When you export a form with API binding, it includes all configuration:

```json
{
  "title": "User Registration",
  "submitButtonLabel": "Register",
  "resetButtonLabel": "Clear",
  "showResetButton": true,
  "fields": [
    {
      "id": "country",
      "type": "select",
      "label": "Select Country",
      "required": true,
      "multiple": false,
      "apiBinding": {
        "url": "https://api.example.com/countries",
        "method": "GET",
        "keyProperty": "code",
        "valueProperty": "name",
        "headers": [
          {
            "key": "Authorization",
            "value": "Bearer your-token-here"
          },
          {
            "key": "X-API-Key",
            "value": "your-api-key"
          }
        ]
      }
    }
  ]
}
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to load options" | Network error or invalid URL | Check URL and internet connection |
| Empty dropdown | Incorrect property paths | Verify key/value property paths match response |
| CORS error | API doesn't allow cross-origin requests | Configure CORS headers on server or use a proxy |
| 401/403 errors | Authentication required | Add Authorization header with token/API key |
| Invalid token errors | Expired or incorrect auth token | Update the Authorization header value |

### Debugging Tips

1. **Open Browser Console** - Check for network errors and API responses
2. **Verify API Response** - Test the URL in Postman or browser
3. **Check Property Paths** - Ensure paths match the actual response structure
4. **Test with Simple API** - Try a public API first to verify configuration

---

## Feature Compatibility

API binding works seamlessly with other form features:

| Feature | Compatible | Notes |
|---------|------------|-------|
| ✅ Multi-select | Yes | Works with `multiple: true` |
| ✅ Required validation | Yes | Validates after options load |
| ✅ Default values | Yes | Set after API response |
| ✅ Conditional visibility | Yes | Options load when field becomes visible |
| ✅ Conditional enable/disable | Yes | Options available when enabled |
| ✅ Field info tooltips | Yes | Shows alongside dropdown |
| ✅ Form export/import | Yes | Full configuration preserved |

---

## Preview Mode

In the Form Builder preview, fields with API binding show a visual indicator:

```
🔗 Options will be loaded from: https://api.example.com/countries
```

This helps you identify which dropdowns are dynamic vs static.

---

## Best Practices

### 1. **Use Descriptive Property Paths**
- Clear paths make maintenance easier
- Example: `data.countryCode` instead of just `code`

### 2. **Handle Large Datasets**
- Consider pagination for APIs with 100+ items
- Use filters in POST body to limit results

### 3. **Test APIs First**
- Verify API works in Postman before configuring
- Check response structure matches property paths

### 4. **Fallback Options**
- You can still define static options as fallback
- If API fails, static options won't display (by design)

### 5. **Consistent Key Types**
- Ensure keys are strings or numbers consistently
- Avoid mixing types (e.g., `"1"` vs `1`)

### 6. **Secure Authentication Headers**
- Never hardcode sensitive tokens in exported forms
- Use environment-specific values for different deployments
- Consider using short-lived tokens
- Rotate API keys regularly

### 7. **Common Header Patterns**
- **Bearer Token:** `Authorization: Bearer <token>`
- **API Key:** `X-API-Key: <key>` or `Authorization: ApiKey <key>`
- **Basic Auth:** `Authorization: Basic <base64-encoded-credentials>`
- **Custom Headers:** Use `X-` prefix for non-standard headers

### 8. **Dependent Dropdowns**
- Always reference field IDs, not labels
- Test with empty parent values
- Consider disabling dependent fields until parent is selected
- Use clear placeholder text (e.g., "Select country first")
- Avoid circular dependencies

---

## API Requirements

For best results, your API should:

1. **Return valid JSON**
2. **Support CORS** (if called from browser)
3. **Have consistent structure** across all items
4. **Include both key and value** properties in each item
5. **Return arrays** (or wrap in `data` property)

### Sample API Implementation (Node.js/Express)

```javascript
app.get('/api/countries', (req, res) => {
  res.json([
    { id: 1, name: 'United States' },
    { id: 2, name: 'Canada' },
    { id: 3, name: 'Mexico' }
  ]);
});
```

### Sample API with POST Filter

```javascript
app.post('/api/users', (req, res) => {
  const { status, role } = req.body;
  const users = database.users
    .filter(u => u.status === status && u.role === role);
  
  res.json({
    data: users.map(u => ({
      userId: u.id,
      fullName: `${u.firstName} ${u.lastName}`
    }))
  });
});
```

### Sample API with Authentication

```javascript
app.get('/api/secure/data', (req, res) => {
  // Verify Authorization header
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  // Verify token (implement your own logic)
  if (!verifyToken(token) || apiKey !== 'expected-key') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Return data
  res.json([
    { id: 1, name: 'Secure Item 1' },
    { id: 2, name: 'Secure Item 2' }
  ]);
});
```

### Sample API for Dependent Dropdowns

```javascript
// Get cities based on country (using query parameter)
app.get('/api/cities', (req, res) => {
  const { country } = req.query;
  
  if (!country) {
    return res.json([]); // Return empty if no country selected
  }
  
  const cities = database.cities.filter(c => c.countryCode === country);
  
  res.json(cities.map(city => ({
    id: city.id,
    name: city.name
  })));
});

// Get cities based on country (using POST body)
app.post('/api/cities', (req, res) => {
  const { countryCode, active } = req.body;
  
  let cities = database.cities;
  
  if (countryCode) {
    cities = cities.filter(c => c.countryCode === countryCode);
  }
  
  if (active !== undefined) {
    cities = cities.filter(c => c.active === active);
  }
  
  res.json({
    data: cities.map(city => ({
      id: city.id,
      name: city.name
    }))
  });
});

// Get products based on multiple dependencies
app.get('/api/products/:category/:subcategory', (req, res) => {
  const { category, subcategory } = req.params;
  
  const products = database.products
    .filter(p => p.categoryId === category && p.subcategoryId === subcategory);
  
  res.json(products);
});
```

---

## Roadmap

Future enhancements planned:

- 🔄 **Refresh button** - Manually reload options
- ✅ **Authentication headers** - Support for Bearer tokens, API keys (COMPLETED)
- ✅ **Template expressions** - Dynamic URLs and bodies with {{fieldId}} (COMPLETED)
- ✅ **Dependent dropdowns** - Auto-reload on field changes (COMPLETED)
- 📊 **Response caching** - Cache API responses to reduce calls
- ⏱️ **Retry logic** - Automatic retry on network failures
- 📝 **Custom transformations** - Transform response data before display
- 🔒 **Environment variables** - Use placeholders for sensitive data
- 🔄 **Loading indicators** - Show loading state while fetching

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify API response structure
3. Test with a simple public API first
4. Review property paths carefully

---

## Quick Reference

### Minimal Configuration
```json
{
  "apiBinding": {
    "url": "https://api.example.com/data",
    "method": "GET",
    "keyProperty": "id",
    "valueProperty": "name"
  }
}
```

### Full Configuration with Headers
```json
{
  "apiBinding": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "keyProperty": "data.id",
    "valueProperty": "data.title",
    "bodyData": {
      "filter": "active",
      "sort": "name"
    },
    "headers": [
      {
        "key": "Authorization",
        "value": "Bearer your-token"
      },
      {
        "key": "X-API-Key",
        "value": "your-api-key"
      }
    ]
  }
}
```

### Common Header Examples

**Bearer Token Authentication:**
```json
{
  "key": "Authorization",
  "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**API Key Authentication:**
```json
{
  "key": "X-API-Key",
  "value": "abc123xyz456"
}
```

**Basic Authentication:**
```json
{
  "key": "Authorization",
  "value": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
}
```

**Multiple Headers:**
```json
"headers": [
  { "key": "Authorization", "value": "Bearer token123" },
  { "key": "X-Client-Id", "value": "my-app" },
  { "key": "Accept-Language", "value": "en-US" }
]
```

---

## Complete Example: Country → State → City Cascade

Here's a complete example of a three-level dependent dropdown:

### Form Structure

```json
{
  "title": "Location Selection",
  "fields": [
    {
      "id": "country",
      "type": "select",
      "label": "Country",
      "required": true,
      "placeholder": "Select a country",
      "apiBinding": {
        "url": "https://api.example.com/countries",
        "method": "GET",
        "keyProperty": "code",
        "valueProperty": "name"
      }
    },
    {
      "id": "state",
      "type": "select",
      "label": "State/Province",
      "required": true,
      "placeholder": "Select country first",
      "apiBinding": {
        "url": "https://api.example.com/states?country={{country}}",
        "method": "GET",
        "keyProperty": "id",
        "valueProperty": "name"
      }
    },
    {
      "id": "city",
      "type": "select",
      "label": "City",
      "required": true,
      "placeholder": "Select state first",
      "apiBinding": {
        "url": "https://api.example.com/cities",
        "method": "POST",
        "keyProperty": "id",
        "valueProperty": "name",
        "bodyData": {
          "countryCode": "{{country}}",
          "stateId": "{{state}}"
        }
      }
    }
  ]
}
```

### How it Works

1. **Initial Load**:
   - Countries load immediately
   - States and cities are empty (waiting for parent selection)

2. **User Selects Country** (e.g., "USA" with code "US"):
   - State field makes request: `GET /states?country=US`
   - State options populate
   - City field remains empty

3. **User Selects State** (e.g., "California" with id "CA"):
   - City field makes request:
     ```
     POST /cities
     {"countryCode": "US", "stateId": "CA"}
     ```
   - City options populate

4. **User Changes Country**:
   - State options reload with new country
   - City options clear (waiting for new state selection)

### API Endpoints Required

```javascript
// 1. Get all countries
GET /api/countries
Response: [
  { "code": "US", "name": "United States" },
  { "code": "CA", "name": "Canada" }
]

// 2. Get states for a country
GET /api/states?country=US
Response: [
  { "id": "CA", "name": "California" },
  { "id": "TX", "name": "Texas" }
]

// 3. Get cities for country + state
POST /api/cities
Body: { "countryCode": "US", "stateId": "CA" }
Response: [
  { "id": "LA", "name": "Los Angeles" },
  { "id": "SF", "name": "San Francisco" }
]
```

---

**Last Updated:** November 15, 2025  
**Version:** 2.0.0
