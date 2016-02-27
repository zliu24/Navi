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

FourJS.ApiAccessV2 = function(configuration) {

  var host = "https://test2.daqri.com";

  var email = "";
  var authToken = "";
  var enterpriseId;
  var enterprises;
  var projectsByEnterpriseId = {};
  var projectsById = {};
  var config = configuration || {};
  var appId = 2;
  var mobileAppApiKey = "a3e91a97-ccdb-419d-8148-7ebc3c75f7aa";

  if(config.host) {
    host = config.host;
    if(host[host.length-1] === '/') {
      host = host.substr(0, host.length-1);
    }
  }

  var login = function(request) {
    // HACK for localhost (hardcoding keys for easier usage)
    if(request.host === "http://localhost:3000"){
      appId = 1;
      mobileAppApiKey = "a3e91a97-ccdb-419d-8148-7ebc3c75f7ab";
    }
    var deferred = jQuery.Deferred();
    var data = { email: request.userEmail, password: request.password };
    if(request.hasOwnProperty('host')) {
      host = request.host;
    }

    var url = host+"/mobile/v2/login.json";
    $.ajax(url, {
      method: "POST",
      data: data,
      dataType: "json",
      headers: {
        "Mobile-App-Api-Key": mobileAppApiKey
      },
      success: function(data) {
        email = request.userEmail;
        makeAuthToken(data.authentication_token);
        deferred.resolve();
      },
      error:  function(err) {
        deferred.reject(err);
      }
    });

    return deferred;
  };

  var loadEnterprises = function() {
    var deferred = jQuery.Deferred();
    doGet(host+"/mobile/v2/app/"+appId+"/enterprises.json").then(function (data) {
        enterprises = data;
        deferred.resolve();
      }, function (err) {
        deferred.reject(err);
      }
    );
    return deferred;
  };

  var loadProjects = function(id) {
    enterpriseId = id;

    var deferred = jQuery.Deferred();
    doGet(host+"/mobile/v2/app/"+appId+"/enterprise/"+enterpriseId+"/projects.json?include_descendants=false").then(function (data) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      }
    );
    return deferred;
  };

  var loadProject = function(id) {
    var deferred = jQuery.Deferred();
    doGet(host+"/mobile/v2/project/"+id+".json").then(function (data) {
        deferred.resolve(data);
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
        "Mobile-App-Api-Key": mobileAppApiKey
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

  var getEnterprises = function() {
    var deferred = jQuery.Deferred();
    if(!enterprises) {
      loadEnterprises().then(
        function() {
          deferred.resolve(enterprises);
        }, function(err) {
          deferred.reject(err);
        }
      );
    } else {
      deferred.resolve(projectsById[id]);
    }
    return deferred;
  };

  var getProjects = function(entId) {
    var deferred = jQuery.Deferred();
    if(!projectsByEnterpriseId[entId]) {
      loadProjects(entId).then(
        function(data) {
          projectsByEnterpriseId[entId] = data;
          deferred.resolve(data);
        }, function(err) {
          deferred.reject(err);
        }
      );
    } else {
      deferred.resolve(projectsByEnterpriseId[entId]);
    }
    return deferred;
  };

  var getProject = function(id) {
    var deferred = jQuery.Deferred();
    if(!projectsById[id]) {
      loadProject(id).then(
        function(data) {
          projectsById[id] = data;
          deferred.resolve(data);
        }, function(err) {
          deferred.reject(err);
        }
      );
    } else {
      deferred.resolve(projectsById[id]);
    }
    return deferred;
  };

  var displayError = function(err) {

  };

  return {
    login: login,
    getEnterprises: getEnterprises,
    getProjects: getProjects,
    getProject:  getProject
  };

};
