

var restify = require('restify');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var userService = require("./UserService.js");
var config = require('config');
var jwt = require('restify-jwt');
var util = require('util');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');


var mongoip=config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodb=config.Mongo.dbname;
var mongouser=config.Mongo.user;
var mongopass = config.Mongo.password;


var mongoose = require('mongoose');
var connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb)
mongoose.connect(connectionstring);

mongoose.connection.once('open', function() {
    console.log("Connected to db");
});




var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';


var server = restify.createServer({
    name: "DVP User Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));
restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(jwt({secret: secret.Secret}));


//////////////////////////////Cloud API/////////////////////////////////////////////////////

server.get('/DVP/API/:version/Users', authorization({resource:"user", action:"read"}), userService.GetUsers);
server.get('/DVP/API/:version/User/:name', authorization({resource:"user", action:"read"}), userService.GetUser);
server.del('/DVP/API/:version/User/:name', authorization({resource:"user", action:"delete"}), userService.DeleteUser);
server.post('/DVP/API/:version/User', authorization({resource:"user", action:"write"}), userService.CreateUser);
server.patch('/DVP/API/:version/User/:name', authorization({resource:"user", action:"write"}), userService.UpdateUser);





server.listen(port, function () {

    logger.info("DVP-UserService.main Server %s listening at %s", server.name, server.url);

});
