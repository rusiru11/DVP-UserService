/**
 * Created by Pawan on 12/29/2017.
 */
var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var BusinessUnit = require('dvp-mongomodels/model/BusinessUnit').BusinessUnit;
var User = require('dvp-mongomodels/model/User');
var unique = require('array-unique');


function AddBusinessUnit(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.AddBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var username = req.user.iss;
        var jsonString;

        if(req.body && req.body.unitName )
        {
            if(req.body.unitName.toLowerCase()!="default")
            {
                if(username)
                {
                    User.findOne({company:company,tenant:tenant,username:username},function (errUser,resUser) {

                        if(errUser)
                        {
                            jsonString = messageFormatter.FormatMessage(errUser, "Error in searching user", false, undefined);
                        }
                        else
                        {
                            var BzUnit = BusinessUnit({
                                owner: resUser,
                                unitName: req.body.unitName,
                                description: req.body.description,
                                created_at: Date.now(),
                                company: company,
                                tenant: tenant
                            });

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
function GetBusinessUnits(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.GetBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var jsonString;


        BusinessUnit.find({company:company, tenant:tenant},function (errUnits,resUnits) {
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

module.exports.AddBusinessUnit=AddBusinessUnit;
module.exports.GetBusinessUnits=GetBusinessUnits;
module.exports.GetBusinessUnit=GetBusinessUnit;
module.exports.GetSupervisorBusinessUnits=GetSupervisorBusinessUnits;
module.exports.AddHeadToBusinessUnits=AddHeadToBusinessUnits;