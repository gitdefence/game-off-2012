// Pack a bunch of UI elements vertically.
function HBox() {
    this.base = new BaseObj(this, 15);
    this.tpos = new Rect(0, 0, 0, 0);

    var children = [];

    // width is optional, if not given,
    // all children will have same width.
    this.add = function (ui, width) {
        children.push({ui: ui, width: width});
        this.base.addChild(ui);
    }

    function calculateWidths(width) {
        var fixedWidth = 0;
        var numSharing = 0;
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.width) fixedWidth += c.width;
            else numSharing++;
        }
        if (fixedWidth > width) {
            // Well... fuck.
            // Eventually we can handle this properly with requestResize, but for now... fuck it.
            throw "Attempting to make a hbox smaller than it's fixed size children allow!";
        }
        var sharedWidth = ~~((width - fixedWidth) / numSharing);
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            c.calculatedWidth = c.width || sharedWidth;
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
            c.ui.resize(r);
        }
    }

    this.globalResize = function(ev) {
        console.log(ev);
    }
}
