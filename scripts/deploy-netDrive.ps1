# --- Konfigurácia ---
$sourcePath = ".\dist\browser"  # Cesta k buildu Angularu (skontrolujte si 'dist')
$destinationPath = "W:\rezervacie-dashboard"          # Vaša namapovaná cesta na serveri

# 1. Spustenie buildu Angularu pre produkciu
Write-Host "Spúšťam build Angular aplikácie..." -ForegroundColor Cyan
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build zlyhal. Nasadenie sa prerušuje."
    exit $LASTEXITCODE
}

# 2. Synchronizácia súborov pomocou Robocopy
# /MIR  - Zrkadlenie (skopíruje zmenené, zmaže tie, ktoré už v zdroji nie sú)
# /FFT  - Používa FAT časy (lepšie pre sieťové disky a rôzne súborové systémy)
# /R:3  - Opakovať 3-krát pri chybe
# /W:5  - Čakať 5 sekúnd medzi opakovaniami
Write-Host "Synchronizujem súbory na server (iba zmeny)..." -ForegroundColor Cyan
robocopy $sourcePath $destinationPath /MIR /FFT /R:3 /W:5

# Robocopy vracia rôzne exit kódy (napr. 1 znamená úspešné skopírovanie zmenených súborov)
if ($LASTEXITCODE -lt 8) {
    Write-Host "Nasadenie úspešne dokončené!" -ForegroundColor Green
} else {
    Write-Error "Robocopy narazil na chybu (Exit Code: $LASTEXITCODE)."
}
