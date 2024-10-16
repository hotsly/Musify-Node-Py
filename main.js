const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

if (!app.requestSingleInstanceLock()) {
    console.log('Another instance of the app is already running.');
    app.quit();
} else {
    if (require('electron-squirrel-startup')) app.quit();

    // Define paths as variables
    let ROOT_DIR
    let RESOURCES_DIR
    let EXECUTABLE_PATH
    if (app.isPackaged){
        ROOT_DIR = app.getAppPath()
        RESOURCES_DIR = process.resourcesPath
        EXECUTABLE_PATH = path.join(RESOURCES_DIR, 'downloader.exe');
        console.log(`Running Packed Mode`)
    }else{
        ROOT_DIR = __dirname;
        RESOURCES_DIR = path.join(ROOT_DIR, 'resources');
        EXECUTABLE_PATH = path.join(ROOT_DIR, 'downloader.py');
        console.log(`Test Mode`)
    }

    const SETTINGS_FILE = path.join(RESOURCES_DIR, 'settings.json');
    const PRELOAD_FILE = path.join(ROOT_DIR, 'preload.js');
    const INDEX_FILE = path.join(ROOT_DIR, 'index.html');
    const TRAY_ICON = path.join(RESOURCES_DIR, 'tray-icon.ico');
    const PLAYLIST_DIR = path.join(RESOURCES_DIR, 'Playlist');

    let mainWindow;
    let tray = null;

    // Create settings.json file if it doesn't exist
    if (!fs.existsSync(SETTINGS_FILE)) {
        const defaultSettings = {
            volume: 100,
            isShuffling: false
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
        console.log('Settings file created');
    }

    // Function to load settings from settings.json
    function loadSettings() {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        }
        return {};
    }

    // Function to save settings to settings.json
    function saveSettings(settings) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); // Save with pretty format
    }

    // Main create window function
    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 360,
            height: 500,
            resizable: true,
            autoHideMenuBar: true,
            icon: TRAY_ICON,
            webPreferences: {
                preload: PRELOAD_FILE,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: !app.isPackaged,
            },
        });

        mainWindow.loadFile(INDEX_FILE);

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

        ipcMain.handle('get-playlist-path', () => PLAYLIST_DIR);

        // Minimize the app to the tray when the main window is closed
        mainWindow.on('close', (event) => {
            event.preventDefault(); // Prevent the window from closing
            mainWindow.hide(); // Hide the window instead
        });
    }

    // Create a tray icon
    function createTray() {
        tray = new Tray(TRAY_ICON);
        
        // Create a context menu for the tray icon
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Play/Pause',
                click: () => {
                    mainWindow.webContents.send('play-pause-audio');
                }
            },
            {
                label: 'Next',
                click: () => {
                    mainWindow.webContents.send('next-song');
                }
            },
            {
                label: 'Previous',
                click: () => {
                    mainWindow.webContents.send('prev-song');
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

        if (!fs.existsSync(PLAYLIST_DIR)) {
            fs.mkdirSync(PLAYLIST_DIR);
            console.log('Playlist folder created');
        }
        fs.readdir(PLAYLIST_DIR, (err, files) => {
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
            let command;
            if (app.isPackaged) {
                command = `"${EXECUTABLE_PATH}" "${youtubeLink}"`;
                console.log(`Running Packed Mode for Downloader`);
            } else {
                command = `python "${EXECUTABLE_PATH}" "${youtubeLink}"`;
                console.log(`Test Mode for Downloader`);
            }
        
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
        
                const downloadedFile = stdout.trim(); // Capture the downloaded file path
                console.log(`Downloaded file: ${downloadedFile}`); // Log the downloaded file
        
                if (downloadedFile) {
                    mainWindow.webContents.send('download-complete', downloadedFile); // Send the file path to renderer
                } else {
                    console.error('No file downloaded or an error occurred.');
                }
        
                // After sending the file path, refresh the playlist
                fs.readdir(PLAYLIST_DIR, (err, files) => {
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
        const filePath = path.join(PLAYLIST_DIR, fileName); // Construct the file path

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
}