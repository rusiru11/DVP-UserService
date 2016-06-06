

var express = require('express')
    , passport = require('passport')
    , site = require('./site')
    , oauth2 = require('./oauth2')


// Express configuration

var app = express.createServer();
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// Passport configuration

require('./auth');


app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);



app.listen(3000);





















var restify = require('restify');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var userService = require("./UserService.js");
var organisationService = require("./OrganisationService");
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
server.put('/DVP/API/:version/User/:name', authorization({resource:"user", action:"write"}), userService.UpdateUser);

//////////////////////////////Organisation API/////////////////////////////////////////////////////
server.get('/DVP/API/:version/User/:name/profile', authorization({resource:"userProfile", action:"read"}), userService.GetUserProfile);
server.put('/DVP/API/:version/User/:name/profile', authorization({resource:"userProfile", action:"write"}), userService.UpdateUserProfile);

server.get('/DVP/API/:version/Organisations', authorization({resource:"user", action:"read"}), organisationService.GetOrganisations);
server.get('/DVP/API/:version/Organisation', authorization({resource:"user", action:"read"}), organisationService.GetOrganisation);
server.del('/DVP/API/:version/Organisation', authorization({resource:"user", action:"delete"}), organisationService.DeleteOrganisation);
server.post('/DVP/API/:version/Organisation', authorization({resource:"user", action:"write"}), organisationService.CreateOrganisation);
server.patch('/DVP/API/:version/Organisation', authorization({resource:"user", action:"write"}), organisationService.UpdateOrganisation);

server.get('/DVP/API/:version/Users/:name/Scope', authorization({resource:"userScope", action:"write"}), userService.GetUserScopes);
server.put('/DVP/API/:version/Users/:name/Scope', authorization({resource:"userScope", action:"write"}), userService.AddUserScopes);
server.del('/DVP/API/:version/User/:name/Scope/:scope', authorization({resource:"userScope", action:"delete"}), userService.DeleteUser);

server.get('/DVP/API/:version/Users/:name/Scope', authorization({resource:"userAppScope", action:"write"}), userService.GetAppScopes);
server.put('/DVP/API/:version/Users/:name/AppScope', authorization({resource:"userAppScope", action:"write"}), userService.AddUserAppScopes);
server.del('/DVP/API/:version/User/:name/AppScope/:scope', authorization({resource:"userAppScope", action:"delete"}), userService.RemoveUserAppScopes);


server.get('/DVP/API/:version/Users/:name/UserMeta', authorization({resource:"userMeta", action:"read"}), userService.GetUserMeta);
server.put('/DVP/API/:version/Users/:name/UserMeta', authorization({resource:"userMeta", action:"write"}), userService.UpdateUserMetadata);

server.get('/DVP/API/:version/Users/:name/AppMeta', authorization({resource:"userAppMeta", action:"read"}), userService.GetAppMeta);
server.put('/DVP/API/:version/Users/:name/AppMeta', authorization({resource:"userAppMeta", action:"write"}), userService.UpdateAppMetadata);




server.listen(port, function () {

    logger.info("DVP-UserService.main Server %s listening at %s", server.name, server.url);

});
