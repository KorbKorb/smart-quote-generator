// Script to generate sample DXF files for testing
const fs = require('fs').promises;
const path = require('path');

// Simple rectangle with holes
const simpleRectangle = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
4
70
1
10
0.0
20
0.0
10
100.0
20
0.0
10
100.0
20
50.0
10
0.0
20
50.0
0
CIRCLE
8
0
10
25.0
20
25.0
40
5.0
0
CIRCLE
8
0
10
75.0
20
25.0
40
5.0
0
ENDSEC
0
EOF`;

// L-shaped bracket
const lBracket = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
6
70
1
10
0.0
20
0.0
10
100.0
20
0.0
10
100.0
20
25.0
10
25.0
20
25.0
10
25.0
20
75.0
10
0.0
20
75.0
0
CIRCLE
8
0
10
12.5
20
12.5
40
4.0
0
CIRCLE
8
0
10
87.5
20
12.5
40
4.0
0
CIRCLE
8
0
10
12.5
20
62.5
40
4.0
0
LINE
8
BEND
62
1
10
25.0
20
0.0
11
25.0
21
75.0
0
ENDSEC
0
EOF`;

// Complex enclosure panel
const enclosurePanel = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
16
70
1
10
0.0
20
0.0
10
300.0
20
0.0
10
300.0
20
10.0
10
290.0
20
10.0
10
290.0
20
190.0
10
300.0
20
190.0
10
300.0
20
200.0
10
0.0
20
200.0
10
0.0
20
190.0
10
10.0
20
190.0
10
10.0
20
10.0
10
0.0
20
10.0
0
CIRCLE
8
0
10
50.0
20
50.0
40
15.0
0
CIRCLE
8
0
10
150.0
20
50.0
40
15.0
0
CIRCLE
8
0
10
250.0
20
50.0
40
15.0
0
CIRCLE
8
0
10
50.0
20
150.0
40
15.0
0
CIRCLE
8
0
10
150.0
20
150.0
40
15.0
0
CIRCLE
8
0
10
250.0
20
150.0
40
15.0
0
CIRCLE
8
0
10
20.0
20
20.0
40
3.175
0
CIRCLE
8
0
10
280.0
20
20.0
40
3.175
0
CIRCLE
8
0
10
20.0
20
180.0
40
3.175
0
CIRCLE
8
0
10
280.0
20
180.0
40
3.175
0
LINE
8
BEND
62
1
10
0.0
20
10.0
11
300.0
21
10.0
0
LINE
8
BEND
62
1
10
0.0
20
190.0
11
300.0
21
190.0
0
ENDSEC
0
EOF`;

// Circular flange
const circularFlange = `0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
0.0
20
0.0
40
100.0
0
CIRCLE
8
0
10
0.0
20
0.0
40
25.0
0
CIRCLE
8
0
10
70.0
20
0.0
40
5.0
0
CIRCLE
8
0
10
35.0
20
60.62
40
5.0
0
CIRCLE
8
0
10
-35.0
20
60.62
40
5.0
0
CIRCLE
8
0
10
-70.0
20
0.0
40
5.0
0
CIRCLE
8
0
10
-35.0
20
-60.62
40
5.0
0
CIRCLE
8
0
10
35.0
20
-60.62
40
5.0
0
ENDSEC
0
EOF`;

async function generateSampleDXFFiles() {
  const testFilesDir = path.join(__dirname, '../test-files');
  
  // Ensure directory exists
  try {
    await fs.mkdir(testFilesDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const files = [
    { name: 'simple-rectangle.dxf', content: simpleRectangle },
    { name: 'l-bracket.dxf', content: lBracket },
    { name: 'enclosure-panel.dxf', content: enclosurePanel },
    { name: 'circular-flange.dxf', content: circularFlange }
  ];

  console.log('🎨 Generating sample DXF files...\n');

  for (const file of files) {
    const filePath = path.join(testFilesDir, file.name);
    try {
      await fs.writeFile(filePath, file.content);
      console.log(`✅ Created: ${file.name}`);
    } catch (error) {
      console.error(`❌ Failed to create ${file.name}:`, error.message);
    }
  }

  console.log('\n✨ Sample DXF files generated successfully!');
  console.log(`📁 Location: ${testFilesDir}`);
}

// Run the generator
generateSampleDXFFiles().catch(console.error);
