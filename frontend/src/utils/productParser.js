// Product Parser Utility
// Helps parse product text input into structured data

/**
 * Parses a single line of product text to extract product name and quantity
 * @param {string} line - Single line of product text
 * @returns {object} - { productName, quantity, originalText }
 */
export const parseSingleProduct = (line) => {
  const trimmedLine = line.trim();
  
  if (!trimmedLine) return null;

  // Regular expressions for different quantity patterns
  const patterns = [
    // Pattern 1: Product Name - Quantity
    { regex: /^(.+?)\s*-\s*(\d+)\s*(pcs|pieces|sheets|units)?$/i, nameIndex: 1, qtyIndex: 2 },
    
    // Pattern 2: Product Name (Quantity)
    { regex: /^(.+?)\s*\((\d+)\)$/i, nameIndex: 1, qtyIndex: 2 },
    
    // Pattern 3: Product Name x Quantity
    { regex: /^(.+?)\s*[xX]\s*(\d+)$/i, nameIndex: 1, qtyIndex: 2 },
    
    // Pattern 4: Product Name, qty: Quantity
    { regex: /^(.+?),\s*qty:\s*(\d+)$/i, nameIndex: 1, qtyIndex: 2 },
    
    // Pattern 5: Product Name Quantity at the end
    { regex: /^(.+?)\s+(\d+)\s*$/i, nameIndex: 1, qtyIndex: 2 },
  ];

  for (const pattern of patterns) {
    const match = trimmedLine.match(pattern.regex);
    if (match) {
      return {
        productName: match[pattern.nameIndex].trim(),
        quantity: parseInt(match[pattern.qtyIndex], 10),
        originalText: trimmedLine,
      };
    }
  }

  // If no pattern matches, assume quantity is 1
  return {
    productName: trimmedLine,
    quantity: 1,
    originalText: trimmedLine,
  };
};

/**
 * Parses multiple lines of product text
 * @param {string} text - Multi-line text input
 * @returns {array} - Array of parsed products
 */
export const parseProductInput = (text) => {
  if (!text) return [];

  const lines = text.split('\n');
  const parsedProducts = [];

  lines.forEach((line) => {
    const parsed = parseSingleProduct(line);
    if (parsed) {
      parsedProducts.push(parsed);
    }
  });

  return parsedProducts;
};

/**
 * Normalizes product name for better matching
 * @param {string} name - Product name
 * @returns {string} - Normalized name
 */
export const normalizeProductName = (name) => {
  return name
    .toLowerCase()
    .replace(/['"]/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(\d+)"\b/g, '$1 inch') // Convert 6" to 6 inch
    .replace(/\b(\d+)'\b/g, '$1 ft') // Convert 10' to 10 ft
    .trim();
};

/**
 * Extracts dimensions from product name
 * @param {string} name - Product name
 * @returns {object} - { width, length, thickness, diameter }
 */
export const extractDimensions = (name) => {
  const dimensions = {
    width: null,
    length: null,
    thickness: null,
    diameter: null,
  };

  // Pattern for dimensions like 4x8, 2x2x1/4
  const dimensionPattern = /(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*(?:[xX]\s*(\d+(?:\.\d+)?))?/;
  const match = name.match(dimensionPattern);

  if (match) {
    dimensions.width = parseFloat(match[1]);
    dimensions.length = parseFloat(match[2]);
    if (match[3]) {
      dimensions.thickness = parseFloat(match[3]);
    }
  }

  // Pattern for diameter (round items)
  const diameterPattern = /(\d+(?:\.\d+)?)\s*(?:inch|in|")\s*(?:dia|diameter)/i;
  const diaMatch = name.match(diameterPattern);
  if (diaMatch) {
    dimensions.diameter = parseFloat(diaMatch[1]);
  }

  return dimensions;
};

/**
 * Suggests similar products based on input
 * @param {string} searchTerm - Product search term
 * @param {array} productCatalog - Available products
 * @returns {array} - Suggested products
 */
export const suggestProducts = (searchTerm, productCatalog) => {
  const normalized = normalizeProductName(searchTerm);
  const suggestions = [];

  productCatalog.forEach((product) => {
    const productNameNormalized = normalizeProductName(product.name);
    
    // Exact match
    if (productNameNormalized === normalized) {
      suggestions.push({ ...product, score: 100 });
      return;
    }

    // Contains search term
    if (productNameNormalized.includes(normalized) || normalized.includes(productNameNormalized)) {
      suggestions.push({ ...product, score: 80 });
      return;
    }

    // Word-by-word matching
    const searchWords = normalized.split(' ');
    const productWords = productNameNormalized.split(' ');
    const matchingWords = searchWords.filter(word => productWords.includes(word));
    
    if (matchingWords.length > 0) {
      const score = (matchingWords.length / searchWords.length) * 60;
      suggestions.push({ ...product, score });
    }
  });

  // Sort by score descending
  return suggestions
    .sort((a, b) => b.score - a.score)
    .filter(s => s.score > 30)
    .slice(0, 5);
};

/**
 * Validates parsed product data
 * @param {object} parsedProduct - Parsed product object
 * @returns {boolean} - Is valid
 */
export const validateParsedProduct = (parsedProduct) => {
  if (!parsedProduct) return false;
  if (!parsedProduct.productName || parsedProduct.productName.trim() === '') return false;
  if (!Number.isInteger(parsedProduct.quantity) || parsedProduct.quantity < 1) return false;
  return true;
};

export default {
  parseSingleProduct,
  parseProductInput,
  normalizeProductName,
  extractDimensions,
  suggestProducts,
  validateParsedProduct,
};
