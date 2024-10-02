// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('index.html');
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

            // After downloading, you can refresh the playlist or update the UI
            fs.readdir(playlistDir, (err, files) => {
                if (err) throw err;

                const audioFiles = files.filter(file => 
                    file.endsWith('.mp3') || 
                    file.endsWith('.webm') || 
                    file.endsWith('.m4a') || 
                    file.endsWith('.wav')
                );
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
