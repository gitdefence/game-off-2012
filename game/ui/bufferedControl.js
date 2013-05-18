// A layout container with 1 child. It adds buffered space around its child
// which can depend on the size we are given.

// We set our size from our children's size.
// So from our children's perspective our size is dynamic, and
// their's is fixed.

//rectConstantBuffer says the pixels on each side we buffer by.
//rectPercentBuffer says the percent of the respective lengths
//we buffer by, the sum of your left + right and top + bottom
//should each be < 1.
function BufferedControl(rectConstantBuffer, rectPercentBuffer) {
	this.base = new BaseObj(this);
	this.tpos = new Rect(0, 0, 0, 0);

	var uiControl;

	this.setControl = function (ui) {
	    uiControl = ui;
	    this.base.addChild(uiControl);
	}

	this.resize = function (rect) {
        

		var width = rect.w;
		var heights = [];
		var totalHeight = 0;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			var height = child.optimalHeight(width);
			totalHeight += height;
			heights.push(height);
		}

		// Make sure we can fit.
		if (totalHeight > rect.h) {
			for (var i = 0; i < heights.length; i++) {
				heights[i] *= rect.h / totalHeight;
			}
		}

		var curY = rect.y;
		for (var i = 0; i < children.length; i++) {
			var height = heights[i];
			var childRect = new Rect(rect.x, curY, width, height);
			children[i].resize(childRect);
			curY += height;
		}
    }

    this.optimalHeight = function (width) {
        var totalHeight = 0;
        for (var i = 0; i < children.length; i++) {
            totalHeight += children[i].optimalHeight(width);
        }
        return totalHeight;
    }
}
