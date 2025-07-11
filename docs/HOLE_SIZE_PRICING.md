# Hole Size Differentiation Pricing

## Overview
We've implemented a size-based pricing system for holes that more accurately reflects the actual manufacturing cost of piercing different sized holes in sheet metal.

## Pricing Tiers

### Small Holes (< 0.25" diameter)
- **Cost**: $0.30 per hole
- **Examples**: Pilot holes, wire pass-throughs, small fastener holes
- **Rationale**: Quick pierce time but may require precision tooling

### Medium Holes (0.25" - 0.75" diameter)
- **Cost**: $0.50 per hole
- **Examples**: Standard bolt holes, cable glands, ventilation
- **Rationale**: Standard tooling, moderate pierce time

### Large Holes (0.75" - 2.0" diameter)
- **Cost**: $0.75 per hole
- **Examples**: Large fasteners, bearing mounts, access ports
- **Rationale**: Longer pierce time, potential for multiple pierces

### Very Large Holes (> 2.0" diameter)
- **Cost**: $1.25 per hole
- **Examples**: Major access panels, large connectors, displays
- **Rationale**: May require special tooling or cutting strategy

## Implementation Details

### Backend Changes

1. **DXF Parser** (`backend/src/utils/dxfParser.js`)
   - Already extracts hole diameter information
   - Stores each hole with position and diameter

2. **Quote Calculator** (`backend/src/utils/quoteCalculator.js`)
   ```javascript
   // Size-based pricing logic
   if (diameter < 0.25) {
     costPerHole = 0.30; // Small holes
   } else if (diameter < 0.75) {
     costPerHole = 0.50; // Medium holes
   } else if (diameter < 2.0) {
     costPerHole = 0.75; // Large holes
   } else {
     costPerHole = 1.25; // Very large holes
   }
   ```

3. **Quote Response**
   - Includes hole distribution breakdown
   - Shows individual hole costs
   - Maintains backward compatibility

### Frontend Display

1. **Quote Breakdown**
   - Shows total piercing cost
   - Expandable detail showing hole size distribution
   - Individual hole costs for transparency

2. **3D Visualization**
   - Holes rendered proportionally to their actual size
   - Visual indication of different hole categories

## Benefits

### For Business
- **More Accurate Costing**: Reflects actual machine time and tooling requirements
- **Competitive Pricing**: Can offer better prices on parts with many small holes
- **Transparency**: Customers understand exactly what they're paying for

### For Customers
- **Fair Pricing**: Not overpaying for small holes
- **Design Optimization**: Can see cost impact of hole size choices
- **Quote Accuracy**: Better reflection of actual manufacturing complexity

## Testing

Run the test script to verify hole pricing:
```bash
node scripts/test-hole-size-pricing.js
```

This will:
1. Create a test DXF with various hole sizes
2. Analyze the file
3. Calculate a quote
4. Show the price breakdown by hole size
5. Compare with old flat-rate pricing

## Future Enhancements

1. **Hole Type Recognition**
   - Tapped holes vs through holes
   - Countersunk holes
   - Counterbored holes

2. **Material-Based Adjustments**
   - Harder materials = higher pierce cost
   - Thickness factor for very thick materials

3. **Cluster Detection**
   - Discount for holes in patterns
   - Penalty for very close spacing

4. **Special Features**
   - Slots (elongated holes)
   - Partial depth holes
   - Non-circular cutouts

## Migration Notes

- Old quotes without hole size data fall back to $0.50 flat rate
- No database migration needed - pricing is calculated on demand
- Historical quotes remain unchanged
