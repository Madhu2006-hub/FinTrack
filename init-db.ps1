Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "FinTrack MySQL Database Initialization" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "This will run setup_database.sql against your local MySQL server."
Write-Host ""

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$sqlFile = (Join-Path $PSScriptRoot "setup_database.sql").Replace("\", "/")

$pass = Read-Host "Enter your MySQL root password (leave empty if none)"

if ([string]::IsNullOrWhiteSpace($pass)) {
    & $mysqlExe -u root -e "source $sqlFile"
} else {
    & $mysqlExe -u root -p"$pass" -e "source $sqlFile"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] 'fintrack' database and 'fintrack_user' created successfully!" -ForegroundColor Green
    Write-Host "You can now run .\start-backend.ps1`n" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Connection failed. Please check the root password or MySQL Workbench.`n" -ForegroundColor Red
}
