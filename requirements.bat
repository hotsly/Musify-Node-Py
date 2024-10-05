#!/bin/bash

# Step 1: Create Python virtual environment (.venv)
echo "Creating Python virtual environment..."
python3 -m venv .venv

# Step 2: Activate the virtual environment
echo "Activating the virtual environment..."
source .venv/bin/activate

# Step 3: Install Python packages (yt_dlp)
echo "Installing Python packages (yt_dlp)..."
pip install yt-dlp

# Step 4: Initialize npm and install electron
echo "Initializing npm and installing electron..."
npm init -y

npm install electron

# Step 5: Set up Git username and email
echo "Setting up Git username and email..."
git config --global user.name "Bien Garcia"
git config --global user.email "garciabien11@gmail.com"

echo "Setup completed successfully!"
