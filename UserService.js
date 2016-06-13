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








            var userObjectArray = [];
            users.forEach(function(user){

                var userObj;

                userObj = user.toJSON();
                if (userObj.password) {

                    delete userObj.password;
                    userObjectArray.push(userObj);
                }
            });

            jsonString = messageFormatter.FormatMessage(err, "Get Users Successful", true, userObjectArray);

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

            var userObj;

            userObj = users.toJSON();

            if(userObj){

                if (userObj.password) {

                    delete userObj.password;
                }

            }




            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, userObj);

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
            Org.findOne({tenant: tenant, id: company}, function(err, org) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
                    console.log(jsonString);
                } else {
                    var limitObj = FilterObjFromArray(org.consoleAccessLimits, "accessType", user.user_meta.role);
                    var userIndex = limitObj.currentAccess.indexOf(user.username);
                    if(userIndex > -1){
                        limitObj.currentAccess.splice(userIndex,1);
                        Org.findOneAndUpdate({id: company, tenant: tenant},org, function(err, rOrg) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Update Console Access Limit Failed", false, undefined);
                                console.log(jsonString);
                            } else {
                                jsonString = messageFormatter.FormatMessage(err, "Update Console Access Limit Success", true, undefined);
                                console.log(jsonString);
                            }
                        });
                    }
                }
            });
            jsonString = messageFormatter.FormatMessage(undefined, "Delete User Success", true, undefined);
        }
        res.end(jsonString);
    });





}

function CreateUser(req, res){

    logger.debug("DVP-UserService.CreateUser Internal method ");
    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    Org.findOne({tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
            res.end(jsonString);
        }else{
            if(org){
                if(req.body.role){
                    var userRole = req.body.role.toLowerCase();
                    var limitObj = FilterObjFromArray(org.consoleAccessLimits, "accessType", userRole);
                    if(limitObj){
                        if(limitObj.accessLimit > limitObj.currentAccess.length){

                            if(!req.body.address)
                            {
                                req.body.address = {};
                            }


                            var user = User({
                                name: req.body.name,
                                avatar: req.body.avatar,
                                birthday: req.body.birthday,
                                gender: req.body.gender,
                                firstname: req.body.firstname,
                                lastname: req.body.lastname,
                                locale: req.body.locale,
                                ssn: req.body.ssn,
                                address:{
                                    zipcode: req.body.address.zipcode,
                                    number: req.body.address.number,
                                    street: req.body.address.street,
                                    city: req.body.address.city,
                                    province: req.body.address.province,
                                    country: req.body.address.country,


                                },
                                username: req.body.username,
                                password: req.body.password,
                                phoneNumber: {contact:req.body.phone, type: "phone", verified: false},
                                email:{contact:req.body.mail, type: "phone", verified: false},
                                company: parseInt(req.user.company),
                                tenant: parseInt(req.user.tenant),
                                user_meta: {role: userRole},
                                created_at: Date.now(),
                                updated_at: Date.now()
                            });





                            user.save(function(err, user) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "User save failed", false, undefined);
                                    res.end(jsonString);
                                }else{
                                    /*Org.findOneAndUpdate({company: company, tenant: tenant},{$filter: {input: "$consoleAccessLimits", as: "consoleAccessLimit", cond: { $eq: [ "$$consoleAccessLimit.accessType", userRole] }}, $addToSet :{$consoleAccessLimit : user.username}}, function(err, rUsers) {
                                        if (err) {
                                            user.remove(function (err) {});
                                            jsonString = messageFormatter.FormatMessage(err, "Update Limit Failed, Rollback User Creation", false, undefined);
                                        }else{
                                            jsonString = messageFormatter.FormatMessage(undefined, "User saved successfully", true, user);
                                        }
                                        res.end(jsonString);
                                    });*/

                                    limitObj.currentAccess.push(user.username);
                                    Org.findOneAndUpdate({id: company, tenant: tenant},org, function(err, rOrg) {
                                        if (err) {
                                            user.remove(function (err) {});
                                            jsonString = messageFormatter.FormatMessage(err, "Update Limit Failed, Rollback User Creation", false, undefined);
                                        }else{
                                            jsonString = messageFormatter.FormatMessage(undefined, "User saved successfully", true, user);
                                        }
                                        res.end(jsonString);
                                    });
                                }
                            });
                        }else{
                            jsonString = messageFormatter.FormatMessage(err, "User Limit Exceeded", false, undefined);
                            res.end(jsonString);
                        }
                    }else{
                        jsonString = messageFormatter.FormatMessage(err, "Invalid User Role", false, undefined);
                        res.end(jsonString);
                    }
                }else{
                    jsonString = messageFormatter.FormatMessage(err, "No User Role Found", false, undefined);
                    res.end(jsonString);
                }
            }else{
                jsonString = messageFormatter.FormatMessage(err, "Organisation Data NotFound", false, undefined);
                res.end(jsonString);
            }
        }
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




            var userObj;

            userObj = users.toJSON();

            if (userObj.password) {

                delete userObj.password;
            }





            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, userObj);

        }

        res.end(jsonString);
    });


}

function GetUserProfileByResourceId(req, res){


    logger.debug("DVP-UserService.GetUserProfileByResourceId Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;



    User.findOne({resourceid: req.params.resourceid ,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{



            var userObj = users.toJSON();

            if(userObj){

                if (userObj.password) {

                    delete userObj.password;
                }

            }



            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, userObj);

        }

        res.end(jsonString);
    });


}

function GetUserProfileByContact(req, res){


    logger.debug("DVP-UserService.GetUsers Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var category = req.params.category;
    var contact = req.params.contact;
    var jsonString;

    var queryObject = {company: company, tenant: tenant};
    queryObject[category+".contact"] = contact
    User.find(queryObject, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{



            var userObjectArray = [];
            users.forEach(function(user){

                var userObj;

                userObj = user.toJSON();
                if (userObj.password) {

                    delete userObj.password;
                    userObjectArray.push(userObj);
                }
            });



            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, userObjectArray);

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



            var userObj = users.toJSON();

            if(userObj){

                if (userObj.password) {

                    delete userObj.password;
                }

            }


            jsonString = messageFormatter.FormatMessage(undefined, "Get User Successful", true, userObj);

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






function GetARDSFriendlyContactObject(req,res){


    logger.debug("DVP-UserService.GetARDSFriendlyContactObject Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var contact = req.params.contact;
    var jsonString;
    User.findOne({username: req.params.name,company: company, tenant: tenant}, function(err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);

        }else{



            var contactObj = {};

            /*

             {"ContactName": "bob","Domain": "159.203.160.47","Extention":2002,"ContactType": "PRIVATE"}


             var contactSchema = new Schema({
             contact:String,
             type:String,
             display: String,
             verified: Boolean
             }, {_id: false});



             */


            ////////////////////////////////////////////
            if(users) {


                var contactinfo = users[contact];

                if(!contactinfo){

                }


                if(contactinfo){


                    if(contactinfo.display) {
                        contactObj.ContactName = contactinfo.display;
                    }else{

                        contactObj.ContactName = contactinfo.contact;

                    }

                    var infoArr = contactinfo.contact.split("@");
                    if(infoArr.length > 1){

                        contactObj.Extention = infoArr[0];
                        contactObj.Domain =  infoArr[1];
                    }else{

                        contactObj.Extention = contactinfo.contact;
                    }

                    contactObj.type = "PUBLIC";


                    if(contact == "veeryaccount")
                        contactObj.type = "PRIVATE";

                }


            }

            ///////////////////////////////////////////

            jsonString = messageFormatter.FormatMessage(err, "Get User Successful", true, contactObj);

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

            jsonString = messageFormatter.FormatMessage(err, "Remove contact Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Remove contact successfully", false, undefined);

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

function SetUserProfileResoureId(req, res){

    logger.debug("DVP-UserService.UpdateUser Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    req.body.updated_at = Date.now();
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant}, { resourceid : req.params.resourceid}, function (err, users) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Update User resource id Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(err, "Update User resource id Successful", true, undefined);

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
            User.findOne({username: adminUserName,company: company, tenant: tenant}, function(err, adminUser) {
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
                                                var userScope = FilterObjFromArray(assignUser.user_scopes, "scope", req.body.menuAction.scope);
                                                var consoleScope = FilterObjFromArray(assignUser.client_scopes,"consoleName",appConsole.consoleName);
                                                if(consoleScope){
                                                    consoleScope.menus.push(req.body);
                                                    consoleScope.menus = UniqueObjectArray(consoleScope.menus, "menuItem");
                                                }else{
                                                    assignUser.client_scopes.push({consoleName: appConsole.consoleName, menus: [req.body]});
                                                }
                                                if(userScope){
                                                    if(userScope.read == false && req.body.menuAction.read == true){
                                                        userScope.read = true;
                                                    }
                                                    if(userScope.write == false && req.body.menuAction.write == true){
                                                        userScope.write = true;
                                                    }
                                                    if(userScope.delete == false && req.body.menuAction.delete == true){
                                                        userScope.delete = true;
                                                    }
                                                }else{
                                                    assignUser.user_scopes.push(req.body.menuAction);
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

function RemoveUserAppScopes(req, res){

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var adminUserName = req.user.iss;
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOne({username: adminUserName, company:company, tenant: tenant}, function(err, adminUser) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Validate Admin User Failed", false, undefined);
            res.end(jsonString);
        } else {
            User.findOne({
                $and: [{"client_scopes.consoleName": req.params.consoleName}, {
                    username: req.params.username,
                    company: company,
                    tenant: tenant
                }]
            }, function (err, user) {
                if(err){
                    jsonString = messageFormatter.FormatMessage(err, "Validate Assigned User Failed", false, undefined);
                    res.end(jsonString);
                }else {
                    if(adminUser && adminUser.user_meta.role != undefined && adminUser.user_meta.role == "admin") {
                        for (var i in user.client_scopes) {
                            var cScope = user.client_scopes[i];
                            if (cScope.consoleName == req.params.consoleName) {
                                for (var j in cScope.menus) {
                                    var menu = cScope.menus[j];
                                    if (menu.menuItem == req.params.navigation) {
                                        cScope.menus.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        User.findOneAndUpdate({
                            $and: [{"client_scopes.consoleName": req.params.consoleName}, {
                                username: req.params.username,
                                company: company,
                                tenant: tenant
                            }]
                        }, user, function (err, users) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Remove Navigation scope Failed", false, undefined);
                            } else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Remove Navigation successfull", false, undefined);
                            }
                            res.end(jsonString);
                        });
                    }else {
                        jsonString = messageFormatter.FormatMessage(err, "Access Denied, No admin permissions", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
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
    var metakey = req.params.usermeta;
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "user_meta" : {} }, function(err, users) {
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
    var metakey = req.params.appmeta;
    var jsonString;

    //{ $pullAll : { 'comments' : [{'approved' : 1}, {'approved' : 0}] } });
    User.findOneAndUpdate({username: req.params.name,company: company, tenant: tenant},{ "app_meta" : {} }, function(err, users) {
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
module.exports.GetUserProfileByContact = GetUserProfileByContact;
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
module.exports.SetUserProfileResoureId = SetUserProfileResoureId;
module.exports.GetUserProfileByResourceId = GetUserProfileByResourceId;
module.exports.GetARDSFriendlyContactObject = GetARDSFriendlyContactObject;

