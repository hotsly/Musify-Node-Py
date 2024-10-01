// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow; // Declare mainWindow variable

function createWindow() {
    mainWindow = new BrowserWindow({ // Assign to mainWindow
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('index.html');
}

// Listen for when the app is ready
app.whenReady().then(() => {
    createWindow();

    // Read files from the Playlist directory
    const playlistDir = path.join(__dirname, 'Playlist');
    fs.readdir(playlistDir, (err, files) => {
        if (err) throw err;

        // Filter only audio files
        const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.webm'));

        // Send the audio file names to the renderer process
        mainWindow.webContents.send('load-playlist', audioFiles);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
