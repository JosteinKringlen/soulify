const Spotify = require('spotify-web-api-js');
const process = require('process');
const request = require('request');

// TODO: Set token
const token = getAccessToken((token) => console.log(token));

function getAccessToken(callback) {
  const client_id = process.env.SOULIFY_CLIENT_ID;
  const client_secret = process.env.SOULIFY_CLIENT_SECRET;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  return request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      callback(body.access_token);
    }
  });
}
