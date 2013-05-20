Infobar.AttackObjVisual = function AttackObjVisual(attackObj, delta) {
    var self = this;

    if (jQuery.isFunction(attackObj)) {
        fail("No, pass in an instance of an attackType, not the attackType.");
    }

    self.base = new BaseObj(self, 10);

    var ourLayout = new ui.FlowLayout();

    var typeLabel = new ui.Label();

    function attackTitle() {
        var attackObjTitle = formatToDisplay(getRealType(attackObj));
        if (delta.length > 0) {
            attackObjTitle = "(" + delta + ") " + attackObjTitle;
        }
        return attackObjTitle;
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        var typeTitle = new ui.HBox();
        typeTitle.add(new FakeDrawObject(attackObj.drawGlyph, true, true), 20);

        typeLabel.maxFontSize(16).text(attackTitle());

        typeTitle.add(typeLabel);

        ourLayout.add(new ui.PaddingControl(typeTitle)
                        .constantBuffer(new Rect(0, 8, 0, 2))
                        .percentBuffer(new Rect(0, 0.15, 0, 0.05)));

        //In the long term this will probably become just a bunch of AlleleVisuals
        for (var type in attackObj) {
            var value = attackObj[type];
            if (typeof value != "number") continue;

            var typeDivider = new ui.HBox();

            typeDivider.add(new ui.Label()
                                    .text(formatToDisplay(type))
                                    .align("left")
                                    .maxFontSize(12)
                                    .color("white")
                                );
            typeDivider.add(new ui.Label()
                                    .text(formatToDisplay(value + ""))
                                    .align("right")
                                    .maxFontSize(12)
                                    .color("white")
                                );

            ourLayout.add(new ui.PaddingControl(typeDivider)
                            .percentBuffer(new Rect(0, 0.4, 0, 0)));
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        ourLayout.resize(rect);
    }

    self.optimalHeight = ourLayout.optimalHeight;
}

//Used to be just for attacks, but now shows targeting types too,
//so a lot of variables still mention attack.
Infobar.NestedObjsVisual = function NestedObjsVisual(attackObjs, title, deltaName) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var ourLayout = new ui.FlowLayout();

    var typesLabel = new ui.Label().text(title).maxFontSize(20);

    var alleleToCompare = null;

    function redoAttackObjLayout(curAlleleToCompare) {
        ourLayout.clear();

        ourLayout.add(typesLabel);

        //Ignore it if it isn't an attack
        if (curAlleleToCompare && !curAlleleToCompare.delta[deltaName]) {
            curAlleleToCompare = null;
        }

        var attackKeys = Object.keys(attackObjs).sort();

        for (var iy = 0; iy < attackKeys.length; iy++) {
            var attackGroup = attackKeys[iy];
            var attackObj = attackObjs[attackGroup];

            if (curAlleleToCompare && curAlleleToCompare.group == attackGroup) {
                ourLayout.add(new Infobar.AttackObjVisual(attackObj, "-"));
                ourLayout.add(new Infobar.AttackObjVisual(new curAlleleToCompare.delta[deltaName](), "+"));
                curAlleleToCompare = null;
            } else {
                ourLayout.add(new Infobar.AttackObjVisual(attackObj, ""));
            }
        }

        //If we haven't added it yet, add it at the end.
        if (curAlleleToCompare) {
            ourLayout.add(new Infobar.AttackObjVisual(new curAlleleToCompare.delta[deltaName](), "+"));
        }

        self.base.dirty();
        self.base.dirtyLayout();
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
        var showingDelta = alleleToCompare && alleleToCompare.delta[deltaName];

        alleleToCompare = newAlleleToCompare;

        var newDelta = newAlleleToCompare && newAlleleToCompare.delta[deltaName];

        //We just continue showing nothing, as there is no delta to change / remove / add
        if (!showingDelta && !newDelta) return;

        redoAttackObjLayout(alleleToCompare);
    }

    //Doesn't update the delta, so call updateDeltaAllele seperately.
    self.updateAttackObjs = function (newAttackObjs) {
        attackObjs = newAttackObjs;

        redoAttackObjLayout(null);
    }

    self.optimalHeight = ourLayout.optimalHeight;
}
