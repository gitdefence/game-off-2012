// Basically just stack elements, one on top of the other.
function FlowLayout() {
	this.base = new BaseObj(this);
	this.tpos = new Rect(0, 0, 0, 0);

	var children = [];

	this.add = function (ui) {
		children.push(ui);
		this.base.addChild(ui);
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
