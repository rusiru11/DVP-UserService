/**
 * Created by Heshan.i on 6/7/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Resource = require('./model/Resource');
var VPackage = require('./model/Package');
var EventEmitter = require('events').EventEmitter;
var Console = require('./model/Console');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

function ValidateResources(resources){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(resources)) {
            var count = 0;
            for (var i in resources) {
                var _resource = resources[i];
                Resource.findOne({resourceName: _resource.resourceName}, function(err, resource) {
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

function ValidateConsoles(consoles){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (Array.isArray(consoles)) {
            var count = 0;
            for (var i in consoles) {
                var console = consoles[i];
                Console.findOne({consoleName: console}, function(err, console) {
                    count++;
                    if (err) {
                        console.log(err);
                    }else{
                        e.emit('validateConsole',console);
                    }
                    if(count == consoles.length){
                        e.emit('endValidateConsoles');
                    }
                });
            }
        }else {
            e.emit('endValidateConsoles');
        }
    });

    return (e);
}

function GetPackages(req, res){
    logger.debug("DVP-UserService.GetPackages Internal method ");

    var jsonString;
    VPackage.find({}, function(err, vPackages) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Packages Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Packages Successful", true, vPackages);
        }
        res.end(jsonString);
    });
}







function GetPackage(req, res){
    logger.debug("DVP-UserService.GetPackage Internal method ");
    var jsonString;
    VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Package Successful", true, vPackage);
        }
        res.end(jsonString);
    });
}

function DeletePackage(req,res){
    logger.debug("DVP-UserService.DeletePackage Internal method ");

    var jsonString;
    VPackage.findOne({packageName: req.params.packageName}, function (err, vPackage) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
            res.end(jsonString);
        } else {
            if (vPackage) {
                vPackage.remove(function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Package Failed", false, undefined);
                    } else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Package successfully deleted", true, undefined);
                    }
                    res.end(jsonString);
                });
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Delete Package Failed, package object is null", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function CreatePackage(req, res){
    logger.debug("DVP-UserService.CreateResource Internal method ");
    var jsonString;

    var vPackage = VPackage({
        packageName: req.body.packageName,
        consoleAccessLimit: req.body.consoleAccessLimit,
        created_at: Date.now(),
        updated_at: Date.now()

    });

    var vc  = ValidateConsoles(req.body.consoles);
    vc.on('validateConsole', function(console){
        vPackage.consoles.push(console.consoleName);
    });
    vc.on('endValidateConsoles', function(){
        var vr = ValidateResources(req.body.resources);
        vr.on('validateResource', function(oriResource){
            for(var i in req.body.resources){
                var bResource = req.body.resources[i];
                if(bResource.resourceName == oriResource.resourceName){
                    vPackage.resources.push(bResource);
                    break;
                }
            }
        });
        vr.on('endValidateResources', function(){
            vPackage.save(function (err, vPackage) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Package save failed", false, undefined);
                } else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Package saved successfully", true, vPackage);
                }
                res.end(jsonString);
            });
        });

    });
}

function UpdatePackage(req, res){
    logger.debug("DVP-UserService.UpdatePackage Internal method ");

    var jsonString;

    req.body.updated_at = Date.now();
    VPackage.findOneAndUpdate({packageName: req.params.packageName}, req.body, function(err, vPackage) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Update Package Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Update Package Successful", true, vPackage);
        }
        res.end(jsonString);
    });
}


module.exports.GetPackages = GetPackages;
module.exports.GetPackage = GetPackage;
module.exports.DeletePackage = DeletePackage;
module.exports.CreatePackage = CreatePackage;
module.exports.UpdatePackage = UpdatePackage;