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

FourJS.Sockets = function() {
  this.url = "ws://localhost:3080"; // The default
  this.connected = false;
};

FourJS.Sockets.prototype.connect = function(url) {
  var _this = this;

  this.url = url || this.url;

  try {
    this.socket = new WebSocket(this.url);
    if(this.socket) {
      this.connected = true;
    }
  } catch (err) {
    console.log("CATCH: FourJS.Socket::Connect: Unable to connect: " + err.description);
  }

  this.socket.onopen = function () {
    console.log("FourJS.Socket::Connect: Successfully connected to " + _this.url);
  };

  this.socket.onmessage = function (msgEvent) {
    if(msgEvent.data.indexOf("Daqri.App.onCameraPose(") === 0) {
      var iLow = msgEvent.data.indexOf("(");
      var iHigh = msgEvent.data.indexOf(")");
      var str = msgEvent.data.substring(iLow+1, iHigh);
      var ar = JSON.parse(str);
      Daqri.App.onCameraPose(ar);
    }
  };
};

FourJS.Sockets.errorLogged = false;

FourJS.Sockets.prototype.send = function(msg) {
  if(this.connected) {
    this.socket.send(msg);
  } else if(!FourJS.Sockets.errorLogged) {
    FourJS.Sockets.errorLogged = true;
    console.log("WARNING: FourJS.Sockets.send: attempt to send message when socket not connected: "+msg);
  }
};
