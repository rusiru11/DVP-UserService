/**
 * Created by Heshan.i on 6/6/2016.
 */
var redis = require('redis');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Org = require('./model/Organisation');
var User = require('./model/User');
var VPackage = require('./model/Package');
var Console = require('./model/Console');
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

client = redis.createClient(config.Redis.port, config.Redis.ip);
client.auth(config.Redis.password);
client.on("error", function (err) {
    console.log("Error " + err);
});

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

function GetNewCompanyId(callback){
    client.incr("CompanyCount", function (err, result) {
        if (err) {
            callback(null);
        } else {
            callback(parseInt(result));
        }
    });
}

function GetOrganisations(req, res){
    logger.debug("DVP-UserService.GetOrganisations Internal method ");

    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Org.find({tenant: tenant}, function(err, orgs) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisations Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Organisations Successful", true, orgs);
        }
        res.end(jsonString);
    });
}

function GetOrganisation(req, res){
    logger.debug("DVP-UserService.GetOrganisation Internal method ");

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    Org.findOne({tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Successful", true, org);
        }
        res.end(jsonString);
    });
}

function DeleteOrganisation(req,res){
    logger.debug("DVP-UserService.DeleteOrganisation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.find({tenant: tenant, id: company}, function(err, users) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Users Failed", false, undefined);
            res.end(jsonString);
        }else{
            if(users.length>0){
                jsonString = messageFormatter.FormatMessage(undefined, "Users are Available, Denied Remove Organisation", false, undefined);
                res.end(jsonString);
            }else {
                Org.findOne({tenant: tenant, id: company}, function (err, org) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        if (org) {
                            org.remove(function (err) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Delete Organisation Failed", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Organisation successfully deleted", true, undefined);
                                }
                                res.end(jsonString);
                            });
                        } else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Delete Organisation Failed, user object is null", false, undefined);
                            res.end(jsonString);
                        }
                    }
                });
            }
        }
    });
}

function CreateOrganisation(req, res){
    logger.debug("DVP-UserService.CreateOrganisation Internal method ");
    var jsonString;
    GetNewCompanyId(function(cid){
        if(cid != null && cid > 0) {
            var org = Org({
                ownerId: req.body.owner.username,
                companyName: req.body.name,
                companyEnabled: true,
                id: cid,
                tenant: 1,
                packages:[],
                consoleAccessLimits:[],
                created_at: Date.now(),
                updated_at: Date.now()
            });

            var userScopes = [
                {scope: "user", read: true, write: true, delete: true},
                {scope: "userProfile", read: true, write: true, delete: true},
                {scope: "organisation", read: true, write: true, delete: true},
                {scope: "resource", read: true, write: true, delete: true},
                {scope: "package", read: true, write: true, delete: true},
                {scope: "console", read: true, write: true, delete: true},
                {scope: "userScope", read: true, write: true, delete: true},
                {scope: "userAppScope", read: true, write: true, delete: true},
                {scope: "userMeta", read: true, write: true, delete: true},
                {scope: "userAppMeta", read: true, write: true, delete: true},
                {scope: "client", read: true, write: true, delete: true},
                {scope: "clientScope", read: true, write: true, delete: true}
            ];

            var user = User({
                name: req.body.owner.name,
                username: req.body.owner.username,
                password: req.body.owner.password,
                phoneNumber: {contact: req.body.owner.phone, type: "phone", verified: false},
                email: {contact: req.body.owner.mail, type: "phone", verified: false},
                user_meta: {role: "admin"},
                user_scopes: userScopes,
                company: cid,
                tenant: 1,
                created_at: Date.now(),
                updated_at: Date.now()

            });

            user.save(function (err, user) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "User save failed", false, undefined);
                    res.end(jsonString);
                } else {
                    org.save(function (err, org) {
                        if (err) {
                            user.remove(function (err) {
                            });
                            jsonString = messageFormatter.FormatMessage(err, "Organisation save failed", false, undefined);
                        } else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Organisation saved successfully", true, org);
                        }
                        res.end(jsonString);
                    });
                }
            });
        }else{
            jsonString = messageFormatter.FormatMessage(undefined, "Create new organisation id failed", false, undefined);
            res.end(jsonString);
        }
    });
}

function UpdateOrganisation(req, res){
    logger.debug("DVP-UserService.UpdateOrganisation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    Org.findOneAndUpdate({tenant: tenant, id: company}, req.body, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Update Organisation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Update Organisation Successful", true, org);
        }
        res.end(jsonString);
    });
}

function AssignPackageToOrganisation(req,res){
    logger.debug("DVP-UserService.AssignPackageToOrganisation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
            res.end(jsonString);
        }else{
            Org.findOne({tenant: tenant, id: company}, function(err, org) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                    res.end(jsonString);
                }else{
                    if(org) {
                        if(org.packages.indexOf(req.params.packageName) == -1) {
                            org.updated_at = Date.now();
                            org.packages.push(req.params.packageName);
                            org.packages = UniqueArray(org.packages);
                            for (var i in vPackage.consoleAccessLimit) {
                                var vCal = vPackage.consoleAccessLimit[i];
                                var tempCal = {
                                    accessType: vCal.accessType,
                                    accessLimit: vCal.accessLimit,
                                    currentAccess: []
                                };
                                if(vCal.accessType == "admin") {
                                    tempCal.currentAccess.push(org.ownerId);
                                }
                                var count = 0;
                                if (org.consoleAccessLimits.length > 0) {
                                    for (var j in org.consoleAccessLimits) {
                                        count++;
                                        var cal = org.consoleAccessLimits[j];
                                        if (cal.accessType == vCal.accessType) {
                                            org.consoleAccessLimits[j].accessLimit = org.consoleAccessLimits[j].accessLimit + tempCal.accessLimit;
                                            break;
                                        }
                                        if (count == org.consoleAccessLimits.length) {
                                            org.consoleAccessLimits.push(tempCal);
                                        }
                                    }
                                } else {
                                    org.consoleAccessLimits.push(tempCal);
                                }
                            }

                            Org.findOneAndUpdate({tenant: tenant, id: company}, org, function (err, rOrg) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Assign Package to Organisation Failed", false, undefined);
                                } else {
                                    UpdateUser(org.ownerId, vPackage);
                                    jsonString = messageFormatter.FormatMessage(err, "Assign Package to Organisation Successful", true, org);
                                }
                                res.end(jsonString);
                            });
                        }else{
                            jsonString = messageFormatter.FormatMessage(err, "Package Already Added", false, undefined);
                            res.end(jsonString);
                        }
                    }else{
                        jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
    });
}

function RemovePackageFromOrganisation(req,res){
    logger.debug("DVP-UserService.RemovePackageFromOrganisation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Org.findOne({tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
            res.end(jsonString);
        }else{
            if(org) {
                org.updated_at = Date.now();
                for (var i = 0; i < org.packages.length; i++) {
                    if (org.packages[i].search(req.params.packageName) != -1) {
                        org.packages.splice(i, 1);
                    }
                }
                VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
                        console.log(jsonString);
                    } else {
                        for(var i in vPackage.consoleAccessLimit){
                            var vCal = vPackage.consoleAccessLimit[i];
                            var tempCal = {accessType: vCal.accessType, accessLimit: vCal.accessLimit, currentAccess: []};
                            for (var j in org.consoleAccessLimits) {
                                var cal = org.consoleAccessLimits[j];
                                if (cal.accessType == vCal.accessType) {
                                    org.consoleAccessLimits[j].accessLimit = org.consoleAccessLimits[j].accessLimit - tempCal.accessLimit;
                                    break;
                                }
                            }
                        }

                        Org.findOneAndUpdate({tenant: tenant, id: company}, org, function (err, rorg) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Remove Package to Organisation Failed", false, undefined);
                            } else {
                                ///TODO: Remove Limits
                                jsonString = messageFormatter.FormatMessage(err, "Remove Package to Organisation Successful", true, org);
                            }
                            res.end(jsonString);
                        });
                    }
                });
            }else{
                jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function GetUserScopes(scopes){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(scopes)) {
            var count = 0;
            for (var i in scopes) {
                count++;
                var userScope = {};
                var oScope = scopes[i];
                userScope.scope = oScope.scopeName;
                for(var j in oScope.actions){
                    var action = oScope.actions[j];
                    if(action){
                        switch (action){
                            case 'read':
                                userScope.read = true;
                                break;
                            case 'write':
                                userScope.write = true;
                                break;
                            case 'delete':
                                userScope.delete = true;
                                break;
                        }
                    }
                }
                e.emit('getUserScopes', userScope);
                if(count == scopes.length){
                    e.emit('endGetUserScopes');
                }
            }
        }else {
            e.emit('endGetUserScopes');
        }
    });

    return (e);
}

function ExtractResources(resources){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(resources)) {
            var count = 0;
            var userScopes = [];
            for (var i in resources) {
                var resource = resources[i];
                var gus  = GetUserScopes(resource.scopes);
                gus.on('getUserScopes', function(scope){
                    if(scope){
                        userScopes.push(scope);
                    }
                });
                gus.on('endGetUserScopes', function(){
                    count++;
                    if(count == resources.length){
                        e.emit('endExtractResources', userScopes);
                    }
                });
            }
        }else {
            e.emit('endExtractResources', []);
        }
    });

    return (e);
}

function ExtractConsoles(consoles){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(consoles)) {
            var count = 0;
            var clientScopes = [];
            for (var i in consoles) {
                var consoleName = consoles[i];
                Console.findOne({consoleName: consoleName}, function(err, console) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
                        res.end(jsonString);
                    }else{
                        for(var j in console.consoleNavigation){
                            count++;
                            var navigation = console.consoleNavigation[j];
                            var menuScope = {menuItem: navigation.navigationName, menuAction: []};
                            for(var k in navigation.resources){
                                var navigationResource = navigation.resources[k];
                                for(var l in navigationResource.scopes){
                                    var navigationResourceScope = navigationResource.scopes[l];
                                    var scope = {scope: navigationResourceScope.scopeName};
                                    for(var m in navigationResourceScope.actions){
                                        var action = navigationResourceScope.actions[m];
                                        if(action){
                                            switch (action){
                                                case 'read':
                                                    scope.read = true;
                                                    break;
                                                case 'write':
                                                    scope.write = true;
                                                    break;
                                                case 'delete':
                                                    scope.delete = true;
                                                    break;
                                            }
                                        }
                                    }
                                    menuScope.menuAction.push(scope);
                                }
                            }
                            clientScopes.push(menuScope);
                        }
                        e.emit('endExtractConsoles',clientScopes);
                    }
                });
            }
        }else {
            e.emit('endExtractConsoles',[]);
        }
    });

    return (e);
}

function UpdateUser(ownerId, vPackage){
    var jsonString;
    User.findOne({username: ownerId}, function(err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Find Owner Failed", false, undefined);
            return jsonString;
        } else {
            var er = ExtractResources(vPackage.resources);
            er.on('endExtractResources', function(userScopes){
                var uScopes = UniqueObjectArray(userScopes,"scope");
                for(var i in uScopes){
                    user.user_scopes.push(uScopes[i]);
                }
                var ec = ExtractConsoles(vPackage.consoles);
                ec.on('endExtractConsoles', function(clientScopes){
                    for(var j in clientScopes){
                        user.client_scopes.push(clientScopes[j]);
                    }

                    user.client_scopes = UniqueObjectArray(user.client_scopes,"menuItem");
                    user.user_scopes = UniqueObjectArray(user.user_scopes,"scope");
                    User.findOneAndUpdate({username: ownerId}, user, function (err, rUser) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Update User Scopes Failed", false, undefined);
                        } else {
                            jsonString = messageFormatter.FormatMessage(err, "Update User Scopes Successful", true, user);
                        }
                        return jsonString;
                    });
                });
            });
        }
    });
}
module.exports.GetOrganisation = GetOrganisation;
module.exports.GetOrganisations = GetOrganisations;
module.exports.DeleteOrganisation = DeleteOrganisation;
module.exports.CreateOrganisation = CreateOrganisation;
module.exports.UpdateOrganisation = UpdateOrganisation;
module.exports.AssignPackageToOrganisation = AssignPackageToOrganisation;
module.exports.RemovePackageFromOrganisation = RemovePackageFromOrganisation;