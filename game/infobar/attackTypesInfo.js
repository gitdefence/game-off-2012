function AttackVisual(obj, attackObj) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var ourLayout = new FlowLayout();

    var attackObjs = obj.attr.attackObjs;
    var attackKeys = getSortedKeys(attackObjs);
    var newAttack = findAttackObjDelta(alleleToCompare, attackObjs);

    function findAttackObjDelta(alleleToCompare, attackObjs) {
        if (!alleleToCompare || !alleleToCompare.delta.attack) return;

        var attackToReplace = attackObjs[alleleToCompare.group];

        var attacksSameKind = attackToReplace &&
            attackToReplace.AttackNode == alleleToCompare.delta.attack;

        //Check if we are replacing an attack with the same type
        if (attacksSameKind) {
            //No need to show our attack, it will be the same anyway
            attackToReplace.deltaDisplay = "+-";

            return null;
        } else {
            //different type
            if (attackToReplace) {
                attackToReplace.deltaDisplay = "-";
            }

            var newAttack = new alleleToCompare.delta.attack();
            newAttack.deltaDisplay = "+";
            newAttack.group = alleleToCompare.group;

            return newAttack;
        }
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        var addedNewAttack = false;
        for (var iy = 0; iy < attackKeys.length; iy++) {
            var attackObj = attackObjs[attackKeys[iy]];
            addAttackInfo(attackObj, attackKeys[iy], ourLayout);
            if (newAttack && newAttack.group == attackKeys[iy]) {
                addAttackInfo(newAttack, attackKeys[iy], ourLayout);
                addedNewAttack = true;
            }
        }

        if (newAttack && !addedNewAttack) {
            addAttackInfo(newAttack, newAttack.group, ourLayout);
        }

        function addAttackInfo(attackObj, group, ourLayout) {
            var delta = attackObj.deltaDisplay || "";
            //var group = attackObj.group;

            var typeTitle = new HBox();

            typeTitle.add(new FakeDrawObject(attackObj.drawGlyph, true, true), 20);

            var attackObjTitle = formatToDisplay(getRealType(attackObj));
            if (delta.length > 0) {
                attackObjTitle = "(" + delta + ") " + attackObjTitle;
            }
            if (DFlag.attackObjsDebug) {
                attackObjTitle += group.substring(group.length - 1, group.length);
            }
            typeTitle.add(new Label()
                            .text(attackObjTitle)
                            .maxFontSize(16));

            ourLayout.add(new PaddingControl(
                    typeTitle,
                    new Rect(0, 8, 0, 2),
                    new Rect(0, 0.15, 0, 0.05)
                ));

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
    }

    self.resize = function (rect) {
        this.tpos = rect;
        ourLayout.resize(rect);
    }

    self.redraw = function () {
        return 5;
    }

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }
}

function AttackObjsVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var ourLayout = new FlowLayout();

    var typesLabel = new Label().text("Attack Types").maxFontSize(20);

    var attackObjs = obj.attr.attackObjs;
    var attackKeys = getSortedKeys(attackObjs);
    var newAttack = findAttackObjDelta(alleleToCompare, attackObjs);

    function findAttackObjDelta(alleleToCompare, attackObjs) {
        if (!alleleToCompare || !alleleToCompare.delta.attack) return;

        var attackToReplace = attackObjs[alleleToCompare.group];

        var attacksSameKind = attackToReplace &&
            attackToReplace.AttackNode == alleleToCompare.delta.attack;

        //Check if we are replacing an attack with the same type
        if (attacksSameKind) {
            //No need to show our attack, it will be the same anyway
            attackToReplace.deltaDisplay = "+-";

            return null;
        } else {
            //different type
            if (attackToReplace) {
                attackToReplace.deltaDisplay = "-";
            }

            var newAttack = new alleleToCompare.delta.attack();
            newAttack.deltaDisplay = "+";
            newAttack.group = alleleToCompare.group;

            return newAttack;
        }
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        ourLayout.add(new PaddingControl(
                typesLabel,
                new Rect(0, 0, 0, 0),
                new Rect(0, 1, 0, 0)
            ));

        var addedNewAttack = false;
        for(var iy = 0; iy < attackKeys.length; iy++) {
            var attackObj = attackObjs[attackKeys[iy]];
            addAttackInfo(attackObj, attackKeys[iy], ourLayout);
            if (newAttack && newAttack.group == attackKeys[iy]) {
                addAttackInfo(newAttack, attackKeys[iy], ourLayout);
                addedNewAttack = true;
            }
        }

        if (newAttack && !addedNewAttack) {
            addAttackInfo(newAttack, newAttack.group, ourLayout);
        }

        function addAttackInfo(attackObj, group, ourLayout) {
            var delta = attackObj.deltaDisplay || "";
            //var group = attackObj.group;

            var typeTitle = new HBox();

            typeTitle.add(new FakeDrawObject(attackObj.drawGlyph, true, true), 20);

            var attackObjTitle = formatToDisplay(getRealType(attackObj));
            if (delta.length > 0) {
                attackObjTitle = "(" + delta + ") " + attackObjTitle;
            }
            if (DFlag.attackObjsDebug) {
                attackObjTitle += group.substring(group.length - 1, group.length);
            }
            typeTitle.add(new Label()
                            .text(attackObjTitle)
                            .maxFontSize(16));

            ourLayout.add(new PaddingControl(
                    typeTitle,
                    new Rect(0, 8, 0, 2),
                    new Rect(0, 0.15, 0, 0.05)
                ));

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
    }

    self.resize = function (rect) {
        this.tpos = rect;
        ourLayout.resize(rect);
    }

    self.redraw = function () {
        return 5;
    }

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }
}
