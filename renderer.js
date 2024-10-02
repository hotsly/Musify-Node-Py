const audio = document.getElementById('audio');
const seekBar = document.getElementById('seek-bar');
const playPauseBtn = document.getElementById('play-pause');
const songList = document.getElementById('song-list');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volumeControl = document.getElementById('volume');

// Playlist elements
const youtubeLinkInput = document.getElementById('youtube-link');
const addPlaylistBtn = document.getElementById('add-playlist-btn');

let isSeeking = false;
// Variable to keep track of the current song index
let currentSongIndex = 0;
let audioFiles = []; // Store the list of audio files

// Load the volume setting from settings.json on startup
(async () => {
    const volume = await window.electron.ipcRenderer.invoke('get-volume');
    audio.volume = volume / 100; // Set audio volume to the saved value
    volumeControl.value = volume; // Set the slider to the saved value
    console.log('Initialized volume:', volume); // Debugging log
})();

// Load the playlist and populate the UI
window.electron.ipcRenderer.on('load-playlist', (files) => {
    audioFiles = files; // Store the audio files globally
    currentSongIndex = 0; // Reset index to the first song
    loadSong(currentSongIndex); // Load the first song
});

// Function to load a song by index
function loadSong(index) {
    if (index < 0 || index >= audioFiles.length) return; // Boundary check
    audio.src = `./Playlist/${audioFiles[index]}`; // Set audio source
}

// Next button functionality
nextBtn.addEventListener('click', () => {
    if (currentSongIndex < audioFiles.length - 1) {
        currentSongIndex++; // Move to the next song
        loadSong(currentSongIndex); // Load the next song
        audio.play(); // Play the next song immediately
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
    }
});

// Previous button functionality
prevBtn.addEventListener('click', () => {
    if (currentSongIndex > 0) {
        currentSongIndex--; // Move to the previous song
        loadSong(currentSongIndex); // Load the previous song
        audio.play(); // Play the previous song immediately
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
    }
});

audio.addEventListener('loadedmetadata', () => {
    seekBar.max = Math.floor(audio.duration);
});

audio.addEventListener('timeupdate', () => {
    if (!isSeeking) {
        seekBar.value = Math.floor(audio.currentTime);
    }
});

audio.addEventListener('ended', () => {
    if (currentSongIndex < audioFiles.length - 1) {
        currentSongIndex++; // Move to the next song
        loadSong(currentSongIndex); // Load the next song
        audio.play(); // Play the next song
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause
    } else {
        // Reset to the first song
        currentSongIndex = 0; 
        loadSong(currentSongIndex); 
    }
});

// Seek bar events
seekBar.addEventListener('mousedown', () => {
    isSeeking = true;
});

seekBar.addEventListener('input', () => {
    audio.currentTime = seekBar.value;
});

seekBar.addEventListener('mouseup', () => {
    isSeeking = false;
    audio.currentTime = seekBar.value;
    audio.play();
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
});

// Play/Pause button functionality
playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change to play icon
    }
});

// Volume control functionality
volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value;
    audio.volume = volumeControl.value / 100; // Set volume (0.0 to 1.0)
    window.electron.ipcRenderer.send('set-volume', volume); // Save volume to settings.json
    console.log('Volume changed to:', volume); // Debugging log
});

// Add YouTube link to playlist
addPlaylistBtn.addEventListener('click', () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    console.log(`YouTube Link entered: ${youtubeLink}`); // Debugging log

    if (youtubeLink) {
        // Create a new song item for the loading state
        const loadingItem = document.createElement('div');
        loadingItem.textContent = 'Loading...'; // Set the loading text
        loadingItem.className = 'list-group-item disabled'; // Add a disabled class for styling
        loadingItem.style.pointerEvents = 'none'; // Disable click events on this item
        songList.appendChild(loadingItem); // Add the loading item to the playlist

        // Show a message in the title bar to indicate adding new songs
        document.title = 'Adding New Songs...';

        // Send the YouTube URL to the main process for downloading
        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);

        // Define a function to handle the download completion
        const downloadCompleteHandler = (event, file) => {
            // Remove the loading item
            songList.removeChild(loadingItem);

            // Ensure the file path is correctly formed
            const songName = file.split('/').pop(); // Get the file name with extension

            // Check if the file is really downloaded
            const songItem = document.createElement('div');
            songItem.textContent = songName; // Use the full file name
            songItem.className = 'list-group-item'; // Updated to use list group item

            // Make the new song clickable after download completes
            songItem.addEventListener('click', () => {
                audio.src = `./Playlist/${songName}`; // Update audio source
                audio.play(); // Play the selected song
                playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Update button text to 'Pause'
            });
            songList.appendChild(songItem); // Add song item to the list

            // Update the title bar to indicate the song was added
            document.title = 'Song Added: ' + songName;

            // Remove the listener after the download is handled
            window.electron.ipcRenderer.removeListener('download-complete', downloadCompleteHandler);
        };

        // Use ipcRenderer.on instead of once, and remove the listener after it is called
        window.electron.ipcRenderer.on('download-complete', downloadCompleteHandler);

        // Clear the input field
        youtubeLinkInput.value = '';
    } else {
        alert('Please enter a valid YouTube URL.');
    }
});

// Function to play a song by index
function playSongByIndex(index) {
    const songItems = document.querySelectorAll('.list-group-item');
    if (index < songItems.length) {
        audio.src = `./Playlist/${songItems[index].textContent}`; // Set audio source
        audio.play(); // Play the selected song
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause

        // Listen for the end of the current song to play the next one
        audio.onended = () => {
            currentSongIndex++;
            playSongByIndex(currentSongIndex); // Play the next song
        };
    } else {
        // Reset the index after the last song has finished
        currentSongIndex = 0;
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Reset button to play
    }
}

// Function to receive playlist from main process
window.electron.ipcRenderer.on('load-playlist', (audioFiles) => {
    songList.innerHTML = ''; // Clear previous song list

    audioFiles.forEach(file => {
        // Remove the file extension from the song name
        const songName = file.split('.').slice(0, -1).join('.'); // Split and join to get the name without the extension

        const songItem = document.createElement('div');
        songItem.textContent = songName; // Use the song name without the extension
        songItem.className = 'list-group-item'; // Updated to use list group item
        songItem.addEventListener('click', () => {
            audio.src = `./Playlist/${file}`; // Update audio source
            audio.play(); // Play the selected song
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Update button text to 'Pause'
        });
        songList.appendChild(songItem); // Add song item to the list
    });
});
