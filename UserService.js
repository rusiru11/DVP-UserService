var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('./model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');



function GetUsers(req, res){


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.find({company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Users Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get Users Successful", true, users);

        }

        res.end(jsonString);
    });





}

function GetUser(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, users);

        }

        res.end(jsonString);
    });








}

function DeleteUser(req,res){


    logger.debug("DVP-UserService.DeleteUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOneAndRemove({username: req.params.name,company: company, tenant: tenant}, function(err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Delete User Failed, user object is null", false, undefined);



        }

        res.end(jsonString);


    });





}

function CreateUser(req, res){

    logger.debug("DVP-UserService.CreateUser Internal method ");



    var user = User({


        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        phoneNumber: {contact:req.body.phone, type: "phone", verified: false},
        email:{contact:req.body.mail, type: "phone", verified: false},
        company: parseInt(req.user.company),
        tenant: parseInt(req.user.tenant),
        created_at: Date.now(),
        updated_at: Date.now()

    });


    var jsonString = messageFormatter.FormatMessage(undefined, "User saved successfully", true, user);
    user.save(function(err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "User save failed", false, undefined);


        }

        res.end(jsonString);

    });




}

function UpdateUser(req, res){



    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, req.body, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Update User Successful", true, users);

        }

        res.end(jsonString);
    });





}

function GetUserProfile(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{


            var profile = {};
            profile.name = users.name;
            profile.phoneNumber = users.phoneNumber;
            profile.email = users.email;
            profile.company = users.company;
            profile.tenant = users.tenant;
            profile.contacts = users.contacts;


            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, users);

        }

        res.end(jsonString);
    });


}

function UpdateUserProfile(req, res) {

    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    if (req.body.name) {

        delete req.body.name;
    }

    if (req.body.password) {

        delete req.body.password;

    }

    if (req.body.company) {

        delete req.body.company;

    }


    if (req.body.contacts) {

        delete req.body.contacts;

    }

    if (req.body.contacts) {

        delete req.body.contacts;

    }


    if (req.body.user_meta) {

        delete req.body.user_meta;

    }

    if (req.body.app_meta) {

        delete req.body.app_meta;

    }


    if (req.body.user_scopes) {

        delete req.body.user_scopes;

    }


    if (req.body.client_scopes) {

        delete req.body.client_scopes;

    }


    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, req.body, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User Successful", true, users);

        }

        res.end(jsonString);
    });

}

function AddUserScopes(req, res){



    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //Show.update({ "_id": showId },{ "$push": { "episodes": episodeData } },callback)
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$push": { "user_scopes": req.body } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, users);

        }

        res.end(jsonString);


    });




}

function RemoveUserScopes(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pullAll": { "user_scopes": [{"scope":req.params.scope}] } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, users);

        }

        res.end(jsonString);


    });

}

function AddUserAppScopes(req, res){



    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //Show.update({ "_id": showId },{ "$push": { "episodes": episodeData } },callback)
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$push": { "client_scopes": req.body } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update client scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update client scope successfully", false, users);

        }

        res.end(jsonString);


    });




}

function RemoveUserAppScopes(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pullAll": { "client_scopes": [{"menuItem":req.params.scope}] } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, users);

        }

        res.end(jsonString);


    });

}

function GetUserMeta(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, users.user_meta);

        }

        res.end(jsonString);
    });








}

function GetAppMeta(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, users.app_meta);

        }

        res.end(jsonString);
    });








}

function UpdateUserMetadata(req, res){



    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { "user_meta" : req.body }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user meta Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Update user meta Successful", true, users);

        }

        res.end(jsonString);
    });





}

function UpdateAppMetadata(req, res){



    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { "app_meta" : req.body }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update app meta Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Update app meta Successful", true, users);

        }

        res.end(jsonString);
    });





}

function GetUserScopes(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User scope Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User scope Successful", true, users.user_scopes);

        }

        res.end(jsonString);
    });








}

function GetAppScopes(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User app scope Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User app scope Successful", true, users.client_scopes);

        }

        res.end(jsonString);
    });








}



module.exports.GetUser = GetUser;
module.exports.GetUsers = GetUsers;
module.exports.DeleteUser = DeleteUser;
module.exports.CreateUser = CreateUser;
module.exports.UpdateUser = UpdateUser;
module.exports.GetUserProfile = GetUserProfile;
module.exports.UpdateUserProfile = UpdateUserProfile;
module.exports.AddUserScopes = AddUserScopes;
module.exports.RemoveUserScopes = RemoveUserScopes;
module.exports.AddUserAppScopes = AddUserAppScopes;
module.exports.RemoveUserAppScopes =RemoveUserAppScopes;
module.exports.GetUserMeta =GetUserMeta;
module.exports.GetAppMeta =GetAppMeta;
module.exports.UpdateUserMetadata = UpdateUserMetadata;
module.exports.UpdateAppMetadata = UpdateAppMetadata;
module.exports.GetUserScopes = GetUserScopes;
module.exports.GetAppScopes = GetAppScopes;
