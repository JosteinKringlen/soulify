const SpotifyApi =  require('./spotifyApi.js')
const inquirer = require('inquirer')
const fs = require('fs')

let username
let playlistName

spotifyApi = new SpotifyApi();
inquirer.prompt([
    {
      name: 'clientId',
    },
    {
      name: 'clientSecret'
    },
    {
      name: 'username'
    }
  ])
  .then(answers => {
    username = answers.username ? answers.username : process.env.SOULIFY_USERNAME
    return spotifyApi.init(answers.clientId, answers.clientSecret)
  })
  .then(answers => {
    return spotifyApi.getUserPlaylists(username)
  })
  .then(response => {
    const choices = response.body.items.map(item => {
      return {
        name: item.name,
        value: item
      }
    })
    return inquirer.prompt([
      {
        type: 'list',
        name: 'playlist',
        message: 'select playlist',
        choices
      }
    ])
  })
  .then(answers => {
    playlistName = answers.playlist.name
    return spotifyApi.getPlaylistTracks(answers.playlist)
  })
  .then(response => {
    console.log(response)
    const playlistsFile = __dirname  + '/../playlists.json'
    let playlists = {}
    if (fs.existsSync(playlistsFile)) {
      const file = fs.readFileSync(playlistsFile ,'utf-8')
      playlists = JSON.parse(file)
    }
    if (!playlists[playlistName]) {
      playlists[playlistName] = {}
    }
    const playlist = playlists[playlistName]
    response.body.items.forEach(item => {
      if (!playlist[item.track.id]) {
        playlist[item.track.id] = {
          artist: item.track.artists[0].name,
          title: item.track.name,
          downloaded: false
        }
      }
    })
    return playlists
  })
  .then(obj => {
    console.log(obj)
    fs.writeFileSync(__dirname + '/../playlists.json', JSON.stringify(obj, null, 2))
  })
  .catch(console.error)
