'use strict';

const google = require('googleapis');
const OAuth2Client = google.auth.OAuth2;
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const opn = require('opn');
const secrets = require('../client_secret');

const called = false;

function callOnce (callback) {
  if (!called) {
    called = true;
    callback();
  }
}

function handler (request, response, server, callback) {
  const self = this;
  const qs = querystring.parse(url.parse(request.url).query);
  self.oAuth2Client.getToken(qs.code, function (err, tokens) {
    if (err) {
      console.error('Error getting oAuth tokens: ' + err);
    }
    self.oAuth2Client.setCredentials(tokens);
    self.isAuthenticated = true;
    response.end('Authentication successful! Please return to the console.');
    callback(tokens);
    server.close();
  });
}

function SampleClient (options) {
  const self = this;
  self.isAuthenticated = false;
  this._options = options || { scopes: [] };

  // create an oAuth client to authorize the API call
  this.oAuth2Client = new OAuth2Client(
    secrets.installed.client_id,
    secrets.installed.client_secret,
    secrets.installed.redirect_uris[0]
  );

  // Open an http server to accept the oauth callback. In this
  // simple example, the only request to our webserver is to
  // /callback?code=<code>
  this._authenticate = function (scopes, callback) {
    // grab the url that will be used for authorization
    self.authorizeUrl = self.oAuth2Client.generateAuthUrl({
      access_type: 'online',
      scope: scopes.join(' ')
    });
    const server = http.createServer(function (request, response) {
      callOnce(function () {
        handler.call(self, request, response, server, callback);
      });
    }).listen(8080, function () {
      // open the browser to the authorize url to start the workflow
      opn(self.authorizeUrl);
    });
  };

  self.execute = function (scopes, callback) {
    self._callback = callback;
    if (self.isAuthenticated) {
      callback.apply();
    } else {
      self._authenticate(scopes, callback);
    }
  };

  return self;
}

module.exports = new SampleClient();
