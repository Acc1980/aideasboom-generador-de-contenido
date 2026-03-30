@echo off
title AIdeasBoom
echo.
echo  Iniciando AIdeasBoom...
echo.

:: Cerrar Node previo si existe
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: Iniciar Redis en segundo plano
start "" /B "C:\Program Files\Redis\redis-server.exe" "C:\Program Files\Redis\redis.windows.conf"
timeout /t 2 /nobreak >nul

:: Verificar que Redis responde
"C:\Program Files\Redis\redis-cli.exe" ping >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Redis no pudo iniciar.
    pause
    exit /b
)
echo  Redis listo.

:: Iniciar el servidor Node en segundo plano
echo  Iniciando servidor en http://localhost:3000
echo.
cd /d "D:\automatizaciones\AIdeasBoom"
start "AIdeasBoom Server" /min cmd /c "npm start"

:: Esperar que levante y abrir el navegador
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo  Servidor corriendo. Puedes cerrar esta ventana.
timeout /t 2 /nobreak >nul
