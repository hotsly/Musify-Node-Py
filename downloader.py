import os
import yt_dlp as youtube_dl
import sys
import re

def is_valid_url(url):
    return re.match(r'https?://(www\.)?youtube\.com/watch\?v=|https?://youtu\.be/', url) is not None

def download_audio(youtube_url, output_path='.\\Playlist'):
    ydl_opts = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'audioformat': 'mp3',  # Default format
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'noplaylist': True,
    }

    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            print(f'Downloading audio: {youtube_url}')
            ydl.download([youtube_url])
            print('Download completed!')
    except Exception as e:
        print(f'An error occurred: {e}')

if __name__ == '__main__':
    if len(sys.argv) > 1:
        youtube_link = sys.argv[1]
        
        if not is_valid_url(youtube_link):
            youtube_link = f"ytsearch:{youtube_link}"

        download_audio(youtube_link)
    else:
        print('Please provide a YouTube URL or search term.')
