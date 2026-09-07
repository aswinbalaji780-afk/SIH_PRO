@echo off
title National Skill Intelligence Platform - Local Server
echo ========================================================
echo   Starting National Skill Intelligence & Learning Platform
echo ========================================================
echo.
cd /d "%~dp0"

echo Checking Python environment...
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PYCMD=py
) else (
    set PYCMD=python
)

echo Using %PYCMD% to start FastAPI Uvicorn Server on port 8000...
echo.
echo Server URL: http://127.0.0.1:8000
echo API Docs:   http://127.0.0.1:8000/docs
echo.
echo Opening browser in 3 seconds...
start "" "http://127.0.0.1:8000"

%PYCMD% -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
