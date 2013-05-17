function Label() {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this);

    var text = new Text();

    this.redraw = function (canvas) {
        canvas.fill(text, "green");
    }

    this.resize = function (rect) {
        this.tpos = rect;
        this.base.dirty();
        text.resize(new Rect(0, 0, 0, 0).size(rect.size()));
        return this;
    }

    this.optimalHeight = function (width) {
        return text.optimalHeight(width);
    }

    this.text = function (newText) {
        text.text(newText);
        this.base.dirty();
        return this;
    }
}
