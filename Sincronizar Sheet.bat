@echo off
title Sincronizar Google Sheet → AIdeasBoom
echo.
echo  Sincronizando aprobaciones del Google Sheet...
echo.

:: Semana 1 — Mar 16-21
echo  [1/3] Semana 1 - Despertar Curiosidad (Mar 16-21)...
curl -s -X POST http://localhost:3000/api/planning/be624f7a-8571-4919-a9a3-ce9c00bdfc6c/import-approvals >nul
echo      OK

:: Semana 2 — Mar 23-28
echo  [2/3] Semana 2 - Masterclass + Ventas (Mar 23-28)...
curl -s -X POST http://localhost:3000/api/planning/9411e015-ab5d-45e2-abce-6ce9e9682df7/import-approvals >nul
echo      OK

:: Semana 3 — Mar 30 - Abr 4
echo  [3/3] Semana 3 - Cierre y Conversion (Mar 30 - Abr 4)...
curl -s -X POST http://localhost:3000/api/planning/0eaec31d-476c-447e-afb1-a58597acac78/import-approvals >nul
echo      OK

echo.
echo  Sincronizacion completada.
echo  Abriendo Google Sheet...
echo.
start "" "https://docs.google.com/spreadsheets/d/1v9ZCF4y17Qz-OgAQrKeIBKiNykQxkv3L6rm3s3PftHc"
timeout /t 2 /nobreak >nul
