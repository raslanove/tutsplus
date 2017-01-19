var glContext;

window.addEventListener('load', function() {

	// Initialize everything,
	initialize();

	// Start drawing,
	drawScene();
}, false);

function initialize() {

	// Get canvas,
	var glCanvas = document.getElementById("glCanvas");

	// Context creation error listener,
	var errorMessage = "Couldn't create a WebGL context!";
	function onContextCreationError(event) {
		if (event.statusMessage) errorMessage = event.statusMessage;
	}
	glCanvas.addEventListener("webglcontextcreationerror", onContextCreationError, false);

	// Attempt getting a WebGL context,
	var contextAttributes = {depth: false, premultipliedAlpha: false};
    glContext = glCanvas.getContext("webgl", contextAttributes) || glCanvas.getContext("experimental-webgl", contextAttributes);
	glCanvas.removeEventListener("webglcontextcreationerror", onContextCreationError, false);

	// If failed,
	if (!glContext) {
		alert(errorMessage);
		return false;
	} 

	initializeState();

	return true;
}

function initializeState() {

	// Set clear color to opaque red,
	glContext.clearColor(1.0, 0.0, 0.0, 1.0);
}

function drawScene() {
	  
	// Clear the color buffer,
	glContext.clear(glContext.COLOR_BUFFER_BIT);
}

