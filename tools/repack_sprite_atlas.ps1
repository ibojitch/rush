param(
  [string]$Source = (Join-Path $PSScriptRoot "..\old\ibojigen_sprite_atlas_source_1774x887.png"),
  [string]$KoeItem = (Join-Path $PSScriptRoot "..\old\koe-item_source_1254x1254.png"),
  [string]$Output = (Join-Path $PSScriptRoot "..\ibojigen_sprite_atlas.png")
)

# Sprite atlas layout used by index.html:
#   grid: 8 columns x 3 rows (the final row holds the KOE item)
#   cell size / pitch: 160 x 228 px
#   output size: 1280 x 456 px
# Each source crop is placed bottom-centre in its cell. Keep this list in the
# same order as SPRITE_TILES in index.html when the artwork changes.
$frames = @(
  @(52,241,148,209), @(266,241,145,209), @(486,243,147,210), @(707,241,146,212),
  @(934,243,148,208), @(1153,243,148,210), @(1372,211,160,212), @(1595,268,153,185),
  @(49,580,145,215), @(266,580,144,215), @(487,580,144,222), @(700,574,153,228),
  @(925,580,148,222), @(1147,580,148,222), @(1371,558,150,216), @(1595,607,148,194)
)

$cellWidth = 160
$cellHeight = 228
$columns = 8
$rows = 3

Add-Type -AssemblyName System.Drawing
$sourcePath = [IO.Path]::GetFullPath($Source)
$outputPath = [IO.Path]::GetFullPath($Output)
$sourceImage = [Drawing.Bitmap]::FromFile($sourcePath)
$koePath = [IO.Path]::GetFullPath($KoeItem)
$koeImage = [Drawing.Bitmap]::FromFile($koePath)

try {
  if ($sourceImage.Width -ne 1774 -or $sourceImage.Height -ne 887) {
    throw "Expected a 1774x887 source atlas, got $($sourceImage.Width)x$($sourceImage.Height)."
  }

  $atlas = [Drawing.Bitmap]::new(
    [int]($cellWidth * $columns),
    [int]($cellHeight * $rows),
    [Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  try {
    $graphics = [Drawing.Graphics]::FromImage($atlas)
    try {
      $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.Clear([Drawing.Color]::Transparent)

      for ($i = 0; $i -lt $frames.Count; $i++) {
        $x, $y, $w, $h = $frames[$i]
        $column = $i % $columns
        $row = [Math]::Floor($i / $columns)
        $destinationX = $column * $cellWidth + [Math]::Floor(($cellWidth - $w) / 2)
        $destinationY = $row * $cellHeight + ($cellHeight - $h)
        $destination = New-Object Drawing.Rectangle $destinationX, $destinationY, $w, $h
        $sourceRectangle = New-Object Drawing.Rectangle $x, $y, $w, $h
        $graphics.DrawImage($sourceImage, $destination, $sourceRectangle, [Drawing.GraphicsUnit]::Pixel)
      }

      # Preserve the KOE bottle's displayed 40:58 aspect ratio in the first cell of the final row.
      $koeDestination = New-Object Drawing.Rectangle 24, 524, 112, 160
      $graphics.DrawImage($koeImage, $koeDestination)
    } finally {
      $graphics.Dispose()
    }

    # Source crops contain arbitrary RGB values in fully transparent pixels.
    # Normalising those pixels to transparent black keeps PNG compression small.
    for ($pixelY = 0; $pixelY -lt $atlas.Height; $pixelY++) {
      for ($pixelX = 0; $pixelX -lt $atlas.Width; $pixelX++) {
        if ($atlas.GetPixel($pixelX, $pixelY).A -eq 0) {
          $atlas.SetPixel($pixelX, $pixelY, [Drawing.Color]::Transparent)
        }
      }
    }

    $atlas.Save($outputPath, [Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $atlas.Dispose()
  }
} finally {
  if ($null -ne $sourceImage) { $sourceImage.Dispose() }
  if ($null -ne $koeImage) { $koeImage.Dispose() }
}

Write-Output "Created $outputPath (1280x684, cell/pitch 160x228)."
