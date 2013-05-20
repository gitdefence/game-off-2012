// A layout container with 1 child. It adds buffered space around its child
// which can depend on the size we are given.

// We set our size from our children's size.
// So from our children's perspective our size is dynamic, and
// their's is fixed.
function PaddingControl(uiControl) {
    var self = this;
    self.base = new BaseObj(self);
    self.tpos = new Rect(0, 0, 0, 0);

    //implementOptimalFunctions(uiControl);
    self.base.addChild(uiControl);

	var rectConstantBuffer = new Rect(0, 0, 0, 0);
	var rectPercentBuffer = new Rect(0, 0, 0, 0);

	self.added = function () {
	    implementOptimalFunctions(uiControl);
	}

	//constantBuffer and percentBuffer CAN be used at the same time

	//Says the pixels on every side we buffer by.
	self.constantBuffer = function (rectBuffer) {
	    rectConstantBuffer = rectBuffer;
	    return self;
	}

	//Says the percent of our internal control we buffer by.
	self.percentBuffer = function (rectBuffer) {
	    rectPercentBuffer = rectBuffer;
	    return self;
	}

	function removeOurHeight(totalHeight) {
	    return (totalHeight - rectConstantBuffer.right()) / (1 + rectPercentBuffer.right());
	}

	function removeOurWidth(totalWidth) {
	    return (totalWidth - rectConstantBuffer.bottom()) / (1 + rectPercentBuffer.bottom());
	}

	self.resize = function (rect) {
	    rect = rect.clone();
	    uiControl.resize(rect);
	    this.tpos = rect;
	    return;

	    //We do the opposite of how we implemented optimalWidth and optimalHeight
	    //(Just invert the equation, you can see it works due to algebra).
	    var childWidth = removeOurHeight(rect.w);
	    var childHeight = removeOurWidth(rect.h);

	    //Now we make our rect normally.
	    var uiControlRect = new Rect(
           rect.x + childWidth * rectPercentBuffer.x + rectConstantBuffer.x,
           rect.y + childHeight * rectPercentBuffer.y + rectConstantBuffer.y,
           rect.w - (childWidth * rectPercentBuffer.right() + rectConstantBuffer.right()),
           rect.h - (childHeight * rectPercentBuffer.bottom() + rectConstantBuffer.bottom()));

	    uiControlRect.round();
	    if (uiControlRect.w < 1) {
	        uiControlRect.w = 1;
	    }

	    if (uiControlRect.h < 1) {
	        uiControlRect.h = 1;
	    }

	    uiControl.resize(uiControlRect);
	    this.tpos = rect;
	}

	self.draw = function (pen) {
	    if (DFlag.drawPaddingControls) {
	        DRAW.rect(pen, this.tpos.clone().shrink(-1), "transparent", 1, "blue");
	    }
	}

    function implementOptimalFunctions(uiControl) {
        if (uiControl.optimalWidth) {
            self.optimalWidth = function (height) {
                var childWidth = uiControl.optimalWidth(removeOurHeight(height));
                return Math.round(childWidth * (1 + rectPercentBuffer.right()) + rectConstantBuffer.right());
            }
        }

        if (uiControl.optimalHeight) {
            self.optimalHeight = function (width) {
                var childHeight = uiControl.optimalHeight(removeOurWidth(width));
                return Math.round(childHeight * (1 + rectPercentBuffer.bottom()) + rectConstantBuffer.bottom());
            }
        }
    }
}
