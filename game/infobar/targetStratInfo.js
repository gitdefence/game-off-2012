function TargetStrategiesVisual(obj, alleleToCompare) {
    var self = this;

    self.base = new BaseObj(self, 10);

    var ourLayout = new FlowLayout();

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

    self.optimalHeight = function (width) {
        return ourLayout.optimalHeight(width);
    }

    self.added = function () {
        self.base.addChild(ourLayout);

        var strategyLabel = new Label().text("Target Strategy").maxFontSize(20);
        ourLayout.add(new PaddingControl(
                strategyLabel,
                new Rect(0, 0, 0, 0),
                new Rect(0, 1, 0, 0)
            ));

        for (var ix = 0; ix < targetStrategies.length; ix++) {
            var targetObj = targetStrategies[ix];

            var typeTitle = new HBox();
            typeTitle.add(new FakeDrawObject(targetObj.strat.drawGlyph, true, true), 20);

            var textToDisplay = formatToDisplay(getRealType(targetObj.strat));
            if (targetObj.delta.length > 0) {
                textToDisplay = "(" + targetObj.delta + ") " + textToDisplay;
            }

            typeTitle.add(new Label().text(textToDisplay).maxFontSize(16));

            ourLayout.add(new PaddingControl(
                    typeTitle,
                    new Rect(0, 8, 0, 2),
                    new Rect(0, 0.15, 0, 0.05)
                ));
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
        ourLayout.resize(rect);
    }
}
