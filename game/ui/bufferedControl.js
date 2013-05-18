// A layout container with 1 child. It adds buffered space around its child
// which can depend on the size we are given.

// We set our size from our children's size.
// So from our children's perspective our size is dynamic, and
// their's is fixed.

//rectConstantBuffer says the pixels on each side we buffer by.
//rectPercentBuffer says the percent of rect we are given (in resize) we take.
function BufferedControl(initialControl, rectConstantBuffer, rectPercentBuffer) {
    var self = this;
	self.base = new BaseObj(self);
	self.tpos = new Rect(0, 0, 0, 0);

	var uiControl = initialControl;

	self.setControl = function (ui) {
	    uiControl = ui;
        implementOptimalFunctions(uiControl);
	    self.base.addChild(uiControl);
	}

	self.added = function () {
	    if (initialControl) {
	        self.setControl(uiControl);
	    }
	}

	self.resize = function (rect) {
	    rect = rect.clone();

	    var childWidth = (rect.w - rectConstantBuffer.right()) / (1 + rectPercentBuffer.right());
	    var childHeight = (rect.h - rectConstantBuffer.bottom()) / (1 + rectPercentBuffer.bottom());

	    var uiControlRect = new Rect(
           rect.x + childWidth * rectPercentBuffer.x + rectConstantBuffer.x,
           rect.y + childHeight * rectPercentBuffer.y + rectConstantBuffer.y,
           rect.w - (childWidth * rectPercentBuffer.right() + rectConstantBuffer.right()),
           rect.h - (childHeight * rectPercentBuffer.bottom() + rectConstantBuffer.bottom()));

	    uiControlRect.round();

	    uiControl.resize(uiControlRect);
	    this.tpos = rect;
	}

    self.draw = function (pen) {
        //DRAW.rect(pen, this.tpos.clone().shrink(-1), "transparent", 1, "blue");
    }

    function implementOptimalFunctions(uiControl) {
        if (uiControl.optimalWidth) {
            self.optimalWidth = function (width) {
                var childWidth = uiControl.optimalWidth(width);
                return Math.round(childWidth * (1 + rectPercentBuffer.right()) + rectConstantBuffer.right());
            }
        }

        if (uiControl.optimalHeight) {
            self.optimalHeight = function (width) {
                var childHeight = uiControl.optimalHeight(width);
                return Math.round(childHeight * (1 + rectPercentBuffer.bottom()) + rectConstantBuffer.bottom());
            }
        }
    }
}
