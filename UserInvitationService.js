var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('dvp-mongomodels/model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var UserInvitation = require('dvp-mongomodels/model/UserInvitation').UserInvitation;
var UserAccount = require('dvp-mongomodels/model/UserAccount');
var PublishToQueue = require('./Worker').PublishToQueue;


function GetInvitation(req, res){


    logger.debug("DVP-UserService.GetInvitation Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    var user = req.user.iss;


    UserInvitation.findOne({company: company, tenant: tenant, _id:  ObjectId(req.params.id)}, function(err, invitations) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get invitation Failed", false, undefined);

        }else {

            if (usergroups) {


                jsonString = messageFormatter.FormatMessage(err, "Get invitation Successful", true, invitations);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No invitations Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function GetMyReceivedInvitations(req, res){


    logger.debug("DVP-UserService.GetMyReceivedInvitations Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    var user = req.user.iss;
    //
    // User.findOne({
    //     username: user,
    //     company: company,
    //     tenant: tenant
    // }, function (err, user) {
    //
    // });

    UserInvitation.find({company: company, tenant: tenant, to:  user, status: 'pending'}, function(err, invitations) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get My invitations Failed", false, undefined);

        }else {

            if (usergroups) {


                jsonString = messageFormatter.FormatMessage(err, "Get My invitations Successful", true, invitations);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No invitations Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function GetMySendInvitations(req, res){


    logger.debug("DVP-UserService.GetMyFromInvitations Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    var user = req.user.iss;


    UserInvitation.find({company: company, tenant: tenant, from:  user}, function(err, invitations) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get My invitations Failed", false, undefined);

        }else {

            if (usergroups) {


                jsonString = messageFormatter.FormatMessage(err, "Get My invitations Successful", true, invitations);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No invitations Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function CreateInvitation(req, res) {

    logger.debug("DVP-UserService.GetMyFromInvitations Internal method ");
    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var from = req.user.iss;
    var to = req.params.to;
    var message = "";
    if(req.body && req.body.message){
        message = req.body.message;
    }

    User.findOne({
        username: to,
        company: company,
        tenant: tenant
    }, function (err, user) {

        if(err){

            jsonString = messageFormatter.FormatMessage(err, "User Invitation failed due to no user found", true, undefined);
            res.end(jsonString);


        }else {

            if (user && user.allow_invitation === true) {

                var invitation = UserInvitation({
                    to: to,
                    from: from,

                    status: 'pending',
                    company: company,
                    tenant: tenant,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    message: message,
                });

                invitation.save(function (err, invitation) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "User Invitation save failed", false, undefined);
                        res.end(jsonString);
                    } else {


                        var userAccount = UserAccount({
                            active: true,
                            verified: false,
                            userref: user._id,
                            user: to,
                            tenant: tenant,
                            company: company,
                            created_at: Date.now(),
                            updated_at: Date.now(),
                            multi_login: false
                        });

                        userAccount.save(function (err, account) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(new Error("Account creation failed"), "User Invitation failed due to no user found", true, undefined);
                                res.end(jsonString);
                            } else {



                                var sendObj = {
                                    "company": 0,
                                    "tenant": 1
                                };

                                sendObj.to =  to;
                                sendObj.from = "no-reply";
                                sendObj.template = "By-User Invitation received";
                                sendObj.Parameters = {username: to, owner: from, created_at: new Date()};

                                PublishToQueue("EMAILOUT", sendObj);

                                jsonString = messageFormatter.FormatMessage(undefined, "User Invitation saved successfully", true, invitation);
                                res.end(jsonString);
                            }
                        });
                    }
                });
            } else {

                jsonString = messageFormatter.FormatMessage(new Error("No user found"), "User Invitation failed due to no user found", true, undefined);
                res.end(jsonString);
            }
        }

    });

}

function AcceptUserInvitation(req, res) {


    logger.debug("DVP-UserService.AcceptUserInvitation Internal method ");

    var company = parseInt(req.params.company);
    var tenant = parseInt(req.params.tenant);
    var to = req.user.iss;
    var jsonString;

    req.body.updated_at = Date.now();
    UserInvitation.findOneAndUpdate({
        _id: ObjectId(req.params.id),
        company: company,
        tenant: tenant,
        to: to,
        status: "pending"
    }, {status: "accepted", update_at: Date.now()}, function (err, invitation) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Invitation Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (invitation) {
                UserAccount.findOneAndUpdate({company: company, tenant: tenant, user: to}, {
                    verified: true,
                    joined: Date.now(),
                    update_at: Date.now()
                }, function (err, rUser) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Update User Invitation failed", false, undefined);
                        res.end(jsonString);

                    } else {

                        jsonString = messageFormatter.FormatMessage(undefined, "Update User Invitation Successful", true, invitation);
                        res.end(jsonString);
                    }

                });
            }
            else {

                jsonString = messageFormatter.FormatMessage(new Error("No invitation found"), "Update User Invitation failed", false, undefined);
                res.end(jsonString);
            }

        }
    });

}

function RejectUserInvitation(req, res){


    logger.debug("DVP-UserService.AcceptUserInvitation Internal method ");

    var company = parseInt(req.params.company);
    var tenant = parseInt(req.params.tenant);
    var to = req.user.iss;
    var jsonString;

    req.body.updated_at = Date.now();
    UserInvitation.findOneAndUpdate({_id: ObjectId(req.params.id),company: company, tenant: tenant, to: to, status: "pending"}, {status: "rejected", update_at: Date.now()}, function(err, invitation) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Invitation Failed", false, undefined);

        }else {

            if (invitation) {
                //jsonString = messageFormatter.FormatMessage(undefined, "Update User Invitation Successful", true, invitation);
                UserAccount.findOneAndUpdate({company: company, tenant: tenant, user: to}, {
                    active: false,
                    update_at: Date.now()
                }, function (err, account) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Update User Invitation failed", false, undefined);
                        res.end(jsonString);

                    } else {

                        jsonString = messageFormatter.FormatMessage(undefined, "Update User Invitation Successful", true, invitation);
                        res.end(jsonString);
                    }

                });
            } else {

                jsonString = messageFormatter.FormatMessage(new Error("No invitation found"), "Update User Invitation failed", false, undefined);
                res.end(jsonString);
            }

        }

        res.end(jsonString);
    });

}

function CancelUserInvitation(req, res){


    logger.debug("DVP-UserService.AcceptUserInvitation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var from = req.user.iss;
    var jsonString;

    req.body.updated_at = Date.now();
    UserInvitation.findOneAndUpdate({_id: ObjectId(req.params.id),company: company, tenant: tenant, from: from, status: 'pending'}, {status: "canceled", update_at: Date.now()}, function(err, invitation) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User Invitation Failed", false, undefined);
            res.end(jsonString);

        }else{

            if(invitation){

                var to = invitation.to;
                //jsonString = messageFormatter.FormatMessage(undefined, "Update User Invitation Successful", true, invitation);
                UserAccount.findOneAndUpdate({ company: company, tenant: tenant, user: to}, {varified:false, active: false, update_at: Date.now()}, function (err, account) {
                    if(err){

                        jsonString = messageFormatter.FormatMessage(err, "Update User Invitation failed", false, undefined);
                        res.end(jsonString);

                    }else{

                        jsonString = messageFormatter.FormatMessage(undefined, "Update User Invitation Successful", true, invitation);
                        res.end(jsonString);
                    }

                });

            }else{

                jsonString = messageFormatter.FormatMessage(new Error("No invitation found"), "Update User Invitation failed", false, undefined);
                res.end(jsonString);
            }


        }

    });

}




module.exports.GetMyReceivedInvitations = GetMyReceivedInvitations;
module.exports.GetMySendInvitations = GetMySendInvitations;
module.exports.CreateInvitation = CreateInvitation;
module.exports.AcceptUserInvitation = AcceptUserInvitation;
module.exports.RejectUserInvitation = RejectUserInvitation;
module.exports.CancelUserInvitation = CancelUserInvitation;
module.exports.GetInvitation = GetInvitation;



