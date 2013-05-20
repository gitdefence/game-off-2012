// Basically adds a box around the child, with margin, padding,
// borders, background, etc.
ui.Box = function Box(child) {
	var self = this;
	self.base = new BaseObj(self);
	self.tpos = new Rect(0, 0, 0, 0);

	var margin = new ui.DeltaRect(0, 0, 0, 0);
	self.margin = function (newMargin) {
		margin = newMargin;
	}

	var padding = new ui.DeltaRect(0, 0, 0, 0);
	self.padding = function (newPadding) {
		padding = newPadding;
	}

	var border = new ui.DeltaRect(0, 0, 0, 0);
	var borderColor = rgba(0, 0, 0, 1);
	self.border = function (newBorderSize, newBorderColor) {
		border = newBorderSize;
		borderColor = newBorderColor;
	}

	self.added = function () {
		self.base.addChild(child);
		if (child.optimalWidth) {
			self.optimalWidth = function (height) {
				var childHeight = height - (margin.y() + border.y() + padding.y());
				var childWidth = child.optimalWidth(childHeight);
				return childWidth + margin.x() + border.x() + padding.x();
			}
		}
		if (child.optimalHeight) {
			self.optimalHeight = function (width) {
				var childWidth = width - (margin.x() + border.x() + padding.x());
				var childHeight = child.optimalHeight(childWidth);
				return childHeight + margin.y() + border.y() + padding.y();
			}
		}
	}

	self.resize = function (rect) {
		self.tpos = rect.clone();

		var childRect = rect.clone();
		childRect.sub(margin);
		childRect.sub(border);
		childRect.sub(padding);
		if (!childRect.validSize()) {
			if (DFlag.debug) {
				throw "Box is making child so small it's invisible!";
			}
			return;
		}

		child.resize(childRect);
	}

	self.redraw = function (canvas) {
		if (border.nonZero()) {
			var p = new Path();
			var rect = self.tpos.clone().zeroOrigin();
			rect.sub(margin).sub(border.clone().mult(0.5));
			p.rect(rect);
			// TODO: Proper per-side drawing.
			canvas.stroke(p, borderColor, border.left());
		}
	}
}
