var canvas;
var context;

window.addEventListener('load', function() { 

   // Get WebGL context,
   canvas = document.getElementById("canvas");
   try {
      context = canvas.getContext('2d');
   } catch (exception) {
      alert("Umm... sorry, no 2d contexts for you! " + exception.message);
      return ;
   }

   // Resize the canvas bitmap when the window is resized,
   window.addEventListener('resize', function onWindowResize(event) {   
   
      // Wait until the resizing events flood settles,
      if (onWindowResize.timeoutId) window.clearTimeout(onWindowResize.timeoutId);
      onWindowResize.timeoutId = window.setTimeout(adjustCanvasBitmapSize, 600);
   });   

   // Since resize events are only triggered on resizing,
   // we'll have to call it ourselves to give the bitmap its
   // initial size,
   adjustCanvasBitmapSize();
});

function adjustCanvasBitmapSize() {

   // Get the device pixel ratio,
   var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
   
   // Abort if nothing changed,
   if (((canvas.width  / pixelRatio) == canvas.offsetWidth ) &&
       ((canvas.height / pixelRatio) == canvas.offsetHeight)) {
      return ;
   }

   // Change internal bitmap dimensions,
   if ((canvas.width  / pixelRatio) != canvas.offsetWidth ) canvas.width  = pixelRatio * canvas.offsetWidth ;
	if ((canvas.height / pixelRatio) != canvas.offsetHeight) canvas.height = pixelRatio * canvas.offsetHeight;
	
	// Redraw everything again,
	drawScene();
}

function drawScene() {

   // Draw our line,
   context.beginPath();
   context.moveTo(0, 0);
   context.lineTo(canvas.width, canvas.height);
   context.stroke();
}
