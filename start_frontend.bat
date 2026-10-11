@echo off
title Campus Helpdesk - Frontend (Port 5173)
echo ========================================================
echo        Starting Vite Frontend Server
echo ========================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
npm run dev
pause
