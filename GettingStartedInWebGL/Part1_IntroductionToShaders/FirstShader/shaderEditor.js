
function createDOMElement(type, className, parentElement) {
   var element = document.createElement(type);
   element.className = className;
   parentElement.appendChild(element);
   return element;
}

function NOMoneShaderEditor(parentElement) {

   // Create the UI,
   var tempElement1, tempElement2, tempElement3, tempElement4, tempElement5, tempElement6;
   
   this.workspaceContainer = createDOMElement("div", "nomoneShaderEditor", parentElement);   
      tempElement1 = createDOMElement("div", "uiParent", this.workspaceContainer);
         this.uiNode = createDOMElement("div", "ui", tempElement1);
            tempElement3 = createDOMElement("div", "controlsRow", this.uiNode);
               tempElement4 = createDOMElement("div", "controlsContainer", tempElement3);
                  this.toggleCodeVisibilityButton = createDOMElement("a", "button", tempElement4);
                  this.toggleCodeVisibilityButton.textContent = "Hide code";
                  this.recompileButton = createDOMElement("a", "button", tempElement4);
                  this.recompileButton.textContent = "Recompile";
                  this.scaleValueOptions = createDOMElement("select", "button", tempElement4);
                  this.scaleValueOptions.name = "Scale value";
                     tempElement6 = createDOMElement("option", "", this.scaleValueOptions);
                     tempElement6.value = 8.0; tempElement6.textContent = "1/8";
                     tempElement6 = createDOMElement("option", "", this.scaleValueOptions);
                     tempElement6.value = 4.0; tempElement6.textContent = "1/4";
                     tempElement6 = createDOMElement("option", "", this.scaleValueOptions);
                     tempElement6.value = 2.0; tempElement6.textContent = "1/2";
                     tempElement6.selected = "selected";
                     tempElement6 = createDOMElement("option", "", this.scaleValueOptions);
                     tempElement6.value = 1.0; tempElement6.textContent = "1";
                     tempElement6 = createDOMElement("option", "", this.scaleValueOptions);
                     tempElement6.value = 0.5; tempElement6.textContent = "2";   
                  tempElement5 = createDOMElement("span", "rowEndControls", tempElement4);
                     this.toggleEditorModeButton = createDOMElement("a", "button", tempElement5);
                     this.toggleEditorModeButton.title = "Change into a plain but more mobile friendly editor";
                     this.toggleEditorModeButton.textContent = "Plain editor";
                     this.toggleFullScreenButton = createDOMElement("a", "button", tempElement5);
                     this.toggleFullScreenButton.textContent = "Full screen";
            tempElement3 = createDOMElement("div", "editorRow", this.uiNode);
               tempElement4 = createDOMElement("div", "editorCell", tempElement3);
                  this.editorContainer = createDOMElement("div", "editorContainer", tempElement4);
                     this.editorResizable = createDOMElement("div", "editorResizable", this.editorContainer);
                        this.plainEditor = createDOMElement("div", "plainEditor", this.editorResizable);
                           this.plainEditorText = createDOMElement("textarea", "editor plainEditorText", this.plainEditor);
                        this.coolEditor = createDOMElement("div", "editor", this.editorResizable);
      this.glCanvas = createDOMElement("canvas", "glCanvas", this.workspaceContainer);
      this.glCanvas.innerHTML = "Your browser doesn't appear to support the <code>&lt;canvas&gt;</code> element.";

   // Methods,         
   this.userResizedEditor = false;
   this.initialize = function() {

      // Initialize ace editor,
      var aceEditor = ace.edit(this.coolEditor);
      aceEditor.setTheme("ace/theme/cobalt");
      aceEditor.getSession().setMode("ace/mode/glsl");
      aceEditor.setOption("showPrintMargin", false);
      aceEditor.setOption("highlightActiveLine", false);
      //aceEditor.setOptions({enableBasicAutocompletion: true, enableSnippets: true, enableLiveAutocompletion: true});
      //aceEditor.setOption("enableBasicAutocompletion", true);
      //aceEditor.setOption("fontSize", "12pt");
      aceEditor.getSession().setTabSize(3);
      this.aceEditor = aceEditor;

      // Reflect window changes on editor,
      $(window).resize(function(e) {
         if (e.target == window) {
            this.manualResizeEditor();
         }
      }.bind(this));

      // Use jqueryui for resizable text areas (TODO:get rid of jquery altogether),
      $(this.editorResizable).resizable({
         containment: this.editorContainer,
         resize: function(event, ui) { 
            this.userResizedEditor = true; this.aceEditor.resize(); 
         }.bind(this)
      });
      
      // Attach click events,
      this.recompileButton.onclick = this.compile;
      this.toggleCodeVisibilityButton.onclick = this.toggleCodeVisibilityButtonClick;
      this.toggleEditorModeButton.onclick = this.toggleEditorModeButtonClick;
      this.toggleFullScreenButton.onclick = this.toggleFullScreenButtonClick;
      this.scaleValueOptions.onchange = this.scaleValueOptionsChanged;

      // Set plain editor mode if mobile browser,
      var isTouchDevice = function() {  return 'ontouchstart' in window || 'onmsgesturechange' in window; };
      if (isTouchDevice() || (typeof window.orientation !== 'undefined')) this.setPlainEditorModeEnabled(true);

      // Start rendering,
      this.startWebGL();
   }.bind(this);
   
   this.containerOverflowHidden = false;
   this.resizeTO = null;
   this.manualResizeEditor = function() {

      if (this.userResizedEditor) {
      
         // Trigger resizing the editor by simulating a mouse drag on the right side,
         if (!this.containerOverflowHidden) {
            this.editorContainer.style.overflow = "hidden";
            this.containerOverflowHidden = true;
         }

         var element = $(this.editorResizable);
         var eastbar = element.find(".ui-resizable-handle.ui-resizable-e").first();
         var pageX = eastbar.offset().left;
         var pageY = eastbar.offset().top;

         eastbar
            .trigger("mouseover")
            .trigger({ type: "mousedown", which: 1, pageX: pageX, pageY: pageY })
            .trigger({ type: "mousemove", which: 1, pageX: pageX - 1, pageY: pageY })
            .trigger({ type: "mousemove", which: 1, pageX: pageX, pageY: pageY })
            .trigger({ type: "mouseup", which: 1, pageX: pageX, pageY: pageY }); 
      }
      
      // Improve resizing experience by adjusting canvas only after resizing is finished,
      if (this.resizeTO) clearTimeout(this.resizeTO);
      this.resizeTO = setTimeout(function() {
         this.adjustCanvasSize();
         this.editorContainer.style.overflow = "visible";
         this.containerOverflowHidden = false;
      }.bind(this), 600);
   }.bind(this);

   this.glCanvasScale = 2.0;
   this.adjustCanvasSize = function() { 

      var canvas = this.glCanvas;
      var pixelRatio = 1.0;
      try { pixelRatio = window.devicePixelRatio; } catch(e) {}
      
      if ((Math.abs(Math.round(canvas.width  * this.glCanvasScale / pixelRatio) - canvas.offsetWidth ) >= this.glCanvasScale) || 
          (Math.abs(Math.round(canvas.height * this.glCanvasScale / pixelRatio) - canvas.offsetHeight) >= this.glCanvasScale)) {
         canvas.width  = pixelRatio * canvas.offsetWidth  / this.glCanvasScale;
         canvas.height = pixelRatio * canvas.offsetHeight / this.glCanvasScale;
         this.gl.viewport(0, 0, canvas.width, canvas.height);
      }
   }.bind(this);
      
   this.cursorPosition = null;
   this.plainEditorActive = false;
   this.setPlainEditorModeEnabled = function(enabled) {
      if (enabled && !this.plainEditorActive) {
         this.plainEditor.style.visibility = "inherit";
         this.coolEditor.style.visibility = "hidden";
         this.toggleEditorModeButton.textContent = "Cool editor";    
         this.cursorPosition = this.aceEditor.getCursorPosition();
         this.plainEditorText.value = this.aceEditor.session.getValue(); 
      } else if (!enabled && this.plainEditorActive) {
         this.plainEditor.style.visibility = "hidden";
         this.coolEditor.style.visibility = "inherit";
         this.toggleEditorModeButton.textContent = "Plain editor";
         this.aceEditor.setValue(this.plainEditorText.value);
         this.aceEditor.clearSelection();
         this.aceEditor.moveCursorToPosition(this.cursorPosition);
      }
      this.plainEditorActive = enabled;
   }.bind(this);

   this.toggleEditorModeButtonClick = function() {
      this.setPlainEditorModeEnabled(!this.plainEditorActive);
   }.bind(this);

   this.toggleFullScreenButtonClick = function() {
   
      // If already full screen; exit full screen,
      // else go fullscreen
      if (document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement) {

         if (document.exitFullscreen) { document.exitFullscreen(); }
         else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
         else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
         else if (document.msExitFullscreen) { document.msExitFullscreen(); }
         
      } else {
         var element = this.workspaceContainer;
         if (element.requestFullscreen) { element.requestFullscreen(); }
         else if (element.mozRequestFullScreen) { element.mozRequestFullScreen(); }
         else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT); }
         else if (element.msRequestFullscreen) { element.msRequestFullscreen(); }
      }
      
      setTimeout(this.manualResizeEditor, 600);
   }.bind(this);

   this.scaleValueOptionsChanged = function() {
      this.glCanvasScale = this.scaleValueOptions.value;
      this.adjustCanvasSize();
   }.bind(this);

   this.codeVisible = true;
   this.editorModeEnabled = true;
   this.setCodeVisibility = function(visible) {
      this.codeVisible = visible;
      if (!this.editorModeEnabled) return;
      if (visible) {
         this.toggleCodeVisibilityButton.textContent = "Hide code";
         this.recompileButton.style.display = "initial";
         this.toggleEditorModeButton.style.display = "initial";
         this.editorContainer.style.visibility = "inherit";
      } else {
         this.toggleCodeVisibilityButton.textContent = "Show code";
         this.recompileButton.style.display = "none";
         this.toggleEditorModeButton.style.display = "none";
         this.editorContainer.style.visibility = "hidden";   
      }
   }.bind(this);

   this.toggleCodeVisibilityButtonClick = function() {
      this.setCodeVisibility(!this.codeVisible);
   }.bind(this);

   // Webgl,
   this.gl = null;
   this.shaderProgram = null;
   this.shaderProgramReady = false;   
   this.vertexPositionAttribute = null;
   this.timeUniform = null;
   this.apectRatioUniform = null;
   this.resolutionUniform = null;
   this.verticesBuffer = null;
   this.firstFrameTime = null;
   this.defaultVertexShaderCode = 
      "attribute vec3 aVertexPosition;" +
      "varying vec4 vertexColor;" +       
      "void main(void) {" +
      "   gl_Position = vec4(aVertexPosition, 1.0);" +
      "   vertexColor = (gl_Position * 0.5) + 0.5;" +
      //"   vertexColor = (gl_Position + 1.0) * 0.5;" +
      "}";
   this.defaultFragmentShaderCode = 
      "#ifdef GL_ES\n" +
      "   precision highp float;\n" +
      "#endif\n\n" +
      "uniform float time;\n\n" +
      "void main(void) {\n" +
      "   gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);\n" +
      "}";

   this.compile = function() {
   
      // Remove the old program,
      try {
         this.gl.disableVertexAttribArray(this.vertexPositionAttribute);
	      this.gl.deleteProgram(this.shaderProgram);
	   } catch (e) {}
	   
      if (this.plainEditorActive) {
         this.shaderProgramReady = this.initShaders(this.defaultVertexShaderCode, this.plainEditorText.value);
      } else {
         this.shaderProgramReady = this.initShaders(this.defaultVertexShaderCode, this.aceEditor.session.getValue());
      }

      // Trigger running the shader,
      if (this.shaderProgramReady) {
         requestAnimationFrame(this.drawScene);
      }      
   }.bind(this);

   this.initWebGL = function(canvas) {
      try {
         // Try to grab the standard context. If it fails, fallback to experimental.
         this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      } catch(e) {}
   }.bind(this);

   this.createShader = function(shaderCode, shaderType) {
      var shader = this.gl.createShader(shaderType);

      this.gl.shaderSource(shader, shaderCode);
      this.gl.compileShader(shader);  

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {  
         alert("Errors occurred while compiling the shader:\n" + this.gl.getShaderInfoLog(shader));  
         return null;  
      }
      return shader;
   }.bind(this);

   this.initShaders = function(vertexShaderCode, fragmentShaderCode) {

      var vertexShader = this.createShader(vertexShaderCode, this.gl.VERTEX_SHADER);
      var fragmentShader = this.createShader(fragmentShaderCode, this.gl.FRAGMENT_SHADER);

      if ((!vertexShader) || (!fragmentShader)) return false;
      
      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);

      // If creating the shader program failed, alert
      if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
         alert("Unable to initialize the shader program.");
         return false;
      }

      this.gl.useProgram(this.shaderProgram);

      this.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
      this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
      this.timeUniform = this.gl.getUniformLocation(this.shaderProgram, "time");
      this.apectRatioUniform = this.gl.getUniformLocation(this.shaderProgram, "aspectRatio");
      this.resolutionUniform = this.gl.getUniformLocation(this.shaderProgram, "resolution");
      
      return true;
   }.bind(this);

   this.initBuffers = function() {
      var vertices = [
         1.0,  1.0,  0.0,
         -1.0, 1.0,  0.0,
         1.0,  -1.0, 0.0,
         -1.0, -1.0, 0.0
      ];

      this.verticesBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
   }.bind(this);

   this.drawScene = function() {

      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      if (!this.shaderProgramReady) return;

      var currentTime = new Date().getTime();
      var elapsedTimeSeconds = (currentTime-this.firstFrameTime)/1000.0;
      
      // To avoid issues caused when elapsedTimeSeconds gets too large,
      elapsedTimeSeconds %= 1000 * 3.14159265359;

      this.gl.uniform1f(this.timeUniform, elapsedTimeSeconds);
      this.gl.uniform1f(this.apectRatioUniform, this.glCanvas.offsetWidth / this.glCanvas.offsetHeight);
      this.gl.uniform2f(this.resolutionUniform, this.glCanvas.width, this.glCanvas.height);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
      this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      
      requestAnimationFrame(this.drawScene);
   }.bind(this);

   this.startWebGL = function() {
      
      this.initWebGL(this.glCanvas);
      if (!this.gl) {
         return;
      }

      this.adjustCanvasSize();
      this.setFragmentShaderCode(this.defaultFragmentShaderCode);
      this.initBuffers();

      // Set onFrame function,
		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = (function() {
            return 
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               window.msRequestAnimationFrame ||
               function (callback, element) {
                  window.setTimeout(callback, 1000 / 60);
               };
         })();
      }

      this.firstFrameTime = new Date().getTime();
      this.drawScene();

   }.bind(this);
 
   this.setEditorModeEnabled = function(isEditor) {
      if (isEditor) {
         this.toggleCodeVisibilityButton.style.display = "initial";
         this.editorModeEnabled = true;
         this.setCodeVisibility(this.codeVisible);
      } else {
         var codeVisibility = this.codeVisible;
         this.setCodeVisibility(false);
         this.codeVisible = codeVisibility; 
         this.editorModeEnabled = false;
         this.toggleCodeVisibilityButton.style.display = "none";
      }
   }.bind(this);
 
   this.setUIVisibility = function(visible) {
      if (visible) {
         this.uiNode.style.visibility = "inherit";
      } else {
         this.uiNode.style.visibility = "hidden";
      }
   }.bind(this);
   
   this.setFragmentShaderCode = function(fragmentShaderCode) {
      if (this.plainEditorActive) {
         this.plainEditorText.value = fragmentShaderCode;
      } else {
         this.aceEditor.setValue(fragmentShaderCode);
         this.aceEditor.clearSelection();
      }
   }.bind(this);
 
   this.setGLCanvasScale = function(scale) {

      var options = this.scaleValueOptions.options;
      var oldSelectedIndex = options.selectedIndex;
      
      var firstSmallerOptionIndex=-1;
      var found = false;
      var i=0;
      for(var option; option=options[i]; i++) {
         
         if(Math.abs(option.value-scale) < 0.001) {
            options.selectedIndex = i;
            found = true;
            break;
         }
         
         if ((firstSmallerOptionIndex==-1) && (option.value<scale)) firstSmallerOptionIndex = i;
      }
      
      // If option not found, add it,
      if (!found) {
      
         var newOption;

         // Add it to the correct location,
         if (firstSmallerOptionIndex==-1) {
            newOption = createDOMElement("option", "", this.scaleValueOptions);
            options.selectedIndex = i;
         } else {
            newOption = document.createElement("option");
            this.scaleValueOptions.insertBefore(newOption, this.scaleValueOptions.children[firstSmallerOptionIndex]);
            options.selectedIndex = firstSmallerOptionIndex;
         }
         
         newOption.value = scale; 
         newOption.textContent = Math.round(100/scale)/100;
      }
 
      // Reflect changes,
      if (oldSelectedIndex != options.selectedIndex) this.scaleValueOptionsChanged();
    }.bind(this);
   
   // Initialize,
   this.initialize();
   
   return this;
}
