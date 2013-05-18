function Label() {
    var self = this;
    self.tpos = new Rect(0, 0, 0, 0);
    self.base = new BaseObj(self);

    var text = new Text();

    self.redraw = function (canvas) {
        canvas.fill(text, "green");
    }

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
        text.resize(new Rect(0, 0, 0, 0).size(rect.size()));
        return self;
    }

    self.optimalHeight = function (width) {
        return text.optimalHeight(width);
    }

    function dirtyMethod(method) {
        return function () {
            method.apply(null, arguments);
            self.base.dirty();
            return self;
        }
    }
    self.text = dirtyMethod(text.text);
    self.align = dirtyMethod(text.align);
}
