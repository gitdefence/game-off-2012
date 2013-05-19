function AllelePointSystem(pos) {
    var self = this;

    self.base = new BaseObj(self, 15);
    self.tpos = pos;

    var obj = null;

    var vbox;
    var autoTrashButton;
    var pointIndicator;
    self.added = function () {
        var that = self;
        function pointButton(num, totalCost) {
            var text = "Buy " + num + ": $" + totalCost;
            function cb() {
                buyPoints(num, totalCost);
            }
            return new Button(text, cb);
        }
        vbox = new VBox();
        self.base.addChild(vbox);

        pointIndicator = new Label("");
        vbox.add(pointIndicator, 28);

        var buyHBox = new HBox();
        vbox.add(buyHBox);
        buyHBox.add(pointButton(1, 50));
        buyHBox.add(pointButton(10, 350));
        buyHBox.add(pointButton(100, 2500));

        var spendHBox = new HBox();
        vbox.add(spendHBox);
        spendHBox.add(new Button("Spend Point", spendPoint));
        spendHBox.add(new Button("Trash Point", trashPoint));

        autoTrashButton = new ToggleButton("Auto Trash Worse", doAutoTrash);
        vbox.add(autoTrashButton, 28);
    };

    self.resize = function (rect) {
        vbox.resize(rect);
    }

    function buyPoints(num, totalCost) {
        var game = self.base.game();
        var selected = game.selection();

        if (game.money < totalCost) return;
        if (!(selected instanceof Tower)) return;

        var newTopAllele = selected.allelesGenerated.length == 0;

        game.money -= totalCost;
        for (var i = 0; i < num; i++) {
            selected.generateAllele();
        }

        if (newTopAllele) {
            game.infobar.updateDeltaAllele(selected);

            doAutoTrash();
        }
    }

    function spendPoint() {
        var game = getGame(self);
        var selected = game.selection();

        if (!(selected instanceof Tower)) return;

        if (selected.allelesGenerated.length <= 0) return;

        var allele = selected.allelesGenerated[0];
        selected.allelesGenerated.splice(0, 1);
        selected.genes.addAllele(allele);

        game.infobar.updateDeltaAllele(selected);

        doAutoTrash();
    }

    function trashPoint() {
        var game = getGame(self);
        var selected = game.selection();

        if (!selected instanceof Tower) return;

        if (selected.allelesGenerated.length <= 0) return;

        selected.allelesGenerated.splice(0, 1);

        game.infobar.updateDeltaAllele(selected);

        doAutoTrash();
    }

    function doAutoTrash() {
        if (!autoTrashButton.toggled()) return;

        var game = getGame(self);
        var selected = game.selection();

        if (!(selected instanceof Tower)) return;

        var anyPositive = false;
        var numTrashed = 0;

        while (!anyPositive && selected.allelesGenerated.length > 0) {
            self.addDeltaDisplay();

            var extraInfo = self.base.parent.extraInfo;

            anyPositive = false;
            for (var key in extraInfo) {
                if (extraInfo[key] > 0 || extraInfo[key].added == "+")
                    anyPositive = true;
                for (var dKey in extraInfo[key].delta)
                    if (extraInfo[key].delta[dKey] > 0)
                        anyPositive = true;
            }
            if (!anyPositive) {
                selected.allelesGenerated.splice(0, 1);
                numTrashed++;
            }
        }

        if (numTrashed > 0) {
            game.infobar.updateDeltaAllele(selected);
        }
    }

    var hover = false;
    self.mouseenter = function () {
        hover = true;
        updateDeltaAlleleDisplay(obj);
    }
    self.mouseout = function () {
        hover = false;
        updateDeltaAlleleDisplay(obj);
    }

    self.updateDeltaAlleleDisplay = function (obj) {
        obj = obj;

        if (getGame(this)) {
            getGame(this).infobar.updateDeltaAllele(obj);
        }
    }

    self.addDeltaDisplay = function () {
        var selected = self.base.game().selection();

        self.base.parent.extraInfo = {};
        var extraInfo = self.base.parent.extraInfo;

        if (!(selected instanceof Tower)) return;

        if (selected.allelesGenerated.length < 1) return;

        var allele = selected.allelesGenerated[0];

        function addToExtraInfo(allele, factor) {
            for (var key in allele.delta) {
                var change = allele.delta[key];

                if (typeof change == "number") {
                    if (!extraInfo[key])
                        extraInfo[key] = 0;

                    extraInfo[key] += change * factor;
                } else {
                    if (extraInfo[formatToDisplay(change.name)]) {
                        extraInfo[formatToDisplay(change.name)].added = "+-";
                    } else {
                        extraInfo[formatToDisplay(change.name)] = change;
                        extraInfo[formatToDisplay(change.name)].added = factor == 1 ? "+" : "-";
                    }
                }
            }
        }

        //If we had it added, indicate that it is being replaced
        if (selected.genes.alleles[allele.group])
            addToExtraInfo(selected.genes.alleles[allele.group], -1);

        //Indicate we are adding the allele
        addToExtraInfo(allele, 1);
    }

    //Kind of hackish, but there is no selection changed system right now.
    var towerSelected = true;
    self.update = function () {
        var selected = self.base.game().selection();

        if (!selected || !selected.allelesGenerated) {
            if (towerSelected) {
                self.base.removeChild(vbox);
            }
            towerSelected = false;
            return;
        }

        if (!towerSelected) {
            self.base.addChild(vbox);
            towerSelected = true;
        }

        pointIndicator.text("Allele Points: " + selected.allelesGenerated.length);

        //This call needs to be removed.
        self.addDeltaDisplay();
    }
}
