// A layout container with 1 child. It adds buffered space around its child
// which can depend on the size we are given.

// We set our size from our children's size.
// So from our children's perspective our size is dynamic, and
// their's is fixed.

//rectConstantBuffer says the pixels on each side we buffer by.
//rectPercentBuffer says the percent of rect we are given (in resize) we take.
function PaddingControl(initialControl, rectConstantBuffer, rectPercentBuffer) {
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

	function removeOurHeight(totalHeight) {
	    return (totalHeight - rectConstantBuffer.right()) / (1 + rectPercentBuffer.right());
	}

	function removeOurWidth(totalWidth) {
	    return (totalWidth - rectConstantBuffer.bottom()) / (1 + rectPercentBuffer.bottom());
	}

	self.resize = function (rect) {
	    rect = rect.clone();

	    //We do the opposite of how we implemented optimalWidth and optimalHeight
        //(Just invert the equation, you can see it works due to algebra).
	    var childWidth = removeOurHeight(rect.w);
	    var childHeight = removeOurHeight(rect.h);

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
        //DRAW.rect(pen, this.tpos.clone().shrink(-1), "transparent", 1, "blue");
    }

    function implementOptimalFunctions(uiControl) {
        if (uiControl.optimalWidth) {
            self.optimalWidth = function (height) {
                var childWidth = uiControl.optimalWidth(height);
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
