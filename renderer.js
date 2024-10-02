const audio = document.getElementById('audio');
const seekBar = document.getElementById('seek-bar');
const playPauseBtn = document.getElementById('play-pause');
const songList = document.getElementById('song-list');
const volumeControl = document.getElementById('volume'); // Ensure this matches your HTML

// Playlist elements
const youtubeLinkInput = document.getElementById('youtube-link');
const addPlaylistBtn = document.getElementById('add-playlist-btn');

let isSeeking = false;

// Ensure this runs after the DOM is fully loaded
window.onload = async () => {
    try {
        const volume = await window.electron.ipcRenderer.invoke('get-volume');
        console.log('Retrieved volume:', volume); // Debugging log

        // Check if volume is a number and within expected range
        if (typeof volume === 'number' && volume >= 0 && volume <= 100) {
            audio.volume = volume / 100; // Set audio volume to the saved value
            volumeControl.value = volume; // Set the slider to the saved value
            console.log('Initialized volume:', volume); // Debugging log
        } else {
            console.warn('Invalid volume value, using default volume 100');
            audio.volume = 1; // Default to max volume if there's an issue
            volumeControl.value = 100; // Reset to default
        }
    } catch (error) {
        console.error('Error retrieving volume:', error);
        // Handle error gracefully, e.g., default to max volume
        audio.volume = 1;
        volumeControl.value = 100; // Reset to default
    }
};

audio.addEventListener('loadedmetadata', () => {
    seekBar.max = Math.floor(audio.duration);
});

audio.addEventListener('timeupdate', () => {
    if (!isSeeking) {
        seekBar.value = Math.floor(audio.currentTime);
    }
});

audio.addEventListener('ended', () => {
    playPauseBtn.textContent = 'Play';
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
    playPauseBtn.textContent = 'Pause';
});

// Play/Pause button functionality
playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = 'Pause';
    } else {
        audio.pause();
        playPauseBtn.textContent = 'Play';
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
        window.electron.ipcRenderer.send('download-youtube-audio', youtubeLink);  // Send the YouTube URL to the main process
        console.log(`Sent to main process: ${youtubeLink}`); // Debugging log
    } else {
        alert('Please enter a valid YouTube URL.');
    }
});

// Receive playlist from main process
window.electron.ipcRenderer.on('load-playlist', (audioFiles) => {
    songList.innerHTML = ''; // Clear previous song list

    audioFiles.forEach(file => {
        const songItem = document.createElement('div');
        songItem.textContent = file;
        songItem.className = 'list-group-item'; // Updated to use list group item
        songItem.addEventListener('click', () => {
            audio.src = `./Playlist/${file}`; // Update audio source
            audio.play(); // Play the selected song
            playPauseBtn.textContent = 'Pause'; // Update button text to 'Pause'
        });
        songList.appendChild(songItem); // Add song item to the list
    });
});
