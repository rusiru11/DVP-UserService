/**
 * Created by Pawan on 12/29/2017.
 */
var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var BusinessUnit = require('dvp-mongomodels/model/BusinessUnit').BusinessUnit;
var User = require('dvp-mongomodels/model/User');


function AddBusinessUnit(req,res) {

    try {
        logger.debug("DVP-BusinessUnitService.AddBusinessUnit Internal method ");
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);
        var username = req.user.iss;
        var jsonString;


        if(username)
        {
            User.findOne({company:company,tenant:tenant,username:username},function (errUser,resUser) {

                if(errUser)
                {
                    jsonString = messageFormatter.FormatMessage(errUser, "Error in searching user", false, undefined);
                }
                else
                {
                    if (req.body && req.body.unitName) {
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
                }
            });
        }


    } catch (e) {
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

module.exports.AddBusinessUnit=AddBusinessUnit;
module.exports.GetBusinessUnits=GetBusinessUnits;
module.exports.GetBusinessUnit=GetBusinessUnit;