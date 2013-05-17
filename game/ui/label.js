function Label(text) {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this);

    var alignment = "center";
    //See align in text.js
    this.align = function (newAlignment) {
        alignment = newAlignment;
        this.base.dirty();
        return this;
    }

    this.redraw = function (canvas) {
        var t = new Text().align(alignment);
        t.text(text);
        t.resize(new Rect(0, 0, 0, 0).size(this.tpos.size()));
        canvas.fill(t, "green");
    }

    this.resize = function (rect) {
        this.tpos = rect;
        this.base.dirty();
        return this;
    }

    this.text = function (newText) {
        if (newText === undefined) {
            return text;
        } else {
            text = newText;
            this.base.dirty();
            return this;
        }
    }
}
