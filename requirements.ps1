# run "powershell -ExecutionPolicy Bypass -File .\requirements.ps1" to install the requirements.
# run pyinstaller --onefile --distpath bin downloader.py

# packing with electron forge
# electron forge installation "npm install --save-dev @electron-forge/cli"
# run "npx electron-forge import" to import forge in existing electron project

# Step 1: Create Python virtual environment (.venv)
Write-Host "Creating Python virtual environment..."
python -m venv .venv

# Step 2: Activate the virtual environment
Write-Host "Activating the virtual environment..."
& .\.venv\Scripts\Activate.ps1

# Step 3: Install Python packages (yt_dlp)
Write-Host "Installing Python packages (yt_dlp)..."
pip install yt-dlp

# Step 4: Install Python packages (yt_dlp)
Write-Host "Installing Python packages (yt_dlp)..."
pip install pyinstaller

# Step 5: Initialize npm
Write-Host "Initializing npm..."
npm init -y

# Step 6: Install electron
Write-Host "Installing electron..."
npm install electron

# # Step 7: Set up Git username and email
# Write-Host "Setting up Git username and email..."
# git config --global user.name "Bien Garcia"
# git config --global user.email "garciabien11@gmail.com"

Write-Host "Setup completed successfully!"
Write-Host 'Change "test": "echo \"Error: no test specified\" && exit 1" to "start": "electron ."'
Write-Host "npm start to run the script."
