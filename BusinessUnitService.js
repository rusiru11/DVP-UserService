/**
 * Created by Pawan on 12/29/2017.
 */
var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var BusinessUnit = require('dvp-mongomodels/model/BusinessUnit').BusinessUnit;
var User = require('dvp-mongomodels/model/User');
var unique = require('array-unique');
var util = require('util');
var UserGroup = require('dvp-mongomodels/model/UserGroup').UserGroup;



function AddBusinessUnit(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.AddBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var username = req.user.iss;
        var jsonString;

        if(req.body && req.body.unitName )
        {
            if(req.body.unitName.toLowerCase()!="default" || req.body.unitName.toLowerCase()!="all")
            {
                if(username)
                {
                    User.findOne({company:company,tenant:tenant,username:username,$or:[{'user_meta.role':'admin'},{'user_meta.role':'supervisor'}]},function (errUser,resUser) {

                        if(errUser)
                        {
                            jsonString = messageFormatter.FormatMessage(errUser, "Error in searching user", false, undefined);
                        }
                        else
                        {
                            var unitObj =
                                {
                                    owner: resUser,
                                    unitName: req.body.unitName,
                                    description: req.body.description,
                                    created_at: Date.now(),
                                    company: company,
                                    tenant: tenant
                                };

                            if(req.body.headUsers && util.isArray(req.body.headUsers))
                            {
                                unitObj.heads=req.body.headUsers;
                            }

                            var BzUnit = BusinessUnit(unitObj);

                            BzUnit.save(function (errUnit, resUnit) {

                                if (errUnit) {
                                    jsonString = messageFormatter.FormatMessage(errUnit, "Error in saving new Business Unit ", false, undefined);
                                }
                                else {
                                    if(resUnit)
                                    {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Business Unit Successfully Saved ", true, resUnit);
                                    }
                                    else
                                    {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Business Unit saving failed ", false, resUnit);
                                    }

                                }

                                res.end(jsonString);
                            });

                        }
                    });
                }
                else
                {
                    jsonString = messageFormatter.FormatMessage(new Error("No authorized user for the request"), "No authorized user for the request", false, undefined);
                    res.end(jsonString);
                }
            }
            else
            {
                jsonString = messageFormatter.FormatMessage(new Error("Cannot use "+req.body.unitName+" as a Business Unit Name"), "Cannot use "+req.body.unitName+" as a Business Unit Name", false, undefined);
                res.end(jsonString);
            }

        }
        else
        {
            jsonString = messageFormatter.FormatMessage(new Error("Insufficient data found to create a business unit"), "Insufficient data found to create a business unit", false, undefined);
            res.end(jsonString);
        }



    }
    catch (e)
    {
        jsonString = messageFormatter.FormatMessage(e, "Exception in operation : AddBusinessUnit ", false, undefined);
        res.end(jsonString);
    }



};
function UpdateBusinessUnit(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.UpdateBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;

        if(req.body && req.params.unitname )
        {
            var updateObj = {
                description:req.body.description
            }
            if(req.body.heads && util.isArray(req.body.heads))
            {
                updateObj.heads=req.body.heads;


            }

            BusinessUnit.findOneAndUpdate({company:company, tenant:tenant,unitName:req.params.unitname},updateObj,function (errUpdate,resUpdate) {

                if(errUpdate)
                {
                    jsonString = messageFormatter.FormatMessage(errUpdate, "Error in updating Business Unit ", false, undefined);
                }
                else
                {
                    jsonString = messageFormatter.FormatMessage(undefined, "Updating Business Unit succeeded ", true, resUpdate);
                }
                res.end(jsonString);
            });


        }
        else
        {
            jsonString = messageFormatter.FormatMessage(new Error("Insufficient data found to create a business unit"), "Insufficient data found to create a business unit", false, undefined);
            res.end(jsonString);
        }



    }
    catch (e)
    {
        jsonString = messageFormatter.FormatMessage(e, "Exception in operation : AddBusinessUnit ", false, undefined);
        res.end(jsonString);
    }



};
function GetBusinessUnits(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.GetBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;


        BusinessUnit.find({company:company, tenant:tenant}).populate('heads').exec(function (errUnits,resUnits) {
            if(errUnits)
            {
                jsonString = messageFormatter.FormatMessage(errUnits, "Error in searching BusinessUnits ", false, undefined);
            }
            else
            {
                jsonString = messageFormatter.FormatMessage(undefined, "BusinessUnits Found ", true, resUnits);
            }
            res.end(jsonString);
        });



    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in operation : GetBusinessUnit ", false, undefined);
        res.end(jsonString);
    }



};
function GetBusinessUnit(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.GetBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;



        if(req.params.unitName)
        {
            BusinessUnit.find({company:company, tenant:tenant, unitName:req.params.unitName},function (errUnit,resUnit) {
                if(errUnit)
                {
                    jsonString = messageFormatter.FormatMessage(errUnit, "Error in searching BusinessUnit ", false, undefined);
                }
                else
                {
                    jsonString = messageFormatter.FormatMessage(undefined, "BusinessUnit Found : "+req.params.unitName, true, resUnit);
                }
                res.end(jsonString);
            });
        }
        else
        {
            jsonString = messageFormatter.FormatMessage(new Error("No UnitName received"), "No UnitName received ", false, undefined);
            res.end(jsonString);
        }





    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in operation : GetBusinessUnit ", false, undefined);
        res.end(jsonString);
    }



};
function GetSupervisorBusinessUnits(req, res){


    logger.debug("DVP-UserService.GetSupervisorBusinessUnits Internal method ");

    try {
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;

        if(req.params.sid)
        {
            BusinessUnit.find({
                company: company,
                tenant: tenant,
                heads: {$in: [req.params.sid]}
            }).exec(function (errUsers, resUsers) {

                if (errUsers) {
                    logger.error("DVP-UserService.GetSupervisorBusinessUnits :  Error in searching supervisors ",errUsers);
                    jsonString = messageFormatter.FormatMessage(errUsers, "Error in searching Business Units", false, undefined);
                }
                else {
                    if (resUsers) {

                        jsonString = messageFormatter.FormatMessage(undefined, "Business Units found", true, unique(resUsers));
                        logger.debug("DVP-UserService.GetSupervisorBusinessUnits :  Business Units found ");
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Business Units Failed", false, undefined);
                        logger.error("DVP-UserService.GetSupervisorBusinessUnits :  Business Units Failed ");
                    }
                }

                res.end(jsonString);
            });
        }
        else
        {
            logger.error("DVP-UserService.GetSupervisorBusinessUnits :  No supervisor ID found ");
            jsonString = messageFormatter.FormatMessage(new Error("No supervisor ID found"), "No supervisor ID found", false, undefined);
            res.end(jsonString);
        }


    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in searching Business Units", false, undefined);
        res.end(jsonString);
    }


}
function AddHeadToBusinessUnits(req, res){


    logger.debug("DVP-UserService.AddHeadToBusinessUnits Internal method ");

    try {
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;

        if(req.params && req.params.hid && req.params.name)
        {
            User.findOne({_id:req.params.hid, company:company, tenant:tenant}).exec(function (errUser,resUser) {

                if(errUser)
                {
                    logger.error("DVP-UserService.AddHeadToBusinessUnits :  Error in searching User data ",errUser);
                    jsonString = messageFormatter.FormatMessage(errUser, "Error in searching User data", false, undefined);
                    res.end(jsonString);
                }
                else
                {

                    if (resUser.user_meta && (resUser.user_meta.role == "admin" || resUser.user_meta.role == "supervisor")) {
                        BusinessUnit.findOneAndUpdate({
                            unitName: req.params.name,
                            company: company,
                            tenant: tenant
                        }, {$push: {heads: resUser}}).exec(function (errAttach,resAttach) {
                            if(errAttach)
                            {
                                logger.error("DVP-UserService.AddHeadToBusinessUnits :  Error in Attaching Head to Business Unit ",errAttach);
                                jsonString = messageFormatter.FormatMessage(errAttach, "Error in Attaching Head to Business Unit", false, undefined);
                            }
                            else
                            {
                                jsonString = messageFormatter.FormatMessage(undefined, "Head attached to Business Units successfully", true, resAttach);
                                logger.debug("DVP-UserService.AddHeadToBusinessUnits :  Head attached to Business Units successfully ");
                            }
                            res.end(jsonString);
                        });


                    }
                    else
                    {
                        logger.error("DVP-UserService.AddHeadToBusinessUnits :  User does not have supervisor or admin privilege to be a Head ");
                        jsonString = messageFormatter.FormatMessage(new Error("User does not have supervisor or admin privilege to be a Head"), "Error in searching User data", false, undefined);
                        res.end(jsonString);
                    }
                }

            });


        }
        else
        {
            logger.error("DVP-UserService.AddHeadToBusinessUnits :  No supervisor ID or BusinessUnit name found ");
            jsonString = messageFormatter.FormatMessage(new Error("No supervisor ID or BusinessUnit name found "), "No supervisor ID or BusinessUnit name found ", false, undefined);
            res.end(jsonString);
        }


    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in attaching Head to Business Unit", false, undefined);
        res.end(jsonString);
    }


}
function AddHeadsToBusinessUnit(req, res){


    logger.debug("DVP-UserService.AddHeadsToBusinessUnit Internal method ");

    try {
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;
        var headUsers=[];

        if(req.body && req.body.headUsers)
        {
            headUsers=req.body.headUsers;
        }



        if(req.params && req.params.name && headUsers.length>0)
        {
            var quearyObj=

                {
                    company:company,
                    tenant:tenant,
                    $or:[{'user_meta.role':'admin'},{'user_meta.role':'supervisor'}],
                    _id:{$in:headUsers},
                    Active: true
                }



            User.find(quearyObj).exec(function (errUser,resUser) {

                if(errUser)
                {
                    logger.error("DVP-UserService.AddHeadsToBusinessUnit :  Error in searching User data ",errUser);
                    jsonString = messageFormatter.FormatMessage(errUser, "Error in searching User data", false, undefined);
                    res.end(jsonString);
                }
                else
                {


                    BusinessUnit.findOneAndUpdate({
                        unitName: req.params.name,
                        company: company,
                        tenant: tenant
                    }, {$push: {heads: resUser}}).exec(function (errAttach,resAttach) {
                        if(errAttach)
                        {
                            logger.error("DVP-UserService.AddHeadsToBusinessUnit :  Error in Attaching Head to Business Unit ",errAttach);
                            jsonString = messageFormatter.FormatMessage(errAttach, "Error in Attaching Head to Business Unit", false, undefined);
                        }
                        else
                        {
                            jsonString = messageFormatter.FormatMessage(undefined, "Head attached to Business Units successfully", true, resAttach);
                            logger.debug("DVP-UserService.AddHeadsToBusinessUnit :  Head attached to Business Units successfully ");
                        }
                        res.end(jsonString);
                    });



                }

            });


        }
        else
        {
            logger.error("DVP-UserService.AddHeadsToBusinessUnit :  No supervisor ID or BusinessUnit name found ");
            jsonString = messageFormatter.FormatMessage(new Error("No supervisor ID or BusinessUnit name found "), "No supervisor ID or BusinessUnit name found ", false, undefined);
            res.end(jsonString);
        }


    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in attaching Head to Business Unit", false, undefined);
        res.end(jsonString);
    }


}



function GetUsersOfBusinessUnits(req, res){


    logger.debug("DVP-UserService.GetUsersOfBusinessUnits Internal method ");

    try {
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;

        if(req.params.name)
        {

            if(req.params.name.toLowerCase() =="all")
            {
                User.find(
                    {
                        company: company,
                        tenant: tenant,
                        Active:true
                    }
                ).select({"password":0, "user_meta": 0, "app_meta":0, "user_scopes":0, "client_scopes":0}).exec(function (errUsers,resUsers) {

                    if(errUsers)
                    {
                        jsonString = messageFormatter.FormatMessage(errUsers, "User searching Failed", false, undefined);
                        logger.error("DVP-UserService.GetUsersOfBusinessUnits :  User searching Failed ");
                        res.end(jsonString);
                    }
                    else
                    {
                        jsonString = messageFormatter.FormatMessage(undefined, "User searching Succeeded", true, resUsers);
                        logger.debug("DVP-UserService.GetUsersOfBusinessUnits :  User searching Succeeded ");
                        res.end(jsonString);
                    }
                });
            }
            else
            {
                UserGroup.find({
                    company: company,
                    tenant: tenant,
                    businessUnit:req.params.name}).exec(function (errGroups, resGroups) {

                    if (errGroups) {
                        logger.error("DVP-UserService.GetUsersOfBusinessUnits :  Error in searching supervisors ",errGroups);
                        jsonString = messageFormatter.FormatMessage(errGroups, "Error in searching Business Units", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (resGroups) {

                            var grouiIds=[];
                            resGroups.forEach(function (item) {

                                grouiIds.push(item._id);

                            });

                            User.find({
                                company: company,
                                tenant: tenant,
                                Active:true,
                                group:{$in:grouiIds}}).select({"password":0, "user_meta": 0, "app_meta":0, "user_scopes":0, "client_scopes":0}).exec(function (errUsers,resUsers) {

                                if(errUsers)
                                {
                                    jsonString = messageFormatter.FormatMessage(errUsers, "User searching Failed", false, undefined);
                                    logger.error("DVP-UserService.GetUsersOfBusinessUnits :  User searching Failed ");
                                    res.end(jsonString);
                                }
                                else
                                {
                                    jsonString = messageFormatter.FormatMessage(undefined, "User searching Succeeded", true, resUsers);
                                    logger.debug("DVP-UserService.GetUsersOfBusinessUnits :  User searching Succeeded ");
                                    res.end(jsonString);
                                }
                            });

                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Business Units searching Failed", false, undefined);
                            logger.error("DVP-UserService.GetUsersOfBusinessUnits :  Business Units searching Failed ");
                            res.end(jsonString);
                        }
                    }


                });
            }


            /*User.find({
             company: company,
             tenant: tenant
             }).populate({
             path:'group',
             match:{businessUnit:{$eq:req.params.name}}
             }).exec(function (errUsers, resUsers) {

             if (errUsers) {
             logger.error("DVP-UserService.GetUsersOfBusinessUnits :  Error in searching supervisors ",errUsers);
             jsonString = messageFormatter.FormatMessage(errUsers, "Error in searching Business Units", false, undefined);
             }
             else {
             if (resUsers) {

             jsonString = messageFormatter.FormatMessage(undefined, "Business Units found", true, unique(resUsers));
             logger.debug("DVP-UserService.GetUsersOfBusinessUnits :  Business Units found ");
             }
             else {
             jsonString = messageFormatter.FormatMessage(undefined, "Business Units Failed", false, undefined);
             logger.error("DVP-UserService.GetUsersOfBusinessUnits :  Business Units Failed ");
             }
             }

             res.end(jsonString);
             });*/
        }
        else
        {
            logger.error("DVP-UserService.GetUsersOfBusinessUnits :  No Business Unit name received ");
            jsonString = messageFormatter.FormatMessage(new Error(" No Business Unit name received "), " No Business Unit name received ", false, undefined);
            res.end(jsonString);
        }


    } catch (e) {
        jsonString = messageFormatter.FormatMessage(e, "Exception in searching Business Units", false, undefined);
        res.end(jsonString);
    }


}

module.exports.AddBusinessUnit=AddBusinessUnit;
module.exports.GetBusinessUnits=GetBusinessUnits;
module.exports.GetBusinessUnit=GetBusinessUnit;
module.exports.GetSupervisorBusinessUnits=GetSupervisorBusinessUnits;
module.exports.AddHeadToBusinessUnits=AddHeadToBusinessUnits;
module.exports.AddHeadsToBusinessUnit=AddHeadsToBusinessUnit;
module.exports.UpdateBusinessUnit=UpdateBusinessUnit;
module.exports.GetUsersOfBusinessUnits=GetUsersOfBusinessUnits;