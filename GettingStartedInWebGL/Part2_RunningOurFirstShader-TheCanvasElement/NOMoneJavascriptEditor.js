
function allowTabsInTextArea(event) {
  if((event.keyCode==9) || (event.which==9)) {
      event.preventDefault();
      var selectionStart = this.selectionStart;
      this.value = this.value.substring(0, selectionStart) + "\t" + this.value.substring(this.selectionEnd);
      this.selectionEnd = selectionStart + 1;
   }
}

function createDOMElement(type, className, parentElement) {
   var element = document.createElement(type);
   element.className = className;
   parentElement.appendChild(element);
   
   if (type=="textarea") {
      element.setAttribute('autocomplete'  , 'off');
      element.setAttribute('autocorrect'   , 'off');
      element.setAttribute('autocapitalize', 'off');
      element.spellcheck=false;
      
      element.onkeydown = allowTabsInTextArea;
   }
   
   return element;
}

function NOMoneJavascriptEditor(parentElement) {

   // Create the UI,
   var tempElement1, tempElement2, tempElement3, tempElement4;
   
   this.workspaceContainer = createDOMElement("div", "NOMoneJavascriptEditor", parentElement);   
      tempElement1 = createDOMElement("div", "RootNode", this.workspaceContainer);
         tempElement2 = createDOMElement("div", "TabsRow", tempElement1);
            tempElement3 = createDOMElement("div", "TabsCell", tempElement2);
               tempElement4 = createDOMElement("div", "TabsNode", tempElement3);
                  this.tabs = createDOMElement("ul", "Tabs", tempElement4);

         tempElement2 = createDOMElement("div", "ContentRow", tempElement1);
            this.contentCell = createDOMElement("div", "ContentCell", tempElement2);
               this.contentNode = createDOMElement("div", "ContentNode", this.contentCell);
                  this.iframeNode = createDOMElement("div", "IframeNode", this.contentNode);

   // Methods,
   this.getPageHTML = function() {
      if (this.htmlTextArea) return this.htmlTextArea.value;
      return "";
   }.bind(this);

   this.getJavascriptText = function() {

      var javascriptText = "";
      var i;
      for (i=0; i<this.javascriptElements.length; i++) {
         javascriptText += "<script type='text/javascript'>\n";
         javascriptText += this.javascriptElements[i].value;
         javascriptText += "\n</script>\n";
      }
      return javascriptText;
   }.bind(this);
   
   this.getCSSText = function() {

      var cssText = "";
      var i;
      for (i=0; i<this.cssElements.length; i++) {
         cssText += "<style>\n";
         cssText += this.cssElements[i].value;
         cssText += "\n</style>\n";
      }
      return cssText;
   }.bind(this);   
   
   this.destroyIframe = function() {
      this.iframeNode.innerHTML = "";   
   }.bind(this);
   
   this.updateIframe = function() {

      // TODO: don't do anything if nothing changed.

      // Get rid of the old iframe (if any),
      this.destroyIframe();
      
      // Create a new iframe (to avoid any traces of any old ones),
      this.iframe = createDOMElement("iframe", "ResultIframe", this.iframeNode);
      this.iframe.setAttribute("allowFullScreen", "");
      
      // Set its contents,
      var iframeWindow = (this.iframe.contentWindow) ? this.iframe.contentWindow :
                         (this.iframe.contentDocument.document) ? this.iframe.contentDocument.document : 
                         this.iframe.contentDocument;

      // Write HTML,
      var htmlContent = this.getPageHTML();
      
      // Append css and javascript to head,
      var headMatches = htmlContent.match(/<\s*head\s*>/i);
      if (headMatches!=null) {
         var headBeginningIndex = htmlContent.search(headMatches[0]);
         headBeginningIndex += headMatches[0].length;
         
         htmlContent = 
            htmlContent.slice(0, headBeginningIndex) +
            '\n' +
            this.getCSSText() +
            this.getJavascriptText() + 
            htmlContent.slice(headBeginningIndex);
      }

      iframeWindow.document.open();
      iframeWindow.document.write(htmlContent);
      iframeWindow.document.close();
            
      // Add css and javascript if not added before,
      if (headMatches==null) {

         var i;
         
         // CSS,
         for (i=0; i<this.cssElements.length; i++) {         
            var cssElement = iframeWindow.document.createElement('style');
            cssElement.type = "text/css";
            if (cssElement.styleSheet) {
              cssElement.styleSheet.cssText = this.cssElements[i].value;
            } else {
              cssElement.appendChild(iframeWindow.document.createTextNode(this.cssElements[i].value));
            }            
            iframeWindow.document.head.appendChild(cssElement);
         }
         
         // Javascript,
         for (i=0; i<this.javascriptElements.length; i++) {
            var javascriptElement = iframeWindow.document.createElement('script');
            javascriptElement.type = "text/javascript";
            javascriptElement.text = this.javascriptElements[i].value;
            iframeWindow.document.head.appendChild(javascriptElement);
         }
      }
      
      // contentEditable is set to true, to fix text-selection bug in firefox,
      // and back to false to prevent the content from being editable. To 
      // reproduce the error: Select text in the result window with, and without,
      // the contentEditable statements below.
      if ( iframeWindow.document.body &&
          (!iframeWindow.document.body.isContentEditable)) {
         iframeWindow.document.body.contentEditable = true;
         iframeWindow.document.body.contentEditable = false;
      }
            
   }.bind(this);

   this.tabsCount = 0;
   this.javascriptElements = [];
   this.cssElements = [];
   this.addTab = function(tabName, tabType) {
   
      // Create a new content element,
      var newElement;
      var textArea;
      if (tabType=="HTML") {
      
         // Don't allow more than 1 HTML tab,
         if (this.htmlTextArea) {
            alert("NOMone Javascript Editor: Can't have more than 1 'HTML' tab.");
            return null;
         }
         newElement = createDOMElement("div", "PlainTextEditorNode", this.contentNode);
         textArea = createDOMElement("textarea", "PlainTextEditor", newElement);
         this.htmlTextArea = textArea;
      } else if (tabType=="JS") {
         newElement = createDOMElement("div", "PlainTextEditorNode", this.contentNode);
         textArea = createDOMElement("textarea", "PlainTextEditor", newElement);
         this.javascriptElements.push(textArea);
      } else if (tabType=="CSS") {
         newElement = createDOMElement("div", "PlainTextEditorNode", this.contentNode);
         textArea = createDOMElement("textarea", "PlainTextEditor", newElement);
         this.cssElements.push(textArea);
      } else if (tabType=="Result") {
      
         // Don't allow multiple "Result" tabs,
         if (this.iframe) {
            alert("NOMone Javascript Editor: Can't have more than 1 'Result' tab.");
            return null;
         }
         newElement = this.iframeNode;
      } else {
         alert("Unsupported tab type.");
         return null;
      }
   
      // Create new tab,
      var newTab = createDOMElement("li", "Tab", this.tabs);
      var newTabAnchor = createDOMElement("a", "TabAnchor", newTab);

      // Set tab name,
      newTabAnchor.textContent = tabName;
                  
      // Create tab event handlers,
      var hideCurrentTabFunction = function() {
         this.destroyIframe();
         newElement.style.display = "none";
         newTab.className = "Tab";
      }.bind(this);

      newTabAnchor.onclick = function() {
            
         // Hide the previous tab and show the new one,
         if (this.hideCurrentTab) this.hideCurrentTab();
         this.hideCurrentTab = hideCurrentTabFunction;
         newElement.style.display = "initial";
         newTab.className = "ActiveTab";
         
         // If this is result, update it first,
         if (tabType=="Result") this.updateIframe();         
      }.bind(this);

      // The new tab content should initially be hidden unless it's the only one,
      if (this.tabsCount == 0) {
         if (tabType=="Result") this.updateIframe();
         this.hideCurrentTab = hideCurrentTabFunction;
         newTab.className = "ActiveTab";         
      } else {
         newElement.style.display = "none";         
      }      
      this.tabsCount++;

      // Initialize the tab object,
      var tabObject = {};
      
      // Set tabs methods,
      // If content is text),
      if (textArea) {
         
         // Set content method,
         tabObject.setContent = function(content) {
            textArea.value = content; 
            return tabObject;
         };
         
         // Scroll to line,
         tabObject.scrollToLine = function(lineNumber) {

            // Create a clone of the text area,
            var textAreaClone = textArea.cloneNode(false);

            // Remember the old visibility state of the text area container,
            var oldDisplayStyle = newElement.style.display;
            
            // Show the text area container,
            newElement.style.display = "initial";

            // Hide the text area so that it doesn't interfer with the clone's
            // size,
            textArea.style.display = "none";
         
            // Remove all clone decorations to get the pure height,
            textAreaClone.style.padding="0px";
            textAreaClone.style.border="none";
            
            // Make sure it scrolls,
            textAreaClone.style.width="100px";
            textAreaClone.style.height="1px";
            textAreaClone.style.overflow="scroll";
            
            // Add 10 lines to compute the line height,
            textAreaClone.value="1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\r\n10";
            
            // Insert the clone in the original text area place to
            // get the same styling,
            textArea.parentNode.insertBefore(textAreaClone, textArea);
            
            // Compute line height,
            var lineHeight = textAreaClone.scrollHeight / 10;
            
            // Remove and destroy the clone,
            textArea.parentNode.removeChild(textAreaClone);
            delete textAreaClone;

            // Make the text area visible again,
            textArea.style.display = "initial";            
            
            // Do the scrolling,
            var destinationY = (lineNumber - 1) * lineHeight;
            textArea.scrollTop = destinationY;

            // Restore the old container visibility state,
            newElement.style.display = oldDisplayStyle;
            
            return tabObject;
         };
      }

      // Show (bring to front) method,
      tabObject.show = function() {
         newTabAnchor.onclick();
         return tabObject;
      };
      
      return tabObject;
   }.bind(this);   
}

