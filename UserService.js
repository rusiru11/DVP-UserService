var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('./model/User');
var Org = require('./model/Organisation');
var VPackage = require('./model/Package');
var Console = require('./model/Console');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');



function GetUsers(req, res){


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.find({company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Users Failed", false, undefined);

        }else{

            if(users){

                if (users.password) {

                    delete req.body.password;
                }

            }

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

            jsonString = messageFormatter.FormatMessage(err, "Update User Successful", true, undefined);

        }

        res.end(jsonString);
    });





}




function GetMyrProfile(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.user.iss,company: company, tenant: tenant}, function(err, users) {
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

            jsonString = messageFormatter.FormatMessage(err, "Update User Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function UpdateUserProfileEmail(req, res) {

    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { email : {contact:req.params.email, type:"email", verified: false}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User email Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User email Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function UpdateUserProfileContact(req, res) {

    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { $addToSet :{contacts : {contact:req.params.contact, type:req.body.type, verified: false}}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User phone number Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User phone number Successful", true, users);

        }

        res.end(jsonString);
    });

}



function RemoveUserProfileContact(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ $pull: { 'contacts': {'contact':req.params.contact} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, undefined);

        }

        res.end(jsonString);


    });

}


function UpdateUserProfilePhone(req, res) {

    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { phoneNumber : {contact:req.params.email, type:"voice", verified: false}}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User phone number Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User phone number Successful", true, undefined);

        }

        res.end(jsonString);
    });

}

function FilterObjFromArray(itemArray, field, value){
    var resultObj;
    for(var i in itemArray){
        var item = itemArray[i];
        if(item[field] == value){
            resultObj = item;
            break;
        }
    }
    return resultObj;
}

function UniqueArray(array) {
    var processed = [];
    for (var i=array.length-1; i>=0; i--) {
        if (array[i]!= null) {
            if (processed.indexOf(array[i])<0) {
                processed.push(array[i]);
            } else {
                array.splice(i, 1);
            }
        }
    }
    return array;
}

function UniqueObjectArray(array, field) {
    var processed = [];
    for (var i=array.length-1; i>=0; i--) {
        if (processed.indexOf(array[i][field])<0) {
            processed.push(array[i][field]);
        } else {
            array.splice(i, 1);
        }
    }
    return array;
}

function AddUserScopes(req, res){
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var adminUserName = req.user.iss;
    var jsonString;

    Org.findOne({tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Validate Organisation Failed", false, undefined);
            res.end(jsonString);
        }else{
            VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Validate Package Failed", false, undefined);
                    res.end(jsonString);
                }else{

                    User.findOne({username: adminUserName,company: company, tenant: tenant}, function(err, adminUser) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Validate Admin User Failed", false, undefined);
                            res.end(jsonString);
                        } else {
                            User.findOne({username: req.params.assignUserName,company: company, tenant: tenant}, function(err, assignUser) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Validate Assigning User Failed", false, undefined);
                                    res.end(jsonString);
                                } else {
                                    if(adminUser && adminUser.user_meta.role != undefined && adminUser.user_meta.role == "admin"){

                                        /*
                                        assignUser.user_scopes.push(req.body);
                                        assignUser.user_scopes = UniqueObjectArray(assignUser.user_scopes,"scope");
                                        User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},assignUser, function(err, rUsers) {
                                            if (err) {
                                                jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);
                                            }else{
                                                jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, undefined);
                                            }
                                            res.end(jsonString);
                                        });

                                        */



                                        User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ $addToSet :{user_scopes : req.body}}, function(err, rUsers) {
                                            if (err) {
                                                jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);
                                            }else{
                                                jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", true, undefined);
                                            }
                                            res.end(jsonString);
                                        });


                                        //{ $addToSet :{user_scopes : req.body}}





                                    }else{
                                        jsonString = messageFormatter.FormatMessage(err, "Access Denied, No admin permissions", false, undefined);
                                        res.end(jsonString);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });


    //Show.update({ "_id": showId },{ "$push": { "episodes": episodeData } },callback)





}

function RemoveUserScopes(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pull": { "user_scopes": {"scope":req.params.scope} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, undefined);

        }

        res.end(jsonString);


    });

}

function AddUserAppScopes(req, res){
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var adminUserName = req.user.iss;
    var jsonString;
    Org.findOne({tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Validate Organisation Failed", false, undefined);
            res.end(jsonString);
        }else{
            VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Validate Package Failed", false, undefined);
                    res.end(jsonString);
                }else{
                    Console.findOne({consoleName: req.params.consoleName}, function(err, appConsole) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Validate Console Failed", false, undefined);
                            res.end(jsonString);
                        }else{
                            User.findOne({username: adminUserName, company:company, tenant: tenant}, function(err, adminUser) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Validate Admin User Failed", false, undefined);
                                    res.end(jsonString);
                                } else {
                                    User.findOne({username: req.params.username,company: company, tenant: tenant}, function(err, assignUser) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Validate Assigning User Failed", false, undefined);
                                            res.end(jsonString);
                                        } else {
                                            if(adminUser && adminUser.user_meta.role != undefined && adminUser.user_meta.role == "admin"){
                                                if(appConsole.consoleUserRoles.indexOf(assignUser.user_meta.role) > -1){
                                                    var consoleAccessLimitObj = FilterObjFromArray(org.consoleAccessLimits,"accessType",assignUser.user_meta.role);
                                                    //if(consoleAccessLimitObj && (consoleAccessLimitObj.currentAccess.indexOf(assignUser.username) > -1 || consoleAccessLimitObj.accessLimit > consoleAccessLimitObj.currentAccess.length)){
                                                    if(consoleAccessLimitObj) {
                                                        var consoleScope = FilterObjFromArray(assignUser.client_scopes,"consoleName",appConsole.consoleName);
                                                        if(consoleScope){
                                                            consoleScope.menus.push(req.body);
                                                            consoleScope.menus = UniqueObjectArray(consoleScope.menus, "menuItem");
                                                        }else{
                                                            assignUser.client_scopes.push({consoleName: appConsole.consoleName, menus: [req.body]});
                                                        }
                                                        User.findOneAndUpdate({
                                                            username: req.params.username,
                                                            company: company,
                                                            tenant: tenant
                                                        }, assignUser, function (err, rUser) {
                                                            if (err) {
                                                                jsonString = messageFormatter.FormatMessage(err, "Update client scope Failed", false, undefined);
                                                            } else {
                                                                jsonString = messageFormatter.FormatMessage(undefined, "Update client scope successfully", false, undefined);
                                                                consoleAccessLimitObj.currentAccess.push(assignUser.username);
                                                                consoleAccessLimitObj.currentAccess = UniqueArray(consoleAccessLimitObj.currentAccess);
                                                                Org.findOneAndUpdate({
                                                                    tenant: tenant,
                                                                    id: company
                                                                }, org, function (err, rOrg) {
                                                                    if (err) {
                                                                        jsonString = messageFormatter.FormatMessage(err, "Update client scope Failed", false, undefined);
                                                                    } else {
                                                                        jsonString = messageFormatter.FormatMessage(undefined, "Update client scope successfully", false, undefined);
                                                                    }
                                                                    console.log(jsonString);
                                                                });
                                                            }
                                                            res.end(jsonString);
                                                        });
                                                    }else{
                                                        //jsonString = messageFormatter.FormatMessage(err, "Access Denied, Console Access Limit Exceeded", false, undefined);
                                                        jsonString = messageFormatter.FormatMessage(err, "Access Denied, No Console Access Limit Found", false, undefined);
                                                        res.end(jsonString);
                                                    }
                                                }else{
                                                    jsonString = messageFormatter.FormatMessage(err, "Access Denied, No user permissions", false, undefined);
                                                    res.end(jsonString);
                                                }
                                            }else{
                                                jsonString = messageFormatter.FormatMessage(err, "Access Denied, No admin permissions", false, undefined);
                                                res.end(jsonString);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function RemoveUserAppScopes(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pull": { "client_scopes": {"menuItem":req.params.scope} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update user scope Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update user scope successfully", false, undefined);

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

            jsonString = messageFormatter.FormatMessage(err, "Update user meta Successful", true, undefined);

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

            jsonString = messageFormatter.FormatMessage(err, "Update app meta Successful", true, undefined);

        }

        res.end(jsonString);
    });





}

function RemoveUserMetadata(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pull": { "user_meta": {"scope":req.params.usermeta} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Remove user meta Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Remove user meta successfully", false, undefined);

        }

        res.end(jsonString);


    });

}

function RemoveAppMetadata(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "$pull": { "app_meta": {"scope":req.params.appmeta} } }, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update app meta Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update app meta successfully", false, undefined);

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
module.exports.RemoveUserMetadata = RemoveUserMetadata;
module.exports.RemoveAppMetadata= RemoveAppMetadata;
module.exports.UpdateUserProfileEmail = UpdateUserProfileEmail;
module.exports.UpdateUserProfilePhone = UpdateUserProfilePhone;
module.exports.UpdateUserProfileContact = UpdateUserProfileContact;
module.exports.RemoveUserProfileContact = RemoveUserProfileContact;
module.exports.GetMyrProfile = GetMyrProfile;

