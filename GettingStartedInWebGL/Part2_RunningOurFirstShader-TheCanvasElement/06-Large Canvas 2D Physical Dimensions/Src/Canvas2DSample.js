window.addEventListener('load', function() { 

   // Get WebGL context,
   var canvas = document.getElementById("canvas");
   var context;
   try {
      context = canvas.getContext('2d');
   } catch (exception) {
      alert("Umm... sorry, no 2d contexts for you! " + exception.message);
      return ;
   }

   // Get the device pixel ratio,
   var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;

   // Adjust the canvas size,
   canvas.width  = pixelRatio * canvas.offsetWidth ;
   canvas.height = pixelRatio * canvas.offsetHeight;

   // Draw the line,
   context.beginPath();
   context.moveTo(0, 0);
   context.lineTo(canvas.width, canvas.height);
   context.stroke(); 
});


