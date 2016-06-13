/**
 * Created by Heshan.i on 6/8/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Resource = require('./model/Resource');
var Navigation = require('./model/Navigation');
var Console = require('./model/Console');
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

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
        if (Array.isArray(resources)) {
            var count = 0;
            for (var i in resources) {
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
            for(var a in allConsole) {
                var console1 = allConsole[a];
                var newResult = {consoleName: console1.consoleName};
                for(var i in console1.consoleNavigation){
                    var navigation = console1.consoleNavigation[i];
                    var newNavigation = {navigationName: navigation.navigationName, navigationStatus: navigation.navigationStatus};
                    var newResourceScopes = [];
                    for(var j in navigation.resources){
                        var resource = navigation.resources[j];
                        for(var k in resource.scopes){
                            var scope = resource.scopes[k];
                            newResourceScopes.push(scope);
                        }
                    }
                    newNavigation.resources = UniqueObjectArray(newResourceScopes,"scopes");
                }
                newResult.consoleNavigation = newNavigation;
                newConsoles.push(newResult);
            }
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Successful", true, newConsoles);
        }
        res.end(jsonString);
    });
}

function GetAllConsolesByUserRole(req, res){
    logger.debug("DVP-UserService.GetAllConsolesByUserRole Internal method ");

    var jsonString;
    Console.find({consoleUserRoles:req.params.roleType}, function(err, allConsole) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Failed", false, undefined);
        }else{
            var newConsoles =[];
            for(var a in allConsole) {
                var console1 = allConsole[a];
                var newResult = {consoleName: console1.consoleName};
                for(var i in console1.consoleNavigation){
                    var navigation = console1.consoleNavigation[i];
                    var newNavigation = {navigationName: navigation.navigationName, navigationStatus: navigation.navigationStatus};
                    var newResourceScopes = [];
                    for(var j in navigation.resources){
                        var resource = navigation.resources[j];
                        for(var k in resource.scopes){
                            var scope = resource.scopes[k];
                            newResourceScopes.push(scope);
                        }
                    }
                    newNavigation.resources = UniqueObjectArray(newResourceScopes,"scopes");
                }
                newResult.consoleNavigation = newNavigation;
                newConsoles.push(newResult);
            }
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Successful", true, newConsoles);
        }
        res.end(jsonString);
    });
}

function GetConsole(req, res){
    logger.debug("DVP-UserService.GetConsole Internal method ");
    var jsonString;
    Console.findOne({consoleName: req.params.consoleName}, function(err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
        }else{
            var newResult = {consoleName: console.consoleName};

            for(var i in console.consoleNavigation){
                var navigation = console.consoleNavigation[i];
                var newNavigation = {navigationName: navigation.navigationName, navigationStatus: navigation.navigationStatus};
                var newResourceScopes = [];
                for(var j in navigation.resources){
                    var resource = navigation.resources[j];
                    for(var k in resource.scopes){
                        var scope = resource.scopes[k];
                        newResourceScopes.push(scope);
                    }
                }
                newNavigation.resources = UniqueObjectArray(newResourceScopes,"scopes");
            }
            newResult.consoleNavigation = newNavigation;
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

    var console = Console({
        consoleName: req.body.consoleName,
        consoleUserRoles: req.body.consoleUserRoles,
        consoleNavigation: [],
        created_at: Date.now(),
        updated_at: Date.now()

    });

    console.save(function (err, console) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Console save failed", false, undefined);
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Console saved successfully", true, console);
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
        navigationStatus: req.body.navigationStatus,
        created_at: Date.now(),
        updated_at: Date.now()

    });

    var gr = GetResources(req.body.resources);
    gr.on('validateResource',function(resource){
        for(var i in req.body.resources){
            var bResource = req.body.resources[i];
            if(bResource.resourceName == resource.resourceName){
                navigation.resources.push(bResource);
                break;
            }
        }
    });
    gr.on('endValidateResources',function(){
        Console.findOne({consoleName: req.params.consoleName}, function(err, console) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
                res.end(jsonString);
            }else{
                if(console) {
                    console.updated_at = Date.now();
                    console.consoleNavigation.push(navigation);
                    Console.findOneAndUpdate({consoleName: req.params.consoleName}, console, function (err, rConsole) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Navigation save failed", false, undefined);
                        } else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Navigation saved successfully", true, console);
                        }
                        res.end(jsonString);
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