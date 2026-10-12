@echo off
set "PATH=C:\Windows\System32;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Windows;C:\Windows\System32\Wbem;%PATH%"
echo ========================================================
echo FinTrack MySQL Database Initialization
echo ========================================================
echo This script connects to local MySQL to create the database:
echo   - Database: fintrack
echo   - User:     fintrack_user
echo.
set /p MYSQL_ROOT_PASS="Enter your MySQL root password (press Enter if none): "

if "%MYSQL_ROOT_PASS%"=="" (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < "%~dp0setup_database.sql"
) else (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"%MYSQL_ROOT_PASS%" < "%~dp0setup_database.sql"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Database and user created successfully!
    echo You can now run .\start-backend.ps1
    echo ========================================================
) else (
    echo.
    echo [ERROR] MySQL connection failed. Please check your root password.
)
pause
