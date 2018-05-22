/**
 * Created by Pawan on 8/1/2016.
 */
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Tenant = require('dvp-mongomodels/model/Tenant').Tenant;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var Org = require('dvp-mongomodels/model/Organisation');

function CreateTenant(req, res) {

    logger.debug("DVP-UserService.CreateTenant Internal method ");
    var jsonString;

    if(req.body ) {
        var tenantObj = Tenant({
            id: req.body.id,
            rootDomain:req.body.rootDomain,
            created_at: Date.now(),
            updated_at: Date.now()
        });


        tenantObj.save(function (err, usertenant) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "User Group save failed", false, undefined);
                res.end(jsonString);
            } else {


                jsonString = messageFormatter.FormatMessage(undefined, "User Group saved successfully", true, usertenant);
                res.end(jsonString);
            }
        });
    }else{


        jsonString = messageFormatter.FormatMessage(undefined, "Require fields not found", false, undefined);
        res.end(jsonString);

    }
}

function GetAllTenants(req, res){


    logger.debug("DVP-UserService.GetAllTenants Internal method ");

    var jsonString;
    Tenant.find(function(err, Tenants) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Tenants Failed", false, undefined);

        }else {

            if (Tenants) {


                jsonString = messageFormatter.FormatMessage(err, "Get Tenants Successful", true, Tenants);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No Tenants Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}
function GetTenant(req, res){


    logger.debug("DVP-UserService.GetTenant Internal method ");

    var jsonString;
    Tenant.find({id:req.params.id},function(err, Tenants) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Tenant Failed", false, undefined);

        }else {

            if (Tenants) {


                jsonString = messageFormatter.FormatMessage(err, "Get Tenant Successful", true, Tenants);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No Tenant Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function GetCompanyDomain(req, res){


    logger.debug("DVP-UserService.GetTenant Internal method ");

    var jsonString;
    Org.findOne({companyName:req.params.companyname}).populate('tenantRef').exec(function(err, organizationData) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Tenant Failed", false, undefined);

        }else {

            if (organizationData) {

                var domainData=req.params.companyname+"."+organizationData.tenantRef.rootDomain;
                var organizationDomain= {
                    Domain:domainData.toLowerCase()
                };



                jsonString = messageFormatter.FormatMessage(err, "Get Tenant Successful", true, organizationDomain);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No Tenant Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}

function GetBasicCompanyDetailsByTenant(req, res){
    var jsonString;
    try{
        var tenant = req.user.tenant;
        Org.find({tenant: tenant}).lean().exec(function (err, orgs) {
            if(err){
                jsonString = messageFormatter.FormatMessage(err, "Get Basic Company Details Failed", false, undefined);
            }else{
                var basicOrgDetails = orgs.map(function (org) {
                    return{
                        companyName: org.companyName,
                        companyId: org.id,
                        companyStatus: org.companyEnabled
                    }
                });

                jsonString = messageFormatter.FormatMessage(undefined, "Get Basic Company Details Success", true, basicOrgDetails);
            }

            res.end(jsonString);
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Get Basic Company Details Failed", false, undefined);
        res.end(jsonString);
    }
}

module.exports.CreateTenant = CreateTenant;
module.exports.GetAllTenants = GetAllTenants;
module.exports.GetTenant = GetTenant;
module.exports.GetCompanyDomain = GetCompanyDomain;
module.exports.GetBasicCompanyDetailsByTenant = GetBasicCompanyDetailsByTenant;