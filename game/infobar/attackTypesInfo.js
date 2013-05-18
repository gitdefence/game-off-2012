function AttackTypesVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new FlowLayout();

    var typesLabel = new Label().setTextType(new Text("Attack Types").maxFontSize(20));

    var attackTypes = obj.attr.attackTypes;
    var attackKeys = getSortedKeys(attackTypes);
    var newAttack = findAttackTypeDelta(alleleToCompare, attackTypes);

    function findAttackTypeDelta(alleleToCompare, attackTypes) {
        if (!alleleToCompare || !alleleToCompare.delta.attack) return;

        var attackToReplace = attackTypes[alleleToCompare.group];

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
        self.base.addChild(vbox);

        vbox.add(new BufferedControl(
                typesLabel,
                new Rect(0, 0, 0, 0),
                new Rect(0, 1, 0, 0)
            ));

        var addedNewAttack = false;
        for(var iy = 0; iy < attackKeys.length; iy++) {
            var attackType = attackTypes[attackKeys[iy]];
            addAttackInfo(attackType, attackKeys[iy], vbox);
            if (newAttack && newAttack.group == attackKeys[iy]) {
                addAttackInfo(newAttack, attackKeys[iy], vbox);
                addedNewAttack = true;
            }
        }

        if (newAttack && !addedNewAttack) {
            addAttackInfo(newAttack, newAttack.group, vbox);
        }

        function addAttackInfo(attackType, group, vbox) {
            var delta = attackType.deltaDisplay || "";
            //var group = attackType.group;

            var typeTitle = new HBox();

            typeTitle.add(new FakeDrawObject(attackType.drawGlyph, false), 20);

            var attackTypeTitle = formatToDisplay(getRealType(attackType));
            if (delta.length > 0) {
                attackTypeTitle = "(" + delta + ") " + attackTypeTitle;
            }
            if (DFlag.attackTypesDebug) {
                attackTypeTitle += group.substring(group.length - 1, group.length);
            }
            typeTitle.add(new Label(attackTypeTitle).setTextType(
                            new Text(attackTypeTitle)
                            .maxFontSize(16)));

            vbox.add(new BufferedControl(
                    typeTitle,
                    new Rect(0, 8, 0, 2),
                    new Rect(0, 0.15, 0, 0.05)
                ));

            for (var type in attackType) {
                var value = attackType[type];
                if (typeof value != "number") continue;

                var typeDivider = new HBox();

                typeDivider.add(new Label().setTextType(
                                    new Text(formatToDisplay(type))
                                    .align("left")
                                    .maxFontSize(12)
                                    .color("white")
                                )
                            );
                typeDivider.add(new Label()
                                    .setTextType(
                                    new Text(formatToDisplay(value + ""))
                                    .align("right")
                                    .maxFontSize(12)
                                    .color("white")
                                )
                            );

                vbox.add(new BufferedControl(
                        typeDivider,
                        new Rect(0, 0, 0, 0),
                        new Rect(0, 0.4, 0, 0)
                    ));
            }
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        vbox.resize(rect);
    }

    self.redraw = function () {
        return 5;
    }

    self.optimalHeight = function (width) {
        return vbox.optimalHeight(width);
    }
}
