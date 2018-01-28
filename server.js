const restify = require('restify');
const plugins = require('restify-plugins');
const Router = require('restify-router').Router;
const routerInstance = new  Router();
const pkg = require('./package.json');

let server = restify.createServer({
    name: 'pkg.name',
    version: '1.0.0'
});
server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.bodyParser());
server.use(
    function crossOrigin(req,res,next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

require('require-all')({
  dirname     :  __dirname + '/routes',
  resolve     : function (routes) {
    routes.applyRoutes(server);
  }
});

server.listen(4000, function () {
    console.log('%s listening at %s', server.name, server.url);
});


