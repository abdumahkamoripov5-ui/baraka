@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js topilmadi. Node.js o'rnating yoki start.bat bilan mahalliy rejimni oching.
  pause
  exit /b 1
)
node baraka\server.cjs
pause
