/**
 * Created by a on 6/26/2016.
 */
var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var ExternalUser = require('./model/ExternalUser');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var regex = require('regex');



function GetExternalUsers(req, res){


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    ExternalUser.find({company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get External Users Failed", false, undefined);

        }else {

            if (users) {


                jsonString = messageFormatter.FormatMessage(err, "Get Users Successful", true, users);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No External Users Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function GetExternalUser(req, res){


    logger.debug("DVP-UserService.GetExternalUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    ExternalUser.findOne({id: req.params.id,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get External User Failed", false, undefined);

        }else{

            if(users) {
                var userObj;
                jsonString = messageFormatter.FormatMessage(err, "Get External User Successful", true, users);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No external user found", false, undefined);

            }

        }

        res.end(jsonString);
    });

}

function DeleteExternalUser(req,res){


    logger.debug("DVP-UserService.DeleteExternalUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    ExternalUser.findOneAndRemove({id: req.params.id,company: company, tenant: tenant}, function(err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get External User Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(undefined, "Delete External User Success", true, undefined);
        }
        res.end(jsonString);
    });
}

function CreateExternalUser(req, res) {

    logger.debug("DVP-UserService.CreateUser Internal method ");
    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);

    var user = User({
        title: req.body.title,
        name: req.body.name,
        avatar: req.body.avatar,
        birthday: req.body.birthday,
        gender: req.body.gender,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        locale: req.body.locale,
        ssn: req.body.ssn,
        address: {
            zipcode: req.body.address.zipcode,
            number: req.body.address.number,
            street: req.body.address.street,
            city: req.body.address.city,
            province: req.body.address.province,
            country: req.body.address.country,


        },


        phoneNumber: {contact: req.body.phone, type: "phone", verified: false},
        email: {contact: req.body.mail, type: "phone", verified: false},
        company: parseInt(req.user.company),
        tenant: parseInt(req.user.tenant),
        user_meta: {role: userRole},
        created_at: Date.now(),
        updated_at: Date.now()
    });


    ExternalUser.save(function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "User save failed", false, undefined);
            res.end(jsonString);
        } else {


            jsonString = messageFormatter.FormatMessage(undefined, "User saved successfully", true, user);
            res.end(jsonString);
        }
    });
}

function UpdateExternalUser(req, res){


    logger.debug("DVP-UserService.UpdateExternalUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    ExternalUser.findOneAndUpdate({id: req.params.id,company: company, tenant: tenant}, req.body, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update External User Failed", false, undefined);

        }else{

            jsonString = messageFormatter.FormatMessage(err, "Update External User Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function GetExternalUserProfileByContact(req, res){


    logger.debug("DVP-UserService.GetExternalUserProfileByContact Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var category = req.params.category;
    var contact = req.params.contact;
    var jsonString;

    var queryObject = {company: company, tenant: tenant};
    queryObject[category+".contact"] = contact
    ExternalUser.find(queryObject, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get External Users Failed", false, undefined);

        }else{

            var userObjectArray = [];
            if(users) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get External User Successful", true, users);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No External User Found", false, undefined);

            }

        }

        res.end(jsonString);
    });


}

function GetExternalUserProfileBySSN(req, res){


    logger.debug("DVP-UserService.GetExternalUserProfileByContact Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var ssn = req.params.ssn;
    var jsonString;

    var queryObject = {ssn:ssn, company: company, tenant: tenant};

    ExternalUser.find(queryObject, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get External Users Failed", false, undefined);

        }else{

            var userObjectArray = [];
            if(users) {

                jsonString = messageFormatter.FormatMessage(undefined, "Get External User Successful", true, users);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No External User Found", false, undefined);

            }

        }

        res.end(jsonString);
    });


}



//{name: new RegExp('^'+name+'$', "i")}

function GetExternalUserProfileByField(req, res){


    logger.debug("DVP-UserService.GetExternalUserProfileByContact Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var field = req.params.field;
    var value = req.params.value;
    var jsonString;

    var queryObject = {company: company, tenant: tenant};

    var likeval = new RegExp('^'+value+'$', "i");
    queryObject[field] = likeval;

    ExternalUser.find(queryObject, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get External Users Failed", false, undefined);

        }else{

            var userObjectArray = [];
            if(users) {

                jsonString = messageFormatter.FormatMessage(undefined, "Get External User Successful", true, users);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No External User Found", false, undefined);

            }

        }
        res.end(jsonString);
    });
}

function UpdateExternalUserProfileContact(req, res) {

    logger.debug("DVP-UserService.UpdateExternalUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    ExternalUser.findOneAndUpdate({id: req.params.id,company: company, tenant: tenant}, { $addToSet :{contacts : {contact:req.params.contact, type:req.body.type, verified: false}}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update External user contact Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(undefined, "Update External User contact Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function UpdateExternalUserProfileEmail(req, res) {

    logger.debug("DVP-UserService.UpdateExternalUserProfileEmail Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    ExternalUser.findOneAndUpdate({id: req.params.id,company: company, tenant: tenant}, { email : {contact:req.params.email, type:"email", verified: false}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User email Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User email Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function RemoveExternalUserProfileContact(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    ExternalUser.findOneAndUpdate({id: req.params.id,company: company, tenant: tenant},{ $pull: { 'contacts': {'contact':req.params.contact} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Remove External User Contact Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Remove External User Contact successfully", false, undefined);

        }

        res.end(jsonString);


    });

}

function UpdateExternalUserProfilePhone(req, res) {

    logger.debug("DVP-UserService.UpdateExternalUserPhone Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    ExternalUser.findOneAndUpdate({id: req.params.id,company: company, tenant: tenant}, { phoneNumber : {contact:req.params.phone, type:"voice", verified: false}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update External User phone number Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update External User phone number Successful", true, undefined);

        }

        res.end(jsonString);
    });

}


module.exports.GetExternalUsers = GetExternalUsers;
module.exports.GetExternalUser = GetExternalUser;
module.exports.DeleteExternalUser = DeleteExternalUser;
module.exports.CreateExternalUser = CreateExternalUser;
module.exports.UpdateExternalUser = UpdateExternalUser;
module.exports.GetExternalUserProfileByContact = GetExternalUserProfileByContact;
module.exports.GetExternalUserProfileByField = GetExternalUserProfileByField;
module.exports.UpdateExternalUserProfileContact = UpdateExternalUserProfileContact;
module.exports.UpdateExternalUserProfileEmail = UpdateExternalUserProfileEmail;
module.exports.RemoveExternalUserProfileContact =RemoveExternalUserProfileContact;
module.exports.UpdateExternalUserProfilePhone = UpdateExternalUserProfilePhone;
module.exports.GetExternalUserProfileBySSN = GetExternalUserProfileBySSN;