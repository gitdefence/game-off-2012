//An object which draws, but every time it draws it just calls a predefined draw function.
//drawFnc should take a pen, a rect.
//cachable defines if the drawFnc can be cached (we exposed redraw instead of draw)
//If offsetRect is true, we offset the rect given to the drawFnc so its origin is (0, 0).
//If reqWidth/reqHeight are defined and non-zero then we implement optimalWidth/optimalHeight with each respectively
function FakeDrawObject(drawFnc, cachable, offsetRect, reqWidth, reqHeight) {
    var self = this;

    if (!assertValid(drawFnc)) {
        drawFnc = function () { };
    }
    if (defined(reqWidth) && typeof reqWidth != "number") {
        fail("Set reqWidth to a number or nothing!");
        reqWidth = 0;
    }
    if (defined(reqHeight) && typeof reqHeight != "number") {
        fail("Set reqWidth to a number or nothing!");
        reqHeight = 0;
    }

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

    self.resize = function (rect) {
        if (defined(reqWidth) && defined(reqHeight) &&
            rect.w < reqWidth || rect.h < reqHeight) {
            var widthPercent = reqWidth && rect.w / reqWidth;
            var heightPercent = reqHeight && rect.h / reqHeight;
            var minPercent = Math.min(widthPercent, heightPercent);
            rect.w = Math.floor(rect.w * minPercent);
            rect.h = Math.floor(rect.w * minPercent);
        }
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

    if (reqWidth) {
        if (reqHeight) {
            //Implement scaling
            self.optimalWidth = function (height) {
                //We need to scale
                if (height < reqHeight) {
                    return reqWidth * (height / reqHeight);
                } else {
                    return reqWidth;
                }
            }
        } else {
            self.optimalWidth = function (height) { return reqWidth; }
        }
    }
    if (reqHeight) {
        if (reqWidth) {
            //Implement scaling
            self.optimalHeight = function (width) {
                //We need to scale
                if (width < reqWidth) {
                    return reqHeight * (width / reqWidth);
                } else {
                    return reqHeight;
                }
            }
        } else {
            self.optimalHeight = function (width) { return reqHeight; }
        }
    }
}
