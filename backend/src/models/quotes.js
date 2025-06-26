const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  material: {
    type: String,
    required: true,
  },
  thickness: {
    type: Number,
    required: true,
  },
  finish: {
    type: String,
    default: 'None',
  },
  bendCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  rushOrder: {
    type: Boolean,
    default: false,
  },
  fileName: String,
  filePath: String,
  pricing: {
    costs: {
      materialCost: {
        type: Number,
        required: true,
      },
      cuttingCost: {
        type: Number,
        required: true,
      },
      bendCost: {
        type: Number,
        default: 0,
      },
      finishCost: {
        type: Number,
        default: 0,
      },
      rushFee: {
        type: Number,
        default: 0,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    details: {
      weightPounds: Number,
      totalAreaSqIn: Number,
      totalAreaSqFt: Number,
      pricePerPound: Number,
      quantity: Number,
    },
  },
});

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: String,
    company: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
  },
  items: {
    type: [quoteItemSchema],
    required: true,
    validate: [arrayMinLength, 'Quote must have at least one item'],
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  notes: String,
  dueDate: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: Date,
  respondedAt: Date,
});

// Validation function for array minimum length
function arrayMinLength(val) {
  return val.length > 0;
}

// Generate quote number before saving
quoteSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Generate quote number: QT-YYYY-MM-XXXX
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      // Find the latest quote for this month
      const lastQuote = await this.constructor
        .findOne({
          quoteNumber: new RegExp(`^QT-${year}-${month}-`),
        })
        .sort({ quoteNumber: -1 });

      let sequence = 1;
      if (lastQuote) {
        const lastSequence = parseInt(lastQuote.quoteNumber.split('-')[3]);
        sequence = lastSequence + 1;
      }

      this.quoteNumber = `QT-${year}-${month}-${String(sequence).padStart(
        4,
        '0'
      )}`;
    } catch (error) {
      return next(error);
    }
  }

  this.updatedAt = new Date();
  next();
});

// Update the updatedAt timestamp on update
quoteSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Index for efficient queries
quoteSchema.index({ 'customer.email': 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ quoteNumber: 1 });

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
