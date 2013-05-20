// A layout container with 1 child. It adds buffered space around its child
// which can depend on the size we are given.

// We set our size from OUR children's size.
// So from our children's perspective our size is dynamic, and their's is fixed.

// For example, if our child is of size 50,
// and we have 50% top buffer, and 10px top buffer,
// then our size is 50*1.5 + 10 = 85.

// Similarily for optimalHeight, if the width we are given
// is 85, we do (85 - 10) / 1.5 = 50 and then give as the width
// in our call to the child optimalHeight.

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
        return (totalHeight - rectConstantBuffer.bottom()) / (1 + rectPercentBuffer.bottom());
    }
    
    function removeOurWidth(totalWidth) {
        return (totalWidth - rectConstantBuffer.right()) / (1 + rectPercentBuffer.right());
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
