@echo off
set "PATH=C:\Program Files\Java\jdk-26.0.1\bin;C:\Program Files\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin;C:\Windows\System32;%PATH%"
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=fintrack
set DB_USERNAME=fintrack_user
set DB_PASSWORD=change-me-db-password
set JWT_SECRET=7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
set JWT_EXPIRATION_MINUTES=60
set CORS_ALLOWED_ORIGIN=http://localhost:5173

cd /d "%~dp0backend"
call "C:\Program Files\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
