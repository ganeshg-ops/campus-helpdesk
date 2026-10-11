@echo off
title Campus Helpdesk - Backend (Port 8000)
echo ========================================================
echo        Starting FastAPI Backend Server
echo ========================================================
cd /d "%~dp0backend"
python run.py
pause
