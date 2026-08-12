# Chulsoo-ya local REST API E2E verification.
# Requires server to be running at localhost:8080 with local profile.

$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:8080/api'

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body = $null,
        [long]$UserId = 0,
        [string]$Role = 'CONSUMER'
    )

    $headers = @{}
    if ($UserId -gt 0) {
        $headers['X-User-Id'] = "$UserId"
        $headers['X-User-Role'] = $Role
    }

    $params = @{
        Method = $Method
        Uri = "$baseUrl$Path"
        Headers = $headers
        ContentType = 'application/json; charset=utf-8'
    }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }

    $response = Invoke-RestMethod @params
    if ($null -eq $response.data) {
        throw "Response data is missing: $($response | ConvertTo-Json -Depth 6)"
    }
    return $response.data
}

$result = [ordered]@{
    startedAt = (Get-Date).ToString('o')
    stages = @()
    success = $false
}

try {
    $users = Invoke-Api -Method 'GET' -Path '/users'
    $consumer = $users | Where-Object { $_.role -eq 'CONSUMER' } | Select-Object -First 1
    $seller = $users | Where-Object { $_.role -eq 'SELLER' } | Select-Object -First 1
    if ($null -eq $consumer -or $null -eq $seller) {
        throw 'Seed consumer or seller account is missing.'
    }
    $result.stages += "Accounts: consumer=$($consumer.id), seller=$($seller.id)"

    $productsPage = Invoke-Api -Method 'GET' -Path '/products?page=0&size=1&sort=id'
    $product = $productsPage.items | Select-Object -First 1
    if ($null -eq $product) {
        throw 'Seed product is missing.'
    }
    $result.stages += "Product: id=$($product.id)"

    $cart = Invoke-Api -Method 'POST' -Path '/cart/items' -UserId $consumer.id -Role $consumer.role -Body @{
        productId = $product.id
        quantity = 2
        optionHash = '-'
    }
    if ($cart.itemCount -lt 2) {
        throw "Cart quantity mismatch: $($cart.itemCount)"
    }
    $result.stages += "Cart add: items=$($cart.itemCount)"

    # Seoul Gangnam-gu Teheran-ro 123, built from Unicode code points to remain compatible with Windows PowerShell 5 encoding.
    $address = -join ([char[]](0xC11C, 0xC6B8, 0xD2B9, 0xBCC4, 0xC2DC, 0x20, 0xAC15, 0xB0A8, 0xAD6C, 0x20, 0xD14C, 0xD5E4, 0xB780, 0xB85C, 0x20, 0x31, 0x32, 0x33))
    $region = Invoke-Api -Method 'GET' -Path ('/regions/resolve?address=' + [uri]::EscapeDataString($address))
    if ([string]::IsNullOrWhiteSpace($region.guCode)) {
        throw 'Address region resolution failed.'
    }
    $result.stages += "Region: code=$($region.guCode)"

    $order = Invoke-Api -Method 'POST' -Path '/orders' -UserId $consumer.id -Role $consumer.role -Body @{
        fulfillmentMethod = 'DELIVERY'
        address = $address
        addressDetail = 'E2E-test'
        guCode = $region.guCode
        requestMemo = 'Automated E2E verification'
    }
    if ($order.status -ne 'WAITING_MATCH') {
        throw "Order creation state mismatch: $($order.status)"
    }
    $result.orderId = $order.id
    $result.stages += "Match request: order=$($order.id), status=$($order.status)"

    # Premium seller offer is immediate; poll for delayed dispatch environments.
    $offer = $null
    foreach ($attempt in 1..12) {
        $offers = Invoke-Api -Method 'GET' -Path '/seller/offers' -UserId $seller.id -Role $seller.role
        $offer = $offers | Where-Object { $_.orderId -eq $order.id } | Select-Object -First 1
        if ($null -ne $offer) { break }
        Start-Sleep -Seconds 1
    }
    if ($null -eq $offer) {
        throw 'Seller offer queue did not receive the order.'
    }
    $result.stages += "Seller offer: offer=$($offer.offerId)"

    $bidOrder = Invoke-Api -Method 'POST' -Path "/seller/offers/$($order.id)/bid" -UserId $seller.id -Role $seller.role
    if ($bidOrder.status -ne 'SELLER_CONFIRMING') {
        throw "Bid state mismatch: $($bidOrder.status)"
    }
    $result.stages += "Single winner: $($bidOrder.status)"

    $confirmed = Invoke-Api -Method 'POST' -Path "/seller/orders/$($order.id)/confirm-stock" -UserId $seller.id -Role $seller.role
    if ($confirmed.status -ne 'PAYMENT_PENDING') {
        throw "Stock confirmation state mismatch: $($confirmed.status)"
    }
    $result.stages += "Stock confirmed: $($confirmed.status)"

    $idempotencyKey = "e2e-$($order.id)-$([guid]::NewGuid().ToString('N'))"
    $paid = Invoke-Api -Method 'POST' -Path '/payments/confirm' -UserId $consumer.id -Role $consumer.role -Body @{
        orderId = $order.id
        idempotencyKey = $idempotencyKey
        method = 'CARD'
    }
    if ($paid.status -ne 'PREPARING') {
        throw "Payment state mismatch: $($paid.status)"
    }
    $result.stages += "Payment accepted: $($paid.status)"

    $delivering = Invoke-Api -Method 'POST' -Path "/seller/orders/$($order.id)/status/DELIVERY_IN_PROGRESS" -UserId $seller.id -Role $seller.role
    if ($delivering.status -ne 'DELIVERY_IN_PROGRESS') {
        throw "Delivery state mismatch: $($delivering.status)"
    }
    $result.stages += "Delivery started: $($delivering.status)"

    $completed = Invoke-Api -Method 'POST' -Path "/seller/orders/$($order.id)/status/COMPLETED" -UserId $seller.id -Role $seller.role
    if ($completed.status -ne 'COMPLETED') {
        throw "Completion state mismatch: $($completed.status)"
    }
    $result.stages += "Order complete: $($completed.status)"
    $result.finalStatus = $completed.status
    $result.success = $true
}
catch {
    $result.error = $_.Exception.Message
    throw
}
finally {
    $result.finishedAt = (Get-Date).ToString('o')
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $PSScriptRoot 'verify-e2e-result.json') -Encoding utf8
}
