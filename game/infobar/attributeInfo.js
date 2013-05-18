//Gives a visual representation for how alleles impact various attributes.
function AlleleVisual(obj, attrName, alleleToCompare) {
    var self = this;

    this.base = new BaseObj(self, 11);
    this.tpos = new Rect(0, 0, 0, 0);

    var attrChanges = [];
    var attrChangeType = []; //current,remove,add

    for (var group in obj.genes.alleles) {
        var allele = obj.genes.alleles[group];
        for (var key in allele.delta) {
            if (key == attrName) {
                var impact = allele.delta[key];
                attrChanges.push(impact);

                var replacing = alleleToCompare && alleleToCompare.group == group;
                attrChangeType.push(replacing ? "remove" : "current");
            }
        }
    }

    if (alleleToCompare) {
        for (var key in alleleToCompare.delta) {
            if (key == attrName) {
                var impact = alleleToCompare.delta[key];
                attrChanges.push(impact);
                attrChangeType.push("add");
            }
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        this.base.dirty();
    }

    self.redraw = function (canvas) {
        var pen = canvas.ctx();

        var boxWidth = 1;

        var x = boxWidth;
        var y = boxWidth;
        var w = 0;
        var h = this.tpos.h - boxWidth * 2;

        for (var ix = 0; ix < attrChanges.length; ix++) {
            w = Math.abs(Math.log(Math.abs(attrChanges[ix])) * 5);

            var color = attrChanges[ix] >= 0 ? "Green" : "Red";
            if (attrChangeType[ix] == "remove") {
                color = "grey";
            }
            if (attrChangeType[ix] == "add") {
                color = "blue";
            }

            DRAW.rect(pen, new Rect(x, y, w, h),
                           color,
                           boxWidth,
                           "White");
            x += w;
        }
    }
}

function AttributeInfo(attrHolder, attrName, alleleToCompare, height) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var topAlleleDelta = 0;
    var topAllele = alleleToCompare;
    if (topAllele) {
        function addToDelta(allele, factor) {
            var change = allele.delta[attrName] || 0;

            topAlleleDelta += change * factor;
        }

        //If we had it added, indicate that it is being replaced
        if (attrHolder.genes.alleles[topAllele.group])
            addToDelta(attrHolder.genes.alleles[topAllele.group], -1);

        //Indicate we are adding the allele
        addToDelta(topAllele, 1);
    }

    var infoParts = new HBox();

    var attrNameLabel = new Label(formatToDisplay(attrName)).setTextType(new Text().align("left"));
    var alleleInfo = new AlleleVisual(attrHolder, attrName, alleleToCompare);

    var numberToDisplay = round(attrHolder.attr[attrName], 2) + "";
    if (topAlleleDelta != 0) {
        numberToDisplay = "(" + topAlleleDelta + ") " + numberToDisplay;
    }
    var attrValueLabel = new Label(numberToDisplay).setTextType(new Text().align("right"));

    self.added = function () {
        self.base.addChild(infoParts);

        infoParts.add(attrNameLabel);
        infoParts.add(alleleInfo);
        infoParts.add(attrValueLabel);
    }

    self.resize = function (rect) {
        this.tpos = rect;
        infoParts.resize(rect);
    }

    self.optimalHeight = function () {
        return height;
    }
}

function AttributeInfos(obj, topAllele) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = new Rect(0, 0, 1, 1);

    var attrVBox = new VBox();
    var attrHeader = new Label("Attributes").setTextType(new Text().maxFontSize(20));

    var height = 0;

    self.added = function (rect) {
        height += 30;
        attrVBox.add(attrHeader, 30);
        for (var attr in obj.attr) {
            if (attr == "targetStrategy" || attr == "attackTypes") continue;

            height += 20;
            attrVBox.add(new AttributeInfo(obj, attr, topAllele, 20), 20);
        }

        self.base.addChild(attrVBox);
    }

    self.resize = function (rect) {
        attrVBox.resize(rect);
        self.tpos = rect;
    }

    self.optimalHeight = function () {
        return height;
    }
}
