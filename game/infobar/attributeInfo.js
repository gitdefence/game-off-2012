var curAlleleHover = null;

var curAlleleHue = 0;

//deltaType is current, remove or add
Infobar.DeltaBar = function DeltaBar(allele, attrName, deltaType) {
    var self = this;
    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

    var deltaBarGroups = Infobar.DeltaBar.deltaBarGroups;

    deltaBarGroups[allele] = deltaBarGroups[allele] || [];
    deltaBarGroups[allele].push(self);

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
    }

    self.redraw = function (canvas) {
        var pen = canvas.ctx();

        var rect = self.tpos.clone().origin(new Vector(0, 0));

        if (!allele.color) {
            allele.color = hsla(curAlleleHue += 40, 70, 80, 1).str();
        }

        if (curAlleleHover == allele) {
            DRAW.rect(pen, rect, allele.color, 2, "white");
        } else {
            DRAW.rect(pen, rect, allele.color);
        }
    }

    function redrawDeltaBars() {
        var ourGroups = deltaBarGroups[allele];
        for (var ix = 0; ix < ourGroups.length; ix++) {
            ourGroups[ix].base.dirty();
        }
    }

    self.mouseenter = function () {
        curAlleleHover = allele;
        redrawDeltaBars();
    }
    self.mouseout = function () {
        if (curAlleleHover == allele) {
            curAlleleHover = null;
        }
        redrawDeltaBars();
    }

    self.optimalWidth = function (height) {
        return Math.round(
                Math.abs(Math.log(Math.abs(allele.delta[attrName])) * 5)
            ) + 3;
    }
}
//Indexed by allele, inside is an array of DeltaBars.
//Maintained by DeltaBar, and should only be modifed
//to call dirty on DeltaBars, and to reset it.
Infobar.DeltaBar.deltaBarGroups = {};

//Gives a visual representation for how alleles impact various attributes.
Infobar.AlleleVisual = function AlleleVisual(obj, attrName) {
    var self = this;

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 1, 1);

    var attrChanges = [];
    var attrChangeType = []; //current,remove,add
    var attrChangeColor = [];

    var deltaBars = new VBox();

    self.added = function () {
        self.base.addChild(deltaBars);
    }

    self.updateInfo = function (alleleToCompare) {
        attrChanges = [];
        attrChangeType = []; //current,remove,add

        deltaBars.clear();

        var plusBars = new HFlowLayout();
        var negBars = new HFlowLayout();

        var addedPlus = false;
        var addedNeg = false;

        function addAlleleDelta(allele) {
            for (var key in allele.delta) {
                if (key != attrName) continue;

                var replacing = alleleToCompare && alleleToCompare.group == group;
                var deltaType = replacing ? "remove" : "current";

                if (allele.delta[attrName] > 0) {
                    plusBars.add(new Infobar.DeltaBar(allele, attrName, deltaType));
                    addedPlus = true;
                } else {
                    negBars.add(new Infobar.DeltaBar(allele, attrName, deltaType));
                    addedNeg = true;
                }
            }
        }

        for (var group in obj.genes.alleles) {
            var allele = obj.genes.alleles[group];
            addAlleleDelta(allele);
        }

        if (alleleToCompare) {
            addAlleleDelta(alleleToCompare);
        }

        //Needed to insure the +/- sign is always the same size.
        var plusBarWithSymbol = new HBox();
        var negBarWithSymbol = new HBox();

        if (addedPlus) {
            plusBarWithSymbol.add(new PaddingControl(new Label().text("+"))
                                    .constantBuffer(new Rect(0, 0, 0, 0))
                                    .percentBuffer(new Rect(0.1, 0, 0.5, 0)), 14);
        } else {
            plusBarWithSymbol.add(new FakeDrawObject(function () { }, false, false, 14, 14));
        }
        plusBarWithSymbol.add(plusBars);

        if (addedNeg) {
            negBarWithSymbol.add(new PaddingControl(new Label().text("-"))
                                    .constantBuffer(new Rect(0, 0, 0, 0))
                                    .percentBuffer(new Rect(0.1, 0, 0.5, 0)), 14);
        } else {
            negBarWithSymbol.add(new FakeDrawObject(function () { }, false, false, 14, 14));
        }
        negBarWithSymbol.add(negBars);

        deltaBars.add(plusBarWithSymbol);
        deltaBars.add(negBarWithSymbol);

        self.base.dirtyLayout();
        self.base.dirty();
    }

    self.updateObj = function (newObj) {
        obj = newObj;
        self.updateInfo(null);
    }

    self.resize = function (rect) {
        self.tpos = rect;
        deltaBars.resize(rect);
        self.base.dirty();
    }

    self.optimalHeight = deltaBars.optimalHeight;
}

Infobar.AttributeInfo = function AttributeInfo(attrHolder, attrName) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var attrNameLabel = new Label()
                            .maxFontSize(12);
    var alleleInfo = new Infobar.AlleleVisual(attrHolder, attrName);
    var attrValueLabel = new Label()
                            .align("right")
                            .maxFontSize(14)
                            .color("white");

    var infoParts = new HBox();
    var ourLayout = new PaddingControl(infoParts).constantBuffer(new Rect(0, 10, 0, 0));

    self.added = function () {
        infoParts.add(attrNameLabel, 70);
        infoParts.add(alleleInfo);
        infoParts.add(attrValueLabel, 40);

        self.base.addChild(ourLayout);
    }

    function getAlleleDelta(alleleToCompare) {
        if (!alleleToCompare) return 0;

        var alleleDelta = 0;

        function addToDelta(allele, factor) {
            var change = allele.delta[attrName] || 0;

            alleleDelta += change * factor;
        }

        //If we had it added, indicate that it is being replaced
        if (attrHolder.genes.alleles[alleleToCompare.group])
            addToDelta(attrHolder.genes.alleles[alleleToCompare.group], -1);

        //Indicate we are adding the allele
        addToDelta(alleleToCompare, 1);

        return alleleDelta;
    }

    self.updateValue = function (alleleToCompare) {
        attrNameLabel.text(formatToDisplay(attrName)).align("left");
        alleleInfo.updateInfo(alleleToCompare);

        var value = attrHolder.attr[attrName];

        function roundTo3Chars(value) {
            return Math.abs(value) < 10 ?
                round(value, 1) + "" :
                round(value, 0) + "";
        }

        //Don't show a decimal point, unless the |number| is < 10.
        var numberToDisplay = roundTo3Chars(value);

        var prevAlleleDelta = getAlleleDelta(alleleToCompare);

        if (prevAlleleDelta) {
            var prevAlleleDelta = roundTo3Chars(prevAlleleDelta);

            numberToDisplay = "(" + prevAlleleDelta + ") " + numberToDisplay;
        }

        attrValueLabel.text(numberToDisplay);

        self.base.dirty();
    }

    self.resize = function (rect) {
        self.tpos = rect;
        ourLayout.resize(rect);
    }

    self.updateObj = function (obj) {
        attrHolder = obj;
        alleleInfo.updateObj(obj);
    }

    self.optimalHeight = function (width) {
        return 40; //ourLayout.optimalHeight(width);
    }
}

Infobar.AttributeInfos = function AttributeInfos(obj) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = new Rect(0, 0, 1, 1);

    var deltaAllele = null;

    var attrBox = new FlowLayout();
    var attrHeader = new Label().text("Attributes").maxFontSize(25);

    var height = 0;

    var attrInfos = {};

    self.added = function (rect) {
        Infobar.DeltaBar.deltaBarGroups = {};

        attrBox.add(new PaddingControl(attrHeader)
                        .constantBuffer(new Rect(0, 0, 0, 0))
                        .percentBuffer(new Rect(0, 0.3, 0, 0)));

        var numAttrs = 0;
        for (var attr in obj.attr) {
            if (attr == "targetStrategy" || attr == "attackObjs") continue;

            //Temporary screening until we remove them
            if (attr == "upload" || attr == "download" || attr == "hitCount" || attr == "kills" || attr == "value") continue;

            attrInfos[attr] = new Infobar.AttributeInfo(obj, attr);
            attrInfos[attr].updateValue(deltaAllele);
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
            attrInfos[attrName].updateValue(deltaAllele);
            self.base.dirty();
        }
    }

    self.updateAllAttributes = function () {
        for (var attrName in attrInfos) {
            attrInfos[attrName].updateValue(deltaAllele);
        }

        self.base.dirty();
    }

    self.updateDeltaAllele = function (deltaAllele) {
        for (var attrName in attrInfos) {
            attrInfos[attrName].updateValue(deltaAllele);
        }

        self.base.dirty();
    }

    self.updateObject = function (newObj) {
        obj = newObj;

        for (var attrName in attrInfos) {
            attrInfos[attrName].updateObj(newObj);
        }

        self.updateAllAttributes();
    }

    self.optimalHeight = attrBox.optimalHeight;
}
