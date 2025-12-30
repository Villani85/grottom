# Script PowerShell di verifica configurazione CORS per Firebase Storage
# Bucket: v0-membership-prod.firebasestorage.app

$BUCKET = "v0-membership-prod.firebasestorage.app"

Write-Host "🔍 Verifica Configurazione CORS per bucket: $BUCKET" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verifica che gsutil sia installato
$gsutilPath = Get-Command gsutil -ErrorAction SilentlyContinue
if (-not $gsutilPath) {
    Write-Host "❌ gsutil non trovato. Installa Google Cloud SDK:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ gsutil trovato" -ForegroundColor Green
Write-Host ""

# Verifica configurazione CORS attuale
Write-Host "📋 Configurazione CORS attuale:" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
gsutil cors get "gs://$BUCKET"
Write-Host ""

# Verifica che il bucket esista
Write-Host "🔍 Verifica esistenza bucket..." -ForegroundColor Cyan
$bucketCheck = gsutil ls "gs://$BUCKET" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bucket trovato: gs://$BUCKET" -ForegroundColor Green
} else {
    Write-Host "❌ Bucket non trovato: gs://$BUCKET" -ForegroundColor Red
    Write-Host "   Verifica il nome del bucket in .env.local" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test preflight OPTIONS (richiede Invoke-WebRequest)
Write-Host "🧪 Test Preflight OPTIONS..." -ForegroundColor Cyan
try {
    $headers = @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "PUT"
        "Access-Control-Request-Headers" = "content-type"
    }
    
    $response = Invoke-WebRequest -Uri "https://storage.googleapis.com/$BUCKET/test" `
        -Method OPTIONS `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 204) {
        Write-Host "✅ Preflight OPTIONS: Status $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Preflight OPTIONS: Status $($response.StatusCode) (atteso 200 o 204)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Errore nel test preflight: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Verifica completata!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prossimi passi:" -ForegroundColor Cyan
Write-Host "   1. Se CORS non è configurato, esegui: gsutil cors set cors.json gs://$BUCKET" -ForegroundColor Yellow
Write-Host "   2. Testa l'upload da http://localhost:3000/admin/courses/[courseId]/edit" -ForegroundColor Yellow
Write-Host "   3. Verifica il file in Firebase Console > Storage" -ForegroundColor Yellow



