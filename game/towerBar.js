//Make list with lits of alleles to create default tower types.

function TowerDragger(towerBar, towerGeneratorFnc) {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this, 20);

    var displayedTower = towerGeneratorFnc(true);

    var placeOffset = new Vector(0, 0);
    var placingTower;

    var displayedTowerCanvas = new Canvas();
    var displayedTowerDirty = true;
    this.resize = function (rect) {
        this.tpos = rect.largestSquare();
        displayedTower.recalculateAppearance();
        displayedTower.tpos = this.tpos;
        displayedTowerCanvas.resize(this.tpos);
        displayedTowerDirty = true;
    };

    this.draw = function (pen) {
        var canvas = displayedTowerCanvas;
        if (displayedTowerDirty) {
            var pen2 = canvas.ctx();
            pen2.translate(-this.tpos.x, -this.tpos.y);
            displayedTower.draw(pen2);
            displayedTowerDirty = false;
        }
        canvas.drawTo(pen);
        if (placingTower) placingTower.draw(pen);
    }

    this.update = function (dt) {
       if (placingTower) placingTower.recalculateAppearance(true);
    }

    this.mousemove = function (e) {
        var tower = placingTower;
        if (!tower) return;

        var eng = getEng(this);

        var pos = new Vector(0, 0);

        pos.x = e.x - placeOffset.x * tower.tpos.w;
        pos.y = e.y - placeOffset.y * tower.tpos.h;

        if (canPlace(tower, pos, eng)) {
            tower.tpos.x = pos.x;
            tower.tpos.y = pos.y;
        } else {
            tower.tryToMove(pos, eng, true);
        }
    }

    var firstClick = false;
    this.mousedown = function (e, repeatPlace) {
        var eng = this.base.rootNode;
        var game = eng.game;

        firstClick = true;

        var curCost = towerBar.currentCost();

        if (placingTower || game.money - curCost < 0) return;

        //They are clicking on the placer, so begin placing
        placingTower = towerGeneratorFnc();

        if(!repeatPlace) {
            placeOffset.set(e);
            placeOffset.sub(this.tpos);

            placeOffset.x /= this.tpos.w;
            placeOffset.y /= this.tpos.h;
        }

        placingTower.tpos.x = e.x - placeOffset.x * this.tpos.w;
        placingTower.tpos.y = e.y - placeOffset.y * this.tpos.h;

        placingTower.recalculateAppearance(true);
        this.mousemove(e);

        game.input.globalMouseMove[this.base.id] = this;
        game.input.globalMouseClick[this.base.id] = this;

        game.money -= curCost;
        towerBar.setCurrentCost(curCost*1.3);
    }

    this.click = function (e) {
        if (firstClick && !isTouchDevice()) {
            firstClick = false;
            return;
        }

        var eng = this.base.rootNode;
        var game = eng.game;

        if (!placingTower) return;

        if (!tryPlaceTower(placingTower, placingTower.tpos, eng)) {
            console.warn("We couldn't place your tower...");
            return;
        }

        placingTower = false;
        delete game.input.globalMouseMove[this.base.id];
        delete game.input.globalMouseClick[this.base.id];

        if (game.input.ctrlKey) {
            this.mousedown(e, true);
            firstClick = false;
        }
    }
}

function Towerbar() {
    var self = this;
    this.base = new BaseObj(this, 14);
    this.tpos = new Rect(0, 0, 0, 0);

    var vbox = new VBox();
    this.base.addChild(vbox);

    var towerCost = 50;
    var costIndicator = new Label("...");
    vbox.add(costIndicator);

    var attackCombinations = [];
    var uniqueNum = 1;

    this.resize = function (rect) {
        costIndicator.resize(rect);
        vbox.resize(rect);
        this.tpos = rect;
    }

    this.added = function () {
        function makeTowerDragger(attackType) {
            function makeTower(forDisplay) {
                var tower = new Tower();

                if (forDisplay) {
                    tower.attr.attackObjs = [];
                    for (var alleleGroup in tower.genes.alleles) {
                        if (tower.genes.alleles[alleleGroup].delta.attack) {
                            delete tower.genes.alleles[alleleGroup];
                        }
                    }
                }

                tower.genes.addAllele(new Allele("attack1", { attack: attackType }));

                return tower;
            }
            var towerDragger = new TowerDragger(self, makeTower);

            return towerDragger;
        }

        for (var key in towerAttackTypes) {
            vbox.add(makeTowerDragger(towerAttackTypes[key]));
        }
    };

    this.currentCost = function () {
        return towerCost;
    };

    this.setCurrentCost = function (newCost) {
        towerCost = newCost;
        costIndicator.text("Current tower cost: " + prefixNumber(towerCost));
    };
    this.setCurrentCost(towerCost);
}
