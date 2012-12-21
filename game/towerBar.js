//Make list with lits of alleles to create default tower types.

function TowerDragger(pos, towerGeneratorFnc) {
    this.tPos = pos;
    this.base = new BaseObj(this, 20);

    this.towerGeneratorFnc = towerGeneratorFnc;

    this.displayedTower = towerGeneratorFnc(true);

    this.placingTower = false;

    this.draw = function (pen) {

        this.displayedTower.tPos = this.tPos;
        this.displayedTower.recalculateAppearance();
        this.displayedTower.draw(pen);

        if (this.placingTower) {
            this.placingTower.recalculateAppearance(true);
            this.placingTower.draw(pen);
        }
    }

    this.mousemove = function (e) {
        //var towerCollision = findClosestToPoint(eng, "Tower", tower.tPos.getCenter(), towerRadius);

        var tower = this.placingTower;
        var eng = getEng(this);

        if(tower) {
            if(canPlace(tower, e, eng)) {
                tower.tPos.x = e.x;
                tower.tPos.y = e.y;
            } else {
                tower.tryToMove(e, eng);
            }
        }
    }

    var firstClick = false;
    this.mousedown = function (e) {
        var eng = this.base.rootNode;
        var game = eng.game;

        firstClick = true;

        var curCost = game.currentCost;

        if (!this.placingTower && game.money - curCost >= 0) {
            //They are clicking on the placer, so begin placing
            this.placingTower = this.towerGeneratorFnc();
            this.placingTower.tPos.x = e.x;
            this.placingTower.tPos.y = e.y;
            game.input.globalMouseMove[this.base.id] = this;
            game.input.globalMouseClick[this.base.id] = this;

            game.money -= curCost;
            game.currentCost *= 1.3;
        }
    }

    this.click = function (e) {
        if(firstClick) {
            firstClick = false;
            return;
        }

        var eng = this.base.rootNode;
        var game = eng.game;

        if (this.placingTower) {
            //They already clicked on the placer, so they are trying to place now
            if(tryPlaceTower(this.placingTower, this.placingTower.tPos, eng)) {
                this.placingTower = false;
                delete game.input.globalMouseMove[this.base.id];
                delete game.input.globalMouseClick[this.base.id];

                if(game.input.ctrlKey) {
                    this.mousedown(e);
                    firstClick = false;
                }
            }
            else {
                //Nothing, we could not place tower but they paid for it so
                //they have to place it somewhere!
            }
        }
    }
}

function Towerbar(pos) {
    this.base = new BaseObj(this, 14);

    this.tPos = pos;

    // Height of 0 used here as a hack to get old behavior.
    var costIndicator = new Label("Tower cost: 50").resize(new TemporalPos(pos.x, pos.y, pos.w, 0));
    this.base.addObject(costIndicator);

    var attackCombinations = [];
    var uniqueNum = 1;

    for (var key in towerAttackTypes) {
        var attackTypes = {}; //Obj needed for now, it goes away when added (because we turn it into an array)
        attackTypes[1] = (towerAttackTypes[key]);
        attackCombinations.push(attackTypes);
    }

    //var superAttack = { 0: allAttackTypes.Pulse, 1: allAttackTypes.Pulse, 2: allAttackTypes.Pulse };
    //attackCombinations.push(superAttack);

    this.added = function () {
        var game = getGame(this);
        var tileSize = game.tileSize;
        //Scaled exactly to 150 by 674...

        function tileFnc(obj, refObj, pos) {
            function towerDraggerFunction(forDisplay) {
                var fakeTile = {};
                fakeTile.tPos = new TemporalPos(0, 0, tileSize, tileSize);
                var tower = new Tower(fakeTile, fakeTile.tPos);

                if (forDisplay) {
                    tower.attr.attack_types = [];
                    for (var alleleGroup in tower.genes.alleles) {
                        if (tower.genes.alleles[alleleGroup].delta.attack)
                            delete tower.genes.alleles[alleleGroup];
                    }
                }

                for (var key in obj) {
                    var attackType = obj[key];
                    tower.genes.addAllele(new Allele("attack" + key, { attack: attackType }));
                }

                return tower;
            }
            var towerDragger = new TowerDragger(pos.clone(), towerDraggerFunction);

            refObj.base.addObject(towerDragger);

            return true;
        }

        var tPosBox = new TemporalPos(pos.x + 15, pos.y + 40, 450, 150);
        makeTiled(this, tileFnc, attackCombinations, tPosBox, 6, 2, 0.1);
    };

    this.update = function () {
        var game = getGame(this);

        costIndicator.tPos.x = pos.x + 10;
        costIndicator.tPos.y = pos.y + 25;

        costIndicator.text("Current tower cost: " + roundToDecimal(game.currentCost, 2));
    }
}
