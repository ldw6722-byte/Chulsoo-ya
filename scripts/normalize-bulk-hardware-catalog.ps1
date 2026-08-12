param(
    [Parameter(Mandatory = $true)]
    [string]$CatalogFile
)

$ErrorActionPreference = 'Stop'
$catalog = Get-Content -Raw -Encoding UTF8 $CatalogFile | ConvertFrom-Json
$fixedDescriptions = 0
$fixedSpecifications = 0
foreach ($product in @($catalog.products)) {
    $description = ([string]$product.description).Trim()
    $specification = ([string]$product.specification).Trim()
    $summary = ([string]$product.specSummary).Trim()
    if ([string]::IsNullOrWhiteSpace($specification) -or $specification -match '^\d+(\.\d+)?$') {
        $product.specification = if ([string]::IsNullOrWhiteSpace($summary)) { '상세 규격은 판매자 재고 확인 시 안내됩니다.' } else { $summary }
        $fixedSpecifications++
        $specification = [string]$product.specification
    }
    if ([string]::IsNullOrWhiteSpace($description) -or $description -match '^\d+(\.\d+)?$') {
        $product.description = "$($product.name)은(는) $specification 규격의 철물·공구 상품입니다. 구매 전 규격과 수량을 확인해 주세요."
        $fixedDescriptions++
    }
}
if (@($catalog.products).Count -ne 1600) { throw ('Invalid total product count: ' + @($catalog.products).Count) }
$catalog | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -Path $CatalogFile
Write-Output ('NORMALIZED products=' + @($catalog.products).Count + ' descriptions=' + $fixedDescriptions + ' specifications=' + $fixedSpecifications)
