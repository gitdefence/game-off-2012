var curAlleleHover = null;

//Indexed by allele, inside is an array of DeltaBars.
//Maintained by DeltaBar, and should only be modifed
//to call dirty on DeltaBars, and to reset it.
var deltaBarGroups = {};

var curAlleleHue = 0;

//deltaType is current, remove or add
function DeltaBar(allele, attrName, deltaType) {
    var self = this;
    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

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
        }
        else {
            DRAW.rect(pen, rect, allele.color);
        }
    }

    function redrawDeltaBars() {
        //Kindaof hackish, make our grandparent dirty.
        var ourGroups = deltaBarGroups[allele];
        for (var ix = 0; ix < ourGroups.length; ix++) {
            ourGroups[ix].base.dirty();
        }
        self.base.dirty();
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

//Gives a visual representation for how alleles impact various attributes.
function AlleleVisual(obj, attrName) {
    var self = this;

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 1, 1);

    var attrChanges = [];
    var attrChangeType = []; //current,remove,add
    var attrChangeColor = [];

    var deltaBars = new VBox();

    self.added = function() {
        self.base.addChild(deltaBars);
    }

    self.updateInfo = function (alleleToCompare) {
        attrChanges = [];
        attrChangeType = []; //current,remove,add

        deltaBars.clear();

        var plusBars = new HBoxFixedChildren();
        var negBars = new HBoxFixedChildren();

        var addedPlus = false;
        var addedNeg = false;
        for (var group in obj.genes.alleles) {
            var allele = obj.genes.alleles[group];

            for (var key in allele.delta) {
                if (key != attrName) continue;

                var replacing = alleleToCompare && alleleToCompare.group == group;
                var deltaType = replacing ? "remove" : "current";

                if (allele.delta[attrName] > 0) {
                    plusBars.add(new DeltaBar(allele, attrName, deltaType));
                    addedPlus = true;
                } else {
                    negBars.add(new DeltaBar(allele, attrName, deltaType));
                    addedNeg = true;
                }
            }
        }

        if (addedPlus) {
            plusBars.add(new FakeDrawObject(
            function (pen, rect) {
                //A plus sign
                rect = rect.largestSquare().origin(new Vector(0, 0));
                var vertLine = new Rect(0.5, 0.1, 0, 0.8).project(rect);
                DRAW.line(pen, vertLine.origin(),
                               new Vector(vertLine.right(), vertLine.bottom()),
                               "Blue",
                               2);
                var horiLine = new Rect(0.1, 0.5, 0.8, 0).project(rect);
                DRAW.line(pen, horiLine.origin(),
                               new Vector(horiLine.right(), horiLine.bottom()),
                               "Blue",
                               2);
            }, true, true, new Rect(0, 0, 20, 20)), 0);
        }

        if (addedNeg) {
            negBars.add(new FakeDrawObject(
            function (pen, rect) {
                //A negative sign
                rect = rect.largestSquare().origin(new Vector(0, 0));
                var horiLine = new Rect(0.2, 0.5, 0.6, 0).project(rect);
                DRAW.line(pen, horiLine.origin(),
                               new Vector(horiLine.right(), horiLine.bottom()),
                               "Blue",
                               2);
            }, true, true, new Rect(0, 0, 20, 20)), 0);
        }

        deltaBars.add(plusBars);
        deltaBars.add(negBars);

        self.resize(self.tpos);
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

    self.optimalHeight = function () {
        return deltaBars.optimalHeight();
    }
}

function AttributeInfo(attrHolder, attrName) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var attrNameLabel = new Label();
    var alleleInfo = new AlleleVisual(attrHolder, attrName);
    var attrValueLabel = new Label()
                            .align("right")
                            .maxFontSize(14)
                            .color("white");

    var infoParts = new HBox();
    var ourLayout = new PaddingControl(
                     infoParts,
                     new Rect(0, 10, 0, 0),
                     new Rect(0, 0, 0, 0)
                  );

    self.added = function () {
        infoParts.add(attrNameLabel, 50);
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

        //Don't show a decimal point, unless the |number| is < 10.
        var numberToDisplay = Math.abs(value) < 10 ?
                                round(value, 1) + "" :
                                round(value, 0) + "";

        var prevAlleleDelta = getAlleleDelta(alleleToCompare);
        
        if (prevAlleleDelta != 0) {
            var prevAlleleDelta = Math.abs(prevAlleleDelta) < 10 ?
                                    round(prevAlleleDelta, 1) + "" :
                                    round(prevAlleleDelta, 0) + "";

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

function AttributeInfos(obj) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = new Rect(0, 0, 1, 1);

    var deltaAllele = null;

    var attrBox = new FlowLayout();
    var attrHeader = new Label().text("Attributes").maxFontSize(20);

    var height = 0;

    var attrInfos = {};

    self.added = function (rect) {
        deltaBarGroups = {};

        attrBox.add(new PaddingControl(
                    attrHeader,
                    new Rect(0, 0, 0, 0),
                    new Rect(0, 0.5, 0, 0)
                ));

        var numAttrs = 0;
        for (var attr in obj.attr) {
            if (attr == "targetStrategy" || attr == "attackObjs") continue;

            //Temporary screening until we remove them
            if (attr == "upload" || attr == "download" || attr == "hitCount" || attr == "kills" || attr == "value") continue;

            attrInfos[attr] = new AttributeInfo(obj, attr);
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
        }

        self.base.dirty();
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

        self.resize(self.tpos);

        self.base.dirty();
    }

    self.updateObject = function (newObj) {
        obj = newObj;

        for (var attrName in attrInfos) {
            attrInfos[attrName].updateObj(newObj);
        }

        self.updateAllAttributes();
    }

    self.optimalHeight = function (width) {
        return attrBox.optimalHeight(width);
    }
}
