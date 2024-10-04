const audio = document.getElementById('audio');
const seekBar = document.getElementById('seek-bar');
const playPauseBtn = document.getElementById('play-pause');
const songList = document.getElementById('song-list');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volumeControl = document.getElementById('volume');
const volumeBtn = document.getElementById('volume-btn');
const youtubeLinkInput = document.getElementById('youtube-link');
const addPlaylistBtn = document.getElementById('add-playlist-btn');
const shuffleBtn = document.getElementById('shuffle-btn');

let isShuffling = false; // Track shuffle state
let isSeeking = false;
let currentSongIndex = 0;
let audioFiles = []; // Store the list of audio files
let lastSongIndex = -1; // Store the index of the last played song
let songHistory = []; // Array to keep track of the history of played songs
let historyIndex = -1; // Index to track the current position in the history stack

async function saveShuffleState() {
    await window.electron.ipcRenderer.send('set-shuffle', isShuffling);
    console.log('Shuffle state saved:', isShuffling);
}

// Function to load the shuffle state from settings.json
(async () => {
    isShuffling = await window.electron.ipcRenderer.invoke('get-shuffle');
    // Set the button's state based on the loaded shuffle state
    if (isShuffling) {
        shuffleBtn.classList.add('active');
        shuffleBtn.classList.remove('inactive');
        shuffleBtn.style.backgroundColor = '#007bff'; // Set blue background
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.classList.add('inactive');
        shuffleBtn.style.backgroundColor = '#6c757d'; // Set gray background
    }
    console.log('Initialized shuffle state:', isShuffling); // Debugging log
})();

// Load the volume setting from settings.json on startup
(async () => {
    const volume = await window.electron.ipcRenderer.invoke('get-volume');
    audio.volume = volume / 100; // Set audio volume to the saved value
    volumeControl.value = volume; // Set the slider to the saved value
    console.log('Initialized volume:', volume); // Debugging log
})();

// Function to get a random index from the audioFiles array
function getRandomSongIndex() {
    let randomIndex;

    // Ensure that the new random index is not the same as the last song index
    do {
        randomIndex = Math.floor(Math.random() * audioFiles.length);
    } while (randomIndex === lastSongIndex);

    lastSongIndex = randomIndex; // Update lastSongIndex to the current random one
    return randomIndex;
}

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

    // Update song history
    if (historyIndex === -1 || songHistory[historyIndex] !== index) {
        // If history is empty or the current song is different from the last one
        songHistory.push(index); // Add the current song index to history

        // Limit the history to the last 10 songs
        if (songHistory.length > 10) {
            songHistory.shift(); // Remove the oldest song if limit exceeded
        } else {
            historyIndex++; // Move to the new end of the history stack
        }
    }
}

// Shuffle button functionality
shuffleBtn.addEventListener('click', async () => {
    if (shuffleBtn.classList.contains('active')) {
        shuffleBtn.classList.remove('active');
        shuffleBtn.classList.add('inactive');
        shuffleBtn.style.backgroundColor = '#6c757d'; // Set gray background
        isShuffling = false; // Disable shuffle mode
        console.log("Shuffle deactivated");
    } else {
        shuffleBtn.classList.remove('inactive');
        shuffleBtn.classList.add('active');
        shuffleBtn.style.backgroundColor = '#007bff'; // Set blue background
        isShuffling = true; // Enable shuffle mode
        console.log("Shuffle activated");
    }
    await saveShuffleState(); // Save the shuffle state to settings.json
});

// Next button functionality
nextBtn.addEventListener('click', () => {
    if (isShuffling) {
        currentSongIndex = getRandomSongIndex(); // Get a random song index
    } else {
        if (currentSongIndex < audioFiles.length - 1) {
            currentSongIndex++; // Move to the next song
        } else {
            currentSongIndex = 0; // Reset to the first song
        }
    }
    loadSong(currentSongIndex); // Load the selected song
    audio.play(); // Play the song immediately
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
});

// Previous button functionality
prevBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--; // Move back in the history stack
        currentSongIndex = songHistory[historyIndex]; // Get the previous song index
        loadSong(currentSongIndex); // Load the previous song
        audio.play(); // Play the previous song immediately
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause
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

// When audio ends, automatically play the next song
audio.addEventListener('ended', () => {
    if (isShuffling) {
        currentSongIndex = getRandomSongIndex(); // Get a random song index
    } else {
        if (currentSongIndex < audioFiles.length - 1) {
            currentSongIndex++; // Move to the next song
        } else {
            currentSongIndex = 0; // Reset to the first song
        }
    }
    loadSong(currentSongIndex); // Load the selected song
    audio.play(); // Play the next song
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause
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

// Volume button functionality
volumeBtn.addEventListener('click', () => {
    // Toggle the volume control's visibility
    if (volumeControl.style.display === 'none' || volumeControl.style.display === '') {
        volumeControl.style.display = 'block';
    } else {
        volumeControl.style.display = 'none';
    }
});

// Volume control functionality
volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value;
    audio.volume = volumeControl.value / 100; // Set volume (0.0 to 1.0)
    window.electron.ipcRenderer.send('set-volume', volume); // Save volume to settings.json
    console.log('Volume changed to:', volume); // Debugging log
});

addPlaylistBtn.addEventListener('click', () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    console.log(`YouTube Link entered: ${youtubeLink}`); // Debugging log

    if (youtubeLink) {
        const loadingItem = document.createElement('div');
        loadingItem.textContent = 'Loading...'; // Set the loading text
        loadingItem.className = 'list-group-item disabled'; // Add a disabled class for styling
        loadingItem.style.pointerEvents = 'none'; // Disable click events on this item
        songList.appendChild(loadingItem); // Add the loading item to the playlist

        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);

        const downloadCompleteHandler = (event, file) => {
            songList.removeChild(loadingItem);
        
            const songName = file.split('/').pop(); // Get the file name with extension
        
            const songItem = document.createElement('div');
            songItem.className = 'list-group-item d-flex justify-content-between align-items-center'; // Use Bootstrap classes for alignment
        
            const songTitle = document.createElement('span');
            songTitle.textContent = songName; // Use the full file name
        
            // Create remove button
            const removeBtn = document.createElement('button'); // Ensure removeBtn is defined here
            removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>'; // Remove button design
            removeBtn.className = 'btn btn-link'; // Bootstrap button link style
            removeBtn.onclick = async () => {
                // Check if the song being removed is currently playing
                if (audio.src.endsWith(file)) {
                    audio.pause(); // Pause the audio if the current song is being removed
                    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change button to play icon
                }
            
                songList.removeChild(songItem); // Remove the song item from the list
                // Send a request to the main process to delete the file
                await window.electron.ipcRenderer.invoke('delete-file', file);
                
                // Update audioFiles and load a new song if needed
                audioFiles = audioFiles.filter(item => item !== file); // Update the global audioFiles array
            
                // Check if the current song index is valid
                if (currentSongIndex >= audioFiles.length) {
                    currentSongIndex = 0; // Reset to the first song if the index is out of bounds
                }
            
                // Load the next song if one exists
                if (audioFiles.length > 0) {
                    loadSong(currentSongIndex);
                    audio.play(); // Play the next song if one exists
                }
            };            
        
            // Append title and button to the song item
            songItem.appendChild(songTitle);
            songItem.appendChild(removeBtn); // Make sure to append it here
            songList.appendChild(songItem); // Add song item to the list
        
            window.electron.ipcRenderer.removeListener('download-complete', downloadCompleteHandler);
        };

        window.electron.ipcRenderer.on('download-complete', downloadCompleteHandler);

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

        audio.onended = () => {
            currentSongIndex++;
            playSongByIndex(currentSongIndex); // Play the next song
        };
    } else {
        currentSongIndex = 0;
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Reset button to play
    }
}

window.electron.ipcRenderer.on('load-playlist', (audioFiles) => {
    songList.innerHTML = ''; // Clear previous song list

    audioFiles.forEach((file, index) => {
        const songName = file.split('.').slice(0, -1).join('.'); // Get song name without the extension

        const songItem = document.createElement('div');
        songItem.className = 'list-group-item d-flex justify-content-between align-items-center'; // Use Bootstrap classes for alignment

        const songTitle = document.createElement('span');
        songTitle.textContent = songName; // Display song name

        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>'; // Remove button design
        removeBtn.className = 'btn btn-link'; // Bootstrap button link style

        removeBtn.onclick = async () => {
            // Check if the song being removed is currently playing
            if (audio.src.endsWith(file)) {
                audio.pause(); // Pause the audio if the current song is being removed
                playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change button to play icon
            }
        
            songList.removeChild(songItem); // Remove the song item from the list
            // Send a request to the main process to delete the file
            await window.electron.ipcRenderer.invoke('delete-file', file);
            
            // Update audioFiles and load a new song if needed
            audioFiles = audioFiles.filter(item => item !== file); // Update the global audioFiles array
        
            // Check if the current song index is valid
            if (currentSongIndex >= audioFiles.length) {
                currentSongIndex = 0; // Reset to the first song if the index is out of bounds
            }
        
            // Load the next song if one exists
            if (audioFiles.length > 0) {
                loadSong(currentSongIndex);
                audio.play(); // Play the next song if one exists
            }
        };        

        // Append title and button to the song item
        songItem.appendChild(songTitle);
        songItem.appendChild(removeBtn);
        songList.appendChild(songItem); // Add song item to the list

        // Add click event to play the song
        songItem.addEventListener('click', () => {
            audio.src = `./Playlist/${file}`; // Update audio source
            audio.play(); // Play the selected song
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause
            currentSongIndex = index; // Set currentSongIndex to the newly played song index
        });
    });
});

// Attach event listener to the existing Play All button
const playAllBtn = document.getElementById('play-all-btn');
playAllBtn.addEventListener('click', () => {
    if (audioFiles.length > 0) {
        currentSongIndex = getRandomSongIndex(); // Get a random song index
        loadSong(currentSongIndex); // Load the random song
        audio.play(); // Play the song
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause icon
    }
});