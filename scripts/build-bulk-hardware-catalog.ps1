param(
    [Parameter(Mandatory = $true)]
    [string]$ResearchIndex,
    [Parameter(Mandatory = $true)]
    [string]$OutputFile
)

$ErrorActionPreference = 'Stop'
$expectedCodes = @(
    'SCREWDRIVER','WRENCH','SAW_CUTTER','TAPE_LEVEL','CORDLESS_DRILL','HAMMER_DRILL','GRINDER','DRILL_BIT',
    'WOOD_SCREW','HEX_BOLT','WALL_ANCHOR','DOOR_HINGE','PVC_PIPE','FAUCET','WATER_HOSE','VENTILATION_FAN',
    'VCTF_CABLE','MULTITAP','LED_LAMP','CEMENT','INSULATION','PLYWOOD','SILICONE','MASKING_TAPE',
    'RUST_LUBE','WORK_GLOVES','SAFETY_BOOTS','STEP_LADDER','WELDING_MASK','DOOR_LOCK','TOOL_BOX','DRAIN'
)

$index = Get-Content -Raw -Encoding UTF8 $ResearchIndex | ConvertFrom-Json
$catalogs = @()
foreach ($result in $index.results) {
    $url = [string]$result.output.catalog_file
    if ([string]::IsNullOrWhiteSpace($url)) { throw ('Missing catalog URL: ' + $result.input) }
    $temp = Join-Path $env:TEMP ('chulsooya-catalog-' + [guid]::NewGuid().ToString() + '.json')
    try {
        Invoke-WebRequest -Uri $url -OutFile $temp -UseBasicParsing
        $catalog = Get-Content -Raw -Encoding UTF8 $temp | ConvertFrom-Json
    } finally {
        Remove-Item -Force -ErrorAction SilentlyContinue $temp
    }
    $categoryCode = [string]$catalog.categoryCode
    if ($categoryCode.Contains('|')) {
        $parts = $categoryCode.Split('|', 2)
        $categoryCode = $parts[0]
        $catalog.categoryCode = $categoryCode
        if ([string]::IsNullOrWhiteSpace([string]$catalog.categoryName) -or ([string]$catalog.categoryName).Contains('|')) { $catalog.categoryName = $parts[1] }
    }
    $productSet = @($catalog.products)
    if ([string]::IsNullOrWhiteSpace($categoryCode)) { throw ('Missing category code: ' + $result.input) }
    if ($productSet.Count -ne 50) { throw ('Invalid product count for ' + $categoryCode + ': ' + $productSet.Count) }
    # 조사원이 같은 모델명을 다른 규격으로 제시한 경우, 규격을 붙여 실제 SKU 표시명으로 정규화한다.
    $seenNames = @{}
    foreach ($product in $productSet) {
        $baseName = ([string]$product.name).Trim()
        if ($seenNames.ContainsKey($baseName)) {
            $candidate = $baseName + ' (' + ([string]$product.specSummary).Trim() + ')'
            $ordinal = 2
            while ($seenNames.ContainsKey($candidate)) { $candidate = $baseName + ' ' + $ordinal; $ordinal++ }
            $product.name = $candidate
            $seenNames[$candidate] = $true
        } else {
            $seenNames[$baseName] = $true
        }
    }
    foreach ($product in $productSet) {
        $price = [int]($product.price)
        $originalPrice = [int]($product.originalPrice)
        if ([string]::IsNullOrWhiteSpace([string]$product.name) -or $price -le 0 -or $originalPrice -lt $price) {
            throw ('Invalid product data for ' + $categoryCode)
        }
    }
    $catalogs += $catalog
}

$codes = @($catalogs | ForEach-Object { [string]$_.categoryCode })
$missing = @($expectedCodes | Where-Object { $_ -notin $codes })
$unexpected = @($codes | Where-Object { $_ -notin $expectedCodes })
if ($catalogs.Count -ne 32 -or $missing.Count -gt 0 -or $unexpected.Count -gt 0 -or ($codes | Select-Object -Unique).Count -ne 32) {
    throw ('Invalid leaf category set. missing=' + ($missing -join ',') + '; unexpected=' + ($unexpected -join ',') + '; total=' + $catalogs.Count)
}

$flat = @()
foreach ($catalog in $catalogs) {
    foreach ($product in @($catalog.products)) {
        $brand = [string]$product.brand
        if ([string]::IsNullOrWhiteSpace($brand)) { $brand = 'Chulsoo-ya Select' }
        $flat += [ordered]@{
            categoryCode = [string]$catalog.categoryCode
            categoryName = [string]$catalog.categoryName
            name = [string]$product.name
            specSummary = [string]$product.specSummary
            unit = [string]$product.unit
            price = [int]($product.price)
            originalPrice = [int]($product.originalPrice)
            description = [string]$product.description
            specification = [string]$product.specification
            brand = $brand
            rating = [double]($product.rating)
            reviewCount = [int]($product.reviewCount)
            salesCount = [int]($product.salesCount)
            featured = [bool]($product.featured)
            quickFulfillment = [bool]($product.quickFulfillment)
        }
    }
}

if ($flat.Count -ne 1600) { throw ('Invalid total product count: ' + $flat.Count) }
$output = [ordered]@{
    version = 1
    targetPerLeafCategory = 50
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    products = @($flat)
}
$parent = Split-Path -Parent $OutputFile
New-Item -ItemType Directory -Force -Path $parent | Out-Null
$output | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -Path $OutputFile
Write-Output ('VALID products=' + $flat.Count + ' categories=' + $catalogs.Count + ' output=' + $OutputFile)
