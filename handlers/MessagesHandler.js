const passport = require('passport-google-oauth');
const config = require('../config/config');
const google = require('googleapis');
const gmail = google.gmail('v1');
const sampleClient = require('../utils/client');

const scopes = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly'
];

module.exports = {
    getMessages: (req, res, next) => {
        const blah = sampleClient.execute(scopes, runSamples);
        res.send(blah);
        next();
    }
}

// a very simple example of getting data from a playlist
function runSamples () {
    gmail.users.getProfile('m3tspn@gmail.com', (err, response) => {
        return response;
    });
}
