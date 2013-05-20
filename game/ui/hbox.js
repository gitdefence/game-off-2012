// Pack a bunch of UI elements horizontally.
ui.HBox = function HBox() {
    this.base = new BaseObj(this, 15);
    this.tpos = new Rect(0, 0, 0, 0);

    var children = [];

    // width is optional, if not given,
    // all children will have same width.
    this.add = function (ui, width) {
        children.push({ui: ui, width: width});
        this.base.addChild(ui);
    }

    this.clear = function () {
        children = [];
        this.base.removeAllChildren();
    }

    function calculateWidths(width) {
        var fixedWidth = 0;
        var numSharing = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.width) fixedWidth += c.width;
            else numSharing++;
        }

        var ratio = 1;
        if (fixedWidth > width) {
            ratio = width / fixedWidth;
        }

        var sharedWidth = ~~((width - fixedWidth) / numSharing);
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            c.calculatedWidth = (c.width || sharedWidth)*ratio;
        }
    }

    this.resize = function (rect) {
        calculateWidths(rect.w);
        this.tpos = rect;

        var x = rect.x;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var r = rect.clone();
            r.w = c.calculatedWidth;
            r.x = x;
            x += r.w;
            if (r.w <= 0) {
                r.w = 1;
            }
            c.ui.resize(r);
        }
    }

    // Currently, this messes up the internal state, so make sure you
    // always call resize() after calling this to clean it up again. (It's
    // not a huge deal since that's the usual use-case anyway)
    this.optimalHeight = function (width) {
        calculateWidths(width);
        var max = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (!c.ui.optimalHeight) continue;
            var height = c.ui.optimalHeight(width);
            if (height > max) max = height;
        }
        return max;
    }
}
