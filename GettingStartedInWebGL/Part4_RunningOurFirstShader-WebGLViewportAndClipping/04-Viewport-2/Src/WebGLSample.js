var glCanvas;
var glContext;
var shaderProgram = {};
var verticesBuffer;
var firstFrameTime;

var gradientVertices;
var pointsVertices;

window.addEventListener('load', function() { 

   // Initialize everything,
   if (!initialize()) return;
   
   // Start drawing,
   start();
   
});

function initialize() {

   // Get WebGL context,
   glCanvas = document.getElementById("glCanvas");
   glContext = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");   
   
   if (!glContext) {
      alert("Failed to acquire a WebGL context. Sorry!");
      return false;
   }

   // Give the canvas its initial size,
   adjustCanvasSize();
   
   // Initialize shaders, buffers and state,
   if (!initializeShaderProgram()) {

      // There's no point in holding on the WebGL context,
      delete glContext;
      return false;
   }
   
   initializeBuffers();
   initializeState();
   
   // Resize the canvas when the window is resized,
   window.addEventListener('resize', function onWindowResize(event) {   
   
      // Wait until the resizing events flood settles,
      if (onWindowResize.timeoutId) window.clearTimeout(onWindowResize.timeoutId);
      onWindowResize.timeoutId = window.setTimeout(adjustCanvasSize, 600);
   });   

   return true;
}

function adjustCanvasSize() {

   var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
   
   if (((glCanvas.width  / pixelRatio) != glCanvas.offsetWidth ) || 
       ((glCanvas.height / pixelRatio) != glCanvas.offsetHeight)) {
       
      glCanvas.width  = pixelRatio * glCanvas.offsetWidth ;
      glCanvas.height = pixelRatio * glCanvas.offsetHeight;
      glContext.viewport(glCanvas.width/4, 0, glCanvas.width/2, glCanvas.height);
   }
}

function initializeShaderProgram() {

   var vertexShaderCode = 
      "attribute vec3 vertexPosition;\n" +
      "varying vec4 vertexColor;\n" +
      "\n" +
      "void main(void) {\n" +
      "   gl_Position = vec4(vertexPosition, 1.0);\n" +
      "   gl_PointSize = 100.0;\n" +
      "   vertexColor = 0.5 * vec4(gl_Position.xy, 0.0, 1.0) + 0.5;\n" +
      "}\n";
         
   var fragmentShaderCode =
      "uniform mediump float time;\n" +
      "varying lowp vec4 vertexColor;\n" +
      "\n" +
      "void main(void) {\n" +
      "   if (gl_FragCoord.z<0.1) {\n" +
      "      gl_FragColor = (vertexColor*0.75) + vertexColor * 0.25;\n" + 
      "   } else {\n" +
      "      if (distance(gl_PointCoord, vec2(0.5, 0.5)) <= 0.5) {\n" +
      "         gl_FragColor.rgba = vec4(0.0, 1.0, 0.0, 1.0);\n" +
      "      } else {\n" +
      "         discard;\n" +
      "      }\n" +
      "   }\n" +
      "}\n";

   // Create shaders,
   var vertexShader   = createShader(  vertexShaderCode, glContext.  VERTEX_SHADER);
   var fragmentShader = createShader(fragmentShaderCode, glContext.FRAGMENT_SHADER);

   if ((!vertexShader) || (!fragmentShader)) return false;
   
   // Create shader program,
   shaderProgram.program = glContext.createProgram();
   glContext.attachShader(shaderProgram.program,   vertexShader);
   glContext.attachShader(shaderProgram.program, fragmentShader);
   glContext.linkProgram(shaderProgram.program);

   // Check the shader program creation status,
   if (!glContext.getProgramParameter(shaderProgram.program, glContext.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
      return false;
   }

   // Get attributes' and uniforms' locations,
   shaderProgram.attributes = {};
   shaderProgram.attributes.vertexPosition = glContext.getAttribLocation(
      shaderProgram.program, "vertexPosition");
      
   shaderProgram.uniforms = {};   
   shaderProgram.uniforms.time = glContext.getUniformLocation(shaderProgram.program, "time");
      
   return true;
}

function createShader(shaderCode, shaderType) {

   var shader = glContext.createShader(shaderType);

   glContext.shaderSource(shader, shaderCode);
   glContext.compileShader(shader);

   if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {  
      alert("Errors occurred while compiling the shader:\n" + glContext.getShaderInfoLog(shader));
      return null;  
   }
   return shader;
}

function initializeBuffers() {

   var tempVertices1 = [
      1.0,  1.0,  -1.0,
      -1.0, 1.0,  -1.0,
      1.0,  -1.0, -1.0,
      -1.0, -1.0, -1.0
   ];

   var tempVertices2 = [
      1.0,  1.0,  1.0,
      -1.0, 1.0,  1.0,
      1.0,  -1.0, 1.0,
      -1.0, -1.0, 1.0
   ];

   gradientVertices = new Float32Array(tempVertices1);
     pointsVertices = new Float32Array(tempVertices2);

   verticesBuffer = glContext.createBuffer();
   glContext.bindBuffer(glContext.ARRAY_BUFFER, verticesBuffer);
}

function initializeState() {

   // Set the current shader in use,
   glContext.useProgram(shaderProgram.program);

   // Set the vertices buffer (I know it's already bound, but that's where it normally
   // belongs in the workflow),
   glContext.bindBuffer(glContext.ARRAY_BUFFER, verticesBuffer);

   // Set where the vertexPosition attribute gets its data,
   glContext.vertexAttribPointer(shaderProgram.attributes.vertexPosition, 3, glContext.FLOAT, false, 0, 0);
   
   // Enable attributes used in shader,
   glContext.enableVertexAttribArray(shaderProgram.attributes.vertexPosition);

   // Set clear color to black,
   glContext.clearColor(0.0, 0.0, 0.0, 1.0);   
}

function start() {

   // Mark the start time,
   firstFrameTime = new Date().getTime();
   
   // Start the drawing loop,
   drawScene();
}

function drawScene() {
     
   // Clear the color buffer,
   glContext.clear(glContext.COLOR_BUFFER_BIT);

   // Calculate the time uniform value,
   var currentTime = new Date().getTime();
   var elapsedTimeSeconds = (currentTime-firstFrameTime) / 1000.0;
   
   // To avoid overflow issues when elapsedTimeSeconds gets too large,
   elapsedTimeSeconds %= 1000 * 3.14159265359;

   // There's no helping changing time every frame,
   glContext.uniform1f(shaderProgram.uniforms.time, elapsedTimeSeconds);
   
   // The revered draw calls!
   glContext.bufferData(glContext.ARRAY_BUFFER, gradientVertices, glContext.STATIC_DRAW);
   glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);

   glContext.bufferData(glContext.ARRAY_BUFFER,   pointsVertices, glContext.STATIC_DRAW);
   glContext.drawArrays(glContext.POINT, 0, 4);
   
   // Request drawing again next frame,
   window.requestAnimationFrame(drawScene);
}
