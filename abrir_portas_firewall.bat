@echo off
chcp 65001 >nul
echo ========================================================
echo   Liberando portas 3080 e 8080 no Firewall do Windows
echo ========================================================
echo.

:: Verificar se tem permissão de Administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [1/2] Liberando porta 3080 (Frontend PWA)...
    netsh advfirewall firewall delete rule name="Sistema de Obras - Frontend" >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema de Obras - Frontend" dir=in action=allow protocol=TCP localport=3080 >nul

    echo [2/2] Liberando porta 8080 (Backend API)...
    netsh advfirewall firewall delete rule name="Sistema de Obras - Backend" >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema de Obras - Backend" dir=in action=allow protocol=TCP localport=8080 >nul

    echo.
    echo ✅ Sucesso! Portas 3080 e 8080 liberadas para acesso no celular.
    echo.
    echo Agora acesse no navegador do celular:
    echo   http://192.168.15.173:3080
    echo.
    pause
) else (
    echo Solicitando elevacao de Administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
)
