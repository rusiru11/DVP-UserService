/**
 * Created by Sukitha on 10/18/2016.
 */

var User = require('dvp-mongomodels/model/User');
var jwt = require('jsonwebtoken');
var redis = require('redis');
var accessToken = require ('dvp-mongomodels/model/AccessToken');
var config = require('config');
var request = require('request');
var uuid = require('node-uuid');
var moment = require('moment');
var Tenant = require('dvp-mongomodels/model/Tenant').Tenant;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var Org = require('dvp-mongomodels/model/Organisation');
var orgService = require('./OrganisationService');
var bcrypt = require('bcryptjs');
var qs = require('querystring');

var util = require('util');

var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redisuser = config.Redis.user;
var redispass = config.Redis.password;


//[redis:]//[user][:password@][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
//redis://user:secret@localhost:6379
var redisClient = redis.createClient(redisport, redisip);
redisClient.on('error', function (err) {
    console.log('Error '.red, err);
});

redisClient.auth(redispass, function (error) {
    console.log("Error Redis : " + error);
});

function GetVerification(token, done) {

    var payload = jwt.decode(token);

    if(payload && payload.iss && payload.jti) {

        redisClient.get("token:iss:" + payload.iss + ":" + payload.jti, function (err, key) {
            if (err) {
                return done(err);
            }
            if (!key) {
                return done(new Error('missing_secret'));
            }

            if(jwt.verify(token, key)) {
                return done(null, payload);
            }else{
                return done(new Error('verification_failed'));
            }


        });
    }else{

        return done(new Error('wrong_token'));
    }
}

function GetScopes(user, claims){


    var context = {};
    var payload = {};
    payload.context = {};
    payload.scope = [];

    if(claims) {
        var index = claims.indexOf("profile_contacts");

        if (index > -1) {
            payload.context.phonenumber = user.phoneNumber;
            payload.context.email = user.email;
            payload.context.othercontacts = user.contacts;

            claims.splice(index, 1);
        }


        var index = claims.indexOf("app_meta");

        if (index > -1) {
            payload.context.appmeta = user.app_meta;
            claims.splice(index, 1);
        }


        var index = claims.indexOf("user_scopes");

        if (index > -1) {
            payload.context.userscopes = user.user_scopes;
            claims.splice(index, 1);
        }

        var index = claims.indexOf("client_scopes");

        if (index > -1) {
            payload.context.clientscopes = user.client_scopes;
            claims.splice(index, 1);
        }


        var index = claims.indexOf("resourceid");

        if (index > -1) {
            payload.context.resourceid = user.resourceid;
            claims.splice(index, 1);
        }





        var profileClaimsFound = claims.filter(function (item, index) {

            return item.startsWith('profile_');
        })

        profileClaimsFound.forEach(function (value) {


            var arr = value.split("_");
            if (arr.length > 1) {

                var action = arr[0];
                var resource = arr[1];

                if(action == "profile"){


                    if(resource == "password"){

                        payload.context[resource] = undefined;


                    }
                    else{

                        payload.context[resource] = user[resource];

                    }

                }

            }});


        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var index = claims.indexOf("all_all");

        if (index > -1) {
            user.user_scopes.forEach(function (item){
                var actionObj = {};
                actionObj.resource = item.scope;
                actionObj.actions = [];

                if(item.read){
                    actionObj.actions.push("read");
                }

                if(item.write){

                    actionObj.actions.push("write");
                }

                if(item.delete){

                    actionObj.actions.push("delete");
                }
                payload.scope.push(actionObj);
            });

        }else {

            claims.forEach(function (value) {


                var arr = value.split("_");
                if (arr.length > 1) {

                    var action = arr[0];
                    var resource = arr[1];


                    var scopeFound = user.user_scopes.filter(function (item) {
                        return item.scope == resource;
                    })


                    if (scopeFound.length > 0) {

                        var myscope = {};
                        myscope.resource = scopeFound[0].scope;
                        myscope.actions = [];

                        if (action == "read") {

                            var actionArray = [];
                            if (scopeFound[0].read) {

                                actionArray.push("read");

                            }

                            myscope.actions = myscope.actions.concat(actionArray);


                        }
                        else if (action == "write") {


                            var actionArray = [];
                            if (scopeFound[0].read) {

                                actionArray.push("read");

                            }

                            if (scopeFound[0].write) {

                                actionArray.push("write");

                            }


                            myscope.actions = myscope.actions.concat(actionArray);

                        }
                        else if (action == "all") {


                            var actionArray = [];
                            if (scopeFound[0].read) {

                                actionArray.push("read");

                            }

                            if (scopeFound[0].write) {

                                actionArray.push("write");

                            }


                            if (scopeFound[0].delete) {

                                actionArray.push("delete");

                            }

                            myscope.actions = myscope.actions.concat(actionArray);

                        }

                        payload.scope.push(myscope);
                    }


                }
            });
        }
    }


    return payload;

}

function GetJWT(user, scopes){

    var jti = uuid.v4();
    var secret = uuid.v4();
    var expin  = moment().add(7, 'days').unix();
    var redisKey = "token:iss:"+user.username+":"+jti;
    redisClient.set(redisKey, secret, redis.print);
    redisClient.expireat(redisKey, expin);

    var payload = {};
    payload.iss = user.username;
    payload.jti = jti;
    payload.sub = "Access client";
    payload.exp = expin;
    payload.tenant = user.tenant;
    payload.company = user.company;
    //payload.aud = client.name;

    var scopes = GetScopes(user, scopes);
    payload.context = scopes.context;
    payload.scope = scopes.scope;
    var token = jwt.sign(payload, secret);
    return token;
}

module.exports.Login =  function(req, res) {
    //email.contact
    User.findOne({"username": req.body.userName}, '+password', function (err, user) {
        if (!user) {
            return res.status(401).send({message: 'Invalid email and/or password'});
        }

        /*bcrypt.compare(req.body.password, user.password, function(err, isMatch) {
            if (!isMatch) {
                return res.status(401).send({message: 'Invalid email and/or password'});
            }
            res.send({token: GetJWT(user, ["all_all"])});
        });*/

        user.comparePassword(req.body.password, function (err, isMatch) {
            if (!isMatch) {
                return res.status(401).send({message: 'Invalid email and/or password'});
            }

            var claims_arr = ["all_all"];
            if(req.body.scope && util.isArray(req.body.scope) && req.body.scope.length >0){

                claims_arr = req.body.scope;
            }

            res.send({token: GetJWT(user, claims_arr)});
        });

    });
};

module.exports.SignUP = function(req, res) {


    User.findOne({"username": req.body.mail}, function (err, existingUser) {
        if (existingUser) {
            return res.status(409).send({message: 'Email is already taken'});
        }
        var user = new User({
            displayName: req.body.displayName,
            email: {
                contact: req.body.mail,
                type: "email",
                display: req.body.mail,
                verified: false
            },
            username: req.body.mail,
            password: req.body.password,
            user_meta: {role: "admin"},
            systemuser: true,
            user_scopes: [
            {scope: "organisation", read: true, write: true},
            {scope: "resource", read: true},
            {scope: "package", read: true},
            {scope: "console", read: true},
            {"scope": "myNavigation", "read": true},
            {"scope": "myUserProfile", "read": true}
        ],

        company: 0,
            tenant: 1,
            created_at: Date.now(),
            updated_at: Date.now()

        });
        user.save(function (err, result) {
            if (!err && result) {


                orgService.CreateOrganisationStanAlone(user, function (err, result) {

                    if (!err && result) {

                        var token = GetJWT(result, ["all_all"]);
                        res.send({state: "new", token: token});

                    } else {

                        res.status(404).send({message: 'Organization save failed'});
                    }
                })


            } else {
                res.status(404).send({message: 'User save failed'});

            }
        });
    });
};

module.exports.Google = function(req, res){
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    var claims_arr = ["all_all"];
    if(req.body.scope && util.isArray(req.body.scope) && req.body.scope.length >0){

        claims_arr = req.body.scope;
    }

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {

        if(token) {
            var accessToken = token.access_token;
            var headers = {Authorization: 'Bearer ' + accessToken};

            // Step 2. Retrieve profile information about the current user.
            request.get({url: peopleApiUrl, headers: headers, json: true}, function (err, response, profile) {
                if (profile.error) {
                    return res.status(500).send({message: profile.error.message});
                }
                // Step 3a. Link user accounts.
                if (req.header('Authorization')) {
                    User.findOne({"googleplus.cid": profile.sub}, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({message: 'There is already a Google account that belongs to you'});
                        }
                        var token = req.header('Authorization').split(' ')[1];


                        GetVerification(token, function (err, payload) {

                            if (!err && payload) {
                                User.findOne({username: payload.iss}, function (err, user) {
                                    if (!user) {
                                        return res.status(400).send({message: 'User not found'});
                                    }

                                    user.googleplus = {
                                        contact: profile.email,
                                        cid: profile.sub,
                                        type: "google",
                                        display: profile.name,
                                        verified: profile.email_verified
                                    };

                                    user.email = {
                                        contact: profile.email,
                                        type: "email",
                                        display: profile.name,
                                        verified: profile.email_verified
                                    };

                                    user.avatar = user.avatar || profile.picture.replace('sz=50', 'sz=200');
                                    user.displayname = user.displayname || profile.name;
                                    user.firstname = user.firstname || profile.given_name;
                                    user.lastname = user.lastname ||profile.family_name;
                                    user.locale = user.locale || profile.locale,
                                    user.save(function () {
                                        var token = GetJWT(user,claims_arr);
                                        res.send({state: "linking",token: token});
                                    });
                                });
                            } else {

                                return res.status(401).send({message: 'Token is not verified'});
                            }

                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.


                    User.findOne({"username": profile.email},  function (err, user) {
                        if (!user) {
                            User.findOne({"googleplus.cid": profile.sub}, function (err, existingUser) {
                                if (existingUser) {
                                    return res.send({state: 'existing',token: GetJWT(existingUser, claims_arr)});
                                }
                                var user = new User();
                                user.googleplus = {
                                    contact: profile.email,
                                    cid: profile.sub,
                                    type: "google",
                                    display: profile.name,
                                    verified: profile.email_verified
                                };

                                user.email = {
                                    contact: profile.email,
                                    type: "email",
                                    display: profile.name,
                                    verified: profile.email_verified
                                };

                                user.avatar = profile.picture.replace('sz=50', 'sz=200');
                                user.displayName = profile.name;
                                user.firstname = profile.given_name;
                                user.lastname = profile.family_name;
                                user.locale = profile.locale;
                                user.company = 0;
                                user.tenant = 1;
                                user.systemuser = true,
                                    user.username = profile.email;
                                user.user_meta = {role: "admin"};
                                user.user_scopes = [
                                    {scope: "organisation", read: true, write: true},
                                    {scope: "resource", read: true},
                                    {scope: "package", read: true},
                                    {scope: "console", read: true},
                                    {"scope": "myNavigation", "read": true},
                                    {"scope": "myUserProfile", "read": true}
                                ];


                                user.save(function (err) {

                                    if(!err) {
                                        orgService.CreateOrganisationStanAlone(user,function(err, rUser){
                                            if(!err && rUser ){

                                                var token = GetJWT(rUser,claims_arr);
                                                res.send({state: "new", token: token});

                                            }else{

                                                res.status(404).send({message: 'Organization save failed'});
                                            }
                                        })

                                    }else{
                                        res.status(404).send({message: 'User save failed'});
                                    }
                                });
                            });
                        } else {

                            User.findOne({"googleplus.cid": profile.sub}, function (err, existingUser) {
                                if (existingUser) {
                                    return res.send({state: 'existing', token: GetJWT(existingUser, claims_arr)});
                                } else {

                                    user.googleplus = {
                                        contact: profile.email,
                                        cid: profile.sub,
                                        type: "google",
                                        display: profile.name,
                                        verified: profile.email_verified
                                    };


                                    user.avatar = user.avatar || profile.picture.replace('sz=50', 'sz=200');
                                    user.displayname = user.displayname || profile.name;
                                    user.firstname = user.firstname || profile.given_name;
                                    user.lastname = user.lastname || profile.family_name;
                                    user.locale = user.locale || profile.locale,
                                        user.save(function () {
                                            var token = GetJWT(user, claims_arr);
                                            res.send({state: "linking", token: token});
                                        });
                                }
                            });

                        }
                    });


                }
            });
        }else{
            return res.status(401).send({message: 'Token is not verified'});
        }
    });
};

module.exports.GitHub = function(req, res) {
    var accessTokenUrl = 'https://github.com/login/oauth/access_token';
    var userApiUrl = 'https://api.github.com/user';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.GITHUB_SECRET,
        redirect_uri: req.body.redirectUri
    };

    var claims_arr = ["all_all"];
    if(req.body.scope && util.isArray(req.body.scope) && req.body.scope.length >0){

        claims_arr = req.body.scope;
    }

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
        accessToken = qs.parse(accessToken);
        var headers = { 'User-Agent': 'Satellizer' };

        // Step 2. Retrieve profile information about the current user.
        request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

            // Step 3a. Link user accounts.
            if (req.header('Authorization')) {


                User.findOne({"github.cid": profile.sub}, function (err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({message: 'There is already a Google account that belongs to you'});
                    }
                    var token = req.header('Authorization').split(' ')[1];


                    GetVerification(token, function (err, payload) {

                        if (!err && payload) {
                            User.findOne({username: payload.iss}, function (err, user) {
                                if (!user) {
                                    return res.status(400).send({message: 'User not found'});
                                }

                                user.github = {
                                    contact: profile.email,
                                    cid: profile.id,
                                    type: "github",
                                    display: profile.name,
                                    verified: true
                                };

                                user.email = {
                                    contact: profile.email,
                                    type: "email",
                                    display: profile.name,
                                    verified: true
                                };

                                user.avatar = user.avatar ||  profile.avatar_url;
                                user.displayname = user.displayname || profile.name;

                                    user.save(function () {
                                        var token = GetJWT(user,claims_arr);
                                        res.send({state: "linking",token: token});
                                    });
                            });
                        } else {

                            return res.status(401).send({message: 'Token is not verified'});
                        }

                    });
                });


            } else {
                // Step 3b. Create a new user account or return an existing one.

                User.findOne({"username": profile.email},  function (err, user) {
                    if (!user) {
                        User.findOne({"github.cid": profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                return res.send({state: 'existing',token: GetJWT(existingUser, claims_arr)});
                            }
                            var user = new User();
                            user.github = {
                                contact: profile.email,
                                cid: profile.id,
                                type: "github",
                                display: profile.name,
                                verified: true
                            };

                            user.email = {
                                contact: profile.email,
                                type: "email",
                                display: profile.name,
                                verified: true
                            };
                            user.avatar = profile.avatar_url;
                            user.displayName = profile.name;
                            user.firstname = profile.login;
                            //user.lastname = profile.family_name;
                            //user.locale = profile.locale;
                            user.company = 0;
                            user.tenant = 1;
                            user.systemuser = true,
                                user.username = profile.email;
                            user.user_meta = {role: "admin"};
                            user.user_scopes = [
                                {scope: "organisation", read: true, write: true},
                                {scope: "resource", read: true},
                                {scope: "package", read: true},
                                {scope: "console", read: true},
                                {"scope": "myNavigation", "read": true},
                                {"scope": "myUserProfile", "read": true}
                            ];


                            user.save(function (err) {

                                if(!err) {


                                    orgService.CreateOrganisationStanAlone(user,function(err, rUser){

                                        if(!err && rUser ){

                                            var token = GetJWT(rUser,claims_arr);
                                            res.send({state: "new", token: token});

                                        }else{

                                            res.status(404).send({message: 'Organization save failed'});
                                        }
                                    })


                                }else{
                                    res.status(404).send({message: 'User save failed'});

                                }
                            });
                        });
                    } else {




                        User.findOne({"github.cid": profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                return res.send({state: 'existing', token: GetJWT(existingUser, claims_arr)});
                            } else {

                                user.github = {
                                    contact: profile.email,
                                    cid: profile.id,
                                    type: "github",
                                    display: profile.name,
                                    verified: true
                                };



                                user.avatar = user.avatar ||  profile.avatar_url;
                                user.displayname = user.displayname || profile.name;

                                user.save(function () {
                                    var token = GetJWT(user,claims_arr);
                                    res.send({state: "linking",token: token});
                                });


                            }
                        });

                    }
                });

            }
        });
    });
};

module.exports.Facebook = function(req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
    };

    var claims_arr = ["all_all"];
    if(req.body.scope && util.isArray(req.body.scope) && req.body.scope.length >0){

        claims_arr = req.body.scope;
    }
    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
        if (response.statusCode !== 200) {
            return res.status(500).send({ message: accessToken.error.message });
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
            if (response.statusCode !== 200) {

                return res.status(500).send({ message: profile.error.message });
            }
            if (req.header('Authorization')) {



                User.findOne({"facebook.cid": profile.id}, function (err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({message: 'There is already a Google account that belongs to you'});
                    }
                    var token = req.header('Authorization').split(' ')[1];


                    GetVerification(token, function (err, payload) {

                        if (!err && payload) {
                            User.findOne({username: payload.iss}, function (err, user) {
                                if (!user) {
                                    return res.status(400).send({message: 'User not found'});
                                }

                                user.facebook = {
                                    contact: profile.email,
                                    cid: profile.id,
                                    type: "facebook",
                                    display: profile.name,
                                    verified: true
                                };

                                user.email = {
                                    contact: profile.email,
                                    type: "email",
                                    display: profile.name,
                                    verified: true
                                };
                                user.avatar = user.avatar ||  'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                                user.displayname = user.displayname || profile.name;
                                user.firstname = user.firstname || profile.first_name;
                                user.lastname = user.lastname ||profile.last_name;
                                //user.locale = user.locale || profile.locale,
                                user.save(function () {
                                    var token = GetJWT(user,claims_arr);
                                    res.send({state: "linking",token: token});
                                });
                            });
                        } else {

                            return res.status(401).send({message: 'Token is not verified'});
                        }

                    });
                });

            } else {
                // Step 3. Create a new user account or return an existing one.




                User.findOne({"username": profile.email},  function (err, user) {
                    if (!user) {
                        User.findOne({"facebook.cid": profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                return res.send({state: 'existing',token: GetJWT(existingUser, claims_arr)});
                            }
                            var user = new User();
                            user.facebook = {
                                contact: profile.email,
                                cid: profile.id,
                                type: "facebook",
                                display: profile.name,
                                verified: true
                            };

                            user.email = {
                                contact: profile.email,
                                type: "email",
                                display: profile.name,
                                verified: true
                            };

                            user.avatar = 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                            user.displayName = profile.name;
                            user.firstname = profile.first_name;
                            user.lastname = profile.last_name;
                            //user.locale = profile.locale;
                            user.company = 0;
                            user.tenant = 1;
                            user.systemuser = true,
                                user.username = profile.email;
                            user.user_meta = {role: "admin"};
                            user.user_scopes = [
                                {scope: "organisation", read: true, write: true},
                                {scope: "resource", read: true},
                                {scope: "package", read: true},
                                {scope: "console", read: true},
                                {"scope": "myNavigation", "read": true},
                                {"scope": "myUserProfile", "read": true}
                            ];


                            user.save(function (err) {

                                if(!err) {


                                    orgService.CreateOrganisationStanAlone(user,function(err, rUser){

                                        if(!err && rUser ){

                                            var token = GetJWT(rUser,["all_all"]);
                                            res.send({state: "new", token: token});

                                        }else{

                                            res.status(404).send({message: 'Organization save failed'});
                                        }
                                    })


                                }else{
                                    res.status(404).send({message: 'User save failed'});

                                }
                            });
                        });
                    } else {

                        User.findOne({"facebook.cid": profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                return res.send({state: 'existing', token: GetJWT(existingUser, claims_arr)});
                            }else {
                                user.facebook = {
                                    contact: profile.email,
                                    cid: profile.id,
                                    type: "facebook",
                                    display: profile.name,
                                    verified: true
                                };


                                user.avatar = user.avatar || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                                user.displayname = user.displayname || profile.name;
                                user.firstname = user.firstname || profile.first_name;
                                user.lastname = user.lastname || profile.last_name;

                                user.save(function () {
                                    var token = GetJWT(user, claims_arr);
                                    res.send({state: "linking", token: token});
                                });
                            }
                        });

                    }
                });

            }
        });
    });
};

