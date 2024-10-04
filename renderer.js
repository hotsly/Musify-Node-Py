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

let isShuffling = false;
let isSeeking = false;
let currentSongIndex = 0;
let audioFiles = [];
let lastSongIndex = -1;
let songHistory = [];
let historyIndex = -1;
let playedSongs = [];

async function saveShuffleState() {
    await window.electron.ipcRenderer.send('set-shuffle', isShuffling);
    console.log('Shuffle state saved:', isShuffling);
}

(async () => {
    isShuffling = await window.electron.ipcRenderer.invoke('get-shuffle');
    if (isShuffling) {
        shuffleBtn.classList.add('active');
        shuffleBtn.classList.remove('inactive');
        shuffleBtn.style.backgroundColor = '#007bff';
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.classList.add('inactive');
        shuffleBtn.style.backgroundColor = '#6c757d';
    }
    console.log('Initialized shuffle state:', isShuffling);
})();

// Load the volume setting from settings.json on startup
(async () => {
    const volume = await window.electron.ipcRenderer.invoke('get-volume');
    audio.volume = volume / 100; // Set audio volume to the saved value
    volumeControl.value = volume; // Set the slider to the saved value
    updateVolumeIcon(volume); // Update the volume icon
    console.log('Initialized volume:', volume); // Debugging log
})();

function getRandomSongIndex() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * audioFiles.length);
  } while (playedSongs.includes(randomIndex));
  
  playedSongs.push(randomIndex);
  
  // If all songs have been played, reset the playedSongs array
  if (playedSongs.length === audioFiles.length) {
    playedSongs = [];
  }
  
  return randomIndex;
}

// Improvement 1: Update UI to reflect currently playing song
function loadSong(index) {
    if (index < 0 || index >= audioFiles.length) return;
    audio.src = `./Playlist/${audioFiles[index]}`;
    
    // Update song history
    if (historyIndex === -1 || songHistory[historyIndex] !== index) {
        songHistory.push(index);
        if (songHistory.length > 10) {
            songHistory.shift();
        } else {
            historyIndex++;
        }
    }
    
    // Update UI to highlight current song
    const songItems = songList.getElementsByClassName('list-group-item');
    for (let i = 0; i < songItems.length; i++) {
        if (i === index) {
            songItems[i].classList.add('active');
        } else {
            songItems[i].classList.remove('active');
        }
    }

    // Set correct button state
    if (audio.paused) {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change to play icon
    } else {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
    }

    // Update duration display
    const durationDisplay = document.getElementById('duration-display');
    const maxDurationDisplay = document.getElementById('max-duration-display');
    
    audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        maxDurationDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });
    
    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        durationDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });
}

function playNextSong() {
    if (isShuffling) {
      currentSongIndex = getRandomSongIndex();
    } else {
      currentSongIndex = (currentSongIndex + 1) % audioFiles.length;
    }
    loadSong(currentSongIndex);
    audio.play();
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
  }
  
audio.addEventListener('ended', playNextSong);

seekBar.addEventListener('input', () => {
    const seekTime = seekBar.value;
    audio.currentTime = seekTime;
});

audio.addEventListener('timeupdate', () => {
    seekBar.value = audio.currentTime;
});

audio.addEventListener('loadedmetadata', () => {
    const duration = audio.duration;
    seekBar.max = duration;
});

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change to play icon
    }
});

audio.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change to pause icon
});

audio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'; // Change to play icon
});

shuffleBtn.addEventListener('click', async () => {
    if (shuffleBtn.classList.contains('active')) {
        shuffleBtn.classList.remove('active');
        shuffleBtn.classList.add('inactive');
        shuffleBtn.style.backgroundColor = '#6c757d';
        isShuffling = false;
        playedSongs = [];
    } else {
        shuffleBtn.classList.remove('inactive');
        shuffleBtn.classList.add('active');
        shuffleBtn.style.backgroundColor = '#007bff';
        isShuffling = true;
    }
    // Improvement 8: Use await when calling saveShuffleState
    await saveShuffleState();
});

// Improvement 3: Wrap around to first song when reaching the end in non-shuffle mode
nextBtn.addEventListener('click', playNextSong);

// Improvement 4: Go to previous song in playlist when not in shuffle mode
prevBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        currentSongIndex = songHistory[historyIndex];
        loadSong(currentSongIndex);
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    } else if (!isShuffling) {
        currentSongIndex = (currentSongIndex - 1 + audioFiles.length) % audioFiles.length;
        loadSong(currentSongIndex);
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }
});

// Volume button functionality
volumeBtn.addEventListener('click', () => {
    // Toggle the volume control's visibility
    if (volumeControl.style.display === 'none') {
        volumeControl.style.display = 'block';
    } else {
        volumeControl.style.display = 'none';
    }
});

// Volume control functionality
volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value;
    audio.volume = volume / 100; // Set volume (0.0 to 1.0)
    window.electron.ipcRenderer.send('set-volume', volume); // Save volume to settings.json
    updateVolumeIcon(volume);
    console.log('Volume changed to:', volume); // Debugging log
});

// Function to update volume icon
function updateVolumeIcon(volume) {
    const volumeIcon = volumeBtn.querySelector('i');
    if (volume == 0) {
        volumeIcon.className = 'bi bi-volume-mute';
    } else if (volume < 50) {
        volumeIcon.className = 'bi bi-volume-down';
    } else {
        volumeIcon.className = 'bi bi-volume-up';
    }
}

// Update volume when audio volume changes (e.g., by system controls)
audio.addEventListener('volumechange', () => {
    const volume = Math.round(audio.volume * 100);
    volumeControl.value = volume;
    updateVolumeIcon(volume);
    window.electron.ipcRenderer.send('set-volume', volume); // Save volume to settings.json
});

// Attach event listener to the existing Play All button
const playAllBtn = document.getElementById('play-all-btn');
playAllBtn.addEventListener('click', () => {
    if (audioFiles.length > 0) {
        if (isShuffling) {
            currentSongIndex = getRandomSongIndex();
        } else {
            // If not shuffling, start from the beginning
            currentSongIndex = 0;
        }
        loadSong(currentSongIndex);
        audio.play()
            .then(() => {
                playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Change button to pause icon
            })
            .catch(error => {
                console.error('Error playing audio:', error);
            });
    } else {
        console.log('No songs in the playlist');
        // Optionally, you can show an alert or message to the user
        // alert('No songs in the playlist');
    }
});

// Improvement 5: Update audioFiles array when adding new song
addPlaylistBtn.addEventListener('click', () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    if (youtubeLink) {
        const loadingItem = document.createElement('div');
        loadingItem.textContent = 'Loading...';
        loadingItem.className = 'list-group-item disabled';
        loadingItem.style.pointerEvents = 'none';
        songList.appendChild(loadingItem);
        
        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);
        
        const downloadCompleteHandler = (event, file) => {
            songList.removeChild(loadingItem);
            
            const songName = file.split('/').pop();
            
            const songItem = document.createElement('div');
            songItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const songTitle = document.createElement('span');
            songTitle.textContent = songName;
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
            removeBtn.className = 'btn btn-link';
            
            removeBtn.onclick = async () => {
                if (audio.src.endsWith(file)) {
                    audio.pause();
                    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                }
                
                songList.removeChild(songItem);
                await window.electron.ipcRenderer.invoke('delete-file', file);
                
                audioFiles = audioFiles.filter(item => item !== file);
                
                if (currentSongIndex >= audioFiles.length) {
                    currentSongIndex = 0;
                }
                
                if (audioFiles.length > 0) {
                    loadSong(currentSongIndex);
                    audio.play();
                }
            };
            
            songItem.appendChild(songTitle);
            songItem.appendChild(removeBtn);
            songList.appendChild(songItem);
            
            // Update audioFiles array
            audioFiles.push(file);
            
            window.electron.ipcRenderer.removeListener('download-complete', downloadCompleteHandler);
        };
        
        window.electron.ipcRenderer.on('download-complete', downloadCompleteHandler);
        
        youtubeLinkInput.value = '';
    } else {
        alert('Please enter a valid YouTube URL.');
    }
});

// Improvement 6: Combine 'load-playlist' event listeners
window.electron.ipcRenderer.on('load-playlist', (files) => {
    audioFiles = files;
    playedSongs = [];
    currentSongIndex = 0;
    loadSong(currentSongIndex);
    
    songList.innerHTML = '';
    
    files.forEach((file, index) => {
        const songName = file.split('.').slice(0, -1).join('.');
        
        const songItem = document.createElement('div');
        songItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const songTitle = document.createElement('span');
        songTitle.textContent = songName;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
        removeBtn.className = 'btn btn-link';
        
        removeBtn.onclick = async (event) => {
            event.stopPropagation(); // Prevent triggering the song play
            if (audio.src.endsWith(file)) {
                audio.pause();
                playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
            }
            
            songList.removeChild(songItem);
            await window.electron.ipcRenderer.invoke('delete-file', file);
            
            audioFiles = audioFiles.filter(item => item !== file);
            
            if (currentSongIndex >= audioFiles.length) {
                currentSongIndex = 0;
            }
            
            if (audioFiles.length > 0) {
                loadSong(currentSongIndex);
                audio.play();
            }
        };
        
        songItem.appendChild(songTitle);
        songItem.appendChild(removeBtn);
        songList.appendChild(songItem);
        
        songItem.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(currentSongIndex);
            audio.play();
            // The 'play' event listener will handle changing the button to pause
        });
    });
});