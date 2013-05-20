// Pack a bunch of UI elements vertically.
ui.VBox = function VBox() {
    this.base = new BaseObj(this, 15);
    this.tpos = new Rect(0, 0, 0, 0);

    var children = [];

    // height is optional, if not given,
    // all children will have same height.
    this.add = function (ui, height) {
        children.push({ui: ui, height: height});
        this.base.addChild(ui);
    }

    this.clear = function () {
        children = [];
        this.base.removeAllChildren();
    }

    function calculateHeights(height) {
        var fixedHeight = 0;
        var numSharing = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.height) fixedHeight += c.height;
            else numSharing++;
        }

        var ratio = 1;
        if (fixedHeight > height) {
            ratio = height / fixedHeight;
        }

        var sharedHeight = ~~((height - fixedHeight) / numSharing);
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            c.calculatedHeight = (c.height || sharedHeight)*ratio;
        }
    }

    this.resize = function (rect) {
        calculateHeights(rect.h);
        this.tpos = rect;

        var y = rect.y;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var r = rect.clone();
            r.h = c.calculatedHeight;
            r.y = y;
            y += r.h;
            if (r.h <= 0) {
                // Otherwise things will crash...
                r.h = 1;
            }
             c.ui.resize(r);
        }
    }

    // Currently, this messes up the internal state, so make sure you
    // always call resize() after calling this to clean it up again. (It's
    // not a huge deal since that's the usual use-case anyway)
    this.optimalWidth = function (height) {
        calculateHeights(height);
        var max = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (!c.ui.optimalWidth) continue;
            var width = c.ui.optimalWidth(height);
            if (width > max) max = width;
        }
        return max;
    }
}
