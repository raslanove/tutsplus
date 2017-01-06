var glContext;

window.addEventListener('load', function() {
	initialize();
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
	glContext = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");   
	glCanvas.removeEventListener("webglcontextcreationerror", onContextCreationError, false);

	// If failed,
	if (!glContext) {
		alert(errorMessage);
		return false;
	} else {
		alert("WebGL context successfully created!");
	}

	return true;
}
