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

# Step 4: Initialize npm
echo "Initializing npm..."
npm init -y || { echo "npm init failed"; exit 1; }

# Step 5: Install electron
echo "Installing electron..."
npm install electron || { echo "npm install electron failed"; exit 1; }

# Step 6: Set up Git username and email
echo "Setting up Git username and email..."
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

echo "Setup completed successfully!"
