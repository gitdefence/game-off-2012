//An object which draws, but every time it draws it just calls a predefined draw function.
//drawFnc should take a pen, a rect.
//cachable defines if the drawFnc can be cached (you exposed redraw instead of draw),
//but still calls redraw normally (you must offset the rect you are given, as it
//is your tpos and you need to draw starting at (0, 0)).
function FakeDrawObject(drawFnc, cachable, fixedSize) {
    var self = this;

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

    self.resize = function (rect) {
        this.tpos = rect;
    }

    if (cachable) {
        self.redraw = function (canvas) {
            var pen = canvas.ctx();
            drawFnc(pen, this.tpos);
        }
    } else {
        self.draw = function (pen) {
            drawFnc(pen, this.tpos);
        }
    }

    if (fixedSize) {
        self.optimalWidth = function () { return fixedSize.w; }
        self.optimalHeight = function () { return fixedSize.h; }
    }
}
