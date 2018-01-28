const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const gmail = google.gmail('v1');
const SECRETS = require('../client_secret');
const atob = require('atob');
const moment = require('moment-timezone');

const oauth2Client = new OAuth2(
  SECRETS.installed.client_id,
  SECRETS.installed.client_secret,
  SECRETS.installed.redirect_uris[0]
);

function getHeader(headers, index) {
    const header = headers.filter((header) => {
        return header.name === index;
    })[0];
    return header;
}

function getBody(message) {
    var encodedBody = '';
    if(typeof message.parts === 'undefined') {
        encodedBody = message.body.data;
    } else {
        encodedBody = getHTMLPart(message.parts);
    }

    encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return decodeURIComponent(escape(atob(encodedBody)));
}

function getHTMLPart(arr) {
    for(var x = 0; x <= arr.length; x++) {
        if(typeof arr[x].parts === 'undefined') {
            if(arr[x].mimeType === 'text/html') {
                return arr[x].body.data;
            }
        } else {
            return getHTMLPart(arr[x].parts);
        }
    }
    return '';
}

function sortMessagesByDate(messages) {
    messages.sort((a, b) => {
        return moment(b.date.raw).unix() - moment(a.date.raw).unix();
    });

    return messages.reduce(function (r, a) {
        const day = moment.tz(a.date.raw, "America/New_York").format('dddd, MMMM Do YYYY');
        r[day] = r[day] || [];
        r[day].push(a);
        return r;
    }, Object.create(null));
}

module.exports = {
    createLabel: (req, res, next) => {
        gmail.users.labels.create({
            'userId': 'jarvisautomator@gmail.com',
            'resource': {
                'name': 'COMPLETED'
            }
        }, (err, response) => {
            if (!err) {
                res.send(response);
                next();
            } else {
                res.send(500, err);
                next();
            }
        });
    },
    oauthCallback: (req, res, next) => {
        oauth2Client.getToken(req.query.code, function (err, tokens) {
            if (!err) {
                oauth2Client.credentials = tokens;
                google.options({
                  auth: oauth2Client
                });

                gmail.users.messages.list({ 'userId': 'jarvisautomator@gmail.com', 'maxResults': 10, 'labelIds': [ 'INBOX' ] }, (err, response) => {
                    let fullMessages = [];
                    const messages = response.messages;
                    const messageIds = messages.map((message) => {
                        return message.id;
                    });
        
                    messageIds.forEach((id) => {
                        gmail.users.messages.get({ 'userId': 'jarvisautomator@gmail.com', 'id': id }, (err, response) => {
                            fullMessages.push(response);
        
                            if (fullMessages.length === messages.length) {
                                console.log('sending');
                                res.send(fullMessages);
                                next();
                            }
                        });
                    });
                });
            } else {
                res.send(err);
                next();
            }
        });
    },
    list: (req, res, next) => {
        gmail.users.messages.list({
            'userId': 'jarvisautomator@gmail.com',
            'maxResults': 10,
            'labelIds': [ 'INBOX' ]
        }, (err, response) => {
            let fullMessages = [];
            const messages = response.messages;
            const messageIds = messages.map((message) => {
                return message.id;
            });

            gmail.users.labels.list({
                userId: 'jarvisautomator@gmail.com'
            }, (err, response) => {
                const inProgressLabelId = response.labels.filter((label) => {
                    return label.name === 'IN_PROGRESS';
                })[0].id;

                const completedLabelId = response.labels.filter((label) => {
                    return label.name === 'COMPLETED';
                })[0].id;

                messageIds.forEach((id) => {    
                    gmail.users.messages.get({ 'userId': 'jarvisautomator@gmail.com', 'id': id }, (err, response) => {
                        const headers = response.payload.headers;
                        const rawEmail = getHeader(headers, 'Date');
                        const emailDate = rawEmail ? rawEmail.value : moment();
    
                        fullMessages.push({
                            id: response.id,
                            labelIds: response.labelIds.map((id) => {
                                if (id === inProgressLabelId) {
                                    return 'IN_PROGRESS';
                                } else if (id === completedLabelId) {
                                    return 'COMPLETED';
                                } else {
                                    return id;
                                }
                            }),
                            from: getHeader(headers, 'From'),
                            date: {
                                raw: emailDate,
                                formatted: moment.tz(emailDate, "America/New_York").format('LLLL'),
                            },
                            subject: getHeader(headers, 'Subject'),
                            body: getBody(response.payload)
                        });
    
                        if (fullMessages.length === messages.length) {
                            res.send({ messages: sortMessagesByDate(fullMessages) });
                            next();
                        }
                    });
                });
            });
        });
    },
    startProgress: (req, res, next) => {
        const id = req.params.id;

        gmail.users.labels.list({
            userId: 'jarvisautomator@gmail.com'
        }, (err, response) => {
            const inProgressLabelId = response.labels.filter((label) => {
                return label.name === 'IN_PROGRESS';
            })[0].id;

            const completedLabelId = response.labels.filter((label) => {
                return label.name === 'COMPLETED';
            })[0].id;

            gmail.users.messages.modify({
                'userId': 'jarvisautomator@gmail.com',
                id,
                resource: {
                    'addLabelIds': [inProgressLabelId],
                    'removeLabelIds': [completedLabelId]
                }
            }, (err, response) => {
                if (err) {
                    res.send(500, { err });
                    next();
                } else {
                    res.send({message: 'Success'});
                    next();
                }
            });
        });
    },
    completed: (req, res, next) => {
        const id = req.params.id;

        gmail.users.labels.list({
            userId: 'jarvisautomator@gmail.com'
        }, (err, response) => {
            const inProgressLabelId = response.labels.filter((label) => {
                return label.name === 'IN_PROGRESS';
            })[0].id;

            const completedLabelId = response.labels.filter((label) => {
                return label.name === 'COMPLETED';
            })[0].id;

            gmail.users.messages.modify({
                'userId': 'jarvisautomator@gmail.com',
                id,
                resource: {
                    'addLabelIds': [completedLabelId],
                    'removeLabelIds': [inProgressLabelId]
                }
            }, (err, response) => {
                if (err) {
                    res.send(500, { err });
                    next();
                } else {
                    res.send({message: 'Success'});
                    next();
                }
            });
        });
    }
}
