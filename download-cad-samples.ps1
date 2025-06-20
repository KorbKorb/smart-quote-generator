# download-cad-samples.ps1
# PowerShell script to download real CAD sample files for testing
$testDir = "C:\Users\Korbin\smart-quote-generator\test-files"

# Create test-files directory if it doesn't exist
if (!(Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir
    Write-Host "Created test-files directory" -ForegroundColor Green
}

Write-Host "Downloading sample CAD files to: $testDir" -ForegroundColor Cyan
Write-Host ""

# Sample DXF files from reliable sources
$sampleFiles = @(
    @{
        Name = "mechanical-part.dxf"
        Url = "https://raw.githubusercontent.com/FreeCAD/Examples/master/DXF_Files/mechanical_part.dxf"
        Description = "Mechanical part with holes and curves"
    },
    @{
        Name = "gasket-design.dxf"
        Url = "https://raw.githubusercontent.com/FreeCAD/Examples/master/DXF_Files/gasket.dxf"
        Description = "Gasket with complex cutouts"
    }
)

# Download each file
foreach ($file in $sampleFiles) {
    $outputPath = Join-Path $testDir $file.Name
    try {
        Write-Host "Downloading $($file.Name)..." -NoNewline
        Invoke-WebRequest -Uri $file.Url -OutFile $outputPath -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
        Write-Host "  Description: $($file.Description)" -ForegroundColor Gray
    }
    catch {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

# Create some simple PDF drawings using .NET if available
try {
    Add-Type -AssemblyName System.Drawing
    
    # Create a simple technical drawing as image, then we'll reference it
    $bitmap = New-Object System.Drawing.Bitmap(800, 600)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::White)
    
    # Draw a simple part outline
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
    $graphics.DrawRectangle($pen, 100, 100, 600, 400)
    $graphics.DrawLine($pen, 100, 300, 700, 300)
    $graphics.DrawEllipse($pen, 150, 150, 100, 100)
    $graphics.DrawEllipse($pen, 550, 150, 100, 100)
    
    # Add some text
    $font = New-Object System.Drawing.Font("Arial", 16)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $graphics.DrawString("SHEET METAL PART - TOP VIEW", $font, $brush, 250, 50)
    $graphics.DrawString("Material: 16GA Steel", $font, $brush, 100, 520)
    
    # Save as image
    $imagePath = Join-Path $testDir "technical-drawing.png"
    $bitmap.Save($imagePath)
    
    Write-Host "`n✓ Created technical-drawing.png" -ForegroundColor Green
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
}
catch {
    Write-Host "Could not create image file" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Additional Resources for Test Files:" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Free CAD File Repositories:" -ForegroundColor Green
Write-Host "   - GrabCAD.com - Community library with thousands of files"
Write-Host "   - 3DContentCentral.com - Free 3D models and drawings"
Write-Host "   - CADdetails.com - Architectural and mechanical drawings"
Write-Host ""
Write-Host "2. Create Your Own Test Files:" -ForegroundColor Green
Write-Host "   - LibreCAD (Free, Open Source): https://librecad.org/"
Write-Host "   - QCAD (Free version available): https://qcad.org/"
Write-Host "   - DraftSight (Free for personal use): https://www.draftsight.com/"
Write-Host ""
Write-Host "3. Online DXF Generators:" -ForegroundColor Green
Write-Host "   - Makercase.com - Box/enclosure generator"
Write-Host "   - Boxes.py - Parametric box generator"
Write-Host ""
Write-Host "4. Convert Images to DXF:" -ForegroundColor Green
Write-Host "   - Use Inkscape (free) to trace images and export as DXF"
Write-Host "   - Online converters for simple shapes"
Write-Host ""

Write-Host "Test files are ready in: $testDir" -ForegroundColor Cyan
Write-Host "You can now test your file upload functionality!" -ForegroundColor Green