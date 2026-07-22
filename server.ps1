param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8080,

    [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Send-HttpResponse {
    param(
        [Parameter(Mandatory)] [System.IO.Stream]$Stream,
        [Parameter(Mandatory)] [int]$StatusCode,
        [Parameter(Mandatory)] [string]$Reason,
        [Parameter(Mandatory)] [string]$ContentType,
        [Parameter(Mandatory)] [byte[]]$Body,
        [Parameter(Mandatory)] [bool]$IncludeBody,
        [hashtable]$ExtraHeaders = @{}
    )

    $headerLines = @(
        "HTTP/1.1 $StatusCode $Reason",
        "Content-Type: $ContentType",
        "Content-Length: $($Body.Length)",
        'Connection: close',
        'Cache-Control: no-store',
        'X-Content-Type-Options: nosniff',
        'Referrer-Policy: no-referrer'
    )
    foreach ($headerName in $ExtraHeaders.Keys) {
        $headerLines += "$headerName`: $($ExtraHeaders[$headerName])"
    }
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($headerLines -join "`r`n") + "`r`n`r`n")
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($IncludeBody -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

function Get-ContentType {
    param([Parameter(Mandatory)] [string]$Extension)

    switch ($Extension.ToLowerInvariant()) {
        '.html' { return 'text/html; charset=utf-8' }
        '.css'  { return 'text/css; charset=utf-8' }
        '.js'   { return 'application/javascript; charset=utf-8' }
        '.json' { return 'application/json; charset=utf-8' }
        '.png'  { return 'image/png' }
        '.jpg'  { return 'image/jpeg' }
        '.jpeg' { return 'image/jpeg' }
        '.gif'  { return 'image/gif' }
        '.svg'  { return 'image/svg+xml' }
        '.webp' { return 'image/webp' }
        '.ico'  { return 'image/x-icon' }
        '.wav'  { return 'audio/wav' }
        '.mp3'  { return 'audio/mpeg' }
        '.woff' { return 'font/woff' }
        '.woff2' { return 'font/woff2' }
        default { return 'application/octet-stream' }
    }
}

$trimCharacters = [char[]]@([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
$rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd($trimCharacters)
$rootPrefix = $rootPath + [System.IO.Path]::DirectorySeparatorChar
$allowedExtensions = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@('.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.wav', '.mp3', '.woff', '.woff2') |
    ForEach-Object { [void]$allowedExtensions.Add($_) }

$url = "http://localhost:$Port/"
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)

try {
    $listener.Start()
} catch {
    Write-Error "Impossible de demarrer HIVE ASCENSION sur le port $Port. Verifiez que ce port n'est pas deja utilise. Detail : $($_.Exception.Message)"
    exit 1
}

Write-Host '==========================================================' -ForegroundColor Green
Write-Host ' HIVE ASCENSION - serveur local demarre' -ForegroundColor Cyan
Write-Host " Adresse : $url" -ForegroundColor Yellow
Write-Host ' Appuyez sur Ctrl+C pour arreter le serveur.' -ForegroundColor Gray
Write-Host '==========================================================' -ForegroundColor Green

if (-not $NoBrowser) {
    Start-Process $url
}

try {
    while ($true) {
        $client = $null
        $stream = $null
        $reader = $null
        $responseSent = $false

        try {
            $client = $listener.AcceptTcpClient()
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 5000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine) -or $requestLine.Length -gt 8192) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Requete incorrecte.')
                Send-HttpResponse $stream 400 'Bad Request' 'text/plain; charset=utf-8' $body $true
                $responseSent = $true
                continue
            }

            $requestParts = $requestLine.Split(' ')
            if ($requestParts.Count -ne 3) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Requete incorrecte.')
                Send-HttpResponse $stream 400 'Bad Request' 'text/plain; charset=utf-8' $body $true
                $responseSent = $true
                continue
            }

            $method = $requestParts[0].ToUpperInvariant()
            $requestTarget = $requestParts[1]
            while (-not [string]::IsNullOrEmpty($reader.ReadLine())) { }

            if ($method -notin @('GET', 'HEAD')) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Methode non autorisee.')
                Send-HttpResponse $stream 405 'Method Not Allowed' 'text/plain; charset=utf-8' $body ($method -ne 'HEAD') @{ Allow = 'GET, HEAD' }
                $responseSent = $true
                continue
            }

            $queryIndex = $requestTarget.IndexOf('?')
            $rawPath = if ($queryIndex -ge 0) { $requestTarget.Substring(0, $queryIndex) } else { $requestTarget }
            if (-not $rawPath.StartsWith('/')) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Chemin incorrect.')
                Send-HttpResponse $stream 400 'Bad Request' 'text/plain; charset=utf-8' $body ($method -eq 'GET')
                $responseSent = $true
                continue
            }

            $decodedPath = [System.Uri]::UnescapeDataString($rawPath).Replace('\', '/')
            $relativePath = $decodedPath.TrimStart('/').Replace('/', [string][System.IO.Path]::DirectorySeparatorChar)
            $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))
            $isInsideRoot = $candidatePath.Equals($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or
                $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)

            if (-not $isInsideRoot) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Acces interdit.')
                Send-HttpResponse $stream 403 'Forbidden' 'text/plain; charset=utf-8' $body ($method -eq 'GET')
                $responseSent = $true
                continue
            }

            if ((Test-Path -LiteralPath $candidatePath -PathType Container)) {
                $candidatePath = Join-Path $candidatePath 'index.html'
            }

            $relativeCandidate = $candidatePath.Substring($rootPath.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar)
            $segments = $relativeCandidate -split '[\\/]'
            $containsPrivateSegment = @($segments | Where-Object { $_.StartsWith('.') }).Count -gt 0
            $extension = [System.IO.Path]::GetExtension($candidatePath)

            if ($containsPrivateSegment -or
                -not $allowedExtensions.Contains($extension) -or
                -not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Ressource introuvable.')
                Send-HttpResponse $stream 404 'Not Found' 'text/plain; charset=utf-8' $body ($method -eq 'GET')
                $responseSent = $true
                continue
            }

            $content = [System.IO.File]::ReadAllBytes($candidatePath)
            Send-HttpResponse $stream 200 'OK' (Get-ContentType $extension) $content ($method -eq 'GET')
            $responseSent = $true
        } catch {
            if (-not $responseSent -and $null -ne $stream -and $stream.CanWrite) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Erreur interne du serveur local.')
                Send-HttpResponse $stream 500 'Internal Server Error' 'text/plain; charset=utf-8' $body $true
            }
            Write-Warning "Requete locale en echec : $($_.Exception.Message)"
        } finally {
            if ($null -ne $reader) { $reader.Dispose() }
            if ($null -ne $stream) { $stream.Dispose() }
            if ($null -ne $client) { $client.Dispose() }
        }
    }
} finally {
    $listener.Stop()
}
