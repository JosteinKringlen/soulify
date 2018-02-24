# Soulify

## Setup
Add environment variables SOULIFY_CLIENT_ID and SOULIFY_CLIENT_SECRET with client id and secret from Spotify API, and SLSK_USER and SLSK_PASS for Soulseek.

#### DISCLAIMER:
This software is a proof of concept software, and must **only** be used to download songs that you have the rights to. 
We do not support illegal downloading of songs. 

#### Playlist Structure:
The playlist info has to be put in a file called `playlists.json` within the project folder.
The structure of the json file should look like this:
```json
{
  "playlists": [
    {
      "name": "<PLAYLIST_NAME>",
      "elements": [
        {
          "artist": "<ARTIST_NAME>",
          "song": "<SONG_NAME>",
          "downloaded": true/false
        },
        {
          "artist": "<ARTIST_NAME>",
           "song": "<SONG_NAME>",
           "downloaded": true/false
        }
      ]
    },
    {
      "name": "<PLAYLIST_NAME>",
      "elements": [
        {
          "artist": "<ARTIST_NAME>",
          "song": "<SONG_NAME>",
          "downloaded": true/false
        },
        {
          "artist": "<ARTIST_NAME>",
          "song": "<SONG_NAME>",
          "downloaded": true/false
        }
      ]
    }
  ] 
}
```