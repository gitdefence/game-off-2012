function AttackVisual(attackObj, delta) {
    var self = this;

    if (jQuery.isFunction(attackObj)) {
        fail("No, pass in an instance of an attackType, not the attackType.");
    }

    self.base = new BaseObj(self, 10);

    var ourLayout = new FlowLayout();

    var typeLabel = new Label();

    delta = delta || "";

    function updateAttackTitle() {
        var attackObjTitle = formatToDisplay(getRealType(attackObj));
        if (delta.length > 0) {
            attackObjTitle = "(" + delta + ") " + attackObjTitle;
        }
        typeLabel.text(attackObjTitle);
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        var typeTitle = new HBox();
        typeTitle.add(new FakeDrawObject(attackObj.drawGlyph, true, true), 20);

        typeLabel.maxFontSize(16);
        updateAttackTitle();

        typeTitle.add(typeLabel);

        ourLayout.add(new PaddingControl(
                    typeTitle,
                    new Rect(0, 8, 0, 2),
                    new Rect(0, 0.15, 0, 0.05)
                ));

        //In the long term this will probably become just a bunch of AlleleVisuals
        for (var type in attackObj) {
            var value = attackObj[type];
            if (typeof value != "number") continue;

            var typeDivider = new HBox();

            typeDivider.add(new Label()
                                    .text(formatToDisplay(type))
                                    .align("left")
                                    .maxFontSize(12)
                                    .color("white")
                                );
            typeDivider.add(new Label()
                                    .text(formatToDisplay(value + ""))
                                    .align("right")
                                    .maxFontSize(12)
                                    .color("white")
                                );

            ourLayout.add(new PaddingControl(
                        typeDivider,
                        new Rect(0, 0, 0, 0),
                        new Rect(0, 0.4, 0, 0)
                    ));
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        ourLayout.resize(rect);
    }

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }
}

function NestedObjsVisual(attackObjs, title, deltaName) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var ourLayout = new FlowLayout();

    var typesLabel = new Label().text(title).maxFontSize(20);

    var alleleToCompare = null;

    var prevAlleleAttackType = false;
    function redoAttackObjLayout(curAlleleToCompare) {
        ourLayout.clear();

        ourLayout.add(typesLabel);

        var attackKeys = getSortedKeys(attackObjs);

        //Ignore it if it isn't an attack
        if (curAlleleToCompare && !curAlleleToCompare.delta[deltaName]) {
            curAlleleToCompare = null;
        }

        for (var iy = 0; iy < attackKeys.length; iy++) {
            var attackObj = attackObjs[attackKeys[iy]];

            var deltaDisplay = null;
            if (curAlleleToCompare && curAlleleToCompare.group == attackKeys[iy]) {
                deltaDisplay = "-";
            }
            ourLayout.add(new AttackVisual(attackObj, deltaDisplay));
            if (deltaDisplay) {
                ourLayout.add(new AttackVisual(new curAlleleToCompare.delta[deltaName](), "+"));
                curAlleleToCompare = null;
            }
        }

        //If we haven't added it yet, add it at the end.
        if (curAlleleToCompare) {
            ourLayout.add(new AttackVisual(new curAlleleToCompare.delta[deltaName](), "+"));
        }

        self.base.dirty();
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        redoAttackObjLayout(null);
    }

    self.resize = function (rect) {
        self.tpos = rect;
        ourLayout.resize(rect);
    }

    self.updateDeltaAllele = function (newAlleleToCompare) {
        alleleToCompare = newAlleleToCompare;

        if (!newAlleleToCompare || !newAlleleToCompare.delta[deltaName]) {
            if (prevAlleleAttackType) {
                prevAlleleAttackType = false;
                redoAttackObjLayout(alleleToCompare);
            }
        } else {
            if (!prevAlleleAttackType) {
                prevAlleleAttackType = true;
                redoAttackObjLayout(alleleToCompare);
            }
        }
    }

    self.updateAttackInfo = function () {
        redoAttackObjLayout(alleleToCompare);
    }

    self.updateAttackObjs = function (newAttackObjs) {
        attackObjs = newAttackObjs;
    }

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }
}
