var Rect = (function () {
    function Rect(x, y, w, h) {
        if (!assertDefined("Rect", x, y, w, h)) {
            x = 0;
            y = 0;
            w = 1;
            h = 1;
        }

        if (w < 0) {
            x += w;
            w = -w;
        }
        if (h < 0) {
            y += h;
            h = -h;
        }

        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        Object.defineProperties(this, {
            x: {
                get: function () {
                    return this._x
                },
                set: function (x) {
                    if (x !== x) throw "Invalid value for x";
                    this._x = x
                },
            },
            y: {
                get: function () {
                    return this._y;
                },
                set: function (y) {
                    if (y !== y) throw "Invalid value for y";
                    this._y = y;
                },
            },
            w: {
                get: function () {
                    return this._w
                },
                set: function (w) {
                    if (w !== w || !w) throw "Invalid value for w";
                    this._w = w
                },
            },
            h: {
                get: function () {
                    return this._h
                },
                set: function (h) {
                    if (h !== h || !h) throw "Invalid value for h";
                    this._h = h
                },
            },
        });
//         this.x = x;
//         this.y = y;
//         this.w = w;
//         this.h = h;
    }

    var p = Rect.prototype;

    p.center = function (newCenter) {
        if (newCenter === undefined) {
            return new Vector(this.x + this.w / 2, this.y + this.h / 2);
        }
        this.x = newCenter.x - this.w / 2;
        this.y = newCenter.y - this.h / 2;
        return this;
    };

    p.clone = function () {
        return new Rect(this.x, this.y, this.w, this.h);
    };

    // Assuming this rectangle fits within the unit rectangle
    // with origin (0, 0) and size (1, 1), project it onto
    // a rectangle with the given origin and size. For example,
    //     rect(0, 0, 0.5, 0.5).project(rect(0, 0, 4, 4))
    // would give you rect(0, 0, 2, 2). Similarilly,
    //     rect(0.5, 0, 0.5, 0.5).project(rect(0, 0, 4, 4))
    // would give you rect(2, 0, 2, 2). Finally,
    //     rect(0, 0, 1, 1).project(rect(20, 75, 1, 1))
    // would give you rect(20, 75, 1, 1).
    p.project = function (rect) {
        this.x = rect.x + this.x * rect.w;
        this.y = rect.y + this.y * rect.h;

        var w = this.w * rect.w;
        if (w != 0) this.w = w;
        var h = this.h * rect.h;
        if (h != 0) this.h = h;

        return this;
    }

    // Assuming this rectangle fits within the given rectangle,
    // this function will normalize it to fit within the unit
    // rectangle, so that it can be projected onto a different
    // rectangle.
    p.norm = function (rect) {
        this.x = (this.x - rect.x) / rect.w;
        this.y = (this.y - rect.y) / rect.h;

        var w = this.w / rect.w;
        if (w != 0) this.w = w;
        var h = this. h / rect.h
        if (h != 0) this.h = h;

        return this;
    }

    // Returns a rectangle represeting the largest square that
    // can fit inside this rectangle, centered inside the rectangle.
    // Very useful for laying out square objects in the gui.
    p.largestSquare = function () {
        var size = this.w > this.h ? this.h : this.w;
        return new Rect(0, 0, size, size).center(this.center());
    }

    p.origin = function (newOrigin) {
        if (newOrigin === undefined) {
            return new Vector(this.x, this.y);
        }
        this.x = newOrigin.x;
        this.y = newOrigin.y;
        return this;
    }

    p.moveOrigin = function (delta) {
        this.x += delta.x;
        this.y += delta.y;
        return this;
    }

    p.size = function (newSize) {
        if (newSize === undefined) {
            return new Vector(this.w, this.h);
        }
        this.w = newSize.x;
        this.h = newSize.y;
        return this;
    }

    // Shrinks a rectangle by amount in all directions.
    // used to add padding.
    p.shrink = function (amount) {
        this.x += amount;
        this.y += amount;
        this.w -= 2 * amount;
        this.h -= 2 * amount;
        return this;
    }

    p.str = function () {
        return "Rectangle at (" + this.x + ", " + this.y + ")" + "with size (" + this.w + ", " + this.h + ")";
    }

    return Rect;
} ());
