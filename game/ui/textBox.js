function TextBox(text, zorder) {
    this.tPos = new TemporalPos(0, 0, 0, 0);

    if (!zorder) zorder = 15;
    this.base = new BaseObj(this, zorder, true);

    var hover = false;
    var down = false;

    var wrapper = new TextWrapper(text, zorder + 1);
    wrapper.textAlign = "center";
    this.base.addObject(wrapper);

    this.draw = function (pen) {
        pen.fillStyle = "black";
        pen.strokeStyle = "green";
        ink.rect(this.tPos.x, this.tPos.y, this.tPos.w, this.tPos.h, pen);
    }

    this.resize = function (rect) {
        wrapper.resize(rect);
        this.tPos = wrapper.tPos;
        return this;
    }

    this.mouseover = function () {
        hover = true;
    };

    this.mouseout = function () {
        hover = false;
    };

    this.mousedown = function () {
        down = true;
    };

    this.mouseup = function () {
        down = false;
    };
}