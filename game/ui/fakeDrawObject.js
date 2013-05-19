//An object which draws, but every time it draws it just calls a predefined draw function.
//drawFnc should take a pen, a rect.
//cachable defines if the drawFnc can be cached (we exposed redraw instead of draw)
//If offsetRect is true, we offset the rect given to the drawFnc so its origin is (0, 0).
//If reqSize is defined then we implement optimalWidth and height with reqSize
function FakeDrawObject(drawFnc, cachable, offsetRect, reqSize) {
    var self = this;

    if (!assertValid(drawFnc)) {
        drawFnc = function () { };
    }

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
    }

    if (cachable) {
        self.redraw = function (canvas) {
            var pen = canvas.ctx();
            var rect = self.tpos.clone();
            if (offsetRect) {
                rect.origin(new Vector(0, 0));
            }
            drawFnc(pen, rect);
        }
    } else {
        self.draw = function (pen) {
            var rect = self.tpos.clone();
            if (offsetRect) {
                rect.origin(new Vector(0, 0));
            }
            drawFnc(pen, rect);
        }
    }

    if (reqSize) {
        self.optimalWidth = function () { return reqSize.w; }
        self.optimalHeight = function () { return reqSize.h; }
    }
}
