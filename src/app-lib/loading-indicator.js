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

FourJS.LoadingIndicator = function(sceneViewer, configuration) {

  var timerId;
  var ellipsisCount = 2;
  var dotSpans = [];
  var loading = false;
  var targetFound = false;
  var showTargetFoundTimerId;

  var showUI = function(type) {
    if(type === "loading") {
      $(".loading-indicator").show();
      $(".loading-text").show();
      $(".fourjs-progress").show();
      $(".fourjs-exclamation").hide();
      $(".target-found-text").hide();
    }
    else if(type === "target-found") {
      $(".loading-indicator").show();
      $(".loading-text").hide();
      $(".target-found-text").show();
      $(".fourjs-progress").hide();
      $(".fourjs-exclamation").show();
    } else if(type === "none") {
      $(".loading-indicator").hide();
    }
  };

  var loadingUpdate = function(loadingStatus) {

    if(sceneViewer.getTargetIsFound() && _.isUndefined(showTargetFoundTimerId)) {
      if (loadingStatus.status === "complete") {
        loading = false;
        showUI("none");
      } else if (loadingStatus.status === "loading") {
        if (!loading) {
          showUI("loading");
          $(".loading-text").show();
          $(".target-found-text").hide();
          loading = true;
          ellipsisCount = 3;
          dotSpans = [];
          for (var j = 1; j <= 3; j++) {
            var span = $(".loading-indicator .t" + j);
            dotSpans.push(span);
            span.css('visibility', 'visible');
          }
          timerId = setInterval(function () {
            ellipsisCount++;
            var i;
            if (ellipsisCount > 3) {
              ellipsisCount = 0;
              for (i = 1; i <= 3; i++) {
                dotSpans[i - 1].css('visibility', 'hidden');
              }
            } else {
              for (i = 1; i <= ellipsisCount; i++) {
                dotSpans[i - 1].css('visibility', 'visible');
              }
            }
          }, 600);

        }

        var total = 0;
        var current = 0;
        var loaded = 0;
        for (var i = 0; i < loadingStatus.assetStatus.length; i++) {
          var asset = loadingStatus.assetStatus[i];
          total += asset.sizeTotal;
          current += asset.sizeLoaded;
          if (asset.sizeTotal === asset.sizeLoaded) {
            loaded++;
          }
        }
        updatePie(current / total);
      }
    }
  };

  var showTargetFound = function() {
    showUI("target-found");
    showTargetFoundTimerId = setTimeout(function() {
      showTargetFoundTimerId = undefined;
      if(!sceneViewer.getSceneIsLoaded()) {
        showUI("loading");
      } else {
        showUI("none");
      }
    }, 2000);
  };

  var showTargetLost = function() {
    showUI("none");
    clearTimeout(showTargetFoundTimerId);
    showTargetFoundTimerId = undefined;
  };

  var initialize = function() {

    sceneViewer.subscribe("loadStatus", loadingUpdate);
    sceneViewer.subscribe("targetFound", showTargetFound);
    sceneViewer.subscribe("targetLost", showTargetLost);

    var host = $(configuration.htmlDomElement).parent();
    host.append(html);

    if(sceneViewer.getTargetIsFound()) {
      showTargetFound();
    } else if(sceneViewer.getSceneIsLoaded()) {

    } else {
      showUI("none");
    }
  };

  var updatePie = function(fraction) {
    if(isNaN(fraction)) { fraction = 0.0; }
    var angle = fraction*360;
    if(angle >= 360) { angle = 359.9; }
    var path = wedgePath(-90, -90+angle, 35.5);
    $(".fourjs-progress").attr("d", path);
  };

  var style =
    '.loading-indicator { position:absolute; top:50%; left:50%; margin-left:-75px; margin-top:-40px; width:150px; height:150px; transition: visibility 0s 2s, opacity 2s linear; text-align: center;}' +
    '.indicator-hidden { visibility: hidden; opacity: 0; transition: visibility 0s 1s, opacity 1s linear; }' +
    '.svg-container { display: inline-block; }' +
    '.loading-text { text-align: center; font-family: Helvetica, Sans-Serif; font-size: 26px; color: white; }' +
    '.target-found-text { text-align: center; font-family: Helvetica, Sans-Serif; font-size: 26px; color: white; }';

  var svg = '<svg class="fourjs-loader" width="80" height="80">' +
      '<g transform="translate(40,40)">'+
        '<circle r="37" stroke="white" stroke-width="3" fill="none"></circle>'+
        '<path class="fourjs-progress" d="" fill="rgba(0, 126, 215, 0.8)"></path>'+
        '<text class="fourjs-exclamation" font-family="Helvetica, San-Serif" fill="white" text-anchor="middle" y="17" font-size="55">!</text>'+
      '</g>' +
    '</svg>';

  var html = '<style>'+style+'</style>' +
    '<div class="loading-indicator">' +
      '<div class="svg-container">'+svg+'</div>' +
      '<div class="loading-text">&nbsp;&nbsp;&nbsp;Loading<span class="t1">.</span><span class="t2">.</span><span class="t3">.</span></span></div>' +
      '<div class="target-found-text">Target found</div>' +
    '</div>';

  var wedgePath = function(startAngle, endAngle, radius) {

    var x1 = radius * Math.cos(Math.PI * startAngle/180);
    var y1 = radius * Math.sin(Math.PI * startAngle/180);
    var x2 = radius * Math.cos(Math.PI * endAngle/180);
    var y2 = radius * Math.sin(Math.PI * endAngle/180);

    var arcFlag = endAngle-startAngle > 180 ? "1" : "0";
    return "M 0 0L"+x1+" "+y1+" A"+radius+" "+radius+" 0 "+arcFlag+" 1 "+x2+ " " + y2 + " z";
  };

  initialize();

  return { };
};
