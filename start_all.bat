@echo off
title Campus Helpdesk Launcher
echo ========================================================
echo        Starting Campus Helpdesk AI Portal
echo ========================================================
echo.

start "Campus Helpdesk - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python run.py"
start "Campus Helpdesk - Frontend (Port 5173)" cmd /k "set PATH=C:\Program Files\nodejs;%%PATH%% && cd /d %~dp0frontend && npm run dev"

echo Backend started at:  http://localhost:8000
echo Frontend started at: http://localhost:5173
echo API Docs:            http://localhost:8000/docs
echo.
echo Press any key to exit this launcher window...
pause >nul
