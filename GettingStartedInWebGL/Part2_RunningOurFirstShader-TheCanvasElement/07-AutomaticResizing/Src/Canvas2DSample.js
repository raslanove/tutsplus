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
   window.addEventListener('resize', adjustCanvasBitmapSize);
   
   // Since resize events are only triggered on resizing,
   // we'll have to call it ourselves to give the bitmap its
   // initial size,
   adjustCanvasBitmapSize();

   // Draw the line,
   context.beginPath();
   context.moveTo(0, 0);
   context.lineTo(canvas.width, canvas.height);
   context.stroke(); 
});

function adjustCanvasBitmapSize() {

   // Get the device pixel ratio,
   var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
   
   if ((canvas.width  / pixelRatio) != canvas.offsetWidth ) canvas.width  = pixelRatio * canvas.offsetWidth ;
	if ((canvas.height / pixelRatio) != canvas.offsetHeight) canvas.height = pixelRatio * canvas.offsetHeight;
}
