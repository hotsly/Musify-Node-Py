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

// Load the volume setting from settings.json on startup
(async () => {
    const volume = await window.electron.ipcRenderer.invoke('get-volume');
    audio.volume = volume / 100; // Set audio volume to the saved value
    volumeControl.value = volume; // Set the slider to the saved value
    console.log('Initialized volume:', volume); // Debugging log
})();

// Function to get a random index from the audioFiles array
function getRandomSongIndex() {
    return Math.floor(Math.random() * audioFiles.length);
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
}

shuffleBtn.classList.add('inactive'); // Set default to inactive
shuffleBtn.addEventListener('click', () => {
    if (shuffleBtn.classList.contains('active')) {
      shuffleBtn.classList.remove('active');
      shuffleBtn.classList.add('inactive');
      shuffleBtn.style.backgroundColor = '#6c757d'; // Set gray background
      console.log("inactive")
    } else {
      shuffleBtn.classList.remove('inactive');
      shuffleBtn.classList.add('active');
      shuffleBtn.style.backgroundColor = '#007bff'; // Set blue background
      console.log("active")
    }
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

// Previous button functionality (remains the same)
prevBtn.addEventListener('click', () => {
    if (currentSongIndex > 0) {
        currentSongIndex--; // Move to the previous song
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

// Add YouTube link to playlist
addPlaylistBtn.addEventListener('click', () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    console.log(`YouTube Link entered: ${youtubeLink}`); // Debugging log

    if (youtubeLink) {
        const loadingItem = document.createElement('div');
        loadingItem.textContent = 'Loading...'; // Set the loading text
        loadingItem.className = 'list-group-item disabled'; // Add a disabled class for styling
        loadingItem.style.pointerEvents = 'none'; // Disable click events on this item
        songList.appendChild(loadingItem); // Add the loading item to the playlist

        document.title = 'Adding New Songs...';

        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);

        const downloadCompleteHandler = (event, file) => {
            songList.removeChild(loadingItem);

            const songName = file.split('/').pop(); // Get the file name with extension

            const songItem = document.createElement('div');
            songItem.textContent = songName; // Use the full file name
            songItem.className = 'list-group-item'; // Updated to use list group item

            songItem.addEventListener('click', () => {
                audio.src = `./Playlist/${songName}`; // Update audio source
                audio.play(); // Play the selected song
                playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Update button text to 'Pause'
            });
            songList.appendChild(songItem); // Add song item to the list

            document.title = 'Song Added: ' + songName;

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

    audioFiles.forEach(file => {
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

    
    // Re-add the play button after the song items
    const playAllBtn = document.createElement('button');
    playAllBtn.id = 'play-all-btn';
    playAllBtn.className = 'play-all-button';
    playAllBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Play icon

    // Update the click event to play a random song
    playAllBtn.addEventListener('click', () => {
        if (audioFiles.length > 0) {
            currentSongIndex = getRandomSongIndex(); // Get a random song index
            loadSong(currentSongIndex); // Load the random song
            audio.play(); // Play the random song
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
        }
    });
});