/**
 * init this sub part
 * 
 * @param  {THREE.Editor} editor - the three.js editor
 * @param  {Object} $scope the angular 
 */

 THREEx.get3jsScene = function(scene, externalSave) {
         externalSave  = externalSave !== undefined ? externalSave : true
         // export the scene
         var exporter  = new THREE.ObjectExporter();
         var output    = exporter.parse(scene, externalSave);
         // beautifullation of the json
         output        = JSON.stringify(output, null, "\t");
         output        = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, "$1");
         // return the output
         return output;
 };
 
 THREEx.exportScene = function(scene) {
         var output  = THREEx.get3jsScene(scene,false);
         // output 
         var blob  = new Blob([output], {
                 type: "text/plain"
         });
         var objectURL  = URL.createObjectURL(blob);
         window.open(objectURL, "_blank");
         window.focus();
 };
 
 THREEx.exportObj = function(object) {
         // var editor = $scope.threejs.editor;
         // var object = editor.selected;
         if (object === null) {
                 alert("No object selected");
                 return
         }
         
         var exporter = new THREE.OBJExporter();
         var output = exporter.parse(object.geometry, false);
         var blob = new Blob([output], {
                 type: "text/plain"
         });
         var objectURL = URL.createObjectURL(blob);
         window.open(objectURL, "_blank");
         return window.focus();
 };

   //////////////////////////////////////////////////////////////////////////////////
   //    Comment                //
   //////////////////////////////////////////////////////////////////////////////////
   THREEx.findGeometryByUUID = function(root, uuid) {
           var found;
           found = undefined;
           root.traverse(function(object3d) {
                   var geometry;
                   geometry = object3d.geometry;
                   if (geometry === undefined) {
                           return;
                   }
                   if (geometry.uuid !== uuid) {
                           return;
                   }
                   found = geometry;
           });
           return found;
   };
   THREEx.findObjectByUUID = function(root, uuid) {
           var found;
           found = undefined;
           root.traverse(function(object3d) {
                   if (object3d.uuid !== uuid) {
                           return;
                   }
                   found = object3d;
           });
           return found;
   };


   //////////////////////////////////////////////////////////////////////////////////
   //    Comment                //
   //////////////////////////////////////////////////////////////////////////////////
   THREEx.exportZip = function(editor) {
           var content, editor, exportAsOBJ, exporter, jsZip, output, sceneJSON, zipProject;
        //    editor = $scope.threejs.editor;
           
           var exportAsOBJ = function(output, type) {
                   // export the callout text as texture
                   output.geometries.forEach(function(outputGeometry) {
                           var basename, geometry, objExporter, objFormat, uuid;
                           // if not a text geometry, do nothing
                           if (outputGeometry.type !== type) {
                                   return;
                           }
                           // find the geometry for this uuid
                           uuid = outputGeometry.uuid;
                           geometry = THREEx.findGeometryByUUID(editor.scene, uuid);
                           // export the geometry in OBJ
                           objExporter = new THREE.OBJExporter();
                           objFormat = objExporter.parse(geometry, false);
                           // add the file in the .zip
                           basename = type + "-" + uuid + ".OBJ";
                           zipProject.file(basename, objFormat);
                           // add the file url in the outputGeometry
                           outputGeometry.objFileUrl = basename;
                   });
           };
           
           jsZip = new JSZip();
           zipProject = jsZip.folder("4dstudio");
           exporter = new THREE.ObjectExporter();
           output = exporter.parse(editor.scene, false);
           exportAsOBJ(output, "TextGeometry");
           exportAsOBJ(output, "CalloutGeometry");
           
           output.object.children.forEach(function(outputObject) {
                   var calloutObject, uuid;
                   if (outputObject.type !== "Callout") {
                           return;
                   }
                   uuid = outputObject.uuid;
                   calloutObject = THREEx.findObjectByUUID(editor.scene, uuid);
                   (function() {
                           var base64Text, basename, dataURL, index, outputTexture, planeMesh, texture, textureExporter;
                           planeMesh = calloutObject.children[0];
                           texture = planeMesh.material.map;
                           textureExporter = new THREE.TextureExporter();
                           outputTexture = textureExporter.parse(texture);
                           dataURL = outputTexture.dataURL;
                           index = dataURL.indexOf(",");
                           base64Text = dataURL.slice(index + 1);
                           basename = "Callout-texture" + "-" + uuid + ".png";
                           zipProject.file(basename, base64Text, {
                                   base64: true
                           });
                           outputObject.textureUrl = basename;
                   })();
           });
           sceneJSON = JSON.stringify(output, null, "\t");
           sceneJSON = sceneJSON.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, "$1");
           zipProject.file("scene.js", sceneJSON);
           content = jsZip.generate({
                   type: "blob"
           });
           return saveAs(content, "4dstudio.zip");
   };