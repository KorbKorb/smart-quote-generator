# Package Quoting System

## Overview
The package quoting system allows users to create quotes for multiple products at once, with automatic category grouping and bundle pricing discounts.

## Features

### 1. Multi-Product Input
- Paste multiple products in various formats
- Automatic product recognition and parsing
- Support for different input formats:
  - `Product Name x Quantity`
  - `Quantity x Product Name`
  - `Product Name (Quantity)`
  - `Product Name - Quantity`

### 2. Category Grouping
- Products automatically grouped by their assigned categories
- Category subtotals and breakdowns
- Collapsible category sections in the UI

### 3. Bundle Pricing & Discounts
- **Volume Discounts**: Based on quantity thresholds
- **Category Bundles**: Discounts for specific category combinations
- **Tiered Pricing**: Different discount levels based on quantity
- **Complete Package Deals**: Special pricing for multi-category orders

### 4. Package Templates
- Save frequently used packages as templates
- Quick-load templates for common orders
- Track template usage statistics

## Database Schema

### New Collections

1. **Products**
   - `name`: Product name
   - `category`: Product category for grouping
   - `material`: Material type
   - `thickness`: Product thickness
   - `basePrice`: Base unit price
   - `priceUnit`: Pricing unit (per_piece, per_sqft, etc.)
   - `sku`: Stock keeping unit
   - `isActive`: Product availability

2. **PackageQuotes**
   - `quoteId`: Reference to main quote
   - `packageName`: Name of the package
   - `items`: Array of products with quantities
   - `categories`: Category breakdown with subtotals
   - `appliedDiscounts`: List of applied discount rules
   - `pricing`: Complete pricing breakdown
   - `isTemplate`: Flag for template packages

3. **DiscountRules**
   - `name`: Rule name
   - `type`: Rule type (volume, category, bundle, combination)
   - `conditions`: Conditions for rule application
   - `discount`: Discount details (percentage, fixed, tiered)
   - `priority`: Rule application order

## API Endpoints

### Package Quote Routes (`/api/package-quotes`)

1. **POST `/parse-products`**
   - Parse text input to identify products
   - Returns found products and unmatched items

2. **POST `/calculate-pricing`**
   - Calculate package pricing with all discounts
   - Returns detailed pricing breakdown

3. **POST `/create`**
   - Create a new package quote
   - Option to save as template

4. **GET `/templates`**
   - Get all saved package templates

5. **GET `/templates/:id`**
   - Load a specific template

6. **GET `/discount-rules`**
   - Get all active discount rules

7. **GET `/products-by-category`**
   - Get all products grouped by category

8. **GET `/products/search?query=`**
   - Search for products by name, SKU, or category

## Sample Discount Rules

1. **Bulk Metal Sheets**: 10% off when ordering 5+ metal sheets
2. **Structural Steel Package**: 15% off I-beams and tubes together
3. **Fastener Bulk Discount**: Tiered discounts (5%, 10%, 15%)
4. **Complete Package**: 20% off when ordering from all categories

## Migration

Run the migration script to set up sample data:

```bash
cd backend
node migrations/001_add_products_and_categories.js
```

## Usage Example

1. User inputs multiple products:
   ```
   Mild Steel Sheet 4x8 x 5
   I-Beam 6" - 20
   Hex Bolt 1/2" x 2" (200)
   ```

2. System parses and identifies products
3. Calculates pricing with applicable discounts:
   - Bulk metal sheets discount (10% off sheets)
   - Fastener bulk discount (10% off bolts)
   - Complete package discount (20% off everything)

4. Displays organized quote by category with total savings

## Next Steps

- Frontend UI components for package builder
- Drag-and-drop interface for organizing items
- Advanced discount rule builder
- Package comparison tool
- Export functionality for package quotes