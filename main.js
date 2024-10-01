// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add this to read files from the Playlist directory
app.on('ready', () => {
    const playlistDir = path.join(__dirname, 'Playlist');
    fs.readdir(playlistDir, (err, files) => {
        if (err) throw err;
        // Filter only audio files (you can modify this based on your needs)
        const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.webm'));
        // Send the audio file names to the renderer process
        mainWindow.webContents.send('load-playlist', audioFiles);
    });
});
