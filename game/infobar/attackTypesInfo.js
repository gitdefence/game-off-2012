function AttackTypesVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new FlowLayout();

    var typesLabel = new Label().setTextType(new Text("Attack Types").maxFontSize(20));

    //Array of { attackType: attr.attackTypes[key], delta: "" };
    var attackTypeContainers = [];

    var originalAttackTypeContainers = [];
    for (var group in obj.attr.attackTypes) {
        originalAttackTypeContainers.push({
            attackType: obj.attr.attackTypes[group],
            group: group,
            delta: ""
        });
    }

    //No need for a stable sort yet, there should be no group overlap
    sortArrayByProperty(originalAttackTypeContainers, "group", originalAttackTypeContainers);
    findAttackTypeDelta(alleleToCompare, obj.genes.alleles, attackTypeContainers, originalAttackTypeContainers);

    function findAttackTypeDelta(alleleToCompare, curAlleles, attackTypeContainers) {
        if (!alleleToCompare || !alleleToCompare.delta.attack) return;

        if (!curAlleles[alleleToCompare.group]) return;
        var prevAllele = curAlleles[alleleToCompare.group];

        var attackTypeChange = true;

        var topAlleleAttack = new alleleToCompare.delta.attack();
        var curAttackObj = null;

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
            if (getRealType(prevAttackObj.attackType) == getRealType(topAlleleAttack)) {
                attackTypeChange = false;
                prevAttackObj.delta = "+-";
            } else {
                //different type
                prevAttackObj.delta = "-";
            }
        }

        if (attackTypeChange) {
            attackTypeContainers.push({ attackType: topAlleleAttack, delta: "+", group: alleleToCompare.group });
        }
    }

    attackTypeContainers = originalAttackTypeContainers.concat(attackTypeContainers);

    //Stable sort to keep the changed attack types after the types they replace.
    sortArrayByPropertyStable(attackTypeContainers, "group");

    self.added = function () {
        self.base.addChild(vbox);

        vbox.add(new BufferedControl(
                typesLabel,
                new Rect(0, 0, 0, 0),
                new Rect(0, 1, 0, 0)
            ));

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

            for (var type in attackTypeObj) {
                var value = attackTypeObj[type];
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
