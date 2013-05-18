//Gives a visual representation for how alleles impact various attributes.
function AlleleVisual(obj, attrName) {
    var self = this;

    this.base = new BaseObj(self, 11);
    this.tpos = new Rect(0, 0, 0, 0);

    var attrChanges = [];

    for (var key in obj.genes.alleles) {
        var allele = obj.genes.alleles[key];
        for (var key in allele.delta) {
            if (key == attrName) {
                var impact = allele.delta[key];
                attrChanges.push(impact);
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
            DRAW.rect(pen, new Rect(x, y, w, h),
                           attrChanges[ix] >= 0 ? "Green" : "Red",
                           boxWidth,
                           "White");
            x += w;
        }
    }
}

function AttributeInfo(attrHolder, attrName) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var topAlleleDelta = 0;
    var topAllele = attrHolder.genes.topAllele();
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
    var alleleInfo = new AlleleVisual(attrHolder, attrName);

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
}

function TargetStrategiesVisual(obj) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new VBox();

    //Each element has {strat: attr.targetStrategy, delta:string}
    var targetStrategies = [];
    var curTargetObj = { strat: obj.attr.targetStrategy, delta: "" };
    targetStrategies.push(curTargetObj);

    var topAllele = obj.genes.topAllele();
    if (topAllele && topAllele.delta.target) {
        var topAlleleStrat = new topAllele.delta.target();
        if (getRealType(topAlleleStrat) == getRealType(curTargetObj.strat)) {
            curTargetObj.delta = "+-"; //We show something to give the user feedback
        } else {
            curTargetObj.delta = "-";
            targetStrategies.push({ strat: topAlleleStrat, delta: "+" });
        }
    }

    self.getRequestedHeight = function () {
        return 30 + 20 * targetStrategies.length;
    }

    self.added = function () {
        self.base.addChild(vbox);

        var strategyLabel = new Label("Target Strategy").setTextType(new Text().maxFontSize(20));
        vbox.add(strategyLabel, 30);

        for (var ix = 0; ix < targetStrategies.length; ix++) {
            var targetObj = targetStrategies[ix];

            var typeTitle = new HBox();
            typeTitle.add(new FakeDrawObject(targetObj.strat.drawGlyph, false), 20);

            var textToDisplay = formatToDisplay(getRealType(targetObj.strat));
            if (targetObj.delta.length > 0) {
                textToDisplay = "(" + targetObj.delta + ") " + textToDisplay;
            }

            typeTitle.add(new Label(textToDisplay));
            vbox.add(typeTitle, 20);
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        vbox.resize(rect);
    }
}

function AttackTypesVisual(obj) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new VBox();

    var typesLabel = new Label("Attack Types").setTextType(new Text().maxFontSize(20));

    //Array of { attackType: attr.attackTypes[key], delta: "" };
    var attackTypeContainers = [];

    var originalAttackTypeContainers = [];
    for (var group in obj.attr.attackTypes) {
        originalAttackTypeContainers.push({
            attackType: obj.attr.attackTypes[group],
            group: group,
            delta: "" });
    }

    sortArrayByProperty(originalAttackTypeContainers, "group");

    //Refactor this code and make it have more functions and less nesting.
    var topAllele = obj.genes.topAllele();
    if (topAllele && topAllele.delta.attack) {
        var attackTypeChange = true;

        var topAlleleAttack = new topAllele.delta.attack();
        var curAttackObj = null;

        var prevAllele = obj.genes.alleles[topAllele.group];

        if (prevAllele) {
            var prevAttackObj = null;
            for (var key in originalAttackTypeContainers) {
                if (originalAttackTypeContainers[key].group == prevAllele.group) {
                    prevAttackObj = originalAttackTypeContainers[key];
                    break;
                }
            }

            //If there is an allele with the same group as us, we should be able to find it.
            if (assertDefined(prevAttackObj)) {
                //Check if we are replacing an attack with the same type
                if (false && getRealType(prevAttackObj.attackType) == getRealType(topAlleleAttack)) {
                    attackTypeChange = false;
                    prevAttackObj.delta = "+-";
                } else {
                    //different type
                    prevAttackObj.delta = "-";
                }
            }
        }

        if (attackTypeChange) {
            attackTypeContainers.push({ attackType: topAlleleAttack, delta: "+", group: topAllele.group });
        }
    }

    attackTypeContainers = originalAttackTypeContainers.concat(attackTypeContainers);

    self.added = function () {
        self.base.addChild(vbox);

        vbox.add(typesLabel, 30);

        for (var key in attackTypeContainers) {
            var attackTypeObj = attackTypeContainers[key].attackType;
            var delta = attackTypeContainers[key].delta;
            var group = attackTypeContainers[key].group;

            var typeTitle = new HBox();

            typeTitle.add(new FakeDrawObject(attackTypeObj.drawGlyph, false), 20);

            var attackTypeTitle = formatToDisplay(getRealType(attackTypeObj));
            if (delta.length > 0) {
                attackTypeTitle = "(" + delta + ") " + attackTypeTitle;
            }
            typeTitle.add(new Label(attackTypeTitle + group.substring(group.length - 1, group.length)));

            vbox.add(typeTitle, 20);

            for (var type in attackTypeObj) {
                var value = attackTypeObj[type];
                if (typeof value != "number") continue;

                var typeDivider = new HBox();

                typeDivider.add(new Label(formatToDisplay(type)).setTextType(
                                    new Text()
                                    .align("left")
                                    .maxFontSize(10)
                                    .color("white")
                                )
                            );
                typeDivider.add(new Label(formatToDisplay(value + ""))
                                .setTextType(
                                    new Text()
                                    .align("right")
                                    .maxFontSize(10)
                                    .color("white")
                                )
                            );

                vbox.add(typeDivider, 20);
            }
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        vbox.resize(rect);
    }
}

function Infobar(pos) {
    var self = this;
    self.base = new BaseObj(self, 14);
    self.tattr = null;

    self.tpos = pos;

    var buttonW = 100;

    //For each displayed item gives extra info to be displayed in brackets)
    self.extraInfo = {};

    var selectSomethingPrompt = new Label();

    var allelePoints = new AllelePointSystem();
    var outerVBox = new VBox();
    var attributeHBox = new HBox();
    var attributeVBox = new VBox();

    //Add our buttons, should really be done just in the constructor with our given pos information
    //Added should be where everything is initialized. Objects must be declared in the class scope though,
    //and to reduce the chance of crashes they are constructed there also. 
    //However, they should be initialized in added.
    self.added = function () {
        selectSomethingPrompt.setTextType(new Text().maxFontSize(20).lineSpacing(1.5).text(
            "Click on a bug or tower to display its information here."));

        outerVBox.add(attributeHBox);
        outerVBox.add(allelePoints, 220);

        attributeHBox.add(attributeVBox);

        updateDisplay();
    };

    self.resize = function (rect) {
        outerVBox.resize(rect);
        selectSomethingPrompt.resize(rect);
        self.tpos = rect;
    }

    function updateDisplay() {
        self.base.removeAllChildren();

        if (self.obj) {
            self.base.addChild(outerVBox);
        } else {
            self.base.addChild(selectSomethingPrompt);
        }
    }

    self.obj = null;
    self.updateAttr = function (obj) {
        self.obj = obj;
        updateDisplay();

        if (self.obj) {
            attributeVBox.clear();

            for (var attr in obj.attr) {
                if (attr == "targetStrategy" || attr == "attackTypes") continue;

                attributeVBox.add(new AttributeInfo(obj, attr), 30);
            }

            var targetStrats = new TargetStrategiesVisual(obj);
            attributeVBox.add(targetStrats, targetStrats.getRequestedHeight());
            attributeVBox.add(new AttackTypesVisual(obj));

            attributeVBox.resize(self.tpos);
        }
    }

    self.mousemove = function () {
        if (self.obj) {
            self.obj.genes.hideTopAllele(false);
        }
    }

    self.mouseout = function () {
        if (self.obj) {
            self.obj.genes.hideTopAllele(true);
        }
    }

    self.sellTower = function() {
        self.obj.base.destroySelf();
    }
}
