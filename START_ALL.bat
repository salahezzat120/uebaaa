@echo off
REM Guardian Owl - Start All Services (Batch File)
REM This is a simple wrapper for the PowerShell script

echo Starting Guardian Owl services...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0START_ALL.ps1"

pause




