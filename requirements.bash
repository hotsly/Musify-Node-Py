@echo off

REM Step 1: Create Python virtual environment (.venv)
echo Creating Python virtual environment...
python -m venv .venv

REM Step 2: Activate the virtual environment
echo Activating the virtual environment...
call .venv\Scripts\activate.bat

REM Step 3: Install Python packages (yt_dlp)
echo Installing Python packages (yt_dlp)...
pip install yt-dlp

REM Step 4: Initialize npm and install electron
echo Initializing npm and installing electron...
npm init -y
npm install electron

echo Setup completed successfully!
