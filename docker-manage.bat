@echo off
REM Docker Setup and Deployment Script for Windows
REM Usage: docker-manage.bat start|stop|build|restart|status|logs|clean

setlocal enabledelayedexpansion

REM Colors using ANSI codes (requires Windows 10+)
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

REM Check if .env exists
if not exist .env (
    echo.
    echo %YELLOW%WARNING: .env file not found. Creating from .env.example...%NC%
    copy .env.example .env
    echo %BLUE%Please update .env with your configuration before deploying to production%NC%
) else (
    echo %GREEN%✓ .env file found%NC%
)

REM Parse command line arguments
if "%1"=="" (
    call :show_menu
    exit /b 0
)

if /i "%1"=="start" (
    call :start_services
    exit /b 0
)

if /i "%1"=="stop" (
    call :stop_services
    exit /b 0
)

if /i "%1"=="build" (
    call :build_images %2
    exit /b 0
)

if /i "%1"=="status" (
    call :show_status
    exit /b 0
)

if /i "%1"=="logs" (
    call :show_logs %2
    exit /b 0
)

if /i "%1"=="restart" (
    call :stop_services
    call :build_images
    call :start_services
    exit /b 0
)

if /i "%1"=="clean" (
    call :cleanup
    exit /b 0
)

if /i "%1"=="urls" (
    call :print_urls
    exit /b 0
)

echo Usage: %0 {start^|stop^|build^|restart^|status^|logs^|clean^|urls}
exit /b 1

:start_services
echo.
echo %BLUE%================================%NC%
echo %BLUE%Starting Services%NC%
echo %BLUE%================================%NC%
docker-compose up -d
if errorlevel 1 (
    echo %RED%✗ Failed to start services%NC%
    exit /b 1
)
echo %GREEN%✓ Services started%NC%
timeout /t 5 /nobreak
call :print_urls
exit /b 0

:stop_services
echo.
echo %BLUE%================================%NC%
echo %BLUE%Stopping Services%NC%
echo %BLUE%================================%NC%
docker-compose down
if errorlevel 1 (
    echo %RED%✗ Failed to stop services%NC%
    exit /b 1
)
echo %GREEN%✓ Services stopped%NC%
exit /b 0

:build_images
echo.
echo %BLUE%================================%NC%
echo %BLUE%Building Docker Images%NC%
echo %BLUE%================================%NC%
docker-compose build %2
if errorlevel 1 (
    echo %RED%✗ Failed to build images%NC%
    exit /b 1
)
echo %GREEN%✓ Docker images built successfully%NC%
exit /b 0

:show_status
echo.
echo %BLUE%================================%NC%
echo %BLUE%Service Status%NC%
echo %BLUE%================================%NC%
docker-compose ps
exit /b 0

:show_logs
echo.
echo %BLUE%================================%NC%
echo %BLUE%Service Logs%NC%
echo %BLUE%================================%NC%
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
exit /b 0

:cleanup
echo.
echo %BLUE%================================%NC%
echo %BLUE%Cleaning Up%NC%
echo %BLUE%================================%NC%
echo %YELLOW%⚠ This will remove all containers and volumes!%NC%
set /p confirm="Are you sure? (y/N) "
if /i not "%confirm%"=="y" (
    echo Cleanup cancelled
    exit /b 0
)
docker-compose down -v
echo %GREEN%✓ Cleanup complete%NC%
exit /b 0

:print_urls
echo.
echo %BLUE%================================%NC%
echo %BLUE%Application URLs%NC%
echo %BLUE%================================%NC%
echo %GREEN%Frontend:%NC% http://localhost:3000
echo %GREEN%Backend API:%NC% http://localhost:3001
echo %GREEN%Database:%NC% localhost:3306
echo.
exit /b 0

:show_menu
echo.
echo %BLUE%================================%NC%
echo %BLUE%Barbershop Docker Management%NC%
echo %BLUE%================================%NC%
echo 1) Start services
echo 2) Stop services
echo 3) Build images
echo 4) Show status
echo 5) Show logs
echo 6) Restart services
echo 7) Cleanup
echo 0) Exit
echo.
set /p choice="Choose an option: "

if "%choice%"=="1" call :start_services & goto :show_menu
if "%choice%"=="2" call :stop_services & goto :show_menu
if "%choice%"=="3" call :build_images & goto :show_menu
if "%choice%"=="4" call :show_status & goto :show_menu
if "%choice%"=="5" call :show_logs & goto :show_menu
if "%choice%"=="6" call :stop_services & call :build_images & call :start_services & goto :show_menu
if "%choice%"=="7" call :cleanup & goto :show_menu
if "%choice%"=="0" exit /b 0

echo Invalid option
goto :show_menu
