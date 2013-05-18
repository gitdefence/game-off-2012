function AttackTypesVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new VBox();

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
    sortArrayByProperty(originalAttackTypeContainers, "group");

    //Refactor this code and make it have more functions and less nesting.
    var topAllele = alleleToCompare;
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

    //Stable sort to keep the changed attack types after the types they replace.
    sortArrayByPropertyStable(attackTypeContainers, "group");

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
            if (DFlag.attackTypesDebug) {
                attackTypeTitle += group.substring(group.length - 1, group.length);
            }
            typeTitle.add(new Label(attackTypeTitle));

            vbox.add(typeTitle, 20);

            for (var type in attackTypeObj) {
                var value = attackTypeObj[type];
                if (typeof value != "number") continue;

                var typeDivider = new HBox();

                typeDivider.add(new Label().setTextType(
                                    new Text(formatToDisplay(type))
                                    .align("left")
                                    .maxFontSize(10)
                                    .color("white")
                                )
                            );
                typeDivider.add(new Label()
                                    .setTextType(
                                    new Text(formatToDisplay(value + ""))
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
