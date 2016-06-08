/**
 * Created by a on 6/6/2016.
 */


var oauth2orize = require('oauth2orize');
var passport = require('passport');
var login = require('connect-ensure-login');
var Client = require('./model/Client');
var User = require('./model/User');
var RefreshToken = require("./model/RefreshToken");
var AuthorizationCode = require('./model/AuthorizationCodes');
var accessToken = require ('./model/AccessToken');
var FlakeIdGen = require('flake-idgen')
var intformat = require('biguint-format')
var uuid = require('node-uuid');
var jwtBearer = require('oauth2orize-jwt-bearer').Exchange;
var jwt = require('jsonwebtoken');
var util = require("util");
var moment = require('moment');
var generator = new FlakeIdGen;

var server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    Client.findById(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
});

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {


    var id1 = generator.next();
    var id3 = intformat(id1, 'dec');
    var code = id3;


    var authorizationcode = AuthorizationCode(
        {
            code: code,
            userId: user.id,
            clientId: client.id,
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



server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
    var token = uuid.v1();



    var accesstoken = accessToken({

        token: token,
        userId: user.id,
        clientId: client.id,
        scope: [],
        expirationDate: Date.now()
    });

    accesstoken.save(function (err, accesstoken) {
        if (err) {

            return done(err);
        }
        return done(null, token);
    });




}));



server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    AuthorizationCode.findOne({code: code}, function(err, authCode) {
        if (err) { return done(err); }
        if (!authCode) { return done(null, false); }
        if (client.id !== authCode.clientId) { return done(null, false); }
        if (redirectURI !== authCode.redirectURL) { return done(null, false); }

        AuthorizationCode.findOneAndRemove({code: code}, function(err) {
            if(err) { return done(err); }
            var token = uuid.v1();

            var accesstoken = accessToken({

                token: token,
                userId: authCode.userId,
                clientId: authCode.clientId,
                scope: [],
                expirationDate: Date.now()
            });

            accesstoken.save(function(err, accesstoken) {
                if (err) {

                    return done(err);
                }


                //////////////////////////////////////////////////////////
                var rToken = null;

                if (authCode.scope && authCode.scope.indexOf("offline_access") == -1) {
                    rToken = uuid.v1();


                    var refreshToken = RefreshToken({
                        token: rToken,
                        userId: authCode.userId,
                        clientId: authCode.clientId,
                        scope: [],
                        expirationDate: Date.now()
                    });

                    refreshToken.save(function (err,refToken) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, token, rToken, {expires_in: Date.now()});
                    });
                }
                else {
                    return done(null, token, rToken, {expires_in:  Date.now()});
                }
                /////////////////////////////////////////////////////////////////////////////////
            });

        });
    });
}));

server.exchange('urn:ietf:params:oauth:grant-type:jwt-bearer', jwtBearer(function(client, data, signature, done) {
    var crypto = require('crypto');
    var pub = "secret";
    var verifier = crypto.createVerify("RSA-SHA256");


    var token = util.format("%s.%s", data, signature)


    var decoded = jwt.decode(token);


    Client.findOne({clientId: decoded.prn, redirectURL: decoded.url}, function (err, client) {
        if (err) {
            return done(err);
        }
        else if (!client) {

            return done(null, null);

        } else {

            jwt.verify(token, client.clientSecret, function (err, decoded) {
                if (err) {

                    done(null, null);

                } else {

                    User.findOne({username: decoded.iss}, function(err, user) {

                        var accessToken = null;
                        if (!err) {


                            var jti = uuid.v4();
                            var secret = uuid.v4();
                            //redisClient.set("token:iss:"+obj.Username+":"+jti, secret, redis.print);
                            //redisClient.expires();

                            var payload = {};
                            payload.iss = user.username;
                            payload.jti = jti;
                            payload.sub = decoded.sub;
                            payload.exp = moment().add(7, 'days').unix();
                            payload.tenant = user.company;
                            payload.company = user.tenant;
                            payload.aud = decoded.prn;

                            payload.scope = {};


                            var accessToken = jwt.sign(payload, user.password);


                        }

                        done(null, accessToken);
                    });

                }
            });

            //done(null, null);

        }
    });
}));

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
    //Validate the user



            User.findOne({username: username}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }
                if (password !== user.password) {
                    return done(null, false);
                }
                var token = uuid.v1();


                var accesstoken = accessToken({

                    token: token,
                    userId: user.id,
                    clientId: client.id,
                    scope: [],
                    expirationDate: Date.now()
                });

                accesstoken.save(function (err, accesstoken) {
                    if (err) {

                        return done(err);
                    }


                    //////////////////////////////////////////////////////////
                    var rToken = null;

                    if (authCode.scope && authCode.scope.indexOf("offline_access") == -1){
                        rToken = uuid.v1();


                        var refreshToken = RefreshToken({
                            token: rToken,
                            userId: authCode.userId,
                            clientId: authCode.clientId,
                            scope: [],
                            expirationDate: Date.now()
                        });

                        refreshToken.save(function (err,refToken) {
                            if (err) {
                                return done(err);
                            }
                            return done(null, token, rToken, {expires_in: Date.now()});
                        });
                    }
                    else {
                        return done(null, token, rToken, {expires_in:  Date.now()});
                    }
                    /////////////////////////////////////////////////////////////////////////////////

                });




        /*
        db.accessTokens.save(token, config.token.calculateExpirationDate(), user.id, client.id, scope, function (err) {
            if (err) {
                return done(err);
            }
            var refreshToken = null;
            //I mimic openid connect's offline scope to determine if we send
            //a refresh token or not
            if (scope && scope.indexOf("offline_access") === 0) {
                refreshToken = utils.uid(config.token.refreshTokenLength);
                db.refreshTokens.save(refreshToken, user.id, client.id, scope, function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
                });
            } else {
                return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
            }
        });
        */
    });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {

    var token = uuid.v1();

    var accesstoken = accessToken({

        token: token,
        userId: -1,
        clientId: client.id,
        scope: [],
        expirationDate: Date.now()
    });

    accesstoken.save(function (err, accesstoken) {
        if (err) {

            return done(err);
        }
        return done(null, token);
    });

}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
    RefreshToken.findOne({token: refreshToken}, function (err, refToken) {
        if (err) {
            return done(err);
        }
        if (!refToken) {
            return done(null, false);
        }
        if (client.id !== refToken.clientId) {
            return done(null, false);
        }
        var token = uuid.v1();


        var accesstoken = accessToken({

            token: token,
            userId: refToken.userId,
            clientId: client.id,
            scope: [],
            expirationDate: Date.now()
        });

        accesstoken.save(function (err, accesstoken) {
            if (err) {

                return done(err);
            }
            return done(null, token, null,{expires_in: Date.now()});
        });



    });
}));


exports.authorization = [
    login.ensureLoggedIn(),
    server.authorization(function(clientID, redirectURI, done) {
        Client.findOne({clientId: clientID, redirectURL: redirectURI}, function(err, client) {
            if (err) { return done(err); }
            else if(!client) {

                var noClientErr = new Error("No client found");
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


