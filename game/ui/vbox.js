// Pack a bunch of UI elements vertically.
// We set our children size using our size.
// So from our children's perspective our size is fixed, and
// they dynamically resize.
function VBox() {
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

    this.resize = function (rect) {
        var h = 0;
        var shared = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.height) h += c.height;
            else shared++;
        }
        if (h > rect.h) {
            // Well... fuck.
            // Eventually we can handle this properly with requestResize, but for now... fuck it.
            throw "Attempting to make a vbox smaller than it's fixed size children allow!";
        }
        this.tpos = rect;

        var sharedHeight = ~~((rect.h - h) / shared);
        var y = rect.y;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var r = rect.clone();
            r.h = c.height || sharedHeight;
            r.y = y;
            y += r.h;
            c.ui.resize(r);
        }
    }
}
