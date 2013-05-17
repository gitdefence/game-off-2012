function Label(text) {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this);

    var textObj = new Text();

    //Allows you to set the internal Text object, changing how the text is drawn.
    this.setTextType = function (text) {
        if (!(text instanceof Text)) {
            fail("You must pass in a type Text");
            return;
        }

        textObj = text;
        this.base.dirty();

        return this;
    }

    this.redraw = function (canvas) {
        textObj.text(text);
        textObj.resize(new Rect(0, 0, 0, 0).size(this.tpos.size()));
        canvas.fill(textObj, "green");
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
