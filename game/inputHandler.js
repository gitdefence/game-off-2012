function InputHandler() {
    //Only valid when handling mouse events (just check when it is set)
    this.ctrlKey = false;

    //Put yourself in here (index global id) to get global mouse moves
    this.globalMouseMove = {};
    this.globalMouseDown = {};
    this.globalMouseUp = {};
    this.globalMouseClick = {};

    //The only reason this would be false is if multiple people are sharing the input handler
    this.consumeEvents = true;
    
    this.mX = -1;
    this.mY = -1;
    this.mdX = -1; //Mouse down
    this.mdY = -1;
    this.muX = -1; //Mouse up
    this.muY = -1;

    this.events = {};

    this.resizeEvent = null;
    
    var canvas;
    
    this.events.resize = function (e) {
        this.resizeEvent = e;
    }

    function getMousePos(e) {
        var canpos = document.getElementById("myCanvas")
        var mX = defined(e.offsetX) ? e.offsetX : e.pageX - canpos.offsetLeft;
        var mY = defined(e.offsetY) ? e.offsetY : e.pageY - canpos.offsetTop;

        return { x: mX + 0.5, y: mY + 0.5 };
    }

    this.nextIsTouch = false;
    this.screenNonTouchEvents = function(e) {
        if(!this.nextIsTouch && !e.fromTouch && isTouchDevice()) return true;
        this.nextIsTouch = false;
        return false;
    }

    this.events.mousemove = function (e) {  
        if(this.screenNonTouchEvents(e)) return;
        var pos = getMousePos(e);
        this.ctrlKey = e.ctrlKey;

        this.mX = pos.x;
        this.mY = pos.y;
    }

    this.events.mouseout = function (e) {
        if(this.screenNonTouchEvents(e)) return;
        var pos = getMousePos(e);
        this.ctrlKey = e.ctrlKey;

        this.mX = -1;
        this.mY = -1;
    }

    this.events.mousedown = function (e) {
        if(this.screenNonTouchEvents(e)) return;
        var pos = getMousePos(e);
        this.ctrlKey = e.ctrlKey;

        this.mdX = pos.x;
        this.mdY = pos.y;
    }

    this.events.mouseup = function (e) {
        if(this.screenNonTouchEvents(e)) return;
        var pos = getMousePos(e);
        this.ctrlKey = e.ctrlKey;

        this.muX = pos.x;
        this.muY = pos.y;
    }
    
    this.mapTouchToMouse = function(e) {
        e = e.originalEvent || e;
        //http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
        
        var type = "";
        switch(event.type)
        {
            case "touchstart":  type = "mousedown"; break;
            case "touchmove":   type = "mousemove"; break;        
            case "touchend":    type = "mouseup"; break;
            case "touchleave":  type = "mouseout"; break;
            case "touchcancel": type = "mouseout"; break;
            default: return;
        }
        
        e.preventDefault();
        
        for(var key in e.changedTouches) {
            var touchEvent = e.changedTouches[key];
            
            var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
                          touchEvent.screenX, touchEvent.screenY,
                          touchEvent.clientX, touchEvent.clientY, false,
                          false, false, false, 0/*left*/, null);
                          
            //this.nextIsTouch = true;
            //e.target.dispatchEvent(simulatedEvent);
            
            simulatedEvent.fromTouch = true;
            this.events[type](simulatedEvent);
            
            return;
        }
    }
    
    this.events.touchstart = function(e) {
        this.mapTouchToMouse(e);
    }
    
    this.events.touchmove = function(e) {
        //e.preventDefault();
        this.mapTouchToMouse(e);
    }
    
    this.events.touchend = function(e) {
        this.mapTouchToMouse(e);

        //Prevents hover state from staying
        this.mX = 0;
        this.mY = 0;
    }
    
    this.events.touchleave = function(e) {
        this.mapTouchToMouse(e);
    }
    
    this.events.touchcancel = function(e) {
        this.mapTouchToMouse(e);
    }
    
    this.unBind = function (canvas) {
        $(canvas).off();
        $(window).off();
    }
    
    this.bind = function (newCanvas) {
        canvas = newCanvas;
        for (var name in this.events) {
            // Preserve this context
            this.events[name] = this.events[name].bind(this);
            
            // Resize event is only on window.
            var src = name == "resize" ? window : canvas;
            $(src).on(name, this.events[name]);
        }
    };

    function throwMouseEventAt(mX, mY, eventName, eng, ignore, ctrlKey) {
        var allUnderMouse = [];

        for (var type in eng.base.allChildren) {
            mergeToArray(findAllWithin(eng, type, { x: mX, y: mY }, 0), allUnderMouse);
        }

        if (allUnderMouse.length == 0)
            return;

        var topMost = allUnderMouse[0];

        if(!ignore)
            ignore = {};

        //*sigh* so inefficient... but for now its fine
        for (var key in allUnderMouse)
            if(!ignore[key])
                if (allUnderMouse[key].base.zindex > topMost.base.zindex ||
                           (allUnderMouse[key].base.zindex == topMost.base.zindex &&
                           allUnderMouse[key].base.zoffset > topMost.base.zoffset)) {
                    if (allUnderMouse[key].base.canHandleEvent(eventName))
                        topMost = allUnderMouse[key];
                }

        for (var key in allUnderMouse)
            if(!ignore[key])
                if (allUnderMouse[key] !== topMost)
                    allUnderMouse[key].base.callRaise(eventName, { x: mX, y: mY, topMost: false, ctrlKey: ctrlKey });

        topMost.base.callRaise(eventName, { x: mX, y: mY, topMost: true, ctrlKey: ctrlKey });

        return allUnderMouse;
    }

    this.handleEvents = function (eng) {
        this.handleMouseEvents(eng);

        if (this.resizeEvent) {
            console.log("this.resizeEvent:", this.resizeEvent);

            var game = eng.game;
            var minWidth = game.numTilesX * game.tileSize + 150;
            var minHeight = game.numTilesY * game.tileSize;
            var width = Math.max(window.innerWidth, minWidth);
            var height = Math.max(window.innerHeight, minHeight);

            this.resizeEvent.width = canvas.width = width;
            this.resizeEvent.height = canvas.height = height;
            
            eng.base.raiseEvent("globalResize", this.resizeEvent);

            if (this.consumeEvents)
                this.resizeEvent = null;
        }
    };

    //Called in update and uses async flags set when we get events
    this.handleMouseEvents = function (eng) {
        if (this.mdX > 0 && this.mdY > 0) {
            for (var key in this.globalMouseDown) {
                if (this.globalMouseDown[key].base.rootNode != eng)
                    delete this.globalMouseDown[key];
                else
                    this.globalMouseDown[key].base.callRaise("mousedown", { x: this.mdX, y: this.mdY });
            }

            var curMouseDown = throwMouseEventAt(this.mdX, this.mdY, "mousedown", eng, this.globalMouseDown, this.ctrlKey);
            this.prevMouseDown = curMouseDown;

            if (this.consumeEvents) {
                this.mdX = -1;
                this.mdY = -1;
            }
        //We delay the mouse up for one cycle to prevent some bugs
        } else if (this.muX > 0 && this.muY > 0) {
            for (var key in this.globalMouseUp) {
                if (this.globalMouseUp[key].base.rootNode != eng)
                    delete this.globalMouseUp[key];
                else
                    this.globalMouseUp[key].base.callRaise("mouseup", { x: this.muX, y: this.muY });
            }

            var curMouseUp = throwMouseEventAt(this.muX, this.muY, "mouseup", eng, this.globalMouseUp, this.ctrlKey);

            if (this.prevMouseDown && this.prevMouseDown.length > 0) {
                for (var key in this.globalMouseClick) {
                    if (this.globalMouseClick[key].base.rootNode != eng)
                        delete this.globalMouseClick[key];
                    else
                        this.globalMouseClick[key].base.callRaise("click", { x: this.muX, y: this.muY });
                }

                for (var i = 0; i < this.prevMouseDown.length; i++) {
                    if (!this.globalMouseClick[this.prevMouseDown[i].base.id] &&
                        vecToRect({ x: this.muX, y: this.muY }, this.prevMouseDown[i].tpos).magSq() == 0) {
                        this.prevMouseDown[i].base.callRaise("click", { x: this.muX, y: this.muY });
                    }
                    this.prevMouseDown[i].base.callRaise("dragEnd", { x: this.muX, y: this.muY });
                }
            }

            this.prevMouseDown = null;

            if (this.consumeEvents) {
                this.muX = -1;
                this.muY = -1;
            }
        }

        if (this.mY > 0 && this.mX > 0) {
            for (var key in this.globalMouseMove) {
                if (this.globalMouseMove[key].base.rootNode != eng)
                    delete this.globalMouseMove[key];
                else
                    this.globalMouseMove[key].base.callRaise("mousemove", { x: this.mX, y: this.mY });
            }

            var curMouseOver = throwMouseEventAt(this.mX, this.mY, "mousemove", eng, this.globalMouseMove);
            //Can actually find mouseout more efficiently... as we have previous and current mousemove...            
            if (this.prevMouseOver && this.prevMouseOver.length > 0) {
                for (var i = 0; i < this.prevMouseOver.length; i++) {
                    if (vecToRect({ x: this.mX, y: this.mY }, this.prevMouseOver[i].tpos).magSq() != 0) {
                        this.prevMouseOver[i].base.callRaise("mouseout", { x: this.mX, y: this.mY });
                    }
                }
            }
            this.prevMouseOver = curMouseOver;

            if (this.prevMouseDown && this.prevMouseDown.length > 0) {
                for (var i = 0; i < this.prevMouseDown.length; i++) {
                    this.prevMouseDown[i].base.callRaise("dragged", { x: this.mX, y: this.mY });
                }
            }

            if (this.consumeEvents) {
                this.mY = -1;
                this.mX = -1;
            }
        }
    }
}
