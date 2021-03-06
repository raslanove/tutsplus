var glCanvas;
var glContext;
var shaderProgram = {};
var verticesBuffer;
var firstFrameTime;

var vertices;
var particles = [];
var particlesCount = 50;
var maxParticleSpeed = 0.0012;
var particleAcceleration = 0.00000012;
var lastFrameTime;

window.addEventListener('load', function() { 

   // Initialize everything,
   if (!initialize()) return;
   
   // Start drawing,
   start();
   
});

function initialize() {

   // Get WebGL context,
   glCanvas = document.getElementById("glCanvas");

   var contextAttributes = {depth: false, premultipliedAlpha: false};
   glContext = glCanvas.getContext("webgl", contextAttributes) || glCanvas.getContext("experimental-webgl", contextAttributes);
   
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
   initializeParticles();
   
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
      glContext.viewport(glCanvas.width*0.25, 0, glCanvas.width*0.5, glCanvas.height);
      glContext.scissor (glCanvas.width*0.25, 0, glCanvas.width*0.5, glCanvas.height);
   }
}

function initializeShaderProgram() {

   var vertexShaderCode = 
      "attribute vec3 vertexPosition;\n" +
      "varying vec4 vertexColor;\n" +
      "\n" +
      "void main(void) {\n" +
      "   gl_Position = vec4(vertexPosition, 1.0);\n" +
      "   gl_PointSize = 150.0;\n" +
      "   vertexColor = (gl_Position * 0.5) + 0.5;\n" +
      "}\n";
         
   var fragmentShaderCode =
      "uniform mediump float time;\n" +
      "varying lowp vec4 vertexColor;\n" +
      "\n" +
      "void main(void) {\n" +
      "   if (distance(gl_PointCoord, vec2(0.5, 0.5)) <= 0.6) {\n" +
      "      gl_FragColor.rgba = vec4(0.0, 1.0, 0.0, 0.5);\n" +
      "   } else {\n" +
      "      gl_FragColor.rgba = vec4(0.0, 1.0, 0.0, 0.0);\n" +
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

   vertices = new Float32Array(particlesCount*3);

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

   // Set clear color to blue,
   glContext.clearColor(0.0, 0.0, 1.0, 1.0);   

   // Enable blending,
   glContext.enable(glContext.BLEND);
   glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
   
   // Enable scissor test,
   glContext.enable(glContext.SCISSOR_TEST);
}

function initializeParticles() {

    for (i=0; i<particlesCount; i++) {
        particles[i] = {};
        particles[i].x = 0;
        particles[i].y = 0;
        particles[i].targetX = 0;
        particles[i].targetY = 0;
        particles[i].maxSpeed = (maxParticleSpeed*0.1) + (Math.random()*maxParticleSpeed*0.9);
        particles[i].velocityX = 0;
        particles[i].velocityY = 0;
        particles[i].timeToPickTarget = 0;
    }
}

function updateParticles(elapsedTimeMillis) {

    var currentParticleFloatIndex=0;    
    for (i=0; i<particlesCount; i++) {

        // Pick a new target if needed,
        particles[i].timeToPickTarget -= elapsedTimeMillis;
        if (particles[i].timeToPickTarget <= 0) {
            particles[i].targetX = Math.random() * 4 - 2;
            particles[i].targetY = Math.random() * 4 - 2;
            particles[i].timeToPickTarget = 1.0 + Math.random() * 4000;
        }

        // Move particles,
        var accX = particles[i].targetX - particles[i].x;
        var accY = particles[i].targetY - particles[i].y;
        var accMagnitude = Math.sqrt(accX*accX + accY*accY);
        var ratio = particleAcceleration / accMagnitude;

        particles[i].velocityX += accX * ratio * elapsedTimeMillis;
        particles[i].velocityY += accY * ratio * elapsedTimeMillis;
        
        var velMagnitude = Math.sqrt(particles[i].velocityX*particles[i].velocityX + particles[i].velocityY*particles[i].velocityY);
        ratio = particles[i].maxSpeed / velMagnitude;

        if (ratio < 1) {
            particles[i].velocityX *= ratio;
            particles[i].velocityY *= ratio;
        }

        particles[i].x += particles[i].velocityX * elapsedTimeMillis;
        particles[i].y += particles[i].velocityY * elapsedTimeMillis;
    
        vertices[currentParticleFloatIndex  ] = particles[i].x;
        vertices[currentParticleFloatIndex+1] = particles[i].y;
        currentParticleFloatIndex += 3;
    } 
}

function start() {

   // Mark the start time,
   firstFrameTime = new Date().getTime();
   lastFrameTime = firstFrameTime;

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

   // Update particles,
   updateParticles(currentTime - lastFrameTime);
   lastFrameTime = currentTime;

   // Update the buffer data,
   glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);
   
   // The revered draw call!
   glContext.drawArrays(glContext.POINT, 0, vertices.length/3);
   
   // Request drawing again next frame,
   window.requestAnimationFrame(drawScene);
}
