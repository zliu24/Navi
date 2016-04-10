var THREEx  = THREEx  || {}

/**
 * handle touch params
 *
 * @class
 */
THREEx.TouchParams  = function ( ) {

  this.buttonType = null
  this.redirectType = null;
  this.redirectChapter = -1;
  this.redirectURL = '';

}

/**
 * create a THREEx.TouchParams based on JSON object
 * 
 * @param  {Object} json - the data object
 * @return {THREEx.TouchParams}      [description]
 */
THREEx.TouchParams.fromJson = function ( json ) {

  var touchParams = new THREEx.TouchParams( );

  touchParams.buttonType = json.buttonType;
  touchParams.redirectType = json.redirectType;
  touchParams.redirectChapter = json.redirectChapter;
  touchParams.redirectURL = json.redirectURL;

  return touchParams;
}

// TODO to remove this large prototype object. in just define the toJson function
THREEx.TouchParams.prototype = {

  constructor: THREEx.TouchParams,

  /**
   * convert the object into json data structure
   * @return {Object} - the json object
   */
  toJson: function ( ) { 

    var json = {

      buttonType: this.buttonType,
      redirectType: this.redirectType,
      redirectChapter: this.redirectChapter,
      redirectURL: this.redirectURL

    };

    return json;
  }

}
