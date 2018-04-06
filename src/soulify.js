const slsk = require('slsk-client');
const process = require('process');
let playlistsToDownload = require('../playlists');
const fs = require('fs');
const {URL} = require('url');
const playlistURL = new URL('file://../playlist.json');
let clientGlobal;

slsk.connect({
    user: process.env.SLSK_USER,
    pass: process.env.SLSK_PASS
}, (err, client) => {
    clientGlobal = client;
    for(let i = 0; i < playlistsToDownload.playlists.length; i++){
        searchForSongsInPlaylist(playlistsToDownload.playlists[i].elements, i)
    }
});



function searchForSongsInPlaylist(playlist, playListIndex) {
    for (let i = 0; i < playlist.length; i++){
        if (!playlist[i].downloaded){
            clientGlobal.search({
                req: `${playlist[i].artist} ${playlist[i].song}`,
                timeout: 2000
            }, (err, res) => {
                if (err) console.log('Error:\n' + err);
                res = res.sort((a, b) => {return b.size - a.size || b.speed - a.speed});
                res = res.filter(track => track.slots);
                res = res.filter(track => track.bitrate === 320);
                const songToDownload = res[0];
                console.log('Res:\n' + JSON.stringify(songToDownload));

                let name = songToDownload.file.split("\\");
                console.log(name[name.length-1]);

                downloadSong(songToDownload, name[name.length-1], playListIndex, i);
            })
        }
    }
}


function downloadSong(songToDownload, name, playListIndex, songIndex) {
    console.log("playListIndex: " + playListIndex);
    console.log("songIndex: " + songIndex);
    clientGlobal.download({
        file: songToDownload,
        path: __dirname + `/${name}`
    },(err, data) => {
        if (err) console.log('Error:\n' + err);
        console.log(data);

        fs.readFile(__dirname  + '/../playlists.json' ,'utf-8', (err, file) => {
            if (err) throw err;

            let stuff = JSON.parse(file);
            stuff.playlists[playListIndex].elements[songIndex].downloaded = true;
            console.log(stuff.playlists[playListIndex].elements[songIndex].downloaded);

            fs.writeFile(__dirname+ '/../playlists.json', JSON.stringify(stuff),'utf-8', err => {
                if (err) throw err;
                console.log("Written to true")
            })
        })
    });
}