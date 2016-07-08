/**
 * Created by Heshan.i on 6/7/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Resource = require('dvp-mongomodels/model/Resource');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

function GetResources(req, res){
    logger.debug("DVP-UserService.GetResources Internal method ");

    var jsonString;
    Resource.find({}, function(err, resources) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Resources Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Resources Successful", true, resources);
        }
        res.end(jsonString);
    });
}

function GetResource(req, res){
    logger.debug("DVP-UserService.GetResource Internal method ");
    var jsonString;
    Resource.findOne({resourceName: req.params.resourceName}, function(err, resource) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Resource Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Resource Successful", true, resource);
        }
        res.end(jsonString);
    });
}

function DeleteResource(req,res){
    logger.debug("DVP-UserService.DeleteResource Internal method ");

    var jsonString;
    Resource.findOne({resourceName: req.params.resourceName}, function (err, resource) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Resource Failed", false, undefined);
            res.end(jsonString);
        } else {
            if (resource) {
                resource.remove(function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Resource Failed", false, undefined);
                    } else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Resource successfully deleted", true, undefined);
                    }
                    res.end(jsonString);
                });
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Delete Resource Failed, resource object is null", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function CreateResource(req, res){
    logger.debug("DVP-UserService.CreateResource Internal method ");
    var jsonString;

    var resource = Resource({
        resourceName: req.body.resourceName,
        created_at: Date.now(),
        updated_at: Date.now()

    });
    for(var i in req.body.scopes) {
        var scope = req.body.scopes[i];
        var tmpScope = {scopeName: scope.scopeName, feature:scope.feature, actions: scope.actions};
        resource.scopes.push(tmpScope);
    }

    resource.save(function (err, resource) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Resource save failed", false, undefined);
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Resource saved successfully", true, resource);
        }
        res.end(jsonString);
    });
}

function UpdateResource(req, res){
    logger.debug("DVP-UserService.UpdateResource Internal method ");

    var jsonString;

    req.body.updated_at = Date.now();
    Resource.findOneAndUpdate({resourceName: req.params.resourceName}, req.body, function(err, resource) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Update Resource Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Update Resource Successful", true, resource);
        }
        res.end(jsonString);
    });
}


module.exports.GetResources = GetResources;
module.exports.GetResource = GetResource;
module.exports.DeleteResource = DeleteResource;
module.exports.CreateResource = CreateResource;
module.exports.UpdateResource = UpdateResource;
