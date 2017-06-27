/**
 * Created by Heshan.i on 6/27/2017.
 */

var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var activeDirectory = require('dvp-mongomodels/model/ActiveDirectory').ActiveDirectory;
var CryptoJS = require("crypto-js");
var util = require('util');


var createActiveDirectory = function (req, res) {

    var jsonString;

    try {
        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);

        var password = CryptoJS.AES.encrypt(req.body.password, util.format('%d %d edj44thgjfdje', tenant, company));

        var ad = activeDirectory({
            company: company,
            tenant: tenant,
            ldapServerIp: req.body.ldapServerIp,
            baseDN: req.body.baseDN,
            username: req.body.username,
            password: password.toString(),
            created_at: Date.now(),
            updated_at: Date.now()
        });

        ad.save(function (err, adResult) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Configure Active Directory failed", false, undefined);
                res.end(jsonString);
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Configure Active Directory successfully", true, undefined);
                res.end(jsonString);
            }
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Error Occurred in Configure Active Directory", false, undefined);
        res.end(jsonString);
    }

};

var updateActiveDirectory = function (req, res) {

    var jsonString;

    try {
        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);

        req.body.updated_at = Date.now();
        activeDirectory.findOneAndUpdate({company: company, tenant: tenant}, req.body, function(err, adResult) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Update Active Directory Configuration Failed", false, undefined);

            }else{

                jsonString = messageFormatter.FormatMessage(err, "Update Active Directory Configuration Successful", true, adResult);

            }

            res.end(jsonString);
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Error Occurred in Update Active Directory Configuration", false, undefined);
        res.end(jsonString);
    }

};

var getActiveDirectory = function (req, res) {

    var jsonString;

    try {
        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);

        activeDirectory.findOne({company: company, tenant: tenant}, function(err, adResult) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Active Directory Configuration Failed", false, undefined);

            }else{

                jsonString = messageFormatter.FormatMessage(err, "Get Active Directory Configuration Successful", true, adResult);

            }

            res.end(jsonString);
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Error Occurred in Get Active Directory Configuration", false, undefined);
        res.end(jsonString);
    }

};

var removeActiveDirectory = function (req, res) {

    var jsonString;

    try {
        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);

        activeDirectory.findOne({company: company, tenant: tenant}, function (err, adResult) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Find Active Directory Configuration Failed", false, undefined);
                res.end(jsonString);
            } else {
                if (adResult) {
                    adResult.remove(function (err) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Remove Active Directory Configuration Failed", false, undefined);
                        } else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Remove Active Directory Configuration Successful", true, undefined);
                        }
                        res.end(jsonString);
                    });
                } else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Find Active Directory Configuration Failed, No Active Directory Found", false, undefined);
                    res.end(jsonString);
                }
            }
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Error Occurred in Remove Active Directory Configuration", false, undefined);
        res.end(jsonString);
    }

};

var resetActiveDirectoryPassword = function (req, res) {
    var jsonString;

    try {
        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);

        activeDirectory.findOne({company: company, tenant: tenant}, '+password', function(err, adResult) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Find Active Directory Configuration Failed", false, undefined);

            }else{

                var bytes  = CryptoJS.AES.decrypt(adResult.password, util.format('%d %d edj44thgjfdje', tenant, company));
                if(bytes.toString(CryptoJS.enc.Utf8) === req.body.currentPassword){

                    var password = CryptoJS.AES.encrypt(req.body.newPassword, util.format('%d %d edj44thgjfdje', tenant, company));

                    activeDirectory.findOneAndUpdate({company: company, tenant: tenant}, {password: password}, function(err, adResult) {
                        if (err) {

                            jsonString = messageFormatter.FormatMessage(err, "Reset Active Directory Password Failed", false, undefined);

                        }else{

                            jsonString = messageFormatter.FormatMessage(err, "Reset Active Directory Password Successful", true, undefined);

                        }

                        res.end(jsonString);
                    });

                }else{

                    jsonString = messageFormatter.FormatMessage(err, "Invalid Current Password", false, undefined);

                }

            }

            res.end(jsonString);
        });
    }catch(ex){
        jsonString = messageFormatter.FormatMessage(ex, "Error Occurred in Get Active Directory Configuration", false, undefined);
        res.end(jsonString);
    }
};

var getActiveDirectoryInternal = function (tenant, company, callback) {

    try {
        activeDirectory.findOne({company: company, tenant: tenant}, '+password', function(err, adResult) {
            if (err) {

                callback(err, undefined);

            }else{

                var bytes  = CryptoJS.AES.decrypt(adResult.password, util.format('%d %d edj44thgjfdje', tenant, company));
                adResult.password = bytes.toString(CryptoJS.enc.Utf8);
                callback(err, adResult);

            }
        });
    }catch(ex){
        callback(ex, undefined);
    }
};


module.exports.CreateActiveDirectory = createActiveDirectory;
module.exports.UpdateActiveDirectory = updateActiveDirectory;
module.exports.GetActiveDirectory = getActiveDirectory;
module.exports.RemoveActiveDirectory = removeActiveDirectory;
module.exports.ResetActiveDirectoryPassword = resetActiveDirectoryPassword;
module.exports.GetActiveDirectoryInternal = getActiveDirectoryInternal;