/**
 * @author mrdoob / http://mrdoob.com/
 * Modified by DAQRI
 */

THREE.ObjectLoader = function ( manager ) {

  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.ObjectLoader.prototype = {

  constructor: THREE.ObjectLoader,

  /**
   * THREE.ObjectLoader.load: downloads json from given URL and parses it
   * @param {string} url
   * @param {function} onLoad
   * @param {function} onProgress
   * @param {function} onError
   */
  load: function ( url, onLoad, onProgress, onError ) {

    var scope = this;

    var loader = new THREE.XHRLoader( scope.manager );
    loader.setCrossOrigin( this.crossOrigin );
    loader.load( url, function ( text ) {

      onLoad( scope.parse( JSON.parse( text ) ) );

    } );

  },

  setCrossOrigin: function ( value ) {

    this.crossOrigin = value;

  },


  /**
   * THREE.ObjectLoader.parse: takes given threejs scene object and
   * @param {object} Scene json parsed into an anonymous object
   */
  parse: function ( obj ) {
    // 1. Iterate over scene.files, separate them out into various arrays (videos, audios, textures, geometries)
    var files = this.parseFiles(obj.files);
    var videos = files.videos;
    var audios = files.audios;

    // 2. Now that we have the geometries stored on s3, mix them together with the geometries found in obj into 'geometries' var
    var geometries = this.parseGeometries( obj.geometries, files.geometries );

    // 3. Similarly, mix downloaded textures from obj.files with the textures found within the obj itself
    var textures = this.parseTextures(obj, files.textures);

    // 4. Now that we have all textures loaded into a var, use it to construct materials
    var materials = this.parseMaterials( obj.materials, textures );
    //console.log("About to parse object:");
    //console.log("files", files);
    //console.log("geometries", geometries);
    //console.log("materials", materials);

    // 5. For each child 3js object, instantiate it as the given three.js object type using all of the above resources.
    var object = this.parseObject(obj.object, geometries, materials, textures, videos, audios, obj.files);

    // 6. Set obj.files equal to the original obj.files
    if (obj.files !== undefined)
      object.files = obj.files;
    else
      object.files =  [];

    if (obj.behaviors_obj !== undefined)
      object.behaviors_obj = obj.behaviors_obj;
    else
      object.behaviors_obj = {};

    if (obj.behaviors_gui !== undefined)
      object.behaviors_gui = obj.behaviors_gui;
    else
      object.behaviors_gui = {};

    if (obj.gui !== undefined)
      object.gui = obj.gui;
    else
      object.gui = { };

    if (obj.wysiwyg_elements !== undefined)
      object.wysiwyg_elements = obj.wysiwyg_elements;
    else
      object.wysiwyg_elements = [];

    if (obj.scripts !== undefined)
      object.scripts = obj.scripts;
    else
      object.scripts = {};

    // 7. Done! Object is now a threejs scene with all geometries, materials, textures, videos, audios etc instantiated and valid three.js object types
    return object;
  },

  /**
   * THREE.ObjectLoader.parseFiles: For each sceneFile in the given array, find corresponding downloaded file in THREEx.assetDownloads, place in sceneAssets.geometries[uuid], sceneAssets.videos[uuid], sceneAssets.audios[uuid], sceneAssets.textures[uuid]
   * @param {array objects} Array of sceneFile objects
   */
  parseFiles: function (sceneFiles) {
    var sceneAssets = {};
    sceneAssets.geometries = {};
    sceneAssets.textures = {};
    //console.log("= sceneFiles", sceneFiles, "= THREEx.assetDownloads", THREEx.assetDownloads);
    if (sceneFiles !== undefined) {

      var assetDownloads = THREEx.assetDownloads;

      for ( var i = 0; i < sceneFiles.length; i++ ) {

        var fileData;
        var name;

        var sceneFile = sceneFiles[ i ];

        if (sceneFile === undefined) { continue };

        // model files use an array of uuids instead of single uuid
        var assetID = sceneFile.uuid || sceneFile.uuids.join(',');
        // We assume the structure of data to consist of an assetID, type, and an array of UUID's

        var assetDownloadState;
        if (assetDownloads !== undefined) {
          assetDownloadState = assetDownloads[assetID];
        }

        if (assetDownloadState !== undefined && assetDownloadState.fileData !== undefined ) {
          fileData = assetDownloadState.fileData;
          name = assetDownloadState.url.split("/").pop();
          //console.log("found scene asset: " + name + " (asset ID = " + assetID + ")");
        }
        else {
          //console.log("error! scene references asset " + assetID + " which failed to download");
          //console.log("asset download status: ");
          //console.log(assetDownloadState);
          continue
        }

        //console.log("File " + i, sceneFile, "assetDownloadState", assetDownloadState, "name", name, "TYPE", sceneFile.type || sceneFile.type_of);

        switch ( sceneFile.type || sceneFile.type_of ) {
          case 'Geometry':
            var geometries = JSON.parse(fileData);
            
            if (Object.prototype.toString.call( geometries ) === '[object Array]' ) {  // For use by model import
              if (geometries.length != sceneFile.uuids.length) {
                //console.log("len", geometries, "uuidslen", sceneFile.uuids);
                //console.error("Error! Downloaded object's number of child geometries does not match the number of uuids in scene.files");
              }
               for (var j = 0; j < geometries.length; j++) {
                var uuid = sceneFile.uuids[j];
                sceneAssets.geometries[ uuid ] = geometries[j];
              }
            } else { // For use by scene import
              var uuid = sceneFile.uuid;
              var geometry = geometries;
              sceneAssets.geometries[uuid] = geometry.data;
            }
            break;
          case 'BufferGeometry':
            // buffer geometries
            if(assetDownloadState.file_extension === "bin" ){
              
              var geometries = this.parseBinary(fileData, JSON.parse(assetDownloadState.metadata));
              
            }else{
              var geometries = JSON.parse(fileData);
            }
            
            
            if (Object.prototype.toString.call( geometries ) === '[object Array]' ) {  // For use by model import
              if (geometries.length != sceneFile.uuids.length) {
                //console.log("len", geometries, "uuidslen", sceneFile.uuids);
                //console.error("Error! Downloaded object's number of child geometries does not match the number of uuids in scene.files");
              }
               for (var j = 0; j < geometries.length; j++) {
                var uuid = sceneFile.uuids[j];
                sceneAssets.geometries[ uuid ] = geometries[j];
              }
            } else { // For use by scene import
              var uuid = sceneFile.uuid;
              var geometry = geometries;
              sceneAssets.geometries[uuid] = geometry.data;
            }
            break;
          case 'Image':
            var texture = fileData;
            texture.uuid = sceneFile.uuid;
            sceneAssets.textures[ sceneFile.uuid ] = texture;
            break;

          // For Video the uuid is actually the uuid of the object the video is attached to. Videos currently dont have a separation from their object
          case 'Video':
          case 'GIF':
            var video = fileData;
            video.uuid = sceneFile.uuid;
            if(!sceneAssets.videos) {
              sceneAssets.videos = {};
            }
            sceneAssets.videos[ video.uuid ] = video;
            break;

          case 'Audio':
            var audio = fileData;
            audio.uuid = sceneFile.uuid;
            if (!sceneAssets.audios) {
              sceneAssets.audios = {};
            }
            sceneAssets.audios[ audio.uuid ] = audio;
            break;
          case 'PDF':
            var pdf = fileData;
            pdf.uuid = sceneFile.uuid;
            if (!sceneAssets.documents) {
              sceneAssets.documents = {};
            }
            sceneAssets.documents[pdf.uuid] = pdf;
            break;

          /* Model files are added to scene files in order to display asset usage for imported models */
          case 'Model':
            break;

          default:
            alert('Unsupported asset type: ' + (sceneFile.type || sceneFile.type_of));
            break;
        }
      }
    }
    return sceneAssets;
  },

  parseGeometries: function ( json, geometries) {

    if( geometries === undefined) {
      geometries = {};
    }

    if ( json !== undefined ) {

      var geometryLoader = new THREE.JSONLoader();
      var bufferGeometryLoader = new THREE.BufferGeometryLoader();

      for ( var i = 0, l = json.length; i < l; i ++ ) {

        var geometry;
        var data = json[ i ];

        if( data === undefined ) {
          continue;
        }

        switch ( data.type ) {

          case 'PlaneGeometry':

            geometry = new THREE.PlaneGeometry(
              data.width,
              data.height,
              data.widthSegments,
              data.heightSegments
            );

            break;

          case 'BoxGeometry':
          case 'CubeGeometry': // DEPRECATED

            geometry = new THREE.BoxGeometry(
              data.width,
              data.height,
              data.depth,
              data.widthSegments,
              data.heightSegments,
              data.depthSegments
            );

            break;

          case 'CalloutGeometry':

            geometry = new THREEx.CalloutGeometry({
              width  : data.width,
              height  : data.height,
              radius  : data.radius,

              arrowHeight  : data.arrowHeight,
              arrowXRight  : data.arrowXRight,
              arrowXCenter  : data.arrowXCenter,
              arrowXLeft  : data.arrowXLeft,

              amount    : data.amount,
              bevelThickness  : data.bevelThickness,
              bevelSize  : data.bevelSize,
            })

            break;

          case 'CircleGeometry':

            geometry = new THREE.CircleGeometry(
              data.radius,
              data.segments
            );

            break;

          case 'CylinderGeometry':

            geometry = new THREE.CylinderGeometry(
              data.radiusTop,
              data.radiusBottom,
              data.height,
              data.radialSegments,
              data.heightSegments,
              data.openEnded
            );

            break;

          case 'SphereGeometry':

            geometry = new THREE.SphereGeometry(
              data.radius,
              data.widthSegments,
              data.heightSegments,
              data.phiStart,
              data.phiLength,
              data.thetaStart,
              data.thetaLength
            );

            break;

          case 'IcosahedronGeometry':

            geometry = new THREE.IcosahedronGeometry(
              data.radius,
              data.detail
            );

            break;

          case 'TorusGeometry':

            geometry = new THREE.TorusGeometry(
              data.radius,
              data.tube,
              data.radialSegments,
              data.tubularSegments,
              data.arc
            );

            break;

          case 'TorusKnotGeometry':

            geometry = new THREE.TorusKnotGeometry(
              data.radius,
              data.tube,
              data.radialSegments,
              data.tubularSegments,
              data.p,
              data.q,
              data.heightScale
            );

            break;

          case 'TextGeometry':

            geometry = new THREEx.TextGeometry(
              data.text,
              {
                font  : data.font,
                weight  : data.weight,
                size  : data.size,
                height  : data.height,
                bevelEnabled  : data.bevelEnabled,
                bevelThickness  : data.bevelThickness,
                bevelSize  : data.bevelSize,
                bevelSegments  : data.bevelSegments,
                curveSegments  : data.curveSegments
              }
            );

            break;

          case 'BufferGeometry':

            geometry = bufferGeometryLoader.parse( geometries[data.uuid] );

            break;

          case 'Geometry':

            if( geometries[data.uuid] !== undefined ) {
              var geo = (geometries[data.uuid].data ? geometries[data.uuid].data : geometries[data.uuid]);
              geometry = geometryLoader.parse( geo ).geometry;
            } else {
              geometry = undefined;
            }

            break;
        }

        if (geometry !== undefined) {
          geometry.uuid = data.uuid;
          if (data.name !== undefined) {
            geometry.name = data.name;
          }
        }

        geometries[ data.uuid ] = geometry;
      }
    }

    return geometries;
  },

  parseTextures: function (obj, textures) {
    var json = obj.textures;
    var objFiles = obj.files;

    if (textures === undefined) {
      textures = {};
    }

    if ( json !== undefined ) {
      var loader = new THREE.TextureLoader();

      for ( var i = 0, l = json.length; i < l; i ++ ) {

        var data = json[ i ];
        var texture;

        if( textures[ data.uuid ] !== undefined ) {
          continue;
        }

        texture = loader.parse(data, objFiles);

        texture.uuid = data.uuid;

        if ( data.name !== undefined ) texture.name = data.name;

        textures[ data.uuid ] = texture;

      }

    }

    return textures;
  },

  parseMaterials: function ( json, textures ) {

    var materials = {};

    if ( json !== undefined ) {

      var loader = new THREE.MaterialLoader();

      for ( var i = 0, l = json.length; i < l; i ++ ) {

        var data = json[ i ];
        var material = loader.parse( data, textures );

        if( material === null )  continue

        material.uuid = data.uuid;

        if ( data.name !== undefined ) material.name = data.name;

        materials[ data.uuid ] = material;

      }

    }

    return materials;

  },

  parseObject: function () {

    var matrix = new THREE.Matrix4();

    return function (data, geometries, materials, textures, videos, audios, files) {

      var object;
      switch ( data.type ) {

        case 'Scene':

          object = new THREE.Scene();

          break;

        case 'PerspectiveCamera':

          object = new THREE.PerspectiveCamera( data.fov, data.aspect, data.near, data.far );

          break;

        case 'OrthographicCamera':

          object = new THREE.OrthographicCamera( data.left, data.right, data.top, data.bottom, data.near, data.far );

          break;

        case 'AmbientLight':

          object = new THREE.AmbientLight( data.color );

          break;

        case 'DirectionalLight':

          object = new THREE.DirectionalLight( data.color, data.intensity );
          object.targetUUID = data.targetUUID

          break;

        case 'PointLight':

          object = new THREE.PointLight( data.color, data.intensity, data.distance );

          break;

        case 'SpotLight':

          object = new THREE.SpotLight( data.color, data.intensity, data.distance, data.angle, data.exponent );
          object.targetUUID = data.targetUUID

          break;

        case 'HemisphereLight':

          object = new THREE.HemisphereLight( data.color, data.groundColor, data.intensity );

          break;

        case 'Text2DObject':
          var object = new THREEx.Text2DObject()
          object.parameters = JSON.parse(JSON.stringify(data.parameters))
          object.geometry = geometries[ data.geometryUUID ];
          object.update()
          break;

        case 'Sprite2DObject':
          var object = new THREEx.Sprite2DObject()
          object.parameters = JSON.parse(JSON.stringify(data.parameters))
          object.update()
          break;

        case 'ArrowModelObject':
          var parameters = JSON.parse(JSON.stringify(data.parameters));
          var object = new THREEx.ArrowModelObject(parameters);
          object.name = data.name;
          object.children[0].material = materials[data.material];
          object.children[0].material.needsUpdate = true;
          var position = JSON.parse(JSON.stringify(data.child.position));
          var rotation = JSON.parse(JSON.stringify(data.child.rotation));
          var scale = JSON.parse(JSON.stringify(data.child.scale));
          object.children[0].position.set(position.x,position.y,position.z);
          object.children[0].rotation.set( rotation._x, rotation._y, rotation._z, rotation._order );
          object.children[0].scale.set(scale.x,scale.y,scale.z);
          object.children[0].uuid = JSON.parse(JSON.stringify(data.child.uuid));
          object.children[0].visible = data.child.visible;
          object.update();
          if ( data.child.posrotscaAnimation ){
            object.children[0].posrotscaAnimation  = THREEx.PosrotscaAnimation.fromJson(object.children[0], data.child.posrotscaAnimation);
            if (object.children[0].posrotscaAnimation.nSteps()) {
              object.children[0].posrotscaAnimation.set(object, 0);
            }
          }
          
          break;
        case 'Callout':


          var geometry = geometries[ data.geometry ];
          var material = materials[ data.material ];
          object     = new THREEx.Callout( geometry, material )
          object.text  = data.text
          object.textNeedsUpdate  = true
          object.update()

          // make children unselectable
          object.children.forEach(function(child){
            child.userData.selectableUUID  = data.uuid
          })

          break;

        case 'VideoObject':
          object    = new THREEx.VideoObject()

          object.fromJson(data);
          if (!object.video) {
            object.video = {}
          }
          var rawVideo;
          if (videos) {
            rawVideo = videos[data.uuid]
          }
          if (rawVideo) {
            object.load(rawVideo.src, false);
          } else if (files) {
            var videoFile = files.filter(function(file) {
              return file.uuid == data.uuid;
            })[0];
            if (videoFile) {
              object.load(videoFile.url, false);
            } else {
              console.log("ObjectLoader: no video to load.", data, files);
            }
          }
          break;

        case 'AudioObject':
          var audio = null;
          if( audios ) {
            audio = audios[data.uuid]
          }

          if (audio) {
            object = audio;
            object.fromJson ( data );
          } else {
            object    = new THREEx.AudioObject()
          }

          break;

        case 'GalleryObject':

          object = new THREEx.GalleryObject( data.height );
          object.fromJson ( data, textures );

          // If there are already slides in the gallery, set the gallery to the first slide to skip the placeholder image
          if (Object.keys(textures).length > 0) {
            object.setIndex(0);
          }
          break;

        case 'ImageObject':
          object    = new THREEx.ImageObject()
          object.fromJson(data);
          break;

        case 'ButtonObject':
          object    = new THREEx.ButtonObject()
          object.fromJson(data);
          break;

        case 'LinkObject':
          object    = new THREEx.LinkObject()
          object.fromJson(data);
          break;

        case 'PdfObject':
          object      = new THREEx.PdfObject();
          object.fromJson(data);
          break;

        case 'Mesh':
          var geometry = geometries[ data.geometry ];
          var material = materials[ data.material ];

          if ( geometry === undefined ) {

            //console.error( 'THREE.ObjectLoader: Undefined geometry ' + data.geometry );
            //console.log(geometries);

          }

          if ( material === undefined ) {

            //console.error( 'THREE.ObjectLoader: Undefined material ' + data.material );
            var material = new THREE.MeshNormalMaterial()
          }

          if(geometry) {
            if (geometry.morphTargets && geometry.morphTargets.length > 0) {
              // jme- to support import of morph animation
              material.morphTargets  = true
              object = new THREE.MorphAnimMesh( geometry, material );
            }else{
              object = new THREE.Mesh( geometry, material );
            }
          }
          else {
            object = new THREE.Object3D();
          }

          break;

        case 'Sprite':

          var material = materials[ data.material ];

          if ( material === undefined ) {

            console.error( 'THREE.ObjectLoader: Undefined material ' + data.material );

          }

          object = new THREE.Sprite( material );

          break;

        default:

          object = new THREE.Object3D();

      }

      object.uuid = data.uuid;

      if ( data.name !== undefined ) object.name = data.name;
      if ( data.matrix !== undefined ) {

        matrix.fromArray( data.matrix );
        matrix.decompose( object.position, object.quaternion, object.scale );

      } else {

        if ( data.position !== undefined ) object.position.fromArray( data.position );
        if ( data.rotation !== undefined ) object.rotation.fromArray( data.rotation );
        if ( data.scale !== undefined ) object.scale.fromArray( data.scale );

      }

      if ( data.visible !== undefined ) object.visible = data.visible;
      if ( data.userData !== undefined ) object.userData = data.userData;


      // handle threex.posrotscaanimation
      if ( data.posrotscaAnimation ){
        object.posrotscaAnimation  = THREEx.PosrotscaAnimation.fromJson(object, data.posrotscaAnimation);
        if (object.posrotscaAnimation.nSteps()) {
          object.posrotscaAnimation.set(object, 0);
        }
      }

      if ( data.touchParams ) {
        object.touchParams = THREEx.TouchParams.fromJson( data.touchParams );
      }


      if ( data.children !== undefined ) {

        for ( var child in data.children ) {

          object.add(this.parseObject(data.children[child], geometries, materials, textures, videos, audios, files) );

        }
      }

      object.behavior = data.behavior;

      return object;

    }

  }(),
  parseBinary : function(buffer, metadata){

    var geometries = metadata.geometries;
    var index = 0;
    for (var i = 0; i < geometries.length; i++) {
        var geometryData = geometries[i];
        geometries[i].data.attributes = extractData(geometryData, buffer, index);
        index += geometryData.colorLength * 4 + geometryData.normalLength * 4 + geometryData.positionLength * 4 + geometryData.uvLength * 4;
    }
    return geometries;
    
    function extractData(data, buffer,index){

        var newAttributes = data.data.attributes;
        
        newAttributes.color.array    = new Float32Array( buffer, index, data.colorLength );
        newAttributes.normal.array   = new Float32Array( buffer, index + data.colorLength * 4, data.normalLength);
        newAttributes.position.array = new Float32Array( buffer, index + data.colorLength * 4 + data.normalLength * 4, data.positionLength);
        newAttributes.uv.array       = new Float32Array( buffer, index + data.colorLength * 4 + data.normalLength * 4 + data.positionLength * 4, data.uvLength );
        
        return newAttributes;
    }
  }

};
