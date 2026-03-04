@echo off
echo ========================================
echo   Backend Server Restart Script
echo   (Correct Backend - HotelViratAws)
echo ========================================
echo.

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Node.js processes stopped successfully
) else (
    echo ✓ No Node.js processes were running
)
echo.

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo.

echo Starting backend server...
echo.
echo ========================================
echo   Server Starting - Watch for Emojis!
echo ========================================
echo.
echo Look for these indicators:
echo   ✓ MongoDB connected emoji
echo   ✓ Ticket emoji (🎫) when generating KOT
echo   ✓ Check mark emoji (✅) for success
echo   ✓ "Using provided tableId" message
echo.
echo If you see "Table number 'A2' is not a number"
echo then the old code is still running!
echo.
echo ========================================
echo.

npm start
