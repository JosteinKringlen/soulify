const slsk = require('slsk-client');
const process = require('process');
const playlists = require('../playlists');
const fs = require('fs');
const {URL} = require('url');
var keypress = require('keypress');
const playlistURL = new URL('file://../playlist.json');
let slskClient;
const searching = {}
let notFound = {}
const downloadQueue = []
const downloading = {}

slsk.connect({
    user: process.env.SLSK_USER,
    pass: process.env.SLSK_PASS,
    timeout: 10000
}, (err, client) => {
    if (err) {
      console.log('error', err)
      process.exit(1)
    }
    slskClient = client
    downloadPlaylists(playlists)
    poll()
});

function downloadPlaylists (playlists) {
  Object.keys(playlists)
    .reverse()
    .map(key => downloadPlaylist.bind(this, key))
    .reduce((p, fn) => p.then(fn), Promise.resolve())
}

function downloadPlaylist(key) {
  const playlist = playlists[key]
  const dir = `${__dirname}/../downloads/${key}`
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  return searchForSongsInPlaylist(playlist, key)
}

function finished () {
  return queueEmpty() &&
    finishedDownloading() &&
    finishedSearching()
}

function finishedSearching () {
  return !Object.keys(searching).length
}

function finishedDownloading () {
  return !Object.keys(downloading).length
}

function queueEmpty () {
  !downloadQueue.length
}

function searchForSongsInPlaylist(playlist, playlistKey) {
  console.log(`searching for songs in ${playlistKey}`)
  return Object.keys(playlist)
    .reverse()
    .map(key => { return { key, song: playlist[key]} })
    .filter(item => !item.song.downloaded)
    .map(item => searchSongAndAddToDownloadQueue.bind(this, item, playlist, playlistKey))
    .reduce((p, fn) => p.then(fn), Promise.resolve())
}

function poll () {
  setInterval(() => {
    if (finishedSearching() && Object.keys(notFound).length) {
      downloadPlaylists(notFound)
      notFound = {}
    }
    if (finished()) {
      console.log('finished')
      process.exit()
    }
    while (downloadQueue.length) {
      downloadSong(downloadQueue.pop())
    }
  }, 10000)
}

function searchSongAndAddToDownloadQueue (item, playlist, playlistKey) {
  return searchSong(item, playlist, playlistKey).then(addToDownloadQueue)
}

function addToDownloadQueue(result) {
  if (result.item) {
    downloadQueue.push(result)
  }
}

function searchAndDownloadSong (item, playlist, playlistKey) {
  return searchSong(item, playlist, playlistKey).then(downloadSong)
}

function searchSong (item, playlist, playlistKey) {
  console.log(`searching for song ${item.song.artist} - ${item.song.title}`)
  searching[item.key] = item
  return new Promise((resolve, reject) => {
    slskClient.search({
        req: `${item.song.artist} ${item.song.title}`,
        timeout: 10000
      }, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        // console.log(res)
        res = res
          .sort((a, b) => {return b.size - a.size || b.speed - a.speed})
          .sort((a, b) => {
            function hasTitle (file) {
              const pathComponents = file.split('\\')
              const name = pathComponents[pathComponents.length - 1].toLowerCase()
              return name.includes(item.song.title.toLowerCase)
            }
            const aHasTitle = hasTitle(a.file)
            const bHasTitle = hasTitle(b.file)
            if (aHasTitle && bHasTitle) {
              return 0
            }
            if (aHasTitle) {
              return -1
            }
            if (bHasTitle) {
              return 1
            }
            return 0
          })
          .filter(track => track.slots)
          .filter(track => track.bitrate === 320)

        delete searching[item.key]

        if (res.length == 0) {
          console.log(`no song found for ${item.song.artist} - ${item.song.title}`)
          if (!notFound[playlistKey]) {
            notFound[playlistKey] = {}
          }
          notFound[playlistKey][item.key] = item.song
          resolve({})
          return
        }

        console.log(`found song for ${item.song.artist} - ${item.song.title}`)
        resolve({
          response: res[0],
          item,
          playlist,
          playlistKey
        })
    })
  })
}

function downloadSong(result) {
  return new Promise((resolve, reject) => {
    if (!result.response) {
      resolve() //TODO: re-search if not available
      return
    }
    const pathComponents = result.response.file.split('\\')
    const name = pathComponents[pathComponents.length - 1]
    console.log(`downloading ${name} to ${__dirname}/../downloads/${result.playlistKey}/${name}`)
    downloading[result.item.key] = result.item

    slskClient.download({
      file: result.response,
      path: `${__dirname}/../downloads/${result.playlistKey}/${name}`
    },(err, data) => {
      if (err) {
        reject(err)
      } else {
        // TODO: prevent async clashes
        console.log(`downloaded ${name}`)
        delete downloading[result.item.key]
        fs.readFile(__dirname  + '/../playlists.json' ,'utf-8', (err, file) => {
          if (err) {
            reject(err)
          } else {
            let playlists = JSON.parse(file);
            playlists[result.playlistKey][result.item.key].downloaded = true;
            fs.writeFile(__dirname+ '/../playlists.json', JSON.stringify(playlists, null, 2),'utf-8', err => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
          }
        })
      }
    })
  })
}

keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
 if (key && key.ctrl && key.name == 'c') {
   process.stdin.pause();
   process.exit()
 }
 if (key && key.name == 's') {
   console.log('notFound: ', Object.keys(notFound).map(playlistKey => {
     return Object.keys(notFound[playlistKey]).map(key => {
       return `${notFound[playlistKey][key].artist} - ${notFound[playlistKey][key].title}`
     })
   }))
  console.log('searching: ', Object.keys(searching)
    .map(key => `${searching[key].song.artist} - ${searching[key].song.title}`))
  console.log('downloadQueue: ', downloadQueue
    .map(item => {
      if (item.item) {
        return `${item.item.song.artist} - ${item.item.song.title}`
      } else {
        return item
      }
    }))
  console.log('downloading: ', Object.keys(downloading)
    .map(key => `${downloading[key].song.artist} - ${downloading[key].song.title}`))
 }
});
process.stdin.setRawMode(true);
process.stdin.resume();

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});
