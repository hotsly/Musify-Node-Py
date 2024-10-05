# Step 1: Create Python virtual environment (.venv)
Write-Host "Creating Python virtual environment..."
python -m venv .venv

# Step 2: Activate the virtual environment
Write-Host "Activating the virtual environment..."
& .\.venv\Scripts\Activate.ps1

# Step 3: Install Python packages (yt_dlp)
Write-Host "Installing Python packages (yt_dlp)..."
pip install yt-dlp

# Step 4: Initialize npm
Write-Host "Initializing npm..."
npm init -y

# Step 5: Install electron
Write-Host "Installing electron..."
npm install electron

# Step 6: Set up Git username and email
Write-Host "Setting up Git username and email..."
git config --global user.name "Bien Garcia"
git config --global user.email "garciabien11@gmail.com"

Write-Host "Setup completed successfully!"
