const Spotify = require('spotify-web-api-node');
const process = require('process');
const request = require('request');

const SpotifyApi = function () {
}

SpotifyApi.prototype = {
  init (clientId, clientSecret) {
    this.clientId = clientId ? clientId : process.env.SOULIFY_CLIENT_ID
    this.clientSecret = clientSecret ? clientSecret : process.env.SOULIFY_CLIENT_SECRET
    return new Promise((resolve, reject) => {
      this.spotifyApi = new Spotify({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      })
      this.getAccessToken(resolve)
    })
  },
  getUser (username) {
    return this.spotifyApi.getUser(username)
  },
  getUserPlaylists (username) {
    return this.spotifyApi.getUserPlaylists(username)
  },
  getPlaylistTracks (playlist) {
    // TODO: download ALL tracks. currently limited by pagination
    return this.spotifyApi.getPlaylistTracks(playlist.owner.id, playlist.id, {
      // limit: 200
      // offset: 100
    })
  },
  getAccessToken (callback) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + new Buffer(this.clientId + ':' + this.clientSecret).toString('base64')
      },
      form: {
        grant_type: 'client_credentials'
      },
      json: true
    };

    return request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log('token', body)
        this.spotifyApi.setAccessToken(body.access_token)
        if (callback) {
          callback(body.access_token);
        }
      }
    });
  }
}

module.exports = SpotifyApi
