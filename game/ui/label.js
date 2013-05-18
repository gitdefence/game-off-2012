function Label(initialText) {
    var self = this;
    self.tpos = new Rect(0, 0, 0, 0);
    self.base = new BaseObj(self);

    var textObj = new Text(initialText);
    //Without this it is impossible to reference a dynamically changing
    //value through a dynamically generated function, dynamically.
    //(dirtyMethod requires this, as if it binds directly to textObj
    //we cannot change it).
    var internals = { textObj: textObj };

    //Allows you to set the internal Text object, changing how the text is drawn.
    self.setTextType = function (newTextObj) {
        if (!(newTextObj instanceof Text)) {
            fail("You must pass in a type Text");
            return;
        }

        textObj = newTextObj;
        internals.textObj = textObj;

        self.base.dirty();

        return self;
    }

    self.redraw = function (canvas) {
        canvas.fill(textObj, "green");
    }

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
        textObj.resize(new Rect(0, 0, 0, 0).size(rect.size()));
        return self;
    }

    self.optimalHeight = function (width) {
        return textObj.optimalHeight(width);
    }

    function dirtyMethod(methodName, holderName) {
        return function () {
            var objToCall = self;
            if (defined(holderName) && assertDefined(internals[holderName])) {
                objToCall = internals[holderName];
            }
            objToCall[methodName].apply(null, arguments);
            self.base.dirty();
            return self;
        }
    }
    self.text = dirtyMethod("text", "textObj");
    self.align = dirtyMethod("align", "textObj");
}
