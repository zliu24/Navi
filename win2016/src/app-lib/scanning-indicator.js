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

FourJS.ScanningIndicator = function() {

  var timer;

  var show = function() {
    $(".fourjs-scanning-indicator").removeClass('scanner-hidden').addClass('scanner-visible');
  };

  var hide = function() {
    $(".fourjs-scanning-indicator").removeClass('scanner-visible').addClass('scanner-hidden');
  };

  /***
   * Call this on load of the scene, ideally prior to asset loading.
   * @param sceneViewer
   * @param configuration - This is the configuration for the
   * @param loadConfiguration - The configuration containing the task, specifically, the target image JSON is needed.
   */
  var onLoad = function(sceneViewer, configuration, loadConfiguration) {
    sceneViewer.subscribe("targetFound", hide);
    sceneViewer.subscribe("targetLost", show);

    var host = configuration.htmlDomElement.parent();
    if($(".fourjs-scanning-indicator").length === 0) {
      host.append(html);
    }
    if(!sceneViewer.getTargetIsFound()) {
      show();
    }

    if(loadConfiguration.targetImage) {
      host.find(".fourjs-scanning-indicator img").prop("src", loadConfiguration.targetImage.asset.file.file.small.url);
    }

    var offset = 0;
    var maxOffset = 80-3;
    var increment = 0.5;
    var update = function() {
      offset += increment;
      if(offset < 0 || offset >= maxOffset) {
        increment *= -1;
        offset += increment;
      }
      $(".scanning-bar").css({ "transform": "translate(0px, "+offset+"px)"});
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  var style =
    '.fourjs-scanning-indicator { font-family: Helvetica, Sans-Serif; font-size: 26px; color: white; position: absolute; top: 60%; left: 20%; height: 80px; font-size: }' +
    '.fourjs-scanning-indicator .img-container { position: relative; display: inline-block; height: 80px; }' +
    '.fourjs-scanning-indicator .scanning-bar { position: absolute; top: 0px; background-color: rgba(217, 0, 0, 0.75); height: 3px; width: 100%; }' +
    '.fourjs-scanning-indicator img { height: 80px; }' +
    '.fourjs-scanning-indicator .scanning-text { display: inline-block; height: 80px; line-height: 80px; vertical-align: top; background-color: rgba(31, 37, 41, 0.25); padding-left: 40px; padding-right: 40px; }' +
    '.fourjs-scanning-indicator.scanner-hidden  { visibility: hidden; opacity: 0; transition: visibility 0s 1s, opacity 1s linear; }' +
    '.fourjs-scanning-indicator.scanner-visible { visibility: visible; opacity: 1; transition: opacity 1s linear; }';

  var html = '<style>'+style+'</style>' +
    '<div class="fourjs-scanning-indicator scanner-hidden">' +
      '<div class="img-container">' +
        '<img/>' +
        '<div class="scanning-bar"></div>' +
      '</div>' +
      '<div class="scanning-text">Looking for target...</div>' +
    '</div>';

  return {
    onLoad: onLoad
  };

};
