const config = require('./config');

const thinky = require('thinky')({
    host: config.host,
    port: config.port,
    db: config.db
})

module.exports = thinky;