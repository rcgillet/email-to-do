const Router = require('restify-router').Router;
const routerInstance = new Router();
const MessagesHandler = require('../handlers/MessagesHandler');
const AuthenticationHandler = require('../handlers/AuthenticationHandler');

routerInstance.get('/login', MessagesHandler.getMessages);
routerInstance.get('/oauthcallback', AuthenticationHandler.oauthCallback);
routerInstance.get('/list', AuthenticationHandler.list);
routerInstance.put('/startProgress/:id', AuthenticationHandler.startProgress);
routerInstance.put('/completed/:id', AuthenticationHandler.completed);
routerInstance.get('/createLabel', AuthenticationHandler.createLabel);

module.exports = routerInstance;
