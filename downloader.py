import os
import yt_dlp as youtube_dl
import sys
import re
import time

def is_valid_url(url):
    return re.match(r'https?://(www\.)?youtube\.com/watch\?v=|https?://youtu\.be/', url) is not None

def download_audio(youtube_url, output_path='.\\Playlist'):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'noplaylist': True,
        'quiet': True,  # Suppress output
        'no_warnings': True,  # Suppress yt-dlp warnings
    }

    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            print(f'Downloading audio: {youtube_url}')
            ydl.download([youtube_url])
            print('Download completed!')

    except Exception as e:
        print(f'An error occurred: {e}')

    # Wait a moment before checking for the file
    time.sleep(1)  # Delay to allow the file system to update

    # Attempt to list downloaded files
    try:
        downloaded_files = os.listdir(output_path)
        # Check if any files exist
        if downloaded_files:
            # Use the full path for the latest file
            latest_file = max(downloaded_files, key=lambda f: os.path.getctime(os.path.join(output_path, f)))
            print(f'Latest downloaded file: {latest_file}')  # Output the latest file name
        else:
            print('No files found in the directory.')

    except Exception as ex:
        print(f'Error accessing files: {ex}')

if __name__ == '__main__':
    if len(sys.argv) > 1:
        youtube_link = sys.argv[1]

        if not is_valid_url(youtube_link):
            youtube_link = f"ytsearch:{youtube_link}"

        download_audio(youtube_link)
    else:
        print('Please provide a YouTube URL or search term.')
