function TargetStrategiesVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var vbox = new VBox();

    //Each element has {strat: attr.targetStrategy, delta:string}
    var targetStrategies = [];
    var curTargetObj = { strat: obj.attr.targetStrategy, delta: "" };
    targetStrategies.push(curTargetObj);

    var topAllele = alleleToCompare;
    if (topAllele && topAllele.delta.target) {
        var topAlleleStrat = new topAllele.delta.target();
        if (getRealType(topAlleleStrat) == getRealType(curTargetObj.strat)) {
            curTargetObj.delta = "+-"; //We show something to give the user feedback
        } else {
            curTargetObj.delta = "-";
            targetStrategies.push({ strat: topAlleleStrat, delta: "+" });
        }
    }

    self.optimalHeight = function () {
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
