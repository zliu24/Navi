/**
 * @author mrdoob / http://mrdoob.com/
 * Modified by DAQRI
 */

THREE.ObjectExporter = function () {};

/**
 * ObjectExporter
 * Takes a threejs scene, iterates over all of its child objects and returns a generic object which can be stringified and turned back into a threejs scene by ObjectLoader
 */
THREE.ObjectExporter.prototype = {

  constructor: THREE.ObjectExporter,

  parse: function ( object, externalSave ) {

    // externalSave is a boolean to determine if this is for the local storage (auto saving) - False, or the 4DS save where we don't want geometric data on models - True

    // Step 1: Create empty 'output' array to store the result of the parse
    var output = {
      metadata: {
        version: 4.3,
        type: 'Object',
        generator: 'ObjectExporter'
      }
    };

    // Step 2: Save all valid scripts, whether behavior-generated or added through an IDE interface
    output.files = object.files || [];
    output.behaviors_obj = object.behaviors_obj || {};
    output.behaviors_gui = object.behaviors_gui || {};
    output.gui = object.gui || {};
    //output.wysiwyg_elements = object.wysiwyg_elements || [];
    output.scripts = {};
    for (var uuid in object.scripts) {
      var arr_scripts = object.scripts[uuid];

      if (arr_scripts.length < 1) continue

      output.scripts[uuid] = [];
      for (var i = 0; i < arr_scripts.length; i++) {
        var script = arr_scripts[i];
        if (script.source != '') {
          output.scripts[uuid].push(JSON.parse(JSON.stringify(script)));
        }
      }
    }

    // Creates array to hold various geometries we encounter while parsing
    var geometries = {};
    var geometryExporter = new THREE.GeometryExporter();

    var parseGeometry = function ( geometry, externalSave ) {

      if ( output.geometries === undefined ) {

        output.geometries = [];

      }

      if ( geometries[ geometry.uuid ] === undefined ) {

        var data = {};

        data.uuid = geometry.uuid;

        if ( geometry.name !== "" ) data.name = geometry.name;

        var handleParameters = function ( parameters ) {

          for ( var i = 0; i < parameters.length; i ++ ) {

            var parameter = parameters[ i ];

            if ( geometry.parameters[ parameter ] !== undefined ) {

              data[ parameter ] = geometry.parameters[ parameter ];

            }

          }

        };

        if ( geometry instanceof THREE.PlaneGeometry ) {

          data.type = 'PlaneGeometry';
          handleParameters( [ 'width', 'height', 'widthSegments', 'heightSegments' ] );

        } else if ( geometry instanceof THREE.BoxGeometry ) {

          data.type = 'BoxGeometry';
          handleParameters( [ 'width', 'height', 'depth', 'widthSegments', 'heightSegments', 'depthSegments' ] );

        } else if ( geometry instanceof THREEx.CalloutGeometry ) {

          data.type = 'CalloutGeometry';
          if( externalSave === true ){
            data.data = geometryExporter.parse( geometry );
          }
          handleParameters( ["width", "height", "radius", "arrowHeight", "arrowXRight", "arrowXCenter", "arrowXLeft", "amount", "bevelThickness", "bevelSize"] );

        } else if ( geometry instanceof THREE.CircleGeometry ) {

          data.type = 'CircleGeometry';
          handleParameters( [ 'radius', 'segments' ] );

        } else if ( geometry instanceof THREE.CylinderGeometry ) {

          data.type = 'CylinderGeometry';
          handleParameters( [ 'radiusTop', 'radiusBottom', 'height', 'radialSegments', 'heightSegments', 'openEnded' ] );

        } else if ( geometry instanceof THREE.SphereGeometry ) {

          data.type = 'SphereGeometry';
          handleParameters( [ 'radius', 'widthSegments', 'heightSegments', 'phiStart', 'phiLength', 'thetaStart', 'thetaLength' ] );

        } else if ( geometry instanceof THREE.IcosahedronGeometry ) {

          data.type = 'IcosahedronGeometry';
          handleParameters( [ 'radius', 'detail' ] );

        } else if ( geometry instanceof THREE.TorusGeometry ) {

          data.type = 'TorusGeometry';
          handleParameters( [ 'radius', 'tube', 'radialSegments', 'tubularSegments', 'arc' ] );

        } else if ( geometry instanceof THREE.TorusKnotGeometry ) {

          data.type = 'TorusKnotGeometry';
          handleParameters( [ 'radius', 'tube', 'radialSegments', 'tubularSegments', 'p', 'q', 'heightScale' ] );

        } else if ( geometry instanceof THREEx.TextGeometry ) {

          data.type = 'TextGeometry';
          if (externalSave === true) {
            data.data = geometryExporter.parse( geometry );
          }
          handleParameters( [ 'text', 'font', 'weight', 'size', 'height', 'bevelThickness', 'bevelSize', 'bevelEnabled', 'bevelSegments', 'curveSegments' ] );

        } else if ( geometry instanceof THREE.BufferGeometry ) {

          data.type = 'BufferGeometry';

          if (externalSave === true) {
            data.data = geometry.toJSON();
            delete data.data.metadata;
          }

        } else if ( geometry instanceof THREE.Geometry ) {
          if (externalSave === true) {
            data.data = geometryExporter.parse( geometry );
            delete data.data.metadata;
          }

          data.type = 'Geometry';
        }

        geometries[ geometry.uuid ] = data;
        output.geometries.push( data );

      }

      return geometry.uuid;

    };

    // Creates array to hold various materials we encounter while parsing
    var materials = {};
    // var materialExporter = new THREE.MaterialExporter();

    var parseMaterial = function ( material ) {

      if ( output.materials === undefined ) {

        output.materials = [];

      }

      if ( materials[ material.uuid ] === undefined ) {
        //       need the meta object for toJSON method
            var meta = {
        		geometries: {},
        		materials: {},
        		textures: {},
        		images: {}
        	};
        // var data = materialExporter.parse( material );
        var data = material.toJSON(meta);
        delete data.metadata;

        if( material.map ){
          data.map  = parseTexture( material.map )
        }

        materials[ material.uuid ] = data;

        output.materials.push( data );

      }

      return material.uuid;

    };

    // Creates array to hold various textures we encounter while parsing
    var textures = {};
    var textureExporter = new THREE.TextureExporter();

    // Verify which textures we actually need to save (not the ones we download)
    var textureCheck = {};
    if (object.files) {
      for (var fileCount = 0; fileCount < object.files.length; fileCount++) {
        if (object.files[fileCount].type_of == "Image" || object.files[fileCount].type == "Image") {
          textureCheck[object.files[fileCount].uuid] = true;
        }
      }
    }

    var parseTexture = function ( texture ) {

      if ( output.textures === undefined ) {

        output.textures = [];

      }

      if ( textures[ texture.uuid ] === undefined ) {
        var data = {};
        if ( textureCheck [texture.uuid] == true ) {
          data["uuid"] = texture.uuid;
        } else {
          data = textureExporter.parse( texture );
        }

        delete data.dataURL;
        delete data.metadata;

        textures[ texture.uuid ] = data;

        output.textures.push( data );

      }

      return texture.uuid;

    };

    /**
     * parseObject
     * Iterates over given object3d and all its children
     * For each mesh type we encounter, extract material/geometry/texture accordingly and store in 'data'. Data is then
     * @param {Step} step
     */
    var parseObject = function ( object, externalSave ) {

      var data = {};

      data.uuid = object.uuid;

      if ( object.name !== '' ) data.name = object.name;
      if ( JSON.stringify( object.userData ) !== '{}' ) data.userData = object.userData;
      if ( object.visible !== true ) {
        data.visible = object.visible;
      }
      data.sceneVisible = object.visible;  // So when mobile manually sets visible = false in scripts (e.g. during scene load or target lost), it can restore to the original saved value

      if ( object instanceof THREE.Scene ) {

        data.type = 'Scene';

      } else if ( object instanceof THREE.PerspectiveCamera ) {

        data.type = 'PerspectiveCamera';
        data.fov = object.fov;
        data.aspect = object.aspect;
        data.near = object.near;
        data.far = object.far;

      } else if ( object instanceof THREE.OrthographicCamera ) {

        data.type = 'OrthographicCamera';
        data.left = object.left;
        data.right = object.right;
        data.top = object.top;
        data.bottom = object.bottom;
        data.near = object.near;
        data.far = object.far;

      } else if ( object instanceof THREE.AmbientLight ) {

        data.type = 'AmbientLight';
        data.color = object.color.getHex();

      } else if ( object instanceof THREE.DirectionalLight ) {

        data.type = 'DirectionalLight';
        data.color = object.color.getHex();
        data.intensity = object.intensity;
        if (object.target) data.targetUUID = object.target.uuid

      } else if ( object instanceof THREE.PointLight ) {

        data.type = 'PointLight';
        data.color = object.color.getHex();
        data.intensity = object.intensity;
        data.distance = object.distance;

      } else if ( object instanceof THREE.SpotLight ) {

        data.type = 'SpotLight';
        data.color = object.color.getHex();
        data.intensity = object.intensity;
        data.distance = object.distance;
        data.angle = object.angle;
        data.exponent = object.exponent;
        if (object.target) data.targetUUID = object.target.uuid

      } else if ( object instanceof THREE.HemisphereLight ) {

        data.type = 'HemisphereLight';
        data.color = object.color.getHex();
        data.groundColor = object.groundColor.getHex();

      } else if ( object instanceof THREEx.Text2DObject ) {

        data.type  = 'Text2DObject';
        data.parameters  = JSON.parse(JSON.stringify(object.parameters))
        data.geometryUUID = parseGeometry(object.geometry);

      } else if ( object instanceof THREEx.Sprite2DObject ) {

        data.type  = 'Sprite2DObject';
        data.parameters  = JSON.parse(JSON.stringify(object.parameters))

      } else if ( object instanceof THREEx.ArrowModelObject ) {
        data.type  = 'ArrowModelObject';
        data.parameters  = JSON.parse(JSON.stringify(object.parameters));
        data.material = parseMaterial( object.children[0].material );
        data.child ={};
        data.child.position = JSON.parse(JSON.stringify(object.children[0].position));
        data.child.rotation = JSON.parse(JSON.stringify(object.children[0].rotation));
        data.child.scale = JSON.parse(JSON.stringify(object.children[0].scale));
        data.child.uuid = JSON.parse(JSON.stringify(object.children[0].uuid));
        data.child.visible = object.children[0].visible;
        if (object.children[0].posrotscaAnimation) {
          if (!(object.children[0].posrotscaAnimation instanceof THREEx.PosrotscaAnimation)) {
            var animationOptions = object.children[0].posrotscaAnimation;
            object.children[0].posrotscaAnimation = new THREEx.PosrotscaAnimation(object.children[0]);
            _.extend(object.children[0], animationOptions);
          }

          data.child.posrotscaAnimation = object.children[0].posrotscaAnimation.toJson();
        }
      } else if ( object instanceof THREEx.Callout ) {

        data.type  = 'Callout';
        data.geometry  = parseGeometry( object.geometry )
        data.material  = parseMaterial( object.material )
        data.text  = object.text

        var planeMesh  = object.children[0]
        var map  = planeMesh.material.map

      } else if ( object instanceof THREEx.VideoObject ) {

        data.type  = 'VideoObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.AudioObject ) {

        data.type  = 'AudioObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.GalleryObject ) {

        data.type  = 'GalleryObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.ImageObject ) {

        data.type  = 'ImageObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.ButtonObject ) {

        data.type  = 'ButtonObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.LinkObject ) {

        data.type  = 'LinkObject';
        object.toJson( data );

      } else if ( object instanceof THREEx.PdfObject ) {

        data.type = 'PdfObject';
        object.toJson(data);

       } else if ( object instanceof THREE.Mesh ) {

        data.type = 'Mesh';
        data.geometry = parseGeometry( object.geometry , externalSave );
        data.material = parseMaterial( object.material );

      } else if ( object instanceof THREE.Sprite ) {

        data.type = 'Sprite';
        data.material = parseMaterial( object.material );

      } else {

        data.type = 'Object3D';

      }

      data.matrix = object.matrix.toArray();

      // handle threex.posrotscaanimation
      if (object.posrotscaAnimation) {
        if (!(object.posrotscaAnimation instanceof THREEx.PosrotscaAnimation)) {
          var animationOptions = object.posrotscaAnimation;
          object.posrotscaAnimation = new THREEx.PosrotscaAnimation(object);
          _.extend(object, animationOptions);
        }

        data.posrotscaAnimation = object.posrotscaAnimation.toJson();
      }

      if ( object.touchParams ) {

        data.touchParams = object.touchParams.toJson()

      }


      if ( object.children.length > 0 ) {

        data.children = [];

        for ( var i = 0; i < object.children.length; i ++ ) {

          if( object.children[i].userData.selectableUUID !== undefined )  continue

          if( object.children[i].serialisable === false )  continue
          // Prevent duplication of children since the parent and the child are created in the same class
          if( object.children[i].parent instanceof THREEx.ArrowModelObject )  continue

          data.children.push( parseObject( object.children[ i ], externalSave ) );

        }

        if( data.children.length === 0 )  delete data.children

      }

      // We now have a genericized object of the given object3d and all its children
      return data;
    }

    // Step 3: begin recursive parsing of the top level scene object and all its children
    output.object = parseObject( object , externalSave );

    // We now have a genericized object which can be easily stringified
    return output;

  }

}
