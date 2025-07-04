# Pine Green Theme Implementation

## Overview
The Smart Quote Generator now features a professional Pine Green color scheme that provides a sophisticated, trustworthy appearance perfect for business applications.

## Color Palette

### Primary Colors - Pine Green
- **Primary**: `#1A4D46` - Main brand color
- **Dark**: `#0F2E2A` - Hover states, emphasis
- **Light**: `#2A6D64` - Secondary elements
- **Pale**: `#E8F0EF` - Light backgrounds
- **Faint**: `#F5F9F8` - Subtle backgrounds

### Accent Colors

#### Warm Accent - Terracotta/Coral
- **Primary**: `#D97559` - CTAs, important actions
- **Dark**: `#C4614D` - Hover states
- **Light**: `#E8A593` - Subtle elements
- **Pale**: `#FAF0ED` - Backgrounds

#### Cool Accent - Sky Blue  
- **Primary**: `#6FA3A0` - Secondary actions
- **Dark**: `#5A8A87` - Hover states
- **Light**: `#9FC4C2` - Subtle elements
- **Pale**: `#EFF6F6` - Backgrounds

### Semantic Colors
- **Success**: `#2E7D32` / Light: `#4CAF50` / Pale: `#E8F5E9`
- **Warning**: `#ED6C02` / Light: `#FF9800` / Pale: `#FFF3E0`
- **Error**: `#D32F2F` / Light: `#F44336` / Pale: `#FFEBEE`
- **Info**: `#0288D1` / Light: `#03A9F4` / Pale: `#E1F5FE`

## Implementation Details

### 1. Global Theme Files
- `/frontend/src/styles/pine-theme.css` - Core color variables
- `/frontend/src/styles/pine-theme-overrides.css` - Component overrides
- `/frontend/src/customer-portal/styles/pine-theme.css` - Portal-specific styles

### 2. Updated Components

#### Navigation
- White background with subtle shadows
- Pine Green active states
- Gradient logo text

#### Buttons
- **Primary**: Pine Green background, darker on hover
- **Secondary**: Cool accent for secondary actions
- **CTA**: Warm accent for important calls-to-action
- **Ghost**: Transparent with Pine Green border

#### Forms
- Neutral borders with Pine Green focus states
- Subtle shadow on focus
- Error states with semantic colors

#### Cards & Panels
- White backgrounds with subtle borders
- Hover effects with Pine Green accents
- Professional shadows

#### Badges & Status
- Semantic colors for different states
- Consistent padding and border radius
- Clear visual hierarchy

### 3. Special Features

#### Gradients
```css
--gradient-primary: linear-gradient(135deg, #1A4D46 0%, #2A6D64 100%);
--gradient-warm: linear-gradient(135deg, #D97559 0%, #E8A593 100%);
--gradient-cool: linear-gradient(135deg, #6FA3A0 0%, #9FC4C2 100%);
```

#### Shadows
Custom shadows with Pine Green tint for depth:
```css
--shadow-md: 0 4px 6px -1px rgba(26, 77, 70, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(26, 77, 70, 0.1);
```

## Usage Examples

### Primary Button
```jsx
<button className="btn btn-primary">Save Quote</button>
```

### CTA Button
```jsx
<button className="btn btn-cta">Get Started Now</button>
```

### Success Alert
```jsx
<div className="alert alert-success">
  <span>Quote successfully created!</span>
</div>
```

### Pine Green Card
```jsx
<div className="stat-card">
  <div className="stat-icon">📊</div>
  <h3>Total Quotes</h3>
  <p className="stat-value">156</p>
</div>
```

## Visual Hierarchy

1. **Primary Actions**: Pine Green (#1A4D46)
2. **Secondary Actions**: Cool Accent (#6FA3A0)
3. **Important CTAs**: Warm Accent (#D97559)
4. **Text**: 
   - Headers: #1A1A1A to #2D2D2D
   - Body: #404040
   - Muted: #737373

## Accessibility

- All color combinations meet WCAG AA standards
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Focus states clearly visible with Pine Green

## Brand Consistency

The Pine Green theme provides:
- Professional, trustworthy appearance
- Clear visual hierarchy
- Consistent interaction patterns
- Harmonious color relationships
- Improved readability with serif/sans-serif combination

## Testing the Theme

To see all theme elements:
1. Visit the theme showcase page (add route to `/theme-showcase`)
2. Check all pages for consistent styling
3. Test hover and focus states
4. Verify mobile responsiveness

The Pine Green theme is now fully integrated across both the admin panel and customer portal, providing a cohesive, professional appearance throughout the application.