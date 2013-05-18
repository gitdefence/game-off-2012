//deltaType is current, remove or add
function DeltaBar(allele, attrName, deltaType) {
    var self = this;
    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 0, 0);

    self.resize = function (rect) {
        self.tpos = rect;
        self.base.dirty();
    }

    self.redraw = function (canvas) {
        var pen = canvas.ctx();

        var rect = self.tpos.origin(new Vector(0, 0));

        if (!allele.color) {
            allele.color = hsla(Math.random() * 360, 70, 80, 1).str();
        }

        DRAW.rect(pen, rect, allele.color);
    }

    self.optimalWidth = function (height) {
        return Math.round(
                Math.abs(Math.log(Math.abs(allele.delta[attrName])) * 5)
            ) + 1;
    }
}

//Gives a visual representation for how alleles impact various attributes.
function AlleleVisual(_obj, _attrName) {
    var self = this;

    var obj = _obj;
    var attrName = _attrName;

    self.base = new BaseObj(self, 11);
    self.tpos = new Rect(0, 0, 1, 1);

    var attrChanges = [];
    var attrChangeType = []; //current,remove,add
    var attrChangeColor = [];

    var deltaBars = new HBoxFixedChildren();

    self.added = function() {
        self.base.addChild(deltaBars);
    }

    self.updateInfo = function (alleleToCompare) {
        attrChanges = [];
        attrChangeType = []; //current,remove,add

        deltaBars.clear();

        for (var group in obj.genes.alleles) {
            var allele = obj.genes.alleles[group];

            for (var key in allele.delta) {
                if (key != attrName) continue;

                var replacing = alleleToCompare && alleleToCompare.group == group;
                deltaBars.add(new DeltaBar(allele, attrName, replacing ? "remove" : "current"));
            }
        }

        self.base.dirty();
    }

    self.resize = function (rect) {
        self.tpos = rect;
        deltaBars.resize(rect);
        self.base.dirty();
    }

    self.redraw = function (canvas) {
        var pen = canvas.ctx();
    }

    self.optimalHeight = function () {
        return 20;
    }
}

function AttributeInfo(_attrHolder, _attrName) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var attrHolder = _attrHolder;
    var attrName = _attrName;

    var attrNameLabel = new Label();
    var alleleInfo = new AlleleVisual(attrHolder, attrName);
    var attrValueLabel = new Label()
                            .align("right")
                            .maxFontSize(14)
                            .color("white");

    var infoParts = new HBox();
    var ourLayout = new BufferedControl(
                     infoParts,
                     new Rect(0, 0, 0, 0),
                     new Rect(0, 0.4, 0, 0)
                  );

    self.added = function () {
        infoParts.add(attrNameLabel);
        infoParts.add(alleleInfo);
        infoParts.add(attrValueLabel);

        self.base.addChild(ourLayout);
    }

    function getAlleleDelta(alleleToCompare) {
        var alleleDelta = 0;
        if (alleleToCompare) {
            function addToDelta(allele, factor) {
                var change = allele.delta[attrName] || 0;

                alleleDelta += change * factor;
            }

            //If we had it added, indicate that it is being replaced
            if (attrHolder.genes.alleles[alleleToCompare.group])
                addToDelta(attrHolder.genes.alleles[alleleToCompare.group], -1);

            //Indicate we are adding the allele
            addToDelta(alleleToCompare, 1);
        }

        return alleleDelta;
    }

    self.updateValue = function (alleleToCompare) {
        attrNameLabel.text(formatToDisplay(attrName)).align("left");
        alleleInfo.updateInfo(alleleToCompare);

        var numberToDisplay = round(attrHolder.attr[attrName], 2) + "";

        var prevAlleleDelta = getAlleleDelta(alleleToCompare);
        if (prevAlleleDelta != 0) {
            numberToDisplay = "(" + prevAlleleDelta + ") " + numberToDisplay;
        }

        attrValueLabel.text(numberToDisplay);

        self.base.dirty();
    }

    self.resize = function (rect) {
        self.tpos = rect;
        ourLayout.resize(rect);
    }

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }
}

function AttributeInfos(_obj, _topAllele) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = new Rect(0, 0, 1, 1);

    var obj = _obj;
    var topAllele = _topAllele;

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

        var numAttrs = 0;
        for (var attr in obj.attr) {
            if (attr == "targetStrategy" || attr == "attackTypes") continue;

            //Temporary screening until we remove them
            if (attr == "upload" || attr == "download" || attr == "hitCount" || attr == "kills" || attr == "value") continue;

            attrInfos[attr] = new AttributeInfo(obj, attr);
            attrInfos[attr].updateValue(topAllele);
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
            attrInfos[attrName].updateValue(topAllele);
        }
    }

    self.optimalHeight = function (width) {
        return attrBox.optimalHeight(width);
    }
}
