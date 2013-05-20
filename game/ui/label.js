ui.Label = function Label() {
    var self = this;
    self.tpos = new Rect(0, 0, 0, 0);
    self.base = new BaseObj(self);

    var textObj = new Text();

    self.redraw = function (canvas) {
        canvas.fill(textObj, "green");
    }

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
        textObj.resize(new Rect(0, 0, 0, 0).size(rect.size()));
        return self;
    }

    function dirtyMethod(method) {
        return function () {
            method.apply(null, arguments);
            self.base.dirty();
            return self;
        }
    }
    self.text = dirtyMethod(textObj.text);
    self.align = dirtyMethod(textObj.align);
    self.maxFontSize = dirtyMethod(textObj.maxFontSize);
    self.color = dirtyMethod(textObj.color);
    self.lineSpacing = dirtyMethod(textObj.lineSpacing);

    self.optimalWidth = textObj.optimalWidth;
    self.optimalHeight = textObj.optimalHeight;
}
