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

        var boxWidth = 2;

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

            var heightBuffer = 0;

            DRAW.rect(pen, new Rect(x, y + heightBuffer, w, h - heightBuffer),
                           color,
                           boxWidth,
                           "White");
            x += w;
        }
    }
}

function AttributeInfo(attrHolder, attrName, alleleToCompare) {
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
    var mainLayout = new BufferedControl(
                     infoParts,
                     new Rect(0, 0, 0, 0),
                     new Rect(0, 0.4, 0, 0)
                  );

    var attrNameLabel = new Label().text(formatToDisplay(attrName)).align("left");
    var alleleInfo = new AlleleVisual(attrHolder, attrName, alleleToCompare);

    var numberToDisplay = round(attrHolder.attr[attrName], 2) + "";
    if (topAlleleDelta != 0) {
        numberToDisplay = "(" + topAlleleDelta + ") " + numberToDisplay;
    }
    var attrValueLabel = new Label()
                                .text(numberToDisplay)
                                .align("right")
                                .maxFontSize(14)
                                .color("white");

    self.added = function () {
        infoParts.add(attrNameLabel);
        infoParts.add(alleleInfo);
        infoParts.add(attrValueLabel);

        self.base.addChild(mainLayout);
    }

    self.resize = function (rect) {
        this.tpos = rect;
        mainLayout.resize(rect);
    }

    self.optimalHeight = function (width) {
        return mainLayout.optimalHeight(width);
    }
}

function AttributeInfos(obj, topAllele) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = new Rect(0, 0, 1, 1);

    var attrBox = new FlowLayout();
    var attrHeader = new Label().text("Attributes").maxFontSize(20);

    var height = 0;

    var attrInfos = {};

    self.added = function (rect) {
        attrBox.add(new BufferedControl(
                    attrHeader,
                    new Rect(0, 0, 0, 0),
                    new Rect(0, 0.5, 0, 0)
                ));
        for (var attr in obj.attr) {
            if (attr == "targetStrategy" || attr == "attackTypes") continue;

            attrInfos[attr] = new AttributeInfo(obj, attr, topAllele);
            attrBox.add(attrInfos[attr]);
        }

        self.base.addChild(attrBox);
    }

    self.resize = function (rect) {
        attrBox.resize(rect);
        self.tpos = rect;
    }

    self.updateAttribute = function (attrName) {
        if (attrInfos[attrName]) {
            
        }
    }

    self.optimalHeight = function (width) {
        return attrBox.optimalHeight(width);
    }
}
