# Fix missing menu images by creating placeholders
$sourceImage = "uploads/menu/1764746186395_breakfast-2408818_1280.jpg"
$menuImages = @(
    "uploads/menu/1764828063761_RD 1_00000.jpg",
    "uploads/menu/1764828132819_001_00000.jpg",
    "uploads/menu/1764828199105_PD 1_00000.jpg",
    "uploads/menu/1764828318539_MD 1_00000.jpg",
    "uploads/menu/1764828535292_GM 1_00000.jpg",
    "uploads/menu/1764828594834_G 65 1_00000.jpg",
    "uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg",
    "uploads/menu/1764829358768_breakfast-2408818_1280.jpg"
)

foreach ($image in $menuImages) {
    if (-not (Test-Path $image)) {
        Write-Host "Creating placeholder for: $image"
        Copy-Item $sourceImage $image
    } else {
        Write-Host "Already exists: $image"
    }
}

Write-Host "`nDone! All missing images have been created."
