ui.DeltaRect = function DeltaRect(top, right, bottom, left) {
	var self = this;
	// Partial specification rules follow those used in CSS.
	// http://www.w3.org/TR/CSS2/box.html
	if (right === undefined) {
		// If there is only one component value, it applies to all sides.
		right = top;
		bottom = top;
		left = top;
	} else if (bottom === undefined) {
		// If there are two values, the top and bottom margins are set to the first value and the right and left margins are set to the second.
		bottom = top;
		left = right;
	} else if (left === undefined) {
		//  If there are three values, the top is set to the first value, the left and right are set to the second, and the bottom is set to the third.
		left = right;
	}

	self._top = top;
	self._right = right;
	self._bottom = bottom;
	self._left = left;
	self.top = function () {
		return top;
	}
	self.right = function () {
		return right;
	}
	self.bottom = function () {
		return bottom;
	}
	self.left = function () {
		return left;
	}
	self.y = function () {
		return top + bottom;
	}
	self.x = function () {
		return left + right;
	}
	self.nonZero = function () {
		return top !== 0 || right !== 0 || bottom !== 0 || left !== 0;
	}
	self.clone = function () {
		return new ui.DeltaRect(top, right, bottom, left);
	}
	self.mult = function (amount) {
		top *= amount;
		right *= amount;
		bottom *= amount;
		left *= amount;
		return self;
	}
}
