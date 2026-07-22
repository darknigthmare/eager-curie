@echo off
title HIVE ASCENSION - Local Web Server
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
set "server_exit=%ERRORLEVEL%"
if not "%server_exit%"=="0" (
  echo.
  echo Le serveur n'a pas pu demarrer. Code d'erreur : %server_exit%
  pause
)
exit /b %server_exit%
