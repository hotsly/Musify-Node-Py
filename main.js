// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

// Function to load settings from settings.json
function loadSettings() {
    const settingsPath = path.join(__dirname, 'settings.json');
    if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    return {};
}

// Function to save settings to settings.json
function saveSettings(settings) {
    const settingsPath = path.join(__dirname, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); // Save with pretty format
}

// Main create window function
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 360,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('index.html');

    // Read volume setting from settings.json
    ipcMain.handle('get-volume', () => {
        const settings = loadSettings();
        console.log(`Loaded volume: ${settings.volume || 100}`); // Debugging log
        return settings.volume || 100; // Default volume is 100
    });

    // Save volume setting to settings.json
    ipcMain.on('set-volume', (event, volume) => {
        const settings = loadSettings(); // Load existing settings
        settings.volume = volume; // Update volume
        saveSettings(settings); // Save the updated settings
        console.log(`Volume set to ${volume} and saved to settings.json`); // Log the saved volume
    });

    // New: Get shuffle state
    ipcMain.handle('get-shuffle', () => {
        const settings = loadSettings();
        return settings.isShuffling || false; // Return saved shuffle state or false if undefined
    });

    // New: Set shuffle state
    ipcMain.on('set-shuffle', (event, isShuffling) => {
        const settings = loadSettings(); // Load existing settings
        settings.isShuffling = isShuffling; // Update the shuffle state
        saveSettings(settings); // Save the updated settings
        console.log(`Shuffle state set to ${isShuffling} and saved to settings.json`); // Log the saved shuffle state
    });
}

app.whenReady().then(() => {
    createWindow();

    const playlistDir = path.join(__dirname, 'Playlist');
    fs.readdir(playlistDir, (err, files) => {
        if (err) throw err;

        const audioFiles = files.filter(file => 
            file.endsWith('.mp3') || 
            file.endsWith('.webm') || 
            file.endsWith('.m4a') || // Added M4A support
            file.endsWith('.wav') // Example for adding WAV support
        );
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('load-playlist', audioFiles);
        });
    });

    // Listen for 'download-youtube-audio' event
    ipcMain.on('download-youtube-audio', (event, youtubeLink) => {
        console.log(`Downloading audio from: ${youtubeLink}`);

        // Run the Python script with the YouTube link
        const scriptPath = path.join(__dirname, 'downloader.py');
        const command = `python "${scriptPath}" "${youtubeLink}"`;

        // Execute the command asynchronously
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);

            // After the download is complete, read the playlist directory again
            const playlistDir = path.join(__dirname, 'Playlist');
            fs.readdir(playlistDir, (err, files) => {
                if (err) throw err;

                const audioFiles = files.filter(file => 
                    file.endsWith('.mp3') || 
                    file.endsWith('.webm') || 
                    file.endsWith('.m4a') || 
                    file.endsWith('.wav') 
                );

                // Notify the renderer process with the updated playlist
                mainWindow.webContents.send('load-playlist', audioFiles);
            });
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
