

var express = require('express');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var session = require('express-session');
var qs = require('qs');
var site = require('./sites');
var oauth2 = require('./oauth2');
var url = require('url');
require('./auth');
var ejwt = require('express-jwt');
var cors = require('cors');
var app = express();





var restify = require('restify');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var userService = require("./UserService.js");
var clientService = require("./ClientService");
var organisationService = require("./OrganisationService");
var resourceService = require("./ResourceService");
var packageService = require("./PackageService");
var navigationService = require('./NavigationService');
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


var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';


var mongoose = require('mongoose');
var connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb)
mongoose.connect(connectionstring);

mongoose.connection.once('open', function() {
    console.log("Connected to db");
});

app.set('view engine', 'ejs');


//var router = express.Router();

/*
router.use(function (req, res, next) {
    var url_parts = url.parse(req.url, true);
    req.query = url_parts.query;
    next();
});
*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(errorhandler({ dumpExceptions: true, showStack: true }));
app.use(cors());




app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);


app.get('/DVP/API/:version/Users', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), userService.GetUsers);


//////////////////////////////Cloud API/////////////////////////////////////////////////////

app.get('/DVP/API/:version/Users', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), userService.GetUsers);
app.get('/DVP/API/:version/User/:name', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), userService.GetUser);
app.delete('/DVP/API/:version/User/:name', jwt({secret: secret.Secret}),authorization({resource:"user", action:"delete"}), userService.DeleteUser);
app.post('/DVP/API/:version/User', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), userService.CreateUser);
app.put('/DVP/API/:version/User/:name', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), userService.UpdateUser);

//////////////////////////////Organisation API/////////////////////////////////////////////////////
app.get('/DVP/API/:version/User/:name/profile', jwt({secret: secret.Secret}),authorization({resource:"userProfile", action:"read"}), userService.GetUserProfile);
app.put('/DVP/API/:version/User/:name/profile', jwt({secret: secret.Secret}),authorization({resource:"userProfile", action:"write"}), userService.UpdateUserProfile);

app.get('/DVP/API/:version/Organisations', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), organisationService.GetOrganisations);
app.get('/DVP/API/:version/Organisation', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), organisationService.GetOrganisation);
app.delete('/DVP/API/:version/Organisation', jwt({secret: secret.Secret}),authorization({resource:"user", action:"delete"}), organisationService.DeleteOrganisation);
app.post('/DVP/API/:version/Organisation', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), organisationService.CreateOrganisation);
app.put('/DVP/API/:version/Organisation', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), organisationService.UpdateOrganisation);
app.put('/DVP/API/:version/Organisation/Assign/:packageName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), organisationService.AssignPackageToOrganisation);
app.delete('/DVP/API/:version/Organisation/Remove/:packageName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), organisationService.RemovePackageFromOrganisation);

app.get('/DVP/API/:version/Resources', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), resourceService.GetResources);
app.get('/DVP/API/:version/Resource/:resourceName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), resourceService.GetResource);
app.delete('/DVP/API/:version/Resource/:resourceName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"delete"}), resourceService.DeleteResource);
app.post('/DVP/API/:version/Resource', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), resourceService.CreateResource);
app.put('/DVP/API/:version/Resource/:resourceName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), resourceService.UpdateResource);

app.get('/DVP/API/:version/Packages', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), packageService.GetPackages);
app.get('/DVP/API/:version/Package/:packageName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), packageService.GetPackage);
app.delete('/DVP/API/:version/Package/:packageName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"delete"}), packageService.DeletePackage);
app.post('/DVP/API/:version/Package', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), packageService.CreatePackage);
app.put('/DVP/API/:version/Package/:packageName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), packageService.UpdatePackage);

app.get('/DVP/API/:version/GetAllConsoles', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), navigationService.GetAllConsoles);
app.get('/DVP/API/:version/Console/:consoleName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"read"}), navigationService.GetConsole);
app.delete('/DVP/API/:version/Console/:consoleName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"delete"}), navigationService.DeleteConsole);
app.post('/DVP/API/:version/Console', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), navigationService.CreateConsole);
app.put('/DVP/API/:version/Console/:consoleName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), navigationService.UpdateConsole);
app.post('/DVP/API/:version/Console/:consoleName/AddNavigation', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), navigationService.AddNavigationToConsole);
app.delete('/DVP/API/:version/Console/:consoleName/Remove/:navigationName', jwt({secret: secret.Secret}),authorization({resource:"user", action:"write"}), navigationService.RemoveNavigationFromConsole);


app.get('/DVP/API/:version/Users/:name/Scope',jwt({secret: secret.Secret}), authorization({resource:"userScope", action:"read"}), userService.GetUserScopes);
app.put('/DVP/API/:version/Users/:name/Scope', jwt({secret: secret.Secret}),authorization({resource:"userScope", action:"write"}), userService.AddUserScopes);
app.delete('/DVP/API/:version/User/:name/Scope/:scope', jwt({secret: secret.Secret}),authorization({resource:"userScope", action:"delete"}), userService.RemoveUserScopes);

app.get('/DVP/API/:version/Users/:name/AppScope',jwt({secret: secret.Secret}), authorization({resource:"userAppScope", action:"read"}), userService.GetAppScopes);
app.put('/DVP/API/:version/Users/:name/AppScope', jwt({secret: secret.Secret}),authorization({resource:"userAppScope", action:"write"}), userService.AddUserAppScopes);
app.delete('/DVP/API/:version/User/:name/AppScope/:scope', jwt({secret: secret.Secret}),authorization({resource:"userAppScope", action:"delete"}), userService.RemoveUserAppScopes);


app.get('/DVP/API/:version/Users/:name/UserMeta', jwt({secret: secret.Secret}),authorization({resource:"userMeta", action:"read"}), userService.GetUserMeta);
app.put('/DVP/API/:version/Users/:name/UserMeta', jwt({secret: secret.Secret}),authorization({resource:"userMeta", action:"write"}), userService.UpdateUserMetadata);
app.delete('/DVP/API/:version/Users/:name/UserMeta/:usermeta', jwt({secret: secret.Secret}),authorization({resource:"userMeta", action:"delete"}), userService.RemoveUserMetadata);

app.get('/DVP/API/:version/Users/:name/AppMeta', jwt({secret: secret.Secret}),authorization({resource:"userAppMeta", action:"read"}), userService.GetAppMeta);
app.put('/DVP/API/:version/Users/:name/AppMeta', jwt({secret: secret.Secret}),authorization({resource:"userAppMeta", action:"write"}), userService.UpdateAppMetadata);
app.delete('/DVP/API/:version/Users/:name/AppMeta/:appmeta', jwt({secret: secret.Secret}),authorization({resource:"userAppMeta", action:"delete"}), userService.RemoveAppMetadata);


app.get('/DVP/API/:version/Clients', jwt({secret: secret.Secret}),authorization({resource:"client", action:"read"}), clientService.GetClients);
app.get('/DVP/API/:version/Client/:clientid', jwt({secret: secret.Secret}),authorization({resource:"client", action:"read"}), clientService.GetClient);
app.delete('/DVP/API/:version/Client/:clientid', jwt({secret: secret.Secret}),authorization({resource:"client", action:"delete"}), clientService.DeleteClient);
app.post('/DVP/API/:version/Client', jwt({secret: secret.Secret}),authorization({resource:"client", action:"write"}), clientService.CreateClient);



app.get('/DVP/API/:version/Client/:id/claims',jwt({secret: secret.Secret}), authorization({resource:"clientScope", action:"read"}), clientService.GetClientClaims);
app.put('/DVP/API/:version/Client/:id/claim', jwt({secret: secret.Secret}),authorization({resource:"clientScope", action:"write"}), clientService.AddClientClaim);
app.delete('/DVP/API/:version/Client/:id/claim/:claim', jwt({secret: secret.Secret}),authorization({resource:"clientScope", action:"delete"}), clientService.RemoveClientClaim);




app.listen(port, function () {

    logger.info("DVP-UserService.main Server listening at %d", port);

});


























/*


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

    */