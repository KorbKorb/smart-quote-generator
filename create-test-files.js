const fs = require('fs');
const path = require('path');

// Create a test-files directory
const testDir = path.join(__dirname, 'test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

console.log('Creating test files in:', testDir);

// 1. Create a simple DXF file (2D CAD format - text based)
const dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1014
9
$INSBASE
10
0.0
20
0.0
30
0.0
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
100.0
31
0.0
0
RECTANGLE
8
0
10
10.0
20
10.0
30
0.0
40
50.0
41
30.0
0
CIRCLE
8
0
10
75.0
20
50.0
30
0.0
40
25.0
0
ENDSEC
0
EOF`;

fs.writeFileSync(path.join(testDir, 'sample-bracket.dxf'), dxfContent);
console.log('✓ Created sample-bracket.dxf');

// 2. Create another DXF with different shapes
const dxfContent2 = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1014
0
ENDSEC
0
SECTION
2
ENTITIES
0
POLYLINE
8
0
66
1
10
0.0
20
0.0
30
0.0
0
VERTEX
8
0
10
0.0
20
0.0
30
0.0
0
VERTEX
8
0
10
200.0
20
0.0
30
0.0
0
VERTEX
8
0
10
200.0
20
150.0
30
0.0
0
VERTEX
8
0
10
0.0
20
150.0
30
0.0
0
VERTEX
8
0
10
0.0
20
0.0
30
0.0
0
SEQEND
0
ENDSEC
0
EOF`;

fs.writeFileSync(path.join(testDir, 'sheet-metal-panel.dxf'), dxfContent2);
console.log('✓ Created sheet-metal-panel.dxf');

// 3. Create a simple SVG that we'll name as PDF for testing
// (Real PDFs require complex libraries, but this will work for upload testing)
const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Sheet Metal Part) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000366 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
463
%%EOF`;

fs.writeFileSync(path.join(testDir, 'test-drawing.pdf'), testPdfContent);
console.log('✓ Created test-drawing.pdf');

// 4. Create a test data file with sample quote information
const sampleQuoteData = {
  testFiles: [
    {
      name: "sample-bracket.dxf",
      description: "Simple bracket with mounting holes",
      suggestedMaterial: "Mild Steel",
      suggestedThickness: "0.125",
      estimatedArea: "45 sq inches",
      bendCount: 2
    },
    {
      name: "sheet-metal-panel.dxf", 
      description: "Flat panel 200x150mm",
      suggestedMaterial: "Aluminum",
      suggestedThickness: "0.0625",
      estimatedArea: "180 sq inches",
      bendCount: 0
    },
    {
      name: "test-drawing.pdf",
      description: "Generic technical drawing",
      suggestedMaterial: "Stainless Steel",
      suggestedThickness: "0.1875",
      estimatedArea: "120 sq inches",
      bendCount: 4
    }
  ],
  testScenarios: [
    {
      scenario: "Rush Order - Simple Part",
      file: "sample-bracket.dxf",
      settings: {
        material: "Mild Steel",
        thickness: "0.125",
        quantity: 50,
        finishType: "powder-coat",
        urgency: "rush",
        expectedPrice: "$250-350"
      }
    },
    {
      scenario: "High Volume - Aluminum",
      file: "sheet-metal-panel.dxf",
      settings: {
        material: "Aluminum", 
        thickness: "0.0625",
        quantity: 1000,
        finishType: "anodized",
        urgency: "standard",
        expectedPrice: "$2000-3000"
      }
    }
  ]
};

fs.writeFileSync(
  path.join(testDir, 'test-scenarios.json'), 
  JSON.stringify(sampleQuoteData, null, 2)
);
console.log('✓ Created test-scenarios.json');

// 5. Create a README for the test files
const readmeContent = `# Test Files for Smart Quote Generator

This folder contains test files for the Smart Quote Generator application.

## Files Included:

### DXF Files (CAD Drawings)
- **sample-bracket.dxf** - A simple bracket design with basic shapes
- **sheet-metal-panel.dxf** - A flat rectangular panel (200x150mm)

### PDF Files
- **test-drawing.pdf** - A basic PDF for testing file upload

### Test Data
- **test-scenarios.json** - Contains suggested test scenarios with expected values

## How to Use:

1. Start your application (both backend and frontend)
2. Navigate to "New Quote" page
3. Drag and drop any of these files into the upload area
4. Use the suggested values from test-scenarios.json to fill the form

## Creating More Test Files:

### For DXF Files:
- Use any free CAD software like LibreCAD, QCAD, or DraftSight
- Draw simple shapes (rectangles, circles, lines)
- Save as DXF format

### For Real DWG Files:
- DWG files are proprietary AutoCAD format
- Use AutoCAD or free alternatives like DraftSight
- Or download samples from: https://www.cadtest.com/downloads/

### For More Test Files:
- Search for "sample DXF files" or "sample DWG files" online
- Many CAD software websites offer free samples
- GitHub has repositories with CAD test files

## Notes:
- The PDF file is a minimal valid PDF for testing
- Real production files would be more complex
- DXF files are text-based and can be edited in a text editor
`;

fs.writeFileSync(path.join(testDir, 'README.md'), readmeContent);
console.log('✓ Created README.md');

console.log('\n✅ All test files created successfully!');
console.log(`\nTest files location: ${testDir}`);
console.log('\nYou can now use these files to test your upload functionality.');