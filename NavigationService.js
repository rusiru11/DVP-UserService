/**
 * Created by Heshan.i on 6/8/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Resource = require('dvp-mongomodels/model/Resource');
var Navigation = require('dvp-mongomodels/model/Navigation');
var Console = require('dvp-mongomodels/model/Console');
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var Org = require('dvp-mongomodels/model/Organisation');

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

function GetResources(resources){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(resources) && resources.length > 0) {
            var count = 0;
            for (var i = 0; i < resources.length; i++) {
                var resource = resources[i];
                Resource.findOne({resourceName: resource.resourceName}, function(err, resource) {
                    count++;
                    if (err) {
                        console.log(err);
                    }else{
                        e.emit('validateResource',resource);
                    }
                    if(count == resources.length){
                        e.emit('endValidateResources');
                    }
                });
            }
        }else {
            e.emit('endValidateResources');
        }
    });

    return (e);
}

function GetAllConsoles(req, res){
    logger.debug("DVP-UserService.GetAllConsoles Internal method ");

    var jsonString;
    Console.find({}, function(err, allConsole) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Failed", false, undefined);
        }else{
            var newConsoles =[];
            if(allConsole) {
                for (var a = 0; a < allConsole.length; a++) {

                    var console1 = allConsole[a];
                    var newResult = {consoleName: console1.consoleName, consoleNavigation: []};
                    if(console1.consoleNavigation) {
                        for (var i = 0; i < console1.consoleNavigation.length; i++) {
                            var navigation = console1.consoleNavigation[i];
                            var newNavigation = {
                                navigationName: navigation.navigationName,
                                navigationStatus: navigation.navigationStatus
                            };
                            var newResourceScopes = [];
                            if(navigation.resources) {
                                for (var j = 0; j < navigation.resources.length; j++) {
                                    var resource = navigation.resources[j];
                                    for (var k in resource.scopes) {
                                        var scope = resource.scopes[k];
                                        newResourceScopes.push(scope);
                                    }
                                }
                                newNavigation.resources = newResourceScopes;//UniqueObjectArray(newResourceScopes,"scopes");
                            }
                            newResult.consoleNavigation.push(newNavigation);
                        }
                        newConsoles.push(newResult);
                    }
                }
            }
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Successful", true, newConsoles);
        }
        res.end(jsonString);
    });
}

function GetAllConsolesByUserRole(req, res){
    logger.debug("DVP-UserService.GetAllConsolesByUserRole Internal method ");

    var jsonString;
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);


    Org.findOne({tenant: tenant, id: company}).populate({path: 'packageDetails.veeryPackage',populate : {path: 'Package'}}).exec( function (err, org) {

        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (org) {

                if (org.packageDetails.length > 0) {
                    var availableNavigationTypes = [];
                    org.packageDetails.forEach(function (pkg) {
                        if(availableNavigationTypes.indexOf(pkg.navigationType) === -1) {
                            availableNavigationTypes.push(pkg.navigationType);
                        }
                    });

                    Console.find({consoleUserRoles:req.params.roleType}, { "$in": { "consoleNavigation.navigationTypes": availableNavigationTypes } }, function(err, allConsole) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Failed", false, undefined);
                    }else{
                        var newConsoles =[];
                        if(allConsole) {
                            for (var a = 0; a < allConsole.length; a++) {
                                var console1 = allConsole[a];
                                var newResult = {consoleName: console1.consoleName, consoleNavigation: []};
                                if(console1.consoleNavigation) {
                                    for (var i = 0; i < console1.consoleNavigation.length; i++) {
                                        var navigation = console1.consoleNavigation[i];
                                        var newNavigation = {
                                            navigationName: navigation.navigationName,
                                            navigationStatus: navigation.navigationStatus
                                        };
                                        var newResourceScopes = [];
                                        if(navigation.resources) {
                                            for (var j = 0; j < navigation.resources.length; j++) {
                                                var resource = navigation.resources[j];
                                                for (var k = 0; k < resource.scopes.length; k++) {
                                                    var scope = resource.scopes[k];
                                                    newResourceScopes.push(scope);
                                                }
                                            }
                                            newNavigation.resources = newResourceScopes;//UniqueObjectArray(newResourceScopes,"scopes");
                                        }
                                        newResult.consoleNavigation.push(newNavigation);
                                    }
                                    newConsoles.push(newResult);
                                }
                            }
                        }
                        jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Successful", true, newConsoles);
                    }
                    res.end(jsonString);
                });

                } else {

                    jsonString = messageFormatter.FormatMessage(err, "No Assigned Package Found", false, undefined);
                    res.end(jsonString);

                }

            } else {

                jsonString = messageFormatter.FormatMessage(err, "No Organisation Found", false, undefined);
                res.end(jsonString);

            }

        }

    });

























}

function GetConsole(req, res){
    logger.debug("DVP-UserService.GetConsole Internal method ");
    var jsonString;
    Console.findOne({consoleName: req.params.consoleName}, function(err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
        }else{
            var newResult = {consoleName: console.consoleName, consoleNavigation:[]};

            if(console && console.consoleNavigation) {
                for (var i = 0; i < console.consoleNavigation.length; i++) {
                    var navigation = console.consoleNavigation[i];
                    var newNavigation = {
                        navigationName: navigation.navigationName,
                        navigationStatus: navigation.navigationStatus
                    };
                    var newResourceScopes = [];
                    for (var j = 0; j< navigation.resources.length; j++) {
                        var resource = navigation.resources[j];
                        for (var k = 0; k < resource.scopes.length; k++) {
                            var scope = resource.scopes[k];
                            newResourceScopes.push(scope);
                        }
                    }
                    newNavigation.resources = newResourceScopes;//UniqueObjectArray(newResourceScopes,"scopes");
                    newResult.consoleNavigation.push(newNavigation);
                }
            }
            jsonString = messageFormatter.FormatMessage(err, "Get Console Successful", true, newResult);
        }
        res.end(jsonString);
    });
}

function DeleteConsole(req,res){
    logger.debug("DVP-UserService.DeleteConsole Internal method ");

    var jsonString;
    Console.findOne({consoleName: req.params.consoleName}, function (err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
            res.end(jsonString);
        } else {
            if (console) {
                console.remove(function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Console Failed", false, undefined);
                    } else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Console successfully deleted", true, undefined);
                    }
                    res.end(jsonString);
                });
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Delete Console Failed, resource object is null", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function CreateConsole(req, res){
    logger.debug("DVP-UserService.CreateConsole Internal method ");
    var jsonString;

    var console1 = Console({
        consoleName: req.body.consoleName,
        consoleUserRoles: req.body.consoleUserRoles,
        consoleNavigation: [],
        created_at: Date.now(),
        updated_at: Date.now()

    });

    console1.save(function (err, rConsole1) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Console save failed", false, undefined);
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Console saved successfully", true, rConsole1);
        }
        res.end(jsonString);
    });
}

function UpdateConsole(req, res){
    logger.debug("DVP-UserService.UpdateConsole Internal method ");

    var jsonString;

    req.body.updated_at = Date.now();
    Console.findOneAndUpdate({consoleName: req.params.consoleName}, req.body, function(err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Update Console Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Update Console Successful", true, console);
        }
        res.end(jsonString);
    });
}

function AddNavigationToConsole(req, res){
    logger.debug("DVP-UserService.AddNavigationToConsole Internal method ");
    var jsonString;

    var navigation = Navigation({
        navigationName: req.body.navigationName,
        navigationTypes: req.body.navigationTypes,
        navigationStatus: req.body.navigationStatus,
        created_at: Date.now(),
        updated_at: Date.now()

    });

    var gr = GetResources(req.body.resources);
    gr.on('validateResource',function(resource){
        if(resource) {
            for (var i in req.body.resources) {
                var bResource = req.body.resources[i];
                if (bResource && bResource.resourceName == resource.resourceName) {
                    navigation.resources.push(bResource);
                    break;
                }
            }
        }else{
            logger.warn('No Resource Service found');
        }
    });
    gr.on('endValidateResources',function(){
        Console.findOne({consoleName: req.params.consoleName}, function(err, console) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
                res.end(jsonString);
            }else{
                if(console) {
                    Console.findOne({$and:[{"consoleNavigation.navigationName":navigation.navigationName},{"consoleName":req.params.consoleName}]}, function(err, isExists) {
                        if(isExists){
                            console.updated_at = Date.now();
                            for (var i = 0; i < console.consoleNavigation.length; i++) {
                                if (console.consoleNavigation[i].navigationName.search(navigation.navigationName) != -1) {
                                    console.consoleNavigation[i] = navigation;
                                    break;
                                }
                            }
                        }else{
                            console.updated_at = Date.now();
                            console.consoleNavigation.push(navigation);
                        }
                        Console.findOneAndUpdate({consoleName: req.params.consoleName}, console, function (err, rConsole) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Navigation save failed", false, undefined);
                            } else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Navigation saved successfully", true, console);
                            }
                            res.end(jsonString);
                        });
                    });
                }else{
                    jsonString = messageFormatter.FormatMessage(err, "No Console Found", false, undefined);
                    res.end(jsonString);
                }
            }
        });
    });
}

function RemoveNavigationFromConsole(req,res){
    logger.debug("DVP-UserService.RemoveNavigationToConsole Internal method ");

    var jsonString;

    Console.findOne({consoleName: req.params.consoleName}, function(err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Find Console Failed", false, undefined);
            res.end(jsonString);
        }else{
            if(console) {
                console.updated_at = Date.now();
                for (var i = 0; i < console.consoleNavigation.length; i++) {
                    if (console.consoleNavigation[i].navigationName.search(req.params.navigationName) != -1) {
                        console.consoleNavigation.splice(i, 1);
                        break;
                    }
                }
                Console.findOneAndUpdate({consoleName: req.params.consoleName}, console, function (err, rConsole) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Remove Navigation from Console Failed", false, undefined);
                    } else {
                        ///TODO: Remove Limits
                        jsonString = messageFormatter.FormatMessage(err, "Remove Navigation from Console Successful", true, console);
                    }
                    res.end(jsonString);
                });
            }else{
                jsonString = messageFormatter.FormatMessage(err, "No Console Found", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

module.exports.GetAllConsoles = GetAllConsoles;
module.exports.GetConsole = GetConsole;
module.exports.DeleteConsole = DeleteConsole;
module.exports.CreateConsole = CreateConsole;
module.exports.UpdateConsole = UpdateConsole;
module.exports.AddNavigationToConsole = AddNavigationToConsole;
module.exports.RemoveNavigationFromConsole = RemoveNavigationFromConsole;
module.exports.GetAllConsolesByUserRole = GetAllConsolesByUserRole;