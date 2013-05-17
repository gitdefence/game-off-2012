function Text() {
    // Will we re-measure and re-fit all of the text on the
    // next call to apply()?
    var dirty = true;

    var text = "[No text]";
    this.text = function (newText) {
        if (newText === undefined) {
            return text;
        }
        // We rely on this text object to have string methods.
        text = newText + "";
        dirty = true;
        return this;
    }

    // Should we word wrap long lines to fit within the width
    // of the bounding rect? If no, resize() will return the
    // width actually used by the text, which may be greater
    // than the width given.
    var wrap = true;
    this.wrap = function (newWrap) {
        if (newWrap === undefined) {
            return wrap;
        }
        wrap = newWrap;
        dirty = true;
        return this;
    }

    var fontSize = 14;

    // When shrink == true, fontSize is the size we would ideally
    // line to achieve, and curFontSize is the size we are forced
    // to render at to meet the constraints of our bounding rect.
    var curFontSize = fontSize;

    // Should we shrink the text size as required to fit within
    // the bounding rect? If yes, the text is always garuenteed
    // to fit within the bounding rect, but isn't always
    // gaurenteed to be readable!
    var shrink = true;
    this.shrink = function (newShrink) {
        if (newShrink === undefined) {
            return shrink;
        }
        shrink = newShrink;
        dirty = true;
        return this;
    }

    // The amount of space allocated for each line, as a function
    // of the font size. As lines are positioned in the center of
    // the space allocted for them, the space is evenly distributed
    // above and below each line (which really only matters for
    // the first and last lines.)
    var lineSpacing = 1;
    this.lineSpacing = function (newLineSpacing) {
        if (newLineSpacing === undefined) {
            return lineSpacing;
        }
        lineSpacing = newLineSpacing;
        dirty = true;
        return this;
    }

    // How should we align the text within the box? Currently
    // supported values are "left", "right", and "center".
    // Justified support is not provided by canvas natively,
    // and is not trivial to implement. If you need it, add
    // it.
    var align = "center";
    this.align = function (newAlign) {
        if (newAlign === undefined) {
            return align;
        }
        // I wish I could do array.contains or something,
        // but javascript doesn't have that natively, and
        // this works for now.
        if (align == "left") {
            align = newAlign;
        } else if (align == "right") {
            align = newAlign;
        } else if (align == "center") {
            align = newAlign;
        } else {
            throw "Invalid or unsuppored value '" + newAlign + "' for Text.align given.";
        }
        return this;
    }

    // Type can be "stroke" or "fill". We need it because
    // the canvas API does'nt let us treat text like every
    // other path...
    this.apply = function (pen, type) {
        if (dirty) {
            this.resize(rect);
            dirty = false;
        }
        pen.font = font();
        pen.fillStyle = "green";
        pen.strokeStyle = "green";
        pen.textAlign = align;
        pen.textBaseline = "middle";

        var height = lineHeight();
        var unusedHeight = rect.h - usedHeight;
        var x = rect.x;
        var y = rect.y + height / 2 + unusedHeight / 2;

        if (align == "center") {
            x += rect.w / 2;
        } else if (align == "right") {
            x += rect.w;
        }

        for (var i = 0; i < lines.length; i++) {
            if (type == "stroke") {
                pen.strokeText(lines[i], x, y);
            } else if (type == "fill") {
                pen.fillText(lines[i], x, y);
            } else {
                throw "Unknown apply type '" + type + "'";
            }
            y += height;
        }
    }

    var rect;
    var usedHeight = 0;
    this.resize = function (newRect) {
        rect = newRect;
        curFontSize = fontSize;

        if (!shrink) return fitText(newRect.clone());

        while (true) {
            var fittedRect = fitText(newRect.clone());
            if (fittedRect.w <= newRect.w && fittedRect.h <= newRect.h) {
                usedHeight = fittedRect.h;
                return;
            }
            if (curFontSize-- < 0) throw "WTF";
        }
    }

    this.optimalHeight = function (width) {
        var rect = new Rect(0, 0, width, 0);
        rect = fitText(rect);
        return rect.h;
    }

    function fitText (rect) {
        c.font = font();
        if (wrap) {
            lines = getLines(c, text, rect.w);
            rect.h = lineHeight() * lines.length;
            return rect;
        } else {
            rect.h = lineHeight();
            rect.w = c.measureText(text).width;
            return rect;
        }

    }

    function font () {
        return curFontSize + "px courier";
    }

    function lineHeight () {
        return curFontSize * lineSpacing;
    }

    var element = document.createElement('canvas')
    var c = element.getContext('2d');
    c.font = font();
    var lines = [];

    //http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
    //Set font before you call this.
    function getLines(ctx, text, maxWidth) {
        var words = text.split(" ");
        var lines = [];
        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
}
