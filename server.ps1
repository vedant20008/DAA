# Lightweight local HTTP server using built-in Windows .NET HttpListener
$port = 5500
$url = "http://localhost:$port/"
$basePath = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  StreamPulse DAA Web Server active at: $url" -ForegroundColor Green
    Write-Host "  Alternative access: http://127.0.0.1:$port/" -ForegroundColor Green
    Write-Host "  Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
    Start-Process $url

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $localPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($localPath)) {
                $localPath = "index.html"
            }

            # URL decode the local path
            $localPath = [System.Uri]::UnescapeDataString($localPath)
            $filePath = Join-Path $basePath $localPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".svg"  { "image/svg+xml" }
                    ".pdf"  { "application/pdf" }
                    ".md"   { "text/markdown; charset=utf-8" }
                    default { "application/octet-stream" }
                }

                $response.ContentType = $contentType
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $errBytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
            $response.Close()
        } catch {
            # Ignore client aborts or stream errors, keep server alive
        }
    }
} finally {
    $listener.Stop()
}
