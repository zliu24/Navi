var THREEx	= THREEx || {}

THREEx.DomMirror	= function(){}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

THREEx.DomMirror.domEqual	= function(srcElement, domElement2){
	return dstElement.innerHTML === srcElement.innerHTML;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

THREEx.DomMirror.copyDomByInnerHTML	= function(srcElement, dstElement){
	dstElement.innerHTML = srcElement.innerHTML;
	
	// destination should be readyonly, no scrolling, and no selections.
	dstElement.style.pointerEvents = 'none';
	dstElement.style.overflow = 'hidden';
	dstElement.style.userSelect = 'none';
}

THREEx.DomMirror.onChange	= function(domElement, callback){
	// create an observer instance
	var mutationObserver = new MutationObserver(function(mutations) {
		callback(mutations)
	});
	mutationObserver.observe(domElement, {
		attributes: true,
		childList: true,
		characterData: true,
		subtree: true,
	})
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

THREEx.DomMirror.emptyDomElement	= function(domElement){
	while( domElement.firstChild ){
		domElement.removeChild(domElement.firstChild);
	}
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

THREEx.DomMirror.fillWithRandomDomElements	= function(container, nElements){
	var seed = Math.random();
	// var seed = 42;
	function random() {
		seed = Math.sin(seed) * 10000;
		return seed - Math.floor(seed);
	}
	// --------------------------
	
	
	nElements = nElements !== undefined ? nElements : 10;
	
	var elementCount = 0;
	
	for(var i = 0; i < nElements; i++){
		// create new element
		var elementIdx = ++elementCount
		var newElement = document.createElement('ul')
		newElement.innerHTML = '<li>element_'+elementCount+'</li>'
		// var newElement = document.createElement('div')
		newElement.innerHTML = 'element_'+elementCount
		newElement.classList.add('random_'+elementIdx)
		// get parentElement
		var parentIdx = Math.floor(random() * (i === 0 ? 0 : i-1))
		if( parentIdx > 0 ){
			var parentElement = container.querySelector('.random_'+parentIdx)
		}else{
			var parentElement = container						
		}
		
		// attach newElement to its parent
		parentElement.appendChild(newElement)
	}
}

