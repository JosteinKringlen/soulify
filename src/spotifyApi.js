const Spotify = require('spotify-web-api-js');
const process = require('process');
const fetch = require('node-fetch');
const btoa = require('btoa');

getAccessToken()

function getAccessToken() {
  const clientId = process.env.SOULIFY_CLIENT_ID;
  const clientSecret = process.env.SOULIFY_CLIENT_SECRET;
  const spotifyAuthUrl = 'https://accounts.spotify.com/api/token';

  const bla = clientId + ':' + clientSecret;
  const base64Creds = btoa(bla)
  const auth = 'Basic ' + base64Creds;

  const content = {
    method: 'POST',
    body: JSON.stringify({grant_type: 'client_credentials'}),
    headers: {
      'Authorization': auth
    }
  };

  fetch(spotifyAuthUrl, content)
    .then(res => res())
    .then(res => console.log(res))
    .catch(err => console.log(err))
}
