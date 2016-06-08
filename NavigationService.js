/**
 * Created by Heshan.i on 6/8/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Resource = require('./model/Resource');
var Navigation = require('./model/Navigation');
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

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

function GetAllNavigation(req, res){
    logger.debug("DVP-UserService.GetNavigations Internal method ");

    var jsonString;
    Navigation.find({}, function(err, allNavigation) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get All Navigation Successful", true, allNavigation);
        }
        res.end(jsonString);
    });
}

function GetNavigation(req, res){
    logger.debug("DVP-UserService.GetNavigation Internal method ");
    var jsonString;
    Navigation.findOne({navigationName: req.params.navigationName}, function(err, navigation) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Navigation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Navigation Successful", true, navigation);
        }
        res.end(jsonString);
    });
}

function DeleteNavigation(req,res){
    logger.debug("DVP-UserService.DeleteNavigation Internal method ");

    var jsonString;
    Navigation.findOne({navigationName: req.params.navigationName}, function (err, navigation) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Navigation Failed", false, undefined);
            res.end(jsonString);
        } else {
            if (navigation) {
                navigation.remove(function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Navigation Failed", false, undefined);
                    } else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Navigation successfully deleted", true, undefined);
                    }
                    res.end(jsonString);
                });
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Delete Navigation Failed, resource object is null", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function CreateNavigation(req, res){
    logger.debug("DVP-UserService.CreateResource Internal method ");
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
        navigation.save(function (err, navigation) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Navigation save failed", false, undefined);
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Navigation saved successfully", true, navigation);
            }
            res.end(jsonString);
        });
    });
}

function UpdateNavigation(req, res){
    logger.debug("DVP-UserService.UpdateNavigation Internal method ");

    var jsonString;

    req.body.updated_at = Date.now();
    Navigation.findOneAndUpdate({navigationName: req.params.navigationName}, req.body, function(err, navigation) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Update Navigation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Update Navigation Successful", true, navigation);
        }
        res.end(jsonString);
    });
}


module.exports.GetAllNavigation = GetAllNavigation;
module.exports.GetNavigation = GetNavigation;
module.exports.DeleteNavigation = DeleteNavigation;
module.exports.CreateNavigation = CreateNavigation;
module.exports.UpdateNavigation = UpdateNavigation;