// This is a hbox, except it assumes its children know their size.
// It also is intended to always have enough room, and will eventually
// have scrollbars when there is not enough room.

// We set our size from our children's size.
// So from our children's perspective our size is dynamic, and
// their's is fixed.
function HFlowLayout() {
    this.base = new BaseObj(this);
    this.tpos = new Rect(0, 0, 0, 0);

    var children = [];

    this.clear = function () {
        children = [];
        this.base.removeAllChildren();
    }

    this.add = function (ui) {
        children.push(ui);
        this.base.addChild(ui);
    }

    this.insert = function (index, ui) {
        children.splice(index, 0, ui);
        this.base.addChild(ui);
    }

    this.resize = function (rect) {
        var height = rect.h;
        var widths = [];
        var totalWidth = 0;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var width = child.optimalWidth(height);
            totalWidth += width;
            widths.push(width);
        }

        // Make sure we can fit.
        if (totalWidth > rect.w) {
            for (var i = 0; i < widths.length; i++) {
                widths[i] *= rect.w / totalWidth;
                widths[i] = Math.max(Math.round(widths[i]), 1);
            }
        }

        var curX = rect.x;
        for (var i = 0; i < children.length; i++) {
            var width = widths[i];
            var childRect = new Rect(curX, rect.y, width, height);
            children[i].resize(childRect);
            curX += width;
        }
    }

    this.optimalWidth = function (height) {
        var totalWidth = 0;
        for (var i = 0; i < children.length; i++) {
            totalWidth += children[i].optimalWidth(height);
        }
        return totalWidth;
    }
}
