const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  thickness: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  cuttingLength: Number,
  area: Number,
  weight: Number,
  notes: String,
});

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerName: String,
  customerEmail: String,
  customerCompany: String,
  items: [quoteItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  validUntil: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000), // 30 days from now
  },
  notes: String,
  internalNotes: String,
  purchaseOrderNumber: String,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  sentAt: Date,
  createdBy: String,
  packageQuotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageQuote',
  }],
  hasPackages: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate quote number
quoteSchema.statics.generateQuoteNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Find the last quote of the month
  const lastQuote = await this.findOne({
    quoteNumber: new RegExp(`^Q${year}${month}`),
  }).sort({ quoteNumber: -1 });

  let sequence = 1;
  if (lastQuote) {
    const lastSequence = parseInt(lastQuote.quoteNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `Q${year}${month}${String(sequence).padStart(4, '0')}`;
};

// Update timestamp on save
quoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
quoteSchema.index({ customerId: 1, createdAt: -1 });
quoteSchema.index({ quoteNumber: 1 });
quoteSchema.index({ status: 1 });

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;