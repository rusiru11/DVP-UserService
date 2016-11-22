/**
 * Created by Heshan.i on 6/6/2016.
 */
var redis = require('redis');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Org = require('dvp-mongomodels/model/Organisation');
var User = require('dvp-mongomodels/model/User');
var VPackage = require('dvp-mongomodels/model/Package');
var PackageUnit = require('dvp-mongomodels/model/PackageUnit');
var Console = require('dvp-mongomodels/model/Console');
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var util = require('util');
var restClientHandler = require('./RestClient.js');
var config = require('config');
var validator = require('validator');
var Tenant = require('dvp-mongomodels/model/Tenant').Tenant;


client = redis.createClient(config.Redis.port, config.Redis.ip);
client.auth(config.Redis.password);
client.on("error", function (err) {
    console.log("Error " + err);
});

function FilterObjFromArray(itemArray, field, value){
    var resultObj;
    if(itemArray) {
        for (var i = 0; i < itemArray.length; i++) {
            var item = itemArray[i];
            if (item[field] == value) {
                resultObj = item;
                break;
            }
        }
        return resultObj;
    }else{
        return undefined;
    }
}

function UniqueArray(array) {
    var processed = [];
    if(array && Array.isArray(array)) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] != null) {
                if (processed.indexOf(array[i]) < 0) {
                    processed.push(array[i]);
                } else {
                    array.splice(i, 1);
                }
            }
        }
        return array;
    }else{
        return [];
    }
}

function UniqueObjectArray(array, field) {
    var processed = [];
    if(array && Array.isArray(array)) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (processed.indexOf(array[i][field]) < 0) {
                processed.push(array[i][field]);
            } else {
                array.splice(i, 1);
            }
        }
        return array;
    }else{
        return [];
    }
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

function GetOrganisationsWithPaging(req, res){
    logger.debug("DVP-UserService.GetOrganisations Internal method ");

    var tenant = parseInt(req.user.tenant);
    var jsonString;


    var page = parseInt(req.params.page),
        size = parseInt(req.params.size),
        skip = page > 0 ? ((page - 1) * size) : 0;


    Org.find({tenant: tenant}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function(err, orgs) {
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

function GetOrganisationName(req, res){
    logger.debug("DVP-UserService.GetOrganisation Internal method ");

    var tenant = parseInt(req.params.tenant);
    var company = parseInt(req.params.company);
    var jsonString;
    Org.findOne({tenant: tenant, id: company},{companyName: 1}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Successful", true, org);
        }
        res.end(jsonString);
    });
}

function GetOrganisationPackages(req, res){
    logger.debug("DVP-UserService.GetOrganisationPackages Internal method ");

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var owner = req.user.iss;
    var jsonString;
    Org.findOne({ownerId:owner, tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
        }else{

            if(org) {
                jsonString = messageFormatter.FormatMessage(undefined, "Get Organisation packages Successful", true, org.packages);
            }
            else{

                jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
            }

        }
        res.end(jsonString);
    });
}

function GetOrganisationPackagesWithDetails(req, res){
    logger.debug("DVP-UserService.GetOrganisationPackagesWithDetails Internal method ");

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var owner = req.user.iss;
    var jsonString;
    Org.findOne({ownerId:owner, tenant: tenant, id: company}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
        }else{

            if(org) {
                var cPackages = {packageInfo: org.packageDetails, unitInfo: org.unitDetails};
                jsonString = messageFormatter.FormatMessage(undefined, "Get Organisation packages Successful", true, cPackages);
            }
            else{

                jsonString = messageFormatter.FormatMessage(err, "Get Organisation Failed", false, undefined);
            }

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

function CreateOwner(req, res){
    var user = User({
        name: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        password: req.body.password,
        phoneNumber: {contact: req.body.phone, type: "phone", verified: false},
        email: {contact: req.body.mail, type: "phone", verified: false},
        user_meta: {role: "admin"},
        systemuser: true,
        user_scopes: [{
            "scope" : "package",
            "read" : true}],
        company: 0,
        tenant: 1,
        created_at: Date.now(),
        updated_at: Date.now()

    });
    user.save(function (err, rUser) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Create Owner failed", false, undefined);
            res.end(jsonString);
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Create Owner successfully", true, rUser);
            res.end(jsonString);
        }
    });
}

function CreateOrganisation(req, res){
    logger.debug("DVP-UserService.CreateOrganisation Internal method ");
    var jsonString;
    GetNewCompanyId(function(cid){
        if(cid != null && cid > 0) {

            User.findOne({username: req.user.username}, function(err, user) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Invalid User", false, undefined);
                    res.end(jsonString);
                }else{
                    if(user.company == 0){

                        Tenant.findOne({},function(err, Tenants) {
                            if (err) {

                                jsonString = messageFormatter.FormatMessage(err, "Get Tenant Failed", false, undefined);

                            }else {

                                if (Tenants) {


                                    var org = Org({
                                        ownerId: req.user.username,
                                        companyName: req.body.organisationName,
                                        companyEnabled: true,
                                        id: cid,
                                        tenant: 1,
                                        packages:[],
                                        packageDetails: [],
                                        unitDetails: [],
                                        consoleAccessLimits:[],
                                        resourceAccessLimits:[],
                                        tenantRef:Tenants._id,
                                        created_at: Date.now(),
                                        updated_at: Date.now()
                                    });
                                    user.user_meta = {role: "admin"};
                                    user.user_scopes =[
                                        {scope: "organisation", read: true, write: true},
                                        {scope: "resource", read: true},
                                        {scope: "package", read: true},
                                        {scope: "console", read: true},
                                        {"scope": "myNavigation", "read": true},
                                        {"scope": "myUserProfile", "read": true}
                                    ];
                                    user.company = cid;
                                    user.updated_at = Date.now();
                                    org.save(function (err, org) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Organisation save failed", false, undefined);
                                            res.end(jsonString);
                                        } else {
                                            User.findOneAndUpdate({username: req.user.username}, user, function (err, rUser) {
                                                if (err) {
                                                    org.remove(function (err) {
                                                    });
                                                    jsonString = messageFormatter.FormatMessage(err, "Update Admin User Failed", false, undefined);
                                                    res.end(jsonString);
                                                } else {
                                                    jsonString = messageFormatter.FormatMessage(undefined, "Organisation saved successfully", true, org);
                                                    res.end(jsonString);
                                                }
                                            });
                                        }
                                    });

                                }else{

                                    jsonString = messageFormatter.FormatMessage(undefined, "No Tenant Found", false, undefined);
                                    res.end(jsonString);

                                }
                            }


                        });

                    }else{
                        jsonString = messageFormatter.FormatMessage(err, "User Already Assign To an Organisation", false, undefined);
                        res.end(jsonString);
                    }
                }
            });

            //user.save(function (err, user) {
            //    if (err) {
            //        jsonString = messageFormatter.FormatMessage(err, "User save failed", false, undefined);
            //        res.end(jsonString);
            //    } else {
            //        org.save(function (err, org) {
            //            if (err) {
            //                user.remove(function (err) {
            //                });
            //                jsonString = messageFormatter.FormatMessage(err, "Organisation save failed", false, undefined);
            //            } else {
            //                jsonString = messageFormatter.FormatMessage(undefined, "Organisation saved successfully", true, org);
            //            }
            //            res.end(jsonString);
            //        });
            //    }
            //});
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

function ActivateOrganisation(req, res){
    logger.debug("DVP-UserService.ActivateOrganisation Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    var state = req.params.state;

    var updated_at = Date.now();
    Org.findOneAndUpdate({tenant: tenant, id: company}, {companyEnabled : state, updated_at : updated_at}, function(err, org) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Activate Organisation Failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(err, "Activate Organisation Successful", true, org);
        }
        res.end(jsonString);
    });
}

var SetPackageToOrganisation = function(company, tenant, domainData, res, vPackage, org){
    var jsonString;

    if (vPackage.consoleAccessLimit && vPackage.consoleAccessLimit.length > 0) {
        for (var i = 0; i < vPackage.consoleAccessLimit.length; i++) {
            var vCal = vPackage.consoleAccessLimit[i];
            var tempCal = {
                accessType: vCal.accessType,
                accessLimit: vCal.accessLimit,
                currentAccess: []
            };
            var count = 0;
            if (org.consoleAccessLimits.length > 0) {
                for (var j = 0; j < org.consoleAccessLimits.length; j++) {
                    count++;
                    var cal = org.consoleAccessLimits[j];
                    if (cal.accessType == vCal.accessType) {
                        org.consoleAccessLimits[j].accessLimit = tempCal.accessLimit;
                        break;
                    }
                    if (count == org.consoleAccessLimits.length) {
                        org.consoleAccessLimits.push(tempCal);

                        if (vCal.accessType == "admin") {
                            tempCal.currentAccess.push(org.ownerId);
                        }
                    }
                }
            } else {
                org.consoleAccessLimits.push(tempCal);
            }
        }
    }

    var er = ExtractResources(vPackage.resources);
    er.on('endExtractResources', function (userScopes) {
        if (userScopes) {
            for (var i = 0; i < userScopes.length; i++) {
                var scopes = userScopes[i];
                var eUserScope = FilterObjFromArray(org.resourceAccessLimits, "scopeName", scopes.scope);
                if (eUserScope) {
                    if (eUserScope.accessLimit != -1 && eUserScope.accessLimit < scopes.accessLimit) {
                        eUserScope.accessLimit = scopes.accessLimit;
                    }
                } else {
                    if (!org.resourceAccessLimits) {
                        org.resourceAccessLimits = [];
                    }
                    var rLimit = {
                        "scopeName": scopes.scope,
                        "accessLimit": scopes.accessLimit
                    };
                    org.resourceAccessLimits.push(rLimit);
                }
            }
        }


        Org.findOneAndUpdate({tenant: tenant, id: company}, org, function (err, rOrg) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Assign Package to Organisation Failed", false, undefined);
            } else {
                UpdateUser(org.ownerId, vPackage);
                AssignTaskToOrganisation(company, tenant, vPackage.veeryTask);
                AssignContextAndCloudEndUserToOrganisation(company, tenant, domainData);
                jsonString = messageFormatter.FormatMessage(err, "Assign Package to Organisation Successful", true, org);
            }
            res.end(jsonString);
        });
    });
};

function AssignPackageToOrganisation(req,res){
    logger.debug("DVP-UserService.AssignPackageToOrganisation Internal method ");
    logger.debug(req.params.packageName);

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    VPackage.findOne({packageName: req.params.packageName}, function(err, vPackage) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
            res.end(jsonString);
        }else{
            Org.findOne({tenant: tenant, id: company}).populate('tenantRef').populate({path: 'packageDetails',populate : {path: 'Package'}}).exec( function(err, org) {


                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                    res.end(jsonString);
                } else {
                    if (org) {


                        var domainData = "127.0.0.1";
                        if (org.tenantRef && org.tenantRef.rootDomain) {
                            domainData = org.companyName + "." + org.tenantRef.rootDomain;

                            if (org.packages.indexOf(req.params.packageName) == -1) {
                                var typeExist = FilterObjFromArray(org.packageDetails, 'veeryPackage.packageType', vPackage.packageType);
                                if (typeExist) {

                                    if(typeExist.veeryPackage.price > vPackage.price){
                                        try {
                                            org.packages.splice(org.packages.indexOf(typeExist.veeryPackage.packageName), 1);
                                        }catch(ex){
                                            console.log("No Package Found in the list:: ", ex);
                                        }
                                        org.packages.push(req.params.packageName);
                                        org.packages = UniqueArray(org.packages);
                                        typeExist.veeryPackage = vPackage._id;
                                        typeExist.buyDate = Date.now();
                                        SetPackageToOrganisation(company, tenant, domainData, res, vPackage, org);
                                    }else{
                                        jsonString = messageFormatter.FormatMessage(undefined, "Cannot downgrade package, Please contact your system administrator", false, undefined);
                                        res.end(jsonString);
                                    }

                                }else{
                                    org.updated_at = Date.now();
                                    org.packages.push(req.params.packageName);
                                    org.packages = UniqueArray(org.packages);
                                    org.packageDetails.push({veeryPackage: vPackage._id, buyDate: Date.now()});
                                    SetPackageToOrganisation(company, tenant, domainData, res, vPackage, org);
                                }
                            } else {
                                jsonString = messageFormatter.FormatMessage(err, "Package Already Added", false, undefined);
                                res.end(jsonString);
                            }

                        } else {
                            jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                            res.end(jsonString);
                        }
                    }
                }
            });
        }
    });
}

function AssignTaskToOrganisation(company, tenant, taskList){
    var taskInfoUrl = util.format("http://%s/DVP/API/%s/ResourceManager/TaskInfo",config.Services.resourceServiceHost, config.Services.resourceServiceVersion);
    var taskUrl = util.format("http://%s/DVP/API/%s/ResourceManager/Task",config.Services.resourceServiceHost, config.Services.resourceServiceVersion);
    if(validator.isIP(config.Services.resourceServiceHost))
    {
        taskUrl = util.format("http://%s:%s/DVP/API/%s/ResourceManager/Task", config.Services.resourceServiceHost, config.Services.resourceServicePort, config.Services.resourceServiceVersion);
        taskInfoUrl = util.format("http://%s:%s/DVP/API/%s/ResourceManager/TaskInfo", config.Services.resourceServiceHost, config.Services.resourceServicePort, config.Services.resourceServiceVersion);
    }
    var companyInfo = util.format("%d:%d", tenant, company);
    restClientHandler.DoGet(companyInfo, taskInfoUrl, "", function (err, res1, result) {
        if (err) {
            console.log(err);
        }
        else {
            var jResult = JSON.parse(result);
            for(var i in taskList) {
                var task = FilterObjFromArray(jResult.Result,"TaskType",taskList[i]);
                if(task) {
                    var body = {"TaskInfoId": task.TaskInfoId};
                    if(task.TaskType == "CALL" || task.TaskType == "CHAT"){
                        body.AddToProductivity = true;
                    }else{
                        body.AddToProductivity = false;
                    }
                    restClientHandler.DoPost(companyInfo, taskUrl, body, function (err, res1, result) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log("Assign Task Success");
                        }
                    });
                }
            }
        }
    });
}

function AssignContextAndCloudEndUserToOrganisation(company, tenant, domain){
    var contextUrl = util.format("http://%s/DVP/API/%s/SipUser/Context",config.Services.sipuserendpointserviceHost, config.Services.sipuserendpointserviceVersion);
    var cloudEndUserUrl = util.format("http://%s/DVP/API/%s/CloudConfiguration/CloudEndUser",config.Services.clusterconfigserviceHost, config.Services.clusterconfigserviceVersion);
    if(validator.isIP(config.Services.resourceServiceHost))
    {
        cloudEndUserUrl = util.format("http://%s:%s/DVP/API/%s/CloudConfiguration/CloudEndUser", config.Services.clusterconfigserviceHost, config.Services.sipuserendpointservicePort, config.Services.clusterconfigserviceVersion);
        contextUrl = util.format("http://%s:%s/DVP/API/%s/SipUser/Context", config.Services.sipuserendpointserviceHost, config.Services.clusterconfigservicePort, config.Services.sipuserendpointserviceVersion);
    }
    var companyInfo = util.format("%d:%d", tenant, company);
    var contextReqBody = {
        ContextCat: 'INTERNAL',
        Context: util.format("%d_%d_CONTEXT",tenant, company),
        Description: 'Default Internal Context',
        ClientTenant: tenant,
        ClientCompany: company

    };
    restClientHandler.DoPost(companyInfo, contextUrl, contextReqBody, function (err, res1, result) {
        if (err) {
            console.log(err);
        }
        else {
            var companyInfoForCloudEndUser = util.format("%d:%d", 1, 3);
            var cloudEndUserReqBody = {
                ClusterID: 1,
                Domain: domain,
                Provision: 1,
                ClientTenant: tenant,
                ClientCompany: company
            };
            console.log("Assign context Success: ", result);
            restClientHandler.DoPost(companyInfoForCloudEndUser, cloudEndUserUrl, cloudEndUserReqBody, function (err, res1, result) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Assign cloudEndUser Success: ", result);
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
        if (scopes && Array.isArray(scopes)) {
            var count = 0;
            for (var i =0; i < scopes.length; i++) {
                count++;
                var userScope = {};
                var oScope = scopes[i];
                if(oScope) {
                    userScope.scope = oScope.scopeName;
                    userScope.accessLimit = oScope.limit;
                    if(oScope.actions) {
                        for (var j = 0; j < oScope.actions.length; j++) {
                            var action = oScope.actions[j];
                            if (action) {
                                switch (action) {
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
                    }
                    if(userScope) {
                        e.emit('getUserScopes', userScope);
                    }
                }
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
        if (resources && Array.isArray(resources)) {
            var count = 0;
            var userScopes = [];
            for (var i = 0; i< resources.length; i++) {
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
        if (consoles && Array.isArray(consoles)) {
            logger.debug("consoles Length: "+ consoles.length);
            var count = 0;
            var consoleScopes = [];
            for (var i = 0; i< consoles.length;i++) {
                var consoleName = consoles[i];
                logger.debug("consoleName: "+ consoleName);
                Console.findOne({consoleName: consoleName}, function(err, rConsole) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Console Failed", false, undefined);
                        console.log(jsonString);
                    }else{
                        if(rConsole) {
                            logger.debug("Result consoleName: " + rConsole.consoleName);
                            var consoleScope = {consoleName: rConsole.consoleName, menus: []};
                            if(rConsole.consoleNavigation) {
                                for (var j = 0; j < rConsole.consoleNavigation.length; j++) {
                                    var navigation = rConsole.consoleNavigation[j];
                                    if (navigation && navigation.navigationName && navigation.resources) {
                                        var menuScope = {menuItem: navigation.navigationName, menuAction: []};
                                        for (var k = 0; k < navigation.resources.length; k++) {
                                            var navigationResource = navigation.resources[k];
                                            if (navigationResource && navigationResource.scopes) {
                                                for (var l = 0; l < navigationResource.scopes.length; l++) {
                                                    var navigationResourceScope = navigationResource.scopes[l];
                                                    if (navigationResourceScope) {
                                                        var scope = {
                                                            scope: navigationResourceScope.scopeName,
                                                            feature: navigationResourceScope.feature
                                                        };
                                                        if(navigationResourceScope.actions) {
                                                            for (var m = 0; m < navigationResourceScope.actions.length; m++) {
                                                                var action = navigationResourceScope.actions[m];
                                                                if (action) {
                                                                    switch (action) {
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
                                                        }
                                                        if (scope) {
                                                            menuScope.menuAction.push(scope);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        consoleScope.menus.push(menuScope);
                                    }
                                }
                            }
                            count++;
                            consoleScopes.push(consoleScope);
                        }
                    }

                    if(count == consoles.length){
                        e.emit('endExtractConsoles',consoleScopes);
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
            var fixUserScopes = [
                {scope: "user", read: true, write: true, delete: true},
                {scope: "userProfile", read: true, write: true, delete: true},
                {scope: "organisation", read: true, write: true},
                {scope: "resource", read: true},
                {scope: "package", read: true},
                {scope: "console", read: true},
                {scope: "userScope", read: true, write: true, delete: true},
                {scope: "userAppScope", read: true, write: true, delete: true},
                {scope: "userMeta", read: true, write: true, delete: true},
                {scope: "userAppMeta", read: true, write: true, delete: true},
                {scope: "client", read: true, write: true, delete: true},
                {scope: "clientScope", read: true, write: true, delete: true}
            ];
            var er = ExtractResources(vPackage.resources);
            er.on('endExtractResources', function(userScopes){
                userScopes = userScopes.concat(fixUserScopes);
                var uScopes = UniqueObjectArray(userScopes,"scope");
                if(uScopes) {
                    for (var i = 0; i < uScopes.length; i++) {
                        var eUserScope = FilterObjFromArray(user.user_scopes, "scope", uScopes[i]);
                        if (eUserScope) {
                            if (uScopes[i].read && (!eUserScope.read || eUserScope.read == false)) {
                                eUserScope.read = uScopes[i].read;
                            }
                            if (uScopes[i].write && (!eUserScope.write || eUserScope.write == false)) {
                                eUserScope.write = uScopes[i].write;
                            }
                            if (uScopes[i].delete && (!eUserScope.delete || eUserScope.delete == false)) {
                                eUserScope.delete = uScopes[i].read;
                            }
                        } else {
                            user.user_scopes.push(uScopes[i]);
                        }
                    }
                }
                var ec = ExtractConsoles(vPackage.consoles);
                ec.on('endExtractConsoles', function(clientScopes){
                    if(clientScopes) {
                        for (var j = 0; j < clientScopes.length; j++) {
                            user.client_scopes.push(clientScopes[j]);
                        }
                    }

                    user.client_scopes = UniqueObjectArray(user.client_scopes,"consoleName");
                    if(user.client_scopes) {
                        for (var k = 0; k < user.client_scopes.length; k++) {
                            var ucs = user.client_scopes[k];
                            ucs.menus = UniqueObjectArray(ucs.menus, "menuItem");
                            if(ucs.menus) {
                                for (var l = 0; l < ucs.menus.length; l++) {
                                    var menu1 = ucs.menus[l];
                                    if(menu1) {
                                        for (var m = 0; m < menu1.menuAction.length; m++) {
                                            var menuAction = FilterObjFromArray(user.user_scopes, "scope", menu1.menuAction[m].scope);
                                            if (menuAction) {
                                                if (menu1.menuAction[m].read) {
                                                    menuAction.read = menu1.menuAction[m].read;
                                                }
                                                if (menu1.menuAction[m].write) {
                                                    menuAction.write = menu1.menuAction[m].write;
                                                }
                                                if (menu1.menuAction[m].delete) {
                                                    menuAction.delete = menu1.menuAction[m].delete;
                                                }
                                            } else {
                                                var mAction = {scope: menu1.menuAction[m].scope};
                                                if (menu1.menuAction[m].read) {
                                                    mAction.read = menu1.menuAction[m].read;
                                                }
                                                if (menu1.menuAction[m].write) {
                                                    mAction.write = menu1.menuAction[m].write;
                                                }
                                                if (menu1.menuAction[m].delete) {
                                                    mAction.delete = menu1.menuAction[m].delete;
                                                }
                                                user.user_scopes.push(mAction);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
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

function CreateOrganisationStanAlone(user, callback) {
    logger.debug("DVP-UserService.CreateOrganisationStanAlone Internal method ");

    GetNewCompanyId(function (cid) {
        if (cid != null && cid > 0) {


            if (user.company == 0) {

                Tenant.findOne({}, function (err, Tenants) {
                    if (err) {

                        callback(err, undefined);

                    } else {

                        if (Tenants) {


                            var org = Org({
                                ownerId: user.username,
                                companyName: user.username,
                                companyEnabled: true,
                                id: cid,
                                tenant: 1,
                                packages: [],
                                consoleAccessLimits: [],
                                tenantRef: Tenants._id,
                                created_at: Date.now(),
                                updated_at: Date.now()
                            });
                            var usr = {};
                            usr.company = cid;
                            usr.updated_at = Date.now();
                            org.save(function (err, org) {
                                if (err) {
                                    callback(err, undefined);
                                } else {

                                        User.findOneAndUpdate({username: user.username}, usr, function (err, rUser) {
                                            if (err) {
                                                org.remove(function (err) {
                                                });
                                                callback(err, undefined);
                                            } else {
                                                rUser.company = cid;
                                                callback(undefined, rUser);
                                            }
                                        });
                                }
                            });

                        } else {
                            callback(new Error("No tenants found"), undefined);
                        }
                    }
                });


            }


        } else {
            callback(new Error("ID generation failed"), undefined);
        }
    });
}

function AssignPackageUnitToOrganisation(req,res){

    logger.debug("DVP-UserService.AssignPackageUnitToOrganisation Internal method ");
    logger.debug("Package:: "+req.params.packageName);
    logger.debug("PackageUnit:: "+req.body.unitName);

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var topUpCount = 0;
    if(req.params.topUpCount) {
        topUpCount = parseInt(req.params.topUpCount);
    }
    var jsonString;

    if(topUpCount > 0) {

        VPackage.findOne({packageName: req.params.packageName}, function (err, vPackage) {

            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Package Failed", false, undefined);
                res.end(jsonString);

            } else {
                if(vPackage) {
                    Org.findOne({tenant: tenant, id: company}, function (err, org) {

                        if (err) {

                            jsonString = messageFormatter.FormatMessage(err, "Find Organisation Failed", false, undefined);
                            res.end(jsonString);

                        } else {

                            if (org) {

                                if (org.packages.indexOf(req.params.packageName) > -1) {

                                    PackageUnit.findOne({unitName: req.params.unitName}, function (err, packageUnit) {

                                        if (err) {

                                            jsonString = messageFormatter.FormatMessage(err, "Get Package Unit Failed", false, undefined);
                                            res.end(jsonString);

                                        } else {

                                            if (packageUnit) {

                                                org.updated_at = Date.now();

                                                if (org.consoleAccessLimits.length > 0) {

                                                    for (var j = 0; j < org.consoleAccessLimits.length; j++) {

                                                        var cal = org.consoleAccessLimits[j];

                                                        if (cal.accessType == packageUnit.consoleAccessLimit.accessType) {
                                                            org.consoleAccessLimits[j].accessLimit = org.consoleAccessLimits[j].accessLimit + topUpCount;
                                                            break;

                                                        }
                                                    }

                                                }


                                                var er = ExtractResources(packageUnit.resources);
                                                er.on('endExtractResources', function (userScopes) {
                                                    if (userScopes) {
                                                        for (var i = 0; i < userScopes.length; i++) {
                                                            var scopes = userScopes[i];
                                                            var eUserScope = FilterObjFromArray(org.resourceAccessLimits, "scopeName", scopes.scope);
                                                            if (eUserScope) {
                                                                if (eUserScope.accessLimit != -1 && topUpCount > 0) {
                                                                    eUserScope.accessLimit = eUserScope.accessLimit + topUpCount;
                                                                } else if (topUpCount === -1) {
                                                                    eUserScope.accessLimit = topUpCount;
                                                                }
                                                            } else {
                                                                if (!org.resourceAccessLimits) {
                                                                    org.resourceAccessLimits = [];
                                                                }
                                                                var rLimit = {
                                                                    "scopeName": scopes.scope,
                                                                    "accessLimit": scopes.accessLimit
                                                                };
                                                                org.resourceAccessLimits.push(rLimit);
                                                            }
                                                        }
                                                    }

                                                    org.unitDetails.push({veeryUnit:packageUnit._id, buyDate: Date.now()});

                                                    Org.findOneAndUpdate({
                                                        tenant: tenant,
                                                        id: company
                                                    }, org, function (err, rOrg) {

                                                        if (err) {

                                                            jsonString = messageFormatter.FormatMessage(err, "Assign Package Unit to Organisation Failed", false, undefined);

                                                        } else {

                                                            jsonString = messageFormatter.FormatMessage(err, "Assign Package Unit to Organisation Successful", true, org);

                                                        }

                                                        res.end(jsonString);
                                                    });
                                                });

                                            } else {

                                                jsonString = messageFormatter.FormatMessage(err, "No Package Unit Found", false, undefined);
                                                res.end(jsonString);

                                            }

                                        }

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
                }else{
                    jsonString = messageFormatter.FormatMessage(undefined, "No Package Found", false, undefined);
                    res.end(jsonString);
                }
            }

        });

    }else{

        jsonString = messageFormatter.FormatMessage(undefined, "Top up count should be grater than zero", false, undefined);
        res.end(jsonString);

    }
}

function GetBillingDetails(req, res){
    logger.debug("DVP-UserService.GetPackageUnits Internal method ");

    var jsonString;

    var billingObj = [
        {name: "CONTACT CENTER SILVER",type: "CALLCENTER",category: "veeryPackage",unitPrice: 100,units: 1, description: "",date: "2016-01-20",valid: true, isTrial: false},
        {name: "AGENT",type: "CALLCENTER",category: "veeryUnit",unitPrice: 10,units: 1, description: "",date: "2016-01-20",valid: true, isTrial: false},
        {name: "112456325",type: "CALLCENTER",category: "DID",unitPrice: 1,units: 1, description: "",date: "2016-01-20",valid: true, isTrial: false}
    ];

    jsonString = messageFormatter.FormatMessage(undefined, "Set Billing Details Success", true, billingObj);
    res.end(jsonString);
    //PackageUnit.find({}, function(err, packageUnits) {
    //    if (err) {
    //        jsonString = messageFormatter.FormatMessage(err, "Get Packages Units Failed", false, undefined);
    //    }else{
    //        jsonString = messageFormatter.FormatMessage(err, "Get Packages Units Successful", true, packageUnits);
    //    }
    //    res.end(jsonString);
    //});
}

module.exports.GetOrganisation = GetOrganisation;
module.exports.GetOrganisations = GetOrganisations;
module.exports.DeleteOrganisation = DeleteOrganisation;
module.exports.CreateOrganisation = CreateOrganisation;
module.exports.UpdateOrganisation = UpdateOrganisation;
module.exports.AssignPackageToOrganisation = AssignPackageToOrganisation;
module.exports.RemovePackageFromOrganisation = RemovePackageFromOrganisation;
module.exports.CreateOwner = CreateOwner;
module.exports.GetOrganisationPackages = GetOrganisationPackages;
module.exports.GetOrganisationPackagesWithDetails = GetOrganisationPackagesWithDetails;
module.exports.GetOrganisationName = GetOrganisationName;
module.exports.AssignPackageUnitToOrganisation = AssignPackageUnitToOrganisation;
module.exports.CreateOrganisationStanAlone = CreateOrganisationStanAlone;
module.exports.ActivateOrganisation = ActivateOrganisation;
module.exports.GetOrganisationsWithPaging = GetOrganisationsWithPaging;
module.exports.GetBillingDetails = GetBillingDetails;
