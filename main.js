const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;
let tray = null;

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
        icon: 'tray-icon.ico',
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

    // Minimize the app to the tray when the main window is closed
    mainWindow.on('close', (event) => {
        event.preventDefault(); // Prevent the window from closing
        mainWindow.hide(); // Hide the window instead
    });
}

// Create a tray icon
function createTray() {
    const trayIcon = './tray-icon.ico'; // Replace with your own icon path
    tray = new Tray(trayIcon);
    
    // Create a context menu for the tray icon
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                // Show the main window
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.show();
                mainWindow.focus();
                mainWindow.setVisibleOnAllWorkspaces(true);
                mainWindow.setSkipTaskbar(false);
                mainWindow.webContents.send('show-window');
            }
        },
        {
            label: 'Exit',
            click: () => {
                // Quit the app
                app.quit();
                process.exit(0);
            }
        }
    ]);
    
    // Set the context menu for the tray icon
    tray.setContextMenu(contextMenu);
    
    // Add a click event listener to the tray icon
    tray.on('click', () => {
        // Show the main window
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setVisibleOnAllWorkspaces(true);
        mainWindow.setSkipTaskbar(false);
        mainWindow.webContents.send('show-window');
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

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

        // Run the executable file with the YouTube link
        const executablePath = path.join(__dirname, 'bin\\downloader.exe');
        const command = `"${executablePath}" "${youtubeLink}"`;

        // Execute the command asynchronously
        exec(command, (error, stdout, stderr) => {
            if ( error) {
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

// Handle the delete-file request
ipcMain.handle('delete-file', async (event, fileName) => {
    const filePath = path.join(__dirname, 'Playlist', fileName); // Construct the file path

    try {
        await fs.promises.unlink(filePath); // Delete the file
        console.log(`Deleted file: ${filePath}`);
    } catch (error) {
        console.error(`Error deleting file: ${error}`);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
    // Hide the main window instead of quitting
    if (mainWindow) {
        mainWindow.hide();
    }
});