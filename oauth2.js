/**
 * Created by a on 6/6/2016.
 */


var oauth2orize = require('oauth2orize');
var passport = require('passport');
var login = require('connect-ensure-login');
var client = require('./model/Client');
var authorizationCode = require('./model/AuthorizationCodes');
var accessToken = require ('./model/AccessToken');


var server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    client.findById(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
});



server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var code = "aaaaaaaaaaaaaaaaaaaaaa";


    var authorizationcode = authorizationCode(
        {
            code: code,
            userID: user,
            clientId: client,
            scope: [],
            redirectURL: redirectURI


        }
    );

    authorizationcode.save(function(err, authcode) {
        if (err) {
            return done(err);

        }
        done(null, code);
    });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    authorizationCode.findOne({code: code}, function(err, authCode) {
        if (err) { return done(err); }
        if (authCode === undefined) { return done(null, false); }
        if (client.id !== authCode.clientID) { return done(null, false); }
        if (redirectURI !== authCode.redirectURI) { return done(null, false); }

        authorizationCode.delete(code, function(err) {
            if(err) { return done(err); }
            var token = "kkkkkkkkkkkkkk";

            var accesstoken = accessToken({

                token: token,
                userID: authCode.userID,
                clientId: authCode.clientID,
                scope: [String],
                expirationDate: ""
            });

            accesstoken.save(token, authCode.userID, authCode.clientID, function(err, accesstoken) {
                if (err) {

                    return done(err);
                }
                done(null, token);
            });
        });
    });
}));



exports.authorization = [
    login.ensureLoggedIn(),
    server.authorization(function(clientID, redirectURI, done) {
        client.findOne({username: clientID, redirectURL: redirectURI}, function(err, client) {
            if (err) { return done(err); }
            else if(!client) {

                var noClientErr = new ERROR("No client found");
                return done(noClientErr);
            }


            return done(null, client, redirectURI);
        });
    }),
    function(req, res){
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
    }
]



exports.decision = [
    login.ensureLoggedIn(),
    server.decision()
]



exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]


