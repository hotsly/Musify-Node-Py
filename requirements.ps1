# Step 1: Create Python virtual environment (.venv)
Write-Host "Creating Python virtual environment..."
python -m venv .venv

# Step 2: Activate the virtual environment
Write-Host "Activating the virtual environment..."
$env:VENV = ".\.venv\Scripts\Activate.ps1"
. $env:VENV

# Step 3: Install Python packages (yt_dlp)
Write-Host "Installing Python packages (yt_dlp)..."
pip install yt-dlp

# Step 4: Initialize npm and install electron (path and fs are built-in modules)
Write-Host "Initializing npm and installing electron..."
npm init -y
npm install electron

Write-Host "Setup completed successfully!"
