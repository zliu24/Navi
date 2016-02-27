var THREEx	= THREEx	|| {}

/**
 * Creates a dynamic texture with an underlying canvas
 * 
 * @class
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 */
THREEx.DynamicTexture	= function(width, height){
	var canvas	= document.createElement( 'canvas' )
	canvas.width	= width
	canvas.height	= height
	this.canvas	= canvas

	//Store width and height
	this.textureWidth = width;
	this.textureHeight = height;


	var context	= canvas.getContext( '2d' )
	this.context	= context

	var texture	= new THREE.CanvasTexture(canvas)
	this.texture	= texture
}

/**
 * Clear the canvas
 *
 * @param  {String=} fillStyle - The fillStyle to clear with, if not provided, fallback on .clearRect
 * @return {THREEx.DynamicTexture} - The object itself, for chained api
 */
THREEx.DynamicTexture.prototype.clear = function(fillStyle){
	// depends on fillStyle
	if( fillStyle !== undefined ){
		this.context.fillStyle	= fillStyle
		this.context.fillRect(0,0,this.canvas.width, this.canvas.height)
	}else{
		this.context.clearRect(0,0,this.canvas.width, this.canvas.height)
	}
	// make the texture as .needsUpdate
	this.texture.needsUpdate	= true;
	// for chained API
	return this;
}

/**
 * Draws the given text
 *
 * @param  {String}	text - The text to display
 * @param  {Number=} x - If provided, it is the x where to draw, if not, the text is centered
 * @param  {Number}	y	- The y where to draw the text
 * @param  {String} fillStyle - The fillStyle to clear with, if not provided, fallback on .clearRect
 * @param  {String=} contextFont - The font to use
 * @return {THREEx.DynamicTexture} - The object itself, for chained texture
 */
THREEx.DynamicTexture.prototype.drawText = function(text, x, y, fillStyle, contextFont){
	// set font if needed
	if( contextFont !== undefined )	this.context.font = contextFont;
	// if x isnt provided
	if( x === undefined || x === null ){
		var textSize	= this.context.measureText(text);
		x = (this.canvas.width - textSize.width) / 2;
	}
	// actually draw the text
	this.context.fillStyle = fillStyle;
	this.context.fillText(text, x, y);
	// make the texture as .needsUpdate
	this.texture.needsUpdate	= true;
	// for chained API
	return this;
};

/**
 * Draw text with a lot of options
 * 
 * @param  {Object} options - The options to set. { margin: int, lineHeight: int, align: 'left|right|center', fillStyle: HTML Color Value, fontSize: integer, fontFamily: 'FontFamilyName', fontWeight: 'normal|bold|lighter|bolder', shadowEnabled: bool, shadowOffsetX: int, shadowOffsetY: int }
 * @param  {Number} visualWidth - The width of the canvas
 * @param  {Number} visualHeight - The height of the canvas
 * @return {THREEx.DynamicTexture}	- The object itself, for chained API
 */
THREEx.DynamicTexture.prototype.drawTextCooked = function(options,visualWidth,visualHeight){
	var context	= this.context
	var canvas	= this.canvas
	options		= options	|| {}
	var text	= options.text;

	var params	= {
		margin		: options.margin !== undefined ? options.margin	: 20,
		lineHeight	: options.lineHeight !== undefined ? options.lineHeight : 10,
		align		: options.align !== undefined ? options.align : 'left',
		fontColor	: options.fillStyle !== undefined ? options.fillStyle : '#000000',
		// - Font changes
		fontSize	: options.fontSize !== undefined ? options.fontSize : 90,
		fontFamily	: options.fontFamily !== undefined ? options.fontFamily : "Arial",
		fontWeight	: options.fontWeight !== undefined ? options.fontWeight : "bold",
		// - Changes for shadow
		shadowEnabled 	: options.shadowEnabled !== undefined ? options.shadowEnabled : true,
		shadowColor 	: options.shadowColor !== undefined ? options.shadowColor : "#000000",
		shadowOffsetX 	: options.shadowOffsetX !== undefined ? options.shadowOffsetX : 2,
		shadowOffsetY 	: options.shadowOffsetY !== undefined ? options.shadowOffsetY : 2,
	}
	// sanity check
	console.assert(typeof(text) === 'string')

	// Reset canvas size to prevent text deformation on the geometry size changes
	canvas.width 	= visualWidth*this.textureWidth;
	canvas.height 	= visualHeight*this.textureHeight;
	
	var offsetY	= (params.lineHeight + params.fontSize+params.margin);
	
	var _this = this;
	var arrayText = text.split("\n");
	
	arrayText.forEach(function(lineText){
		//Write text in canvas
		offsetY = _this.writeText(lineText,offsetY,params);
	});
	
	

	// make the texture as .needsUpdate
	this.texture.needsUpdate	= true;
	// for chained API
	return this;
}

/**
 * Draw a marker
 * 
 * @param  {object} options - The options to draw { text: string, shape: 'circle|triangle|square', lineHeight: int, align: 'left|right|center', shapeColor: HTML Color Value, fontSize: integer, fontFamily: 'FontFamilyName', fontWeight: 'normal|bold|lighter|bolder', shadowEnabled: bool }
 * @return {THREEx.DynamicTexture}	- The object itself, for chained API
 */
THREEx.DynamicTexture.prototype.drawTextureSprite = function(options){
	var context	= this.context
	var canvas	= this.canvas
	options		= options	|| {}
	var text	= options.text
	var params = {
		// Choose shape between circle, triangle or square
		shape           : options.shape !== undefined ? options.shape		: 'circle',
		// Choose the color of the shape
		shapeColor      : options.shapeColor !== undefined ? options.shapeColor	: '#465FCD',
		// Choose the text inside the shape
		text            : options.text !== undefined ? options.text		: 'S',
		// Choose the lineHeight value ; The textDraw (canvas) will draw the bottom of the letters at this value
		// Every time we go to another line, we add to the offsetY : fontSize + lineHeight
		lineHeight      : options.lineHeight !== undefined ? options.lineHeight : 0,
		fontSize        : options.fontSize !== undefined ? options.fontSize	: 90,
		fontFamily      : options.fontFamily !== undefined ? options.fontFamily	: "Arial",
		fontWeight      : options.fontWeight !== undefined ? options.fontWeight	: "bold",
		fontColor       : options.fontColor !== undefined ? options.fontColor	: "#ffffff",
		// Default align is center because => Inside the shape
		align		: options.align !== undefined ? options.align 		: 'center',
		shadowEnabled 	: options.shadowEnabled !== undefined ? options.shadowEnabled : false,
		margin		: options.margin !== undefined ? options.margin 	: 0,
	}

	// sanity check
	console.assert(typeof(text) === 'string')

	// Reset canvas size to prevent text deformation on the geometry size changes
	canvas.width 	= this.textureWidth;
	canvas.height 	= this.textureHeight;

	context.save()

	context.fillStyle = params.shapeColor;
	if(params.shape === "square"){
		// posX, posY, sizeX, sizeY
		context.fillRect(0, 0, this.textureWidth, this.textureHeight );
	}else if(params.shape === "circle"){
		// posX, posY, radius, start angle, end angle, counter clockwise
		context.arc( this.textureWidth/2, this.textureHeight/2,	this.textureHeight/2, 0, 2 * Math.PI, false );
		context.fill();
	}else if(params.shape === "triangle"){
		var h = this.textureWidth * (Math.sqrt(3)/2);
		context.beginPath();
		context.moveTo(this.textureWidth / 2, 0);
        	context.lineTo( 0, h);
        	context.lineTo(this.textureWidth , h);
		context.closePath();
		context.fill();
	}else console.assert(false, 'unknown params shape' + params.shape);

	// Center letters
	// fontsize/3 to simulate the textbaseline middle
	var offsetY = (this.textureHeight/2)+(params.fontSize/3);
	
	//Write text in canvas
	this.writeText(text,offsetY,params);

	// make the texture as .needsUpdate
	this.texture.needsUpdate	= true;
	// for chained API
	return this;

}

/**
 * Write text
 * 
 * @param  {String} text    - Text to display
 * @param  {Number} offsetY - The offset y where to display the text
 * @param  {Object} params  - Parameters 
 * @return {Number} - The Y offset value
 */
THREEx.DynamicTexture.prototype.writeText	= function(text,offsetY,params){
	this.context.save()
	// Font creation
	this.context.font = params.fontWeight+" "+params.fontSize+"px "+params.fontFamily;
	var _this = this;
	while(text.length > 0 ){
		// compute the text for specifically this line
		var maxText	= computeMaxTextLength(text,true);
		// Prevent crash browser on infinite loop
		if(maxText.length==0)break;
		
		// update the remaining text
		text	= text.substr(maxText.length);

		// compute x based on params.align
		var textSize	= this.context.measureText(maxText);
		if( params.align === 'left' ){
			var offsetX	= params.margin;
		}else if( params.align === 'right' ){
			var offsetX	= this.canvas.width - params.margin - textSize.width;
		}else if( params.align === 'center' ){
			var offsetX = (this.canvas.width - textSize.width) / 2;
		}else	console.assert( false )

		// - Changes shadow
		if (params.shadowEnabled) {
			this.context.fillStyle	= params.shadowColor;
			this.context.fillText(maxText, offsetX+params.shadowOffsetX, offsetY+params.shadowOffsetY);
		};
		this.context.fillStyle	= params.fontColor;
		// actually draw the text at the proper position
		this.context.fillText(maxText, offsetX, offsetY);

		// goto the next line
		offsetY	+= params.lineHeight+params.fontSize;
		
	}
	this.context.restore();

	 /**
	  * Compute the maximum text that can fit in 1 line
	  * @param  {String} text             - The text to display
	  * @param  {Boolean} wordSplitEnabled - True if you want to split at a word level, false at a letter level
	  * @return {string}                  - The max text displayable in the canvas
	  */
	function computeMaxTextLength(text,wordSplitEnabled){
		// create array of words or letter depending on wordSplitEnabled
		if( wordSplitEnabled === true ){
			var splitedTexts= text.split(" ");
		}else{
			var splitedTexts= text.split("");			
		}
		var maxText	= ''
		var maxWidth	= _this.canvas.width - params.margin*2;
		//loop until the length of the line is superior than the canvas width is exceded
		for( var i = 0; maxText.length !== text.length && i < splitedTexts.length; i++ ){
			var splitedText	= splitedTexts[i] + (wordSplitEnabled ? ' ' : '')
			var textSize	= _this.context.measureText(maxText + splitedText);
			
			// test if the first word of the line tested is larger than the canvas width
			// - spliting per characters when wordSplitEnabled is only valid for the 1st word
			var isFirstWord = i === 0 ? true : false;
			if( wordSplitEnabled === true && isFirstWord === true ){
				// actually test if the first word is larger than the maxWith
				if(_this.context.measureText(splitedText).width > maxWidth ){
					//test if we split the words or the letters
					var letterSplitText = splitedTexts[i].split("");
					// loop on the letters of the word that is too large for the canvas
					for( var j = 0; maxText.length !== text.length; j++ ){
						var textSize	= _this.context.measureText(maxText + letterSplitText[j]);
						if( textSize.width > maxWidth ) break;
						maxText	+= letterSplitText[j];
					}
					return maxText;
				}
			}
			
			// if testSize.width is now larger than the canvas, we return the current maxText
			if( textSize.width > maxWidth )	break;

			// finally add the test to maxText
			maxText	+= splitedText;
		}
		return maxText;
	}
	return offsetY;
}


/**
 * Execute the drawImage on the internal context.
 * The arguments are the same the official context2d.drawImage.
 * @return {THREEx.DynamicTexture} - The object itself, for chained API 
 * @nobetterjs
 */
THREEx.DynamicTexture.prototype.drawImage	= function(/* same params as context2d.drawImage */){
	// call the drawImage
	this.context.drawImage.apply(this.context, arguments)
	// make the texture as .needsUpdate
	this.texture.needsUpdate	= true;
	// for chained API
	return this;
}
