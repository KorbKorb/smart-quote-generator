const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Product = require('../models/Product');
const DiscountRule = require('../models/DiscountRule');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-quote-generator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample products with categories
const sampleProducts = [
  // Metal Sheets
  {
    name: 'Mild Steel Sheet 4x8',
    category: 'Metal Sheets',
    material: 'Mild Steel',
    thickness: 0.25,
    basePrice: 120,
    priceUnit: 'per_piece',
    description: '4ft x 8ft mild steel sheet',
    sku: 'MS-SHEET-4X8-025',
  },
  {
    name: 'Aluminum Sheet 4x8',
    category: 'Metal Sheets',
    material: 'Aluminum',
    thickness: 0.125,
    basePrice: 180,
    priceUnit: 'per_piece',
    description: '4ft x 8ft aluminum sheet',
    sku: 'AL-SHEET-4X8-0125',
  },
  {
    name: 'Stainless Steel Sheet 4x8',
    category: 'Metal Sheets',
    material: 'Stainless Steel',
    thickness: 0.1875,
    basePrice: 320,
    priceUnit: 'per_piece',
    description: '4ft x 8ft stainless steel sheet',
    sku: 'SS-SHEET-4X8-01875',
  },
  
  // Structural Steel
  {
    name: 'I-Beam 6"',
    category: 'Structural Steel',
    material: 'Mild Steel',
    thickness: 6,
    basePrice: 45,
    priceUnit: 'per_linear_ft',
    description: '6 inch I-beam',
    sku: 'IBEAM-6',
  },
  {
    name: 'Square Tube 2x2',
    category: 'Structural Steel',
    material: 'Mild Steel',
    thickness: 0.25,
    basePrice: 12,
    priceUnit: 'per_linear_ft',
    description: '2"x2" square tube',
    sku: 'SQ-TUBE-2X2-025',
  },
  
  // Fasteners
  {
    name: 'Hex Bolt 1/2" x 2"',
    category: 'Fasteners',
    material: 'Steel',
    thickness: 0.5,
    basePrice: 0.45,
    priceUnit: 'per_piece',
    minimumQuantity: 50,
    description: '1/2" x 2" hex bolt',
    sku: 'HEX-BOLT-1/2X2',
  },
  {
    name: 'Flat Washer 1/2"',
    category: 'Fasteners',
    material: 'Steel',
    thickness: 0.0625,
    basePrice: 0.12,
    priceUnit: 'per_piece',
    minimumQuantity: 100,
    description: '1/2" flat washer',
    sku: 'WASHER-FLAT-1/2',
  },
];

// Sample discount rules
const sampleDiscountRules = [
  {
    name: 'Bulk Metal Sheets Discount',
    description: '10% off when ordering 5 or more metal sheets',
    type: 'volume',
    conditions: {
      minQuantity: 5,
      categories: ['Metal Sheets'],
    },
    discount: {
      type: 'percentage',
      value: 10,
    },
    applicableTo: 'matching_items',
    priority: 1,
  },
  {
    name: 'Structural Steel Package',
    description: '15% off when buying I-beams and square tubes together',
    type: 'bundle',
    conditions: {
      bundleRequirements: [
        {
          category: 'Structural Steel',
          minQuantity: 20, // 20 linear feet minimum
        },
      ],
    },
    discount: {
      type: 'percentage',
      value: 15,
    },
    applicableTo: 'matching_items',
    priority: 2,
  },
  {
    name: 'Fastener Bulk Discount',
    description: 'Tiered discount for fasteners',
    type: 'volume',
    conditions: {
      categories: ['Fasteners'],
    },
    discount: {
      type: 'tiered',
      tiers: [
        { minQuantity: 100, maxQuantity: 499, discountValue: 5 },
        { minQuantity: 500, maxQuantity: 999, discountValue: 10 },
        { minQuantity: 1000, discountValue: 15 },
      ],
    },
    applicableTo: 'matching_items',
    priority: 1,
  },
  {
    name: 'Complete Package Discount',
    description: '20% off when ordering from all three categories',
    type: 'category',
    conditions: {
      categories: ['Metal Sheets', 'Structural Steel', 'Fasteners'],
      requireAllCategories: true,
      minOrderValue: 1000,
    },
    discount: {
      type: 'percentage',
      value: 20,
    },
    applicableTo: 'all_items',
    priority: 3,
  },
];

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    await Product.deleteMany({});
    await DiscountRule.deleteMany({});
    
    // Insert sample products
    console.log('Inserting sample products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} products`);
    
    // Insert discount rules
    console.log('Inserting discount rules...');
    const rules = await DiscountRule.insertMany(sampleDiscountRules);
    console.log(`Inserted ${rules.length} discount rules`);
    
    console.log('Migration completed successfully!');
    
    // Display categories
    const categories = await Product.distinct('category');
    console.log('\nAvailable categories:', categories);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the migration
runMigration();