@echo off
echo ========================================
echo   PickCV - Starting Development Server
echo ========================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting dev server...
echo Browser will open automatically!
echo.
call npm run dev
