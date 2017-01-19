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

function adjustDrawingBufferSize() {

    var canvas = glContext.canvas;
    var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
    
    // Checking width and height individually to avoid two resize operations if only 
    // one was needed. Since this function was called, then at least on of them was
    // changed,
    if (canvas.width  != Math.floor(canvas.clientWidth  * pixelRatio)) canvas.width  = pixelRatio * canvas.clientWidth ;
    if (canvas.height != Math.floor(canvas.clientHeight * pixelRatio)) canvas.height = pixelRatio * canvas.clientHeight;
    
    // Set the new viewport dimensions,
     glContext.viewport(0, 0, glContext.drawingBufferWidth, glContext.drawingBufferHeight);
}

function onCanvasResize() {

    // Compute the dimensions in physical pixels,
    var canvas = glContext.canvas;
    var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;

    var physicalWidth  = Math.floor(canvas.clientWidth  * pixelRatio);
    var physicalHeight = Math.floor(canvas.clientHeight * pixelRatio);

    // Abort if nothing changed,
    if ((onCanvasResize.targetWidth  == physicalWidth ) && 
        (onCanvasResize.targetHeight == physicalHeight)) {
        return;
    }

    // Set the new required dimensions,
    onCanvasResize.targetWidth  = physicalWidth ;
    onCanvasResize.targetHeight = physicalHeight;

    // Wait until the resizing events flood settles,
    if (onCanvasResize.timeoutId) window.clearTimeout(onCanvasResize.timeoutId);
    onCanvasResize.timeoutId = window.setTimeout(adjustDrawingBufferSize, 600);
} 

function drawScene() {

    // Handle canvas size changes,
    onCanvasResize();
 
    // Restrict drawing to the left half of the canvas,
    glContext.viewport(0, 0, glContext.drawingBufferWidth / 2, glContext.drawingBufferHeight);
     
    // Clear the color buffer,
    glContext.clear(glContext.COLOR_BUFFER_BIT);

    // Request drawing again next frame,
    window.requestAnimationFrame(drawScene);
}
