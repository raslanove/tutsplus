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

   context.beginPath();
   context.moveTo(0, 0);
   context.lineTo(30, 30);
   context.stroke(); 
});


