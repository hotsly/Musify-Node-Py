import os
import yt_dlp as youtube_dl

def download_audio(youtube_url, output_path='.\\Playlist'):
    ydl_opts = {
        'format': 'bestaudio/best',
        'extractaudio': True,  # Download audio only
        'audioformat': 'mp3',  # Save as mp3 format
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),  # Save as file with video title
        'noplaylist': True,  # Download only the single video
    }

    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            print(f'Downloading audio: {youtube_url}')
            ydl.download([youtube_url])
            print('Download completed!')
    except Exception as e:
        print(f'An error occurred: {e}')

if __name__ == '__main__':
    youtube_link = input('Enter the YouTube video URL: ')
    download_audio(youtube_link)
