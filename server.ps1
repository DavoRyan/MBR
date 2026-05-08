$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running on http://localhost:8080"

$root = "c:\Users\davor\OneDrive\Desktop\NEMI Teas Sales Data"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $localPath = $ctx.Request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $filePath = Join-Path $root ($localPath.TrimStart("/"))
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        switch ($ext) {
            ".html" { $ctx.Response.ContentType = "text/html; charset=utf-8" }
            ".css"  { $ctx.Response.ContentType = "text/css" }
            ".js"   { $ctx.Response.ContentType = "application/javascript" }
            ".csv"  { $ctx.Response.ContentType = "text/csv" }
            default { $ctx.Response.ContentType = "application/octet-stream" }
        }
        $ctx.Response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
