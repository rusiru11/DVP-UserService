var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('./model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

function GetUsers(req, res){


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.find({}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, users);

        }

        res.end(jsonString);
    });





}


function GetUser(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.params.name}, function(err, users) {
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
    User.findOne({username: req.params.name}, function(err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        }else{

           if(user) {

               user.remove(function (err) {
                   if (err) {

                       jsonString = messageFormatter.FormatMessage(err, "Delete User Failed", false, undefined);

                   }

                   else {

                       jsonString = messageFormatter.FormatMessage(undefined, "User successfully deleted", true, undefined);
                   }

                   res.end(jsonString);

               });
           }else{

               jsonString = messageFormatter.FormatMessage(undefined, "Delete User Failed, user object is null", false, undefined);
               res.end(jsonString);
           }

        }


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
        user_meta: {},
        app_meta: {},
        company: parseInt(req.user.company),
        tenant: parseInt(req.user.tenant),
        user_scopes: {},
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
    User.findOneAndUpdate({username: req.params.name}, req.body, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Update User Successful", true, users);

        }

        res.end(jsonString);
    });





}


module.exports.GetUser = GetUser;
module.exports.GetUsers = GetUsers;
module.exports.DeleteUser = DeleteUser;
module.exports.CreateUser = CreateUser;
module.exports.UpdateUser = UpdateUser;
