//import slsk from 'slsk-client'
//import process from 'process'
const slsk = require('slsk-client');
const process = require('process');

slsk.connect({
    user: process.env.SLSK_USER,
    pass: process.env.SLSK_PASS
}, (err, client) => {
    client.search({
        req: 'nora en pure waves',
        timeout: 2000
    },(err, res) => {
        if (err) console.log('Error:\n' + err);
        res = res.sort((a, b) => b.size - a.size || b.speed - a.speed);
        res = res.filter(track => track.slots);
        res = res.filter(track => track.bitrate === 320);
        console.log('Res:\n' + JSON.stringify(res[0]));

        client.download({
            file: res[0],
            path: __dirname + '/random.mp3'
        },(err, data) => {
            if (err) console.log('Error:\n' + err);
        })
    })
});