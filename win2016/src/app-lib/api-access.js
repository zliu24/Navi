/***
 * Copyright (C) 2016 DAQRI, LLC. - All Rights Reserved.
 *
 * NOTICE:  This is not open source code. All source code and other information contained herein is, and remains the property of DAQRI LLC and/or its suppliers, partners, or
 * affiliates, if any (“DAQRI”) to the greatest extent possible.  The intellectual property, technical concepts, and creative expression contained herein (“code”) are proprietary to
 * DAQRI and may be covered by U.S. and Foreign Patents, patents in process, trade secret, or copyright law. Dissemination, alteration, reproduction, display, and performance
 * of this code is strictly forbidden unless prior written permission is obtained from DAQRI. Any access that DAQRI may grant you to this code is expressly conditioned on your
 * agreement to these terms, and to any other terms that DAQRI may request of you. Do not access this code if you do not agree to these terms.
 *
*/


'use strict';
var FourJS = FourJS || {};

FourJS.ApiAccess = function(configuration) {

  var host = "http://4dstudio.daqri.com";

  var email = "";
  var authToken = "";
  var userInfo;
  var projects = [];
  var enterpriseIds = [];
  var config = configuration || {};

  if(config.host) {
    host = config.host;
    if(host[host.length-1] === '/') {
      host = host.substr(0, host.length-1);
    }
  }

  var login = function(request) {
    var deferred = jQuery.Deferred();
    var data = { email: request.userEmail, password: request.password };
    if(request.hasOwnProperty('host')) {
      host = request.host;
    }

    var url = host+"/mobile/v1/login.json";
    $.ajax(url, {
      method: "POST",
      data: data,
      dataType: "json",
      success: function(data) {
        email = request.userEmail;
        var enterpriseIds = data.enterprise_ids;
        makeAuthToken(data.authentication_token);
        // TODO: Fudge to fix
        userInfo = { user: { enterpriseId: _.indexOf(enterpriseIds, 3) !== -1 ? 3 : enterpriseIds[0] } };

        var d = loadProjects();
        d.then(function() {
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });
      },
      error:  function(err) {
        deferred.reject(err);
      }
    });

    return deferred;
  };

  var loadProjects = function() {
    var deferred = jQuery.Deferred();

    loadProjectsList().then(function(enterpriseProjects) {
      var all = [];
      for(var i=0; i<enterpriseProjects.length; i++) {
        all.push(loadProject(enterpriseProjects[i].id));
      }
      $.when.apply($, all).then(function() {
        deferred.resolve();
        }, function(err) {
      });
    }, function(err) {
      displayError(err);
    });

    return deferred;
  };

  var loadProjectsList = function() {
    var deferred = jQuery.Deferred();
    doGet(host+"/mobile/v1/i4ds/enterprise/"+userInfo.user.enterpriseId+".json").then(function (data) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      }
    );
    return deferred;
  };

  var loadProject = function(id) {
    var deferred = jQuery.Deferred();
    doGet(host+"/mobile/v1/i4ds/project/"+id).then(function (data) {
        projects.push(data);
        deferred.resolve();
      }, function (err) {
        deferred.reject(err);
      }
    );
    return deferred;
  };

  var doGet = function(url) {
    var deferred = jQuery.Deferred();
    $.ajax(url, {
      method: "GET",
      dataType: "json",
      crossDomain: true,
      headers: {
        "Authorization": authToken,
        "X-Mobile-App-Id": 1,            //
        "X-Mobile-App-Api-Key": 'unused' // Just to validate a request
      },
      success: function (data) {
        deferred.resolve(data);
      },
      error: function (err) {
        deferred.reject(err);
      }
    });
    return deferred;
  };

  var makeAuthToken = function(loginReturnedString) {
    authToken = "DAQRI "+btoa(email+":"+loginReturnedString);
  };

  var getEnterpriseId = function() {
    return userInfo.user.enterpriseId;
  };

  var getProjects = function() {
    return projects;
  };

  var displayError = function(err) {

  };

  return {
    login: login,
    getEnterpriseId: getEnterpriseId,
    getProjects: getProjects
  };

};
