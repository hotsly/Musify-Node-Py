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
const playAllBtn = document.getElementById('play-all-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const shuffleToast = document.getElementById('shuffle-toast');
const shuffleToastMessage = document.getElementById('shuffle-toast-message');

let isShuffling = false;
let currentSongIndex = 0;
let audioFiles = [];
let queue = [];
let songHistory = [];
let historyIndex = -1;
let downloadingSongs = 0;

async function saveShuffleState() {
    await window.electron.ipcRenderer.send('set-shuffle', isShuffling);
    console.log('Shuffle state saved:', isShuffling);
}

(async () => {
    isShuffling = await window.electron.ipcRenderer.invoke('get-shuffle');
    if (isShuffling) {
        shuffleBtn.classList.add('active');
        shuffleBtn.firstElementChild.style.color = '#007bff';
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.firstElementChild.style.color = 'white';
    }
})();

// Load the volume setting from settings.json on startup
(async () => {
    const volume = await window.electron.ipcRenderer.invoke('get-volume');
    audio.volume = volume / 100; 
    volumeControl.value = volume; 
    updateVolumeIcon(volume); 
})();

function getRandomSongIndex() {
    if (isShuffling) {
        if (audioFiles.length === 1) {
            return 0;
        } else if (audioFiles.length === 2) {
            return currentSongIndex === 0 ? 1 : 0;
        } else {
            let unplayedSongs = [];
            for (let i = 0; i < audioFiles.length; i++) {
                if (i !== currentSongIndex) {
                    unplayedSongs.push(i);
                }
            }
            return unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)];
        }
    } else {
        return (currentSongIndex + 1) % audioFiles.length;
    }
}

// Improvement 1: Update UI to reflect currently playing song
async function loadSong(index) {
    const playlistPath = await window.electron.ipcRenderer.invoke('get-playlist-path');
    audio.src = `${playlistPath}\\${audioFiles[index]}`;

    // Update UI to highlight current song
    const songItems = songList.getElementsByClassName('list-group-item');
    for (let i = 0; i < songItems.length; i++) {
        if (i === index) {
            songItems[i].style.backgroundColor = '#292b2c'; 
        } else {
            songItems[i].style.backgroundColor = ''; 
        }
    }

    // Set correct button state
    if (audio.paused) {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>'; 
    } else {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;;"></i>'; 
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

    await audio.play()
}

function playNextSong() {
    if (queue.length > 0) {
        const index = queue.shift();
        loadSong(index);
        currentSongIndex = index;
        addSongToHistory(index);
    } else {
        let randomIndex = getRandomSongIndex();
        loadSong(randomIndex);
        currentSongIndex = randomIndex;
        addSongToHistory(randomIndex);
    }
}

function playPrevSong() {
    if (historyIndex > 0) {
        historyIndex--;
        currentSongIndex = songHistory[historyIndex];
        loadSong(currentSongIndex);
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>';
    } else if (historyIndex === 0) {
        historyIndex = -1;
        currentSongIndex = songHistory[songHistory.length - 1];
        loadSong(currentSongIndex);
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>';
    } else if (!isShuffling) {
        currentSongIndex = audioFiles.length - 1;
        loadSong(currentSongIndex);
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>';
    }
}

function addSongToHistory(index) {
    if (songHistory.length >= 20) {
        songHistory.shift();
    }
    songHistory.push(index);
    historyIndex = songHistory.length - 1;
}

audio.addEventListener('ended', () => {
    addSongToHistory(currentSongIndex);
    playNextSong();
});

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
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>'; 
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>'; 
    }
});

window.electron.ipcRenderer.on('play-pause-audio', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>'; 
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>'; 
    }
});

audio.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>'; 
});

audio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>'; 
});

function showShuffleToast(isShuffleOn) {
    if (isShuffleOn) {
        shuffleToastMessage.textContent = 'Shuffle On';
    } else {
        shuffleToastMessage.textContent = 'Shuffle Off';
    }
    const toast = new bootstrap.Toast(shuffleToast, {
        autohide: true,
        delay: 2000
    });
    toast.show();
}

shuffleBtn.addEventListener('click', async () => {
    if (shuffleBtn.classList.contains('active')) {
        shuffleBtn.classList.remove('active');
        shuffleBtn.firstElementChild.style.color = 'white';
        isShuffling = false;
        showShuffleToast(false);
    } else {
        shuffleBtn.classList.remove('inactive');
        shuffleBtn.classList.add('active');
        shuffleBtn.firstElementChild.style.color = '#007bff';
        isShuffling = true;
        showShuffleToast(true);
    }
    await saveShuffleState();
});

nextBtn.addEventListener('click', playNextSong);

prevBtn.addEventListener('click', playPrevSong);

window.electron.ipcRenderer.on('next-song', playNextSong);

window.electron.ipcRenderer.on('prev-song', playPrevSong);

volumeBtn.addEventListener('click', () => {
    if (volumeControl.style.display === 'none') {
        volumeControl.style.display = 'block';
    } else {
        volumeControl.style.display = 'none';
    }
});

volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value;
    audio.volume = volume / 100; 
    window.electron.ipcRenderer.send('set-volume', volume); 
    updateVolumeIcon(volume);
    console.log('Volume changed to:', volume); 
});

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

audio.addEventListener('volumechange', () => {
    const volume = Math.round(audio.volume * 100);
    volumeControl.value = volume;
    updateVolumeIcon(volume);
    window.electron.ipcRenderer.send('set-volume', volume); 
});

playAllBtn.addEventListener('click', () => {
    if (audioFiles.length > 0) {
        if (isShuffling) {
            currentSongIndex = getRandomSongIndex();
        } else {
            currentSongIndex = 0;
        }
        loadSong(currentSongIndex);
        audio.play()
            .then(() => {
                playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="color: white;"></i>'; 
            })
            .catch(error => {
                console.error('Error playing audio:', error);
            });
    } else {
        console.log('No songs in the playlist');
    }
});

window.electron.ipcRenderer.on('download-complete', (event, file) => {
    console.log('Download complete event triggered.');
    
    downloadingSongs--; 

    const songName = file.split('/').pop(); 
    const songItem = document.createElement('div');
    songItem.className = 'list-group-item d-flex justify-content-between align-items-center';

    const songTitle = document.createElement('span');
    songTitle.textContent = songName;

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
    removeBtn.className = 'btn btn-link';

    const playNextBtn = document.createElement('button');
    playNextBtn.innerHTML = '<i class="bi bi-arrow-bar-right"></i>';
    playNextBtn.className = 'btn btn-link';

    removeBtn.onclick = async () => {
        if (audio.src.endsWith(file)) {
            audio.pause();
            playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>';
        }

        songList.removeChild(songItem);
        await window.electron.ipcRenderer.invoke('delete-file', file);
        
        audioFiles = audioFiles.filter(item => item !== file);
        
        if (currentSongIndex >= audioFiles.length) {
            currentSongIndex = 0;
        }
    };

    playNextBtn.onclick = () => {
        const index = audioFiles.indexOf(file);
        if (index !== -1) {
            queue.push(index);
        }
    };

    songItem.appendChild(songTitle);
    songItem.appendChild(playNextBtn);
    songItem.appendChild(removeBtn);
    songList.appendChild(songItem);

    audioFiles.push(file);

    if (downloadingSongs === 0) {
        console.log('All downloads complete, hiding spinner.');
        loadingSpinner.style.display = 'none'; 
    }
});

addPlaylistBtn.addEventListener('click', () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    if (youtubeLink) {
        downloadingSongs++; 

        loadingSpinner.style.display = 'block'; 

        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);
        youtubeLinkInput.value = ''; 
    } else {
        alert('Please enter a valid YouTube URL.');
    }
});

youtubeLinkInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addPlaylistBtn.click();
    }
});

window.electron.ipcRenderer.on('load-playlist', (files) => {
    audioFiles = files;
    currentSongIndex = 0;
    
    songList.innerHTML = '';
    
    files.forEach((file, index) => {
        const songName = file.split('.').slice(0, -1).join('.');
        
        const songItem = document.createElement('div');
        songItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const songTitle = document.createElement('span');
        songTitle.textContent = songName;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="bi bi-trash" style="color: white;"></i>';
        removeBtn.className = 'btn btn-link';

        const playNextBtn = document.createElement('button');
        playNextBtn.innerHTML = '<i class="bi bi-arrow-bar-right"></i>';
        playNextBtn.className = 'btn btn-link';

        removeBtn.onclick = async (event) => {
            event.stopPropagation(); 
            if (audio.src.endsWith(file)) {
                audio.pause();
                playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="color: white;"></i>';
            }
            
            songList.removeChild(songItem);
            await window.electron.ipcRenderer.invoke('delete-file', file);
            
            audioFiles = audioFiles.filter(item => item !== file);
            
            if (currentSongIndex >= audioFiles.length) {
                currentSongIndex = 0;
            }
        };

        playNextBtn.onclick = () => {
            event.stopPropagation();
            queue.push(index);
        };

        songItem.appendChild(songTitle);
        songItem.appendChild(playNextBtn);
        songItem.appendChild(removeBtn);
        songList.appendChild(songItem);
        
        songItem.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(currentSongIndex);
            audio.play();
            addSongToHistory(currentSongIndex);
            // The 'play' event listener will handle changing the button to pause
        });
    });
});