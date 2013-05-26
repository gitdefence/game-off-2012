function Tower_Packet(t1, t2, speed, allele) {
    this.base = new BaseObj(this, 12);
    // We don't really need it
    this.tpos = new Rect(0, 0, 1, 1);
    var p1 = t1.tpos.center();
    var p2 = t2.tpos.center();

    var dis = p1.clone().sub(p2).mag();

    var packet = new SCircle(p1, 3, allele.getOuterColor(), allele.getInnerColor(), 15);
    packet.lineWidth = 1;

    var motionDelay = new MotionDelay(p1, p2, dis / speed, apply);
    this.base.addChild(packet);
    packet.base.addChild(motionDelay);

    var that = this;
    function apply() {
        t2.genes.addAllele(allele);
        that.base.destroySelf();
    }

    this.update = function() {
        packet.tpos.origin(t1.tpos.center());
    }
}

function Tower_Connection(t1, t2) {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this, 11);
    this.t1 = t1;
    this.t2 = t2;

    var line = new SLine(t1.tpos.center(), t2.tpos.center(), "rgba(0, 255, 0, 0.2)", 11, [0.1, 0.3, 0.5, 0.7, 0.9]);
    this.base.addChild(line);

    var prevhitCount;
    var deleteButton;

    var that = this;

    function getDeleteButtonPos() {
        var width = 20;
        var height = 20;

        var delta = t2.tpos.center();
        delta.sub(t1.tpos.center());
        delta.mult(1/2);

        if (!assertValid(width, height)) {
            width = 1;
            height = 1;
        }

        var pos = t2.tpos.center();
        pos.sub(delta);
        pos.sub(new Vector(width * 0.5, height * 0.5));
        pos = new Rect(0, 0, width, height).origin(pos);

        return pos;
    }

    this.added = function() {
        deleteButton = new Button("-", bind(that, "deleteSelf"), 50);

        this.base.addChild(deleteButton);
        deleteButton.resize(getDeleteButtonPos());
    }

    function dataTransfer(t1, t2) {
        function sendRandomPacket(t1, t2, speed) {
            var group = pickRandomKey(t1.genes.alleles);
            var al = t1.genes.alleles[group];

            that.base.addChild(new Tower_Packet(t1, t2, speed, al));
        }

        if (prevhitCount === undefined) {
            prevhitCount = t1.attr.kills;
            return;
        }

        var dis = cloneObject(t1.tpos.center());
        dis.sub(t2.tpos.center());
        dis = dis.mag() / 1000;

        var speed = Math.max(Math.min(t1.attr.upload, t2.attr.download) / dis, 0.00000001 /* should really be zero */);
        var killsRequired = 10 / speed;
        var killDelta = t1.attr.kills - prevhitCount;

        while (Math.floor(killDelta / killsRequired) > 0) {
            sendRandomPacket(t1, t2, speed);
            prevhitCount += killsRequired;
            killDelta = t1.attr.kills - prevhitCount;
        }
        prevhitCount = t1.attr.kills - killDelta;
    }

    this.deleteSelf = function () {
        var conns = this.base.parent.connections;
        deleteButton.base.destroySelf();

        for(var key in conns) {
            if(conns[key] == this) {
                conns.splice(key, 1);
                break;
            }
        }

        this.base.destroySelf();
    }

    this.update = function (dt) {
        dataTransfer(t1, t2);

        line.start = t1.tpos.center();
        line.end = t2.tpos.center();

        var game = getGame(this);

        if (game && this.base.parent) {
            var holderSelected = t1 == game.selection();

            deleteButton.hidden = !holderSelected;
        }

        deleteButton.resize(getDeleteButtonPos());

        // Wtf... setColorPart() should not be a thing.
        if (this.base.parent.hover) {
            line.color = setColorPart(line.color, 3, 0.9);
        } else {
            line.color = setColorPart(line.color, 3, 0.2);
        }
    }
}

TowerStats = {
        range:          10,
        damage:         1,
        maxHp:          10,
        hp:      0,
        hpRegen:        1,
        attSpeed:       0.2,
        upload:         5,
        download:       5,
        hitCount:       0,
        kills:          0,
        value:          50
    };

function Tower() {
    this.tpos = new Rect(0, 0, 0, 0);
    this.base = new BaseObj(this, 10);

    this.attr = {};
    this.setBaseAttrs = function () {
        this.attr = {
            range: TowerStats.range,
            damage: TowerStats.damage,
            maxHp: TowerStats.maxHp,
            hp: TowerStats.hp,
            hpRegen: TowerStats.hpRegen,
            attSpeed: TowerStats.attSpeed,
            upload: TowerStats.upload,
            download: TowerStats.download,
            hitCount: TowerStats.hitCount,
            kills: 0,
            value: TowerStats.value
        };
        this.attr.targetStrategy = new targetStrategies.Random();
        this.attr.attackObjs = {};
    };
    this.setBaseAttrs();

    //List of alleles
    this.allelesGenerated = [];

    this.genes = new Genes();
    this.base.addChild(this.genes);

    //For alleles.
    this.autoTrash = true;

    this.connections = [];

    this.base.addChild(this.attackCycle = new AttackCycle());
    //this.base.addChild(new UpdateTicker(this.attr, "mutate", "mutate", true));
    this.base.addChild(new Selectable());

    this.constantOne = 1;
    this.base.addChild(new UpdateTicker(this, "constantOne", "regenTick"));

    for (var alGroup in TowerAlleles) {
        if (!this.genes.alleles[alGroup]) {
            this.genes.addAllele(new Allele(alGroup, TowerAlleles[alGroup]()));
        }
    }

    this.added = function () {
        this.recalculateAppearance();
    }

    this.generateAllele = function () {
        var genAllGroup = pickRandomKey(AllAlleleGroups);

        if (DFlag.attackObjsDebug) {
            genAllGroup = choose({
                0.3: "attack1",
                0.6: "attack2",
                1: "attack3"
            });
        } else if (DFlag.targetObjsDebug) {
            genAllGroup = "targetBase";
        }


        var alleleGenerated = new Allele(genAllGroup, AllAlleleGroups[genAllGroup]());
        this.allelesGenerated.push(alleleGenerated);
    }

    this.regenTick = function () {
        if (this.attr.hp >= this.attr.maxHp) return;

        if (this.attr.hpRegen > 0) {
            this.attr.hp += this.attr.hpRegen;

            if (this.attr.hp > this.attr.maxHp) {
                this.attr.hp = this.attr.maxHp;
            }

            var game = getGame(this);
            if (game && this == game.selection()) {
                game.infobar.updateAttribute("hp");
            }
        }
    }

    this.update = function (dt) {
        this.recalculateAppearance(true);
    }

    //This may also change x, y, w and h.
    this.recalculateAppearance = function (changeSize) {
        this.color = getInnerColorFromAttrs(this.attr);
        this.borderColor = getOuterColorFromAttrs(this.attr);

        //Shows HP
        var outerWidth = Math.pow(this.attr.maxHp / 50, 0.5) * 8;
        this.outerWidth = outerWidth;

        //Show HP regen?
        var innerWidth = Math.log(Math.abs(this.attr.maxHp / this.attr.damage / this.attr.attSpeed + 10)) * 6; //Math.pow(this.attr.hpRegen * 10, 0.9);

        var center = this.tpos.center();

        var totalWidth = outerWidth + innerWidth;

        if (changeSize) {
            this.tpos.x = center.x - totalWidth;
            this.tpos.y = center.y - totalWidth;

            this.tpos.w = totalWidth * 2;
            this.tpos.h = totalWidth * 2;
        }

        if (!assertRectangle(this.tpos)) {
            this.tpos = new Rect(0, 0, 1, 1);
        }

        this.lineWidth = outerWidth;
    }

    this.draw = function (pen) {
        var pos = this.tpos.clone();
        var cen = pos.center();

        pos.x += this.outerWidth;
        pos.y += this.outerWidth;

        pos.w -= this.outerWidth * 2;
        pos.h -= this.outerWidth * 2;

        DRAW.rect(pen, pos,
                  this.color);

        this.drawHpBars(pen, pos);


        DRAW.circle(pen, cen, this.attr.range,
            setAlpha(this.color, 0.1));

        drawAttributes(this, pen);
    };

    this.drawHpBars = function(pen, pos) {
        //One hp bar per x hp
        var hpPerBar = 10;

        //Total of hp in bars one one side equal to hp regenerated in x seconds
        var timePerSide = 10;

        var numberOfBars = this.attr.maxHp / hpPerBar;
        var barsFilled = this.attr.hp / hpPerBar;
        var barsPerSide = Math.max(Math.ceil(timePerSide * this.attr.hpRegen / hpPerBar), 1);

        //Shows HP
        var outerWidth = Math.pow(this.attr.maxHp / 50, 0.9);

        var layers = Math.ceil(numberOfBars / barsPerSide / 4);

        //Draw hp bars around rectangle...
        //We draw it with a finite state machine, the state is the position, color, size etc.
        //Then we just increment the state machine a lot.
        var barHeight = this.outerWidth / layers;//10 / Math.pow(barsPerSide, 0.1);//50 / Math.ceil(numberOfBars / barsPerSide / 4);
        var barWidth = pos.w / barsPerSide;


        var posX = pos.x;
        var posY = pos.y;
        var width = barWidth;
        var height = barHeight;

        var color = this.borderColor;

        var rotationPosition = 0; //0 = top, 1 = left, etc (clockwise)
        var sideCount = 0;

        var onX = true;

        var currentFactor = 1;

        posY -= height;

        function nextBar() {
            switch(rotationPosition) {
                case 0:
                    posX += width;
                    break;
                case 1:
                    posY += height;
                    break;
                case 2:
                    posX += width;
                    break;
                case 3:
                    posY += height;
                    break;
            }
        }
        function rotateBar() {
            function swapWidthHeight() {
                var temp = width;
                width = -height;
                height = temp;
            }
            switch(rotationPosition) {
                case 0:
                    width = barHeight; //Rotate bar
                    height = barWidth;

                    posX += barHeight * (currentFactor - 1); //Move out to correct distance away from square
                    posY += barHeight * currentFactor; //Move to correct start
                    break;
                case 1:
                    width = -barWidth; //Rotate bar
                    height = barHeight;

                    posX -= barHeight * (currentFactor - 1);
                    posY += barHeight * (currentFactor - 1);
                    break;
                case 2:
                    width = -barHeight; //Rotate bar
                    height = -barWidth;

                    posX -= barHeight * (currentFactor - 1);
                    posY -= barHeight * (currentFactor - 1);
                    break;
                case 3:
                    width = barWidth; //Rotate bar
                    height = barHeight;

                    posX += barHeight * (currentFactor - 1);
                    posY -= barHeight * (currentFactor + 1);
                    break;
            }
            rotationPosition++;
            if(rotationPosition >= 4) {
                rotationPosition = 0;
                currentFactor++;
            }
        }

        while(numberOfBars > 0) {
            //if(rotationPosition > 1)
              //  nextBar();

            var xBuffer = (width) * 0.15;
            var yBuffer = (height) * 0.15;

            function drawBar(color, widthPercent, heightPercent) {
                DRAW.rect(pen,
                        new Rect(
                                    posX + xBuffer, posY + yBuffer,
                                    ((width) - xBuffer * 2) * widthPercent,
                                    ((height) - yBuffer * 2) * heightPercent
                                ),
                         color);
            }

            if(barsFilled < 1) {
                drawBar("grey", 1, 1);

                if(barsFilled > 0) {
                    var currentFill = barsFilled % 1;
                    if(rotationPosition == 1 || rotationPosition == 3)
                        drawBar(color, 1, currentFill);
                    else
                        drawBar(color, currentFill, 1);
                }
            } else {
                drawBar(color, 1, 1);
            }

            //if(rotationPosition <= 1)
                nextBar();

            sideCount++;
            if(sideCount >= barsPerSide) {
                sideCount = 0;
                rotateBar();
            }

            numberOfBars--;
            barsFilled--;
        }
    }

    this.tryUpgrade = function () {
        var game = getGame(this);

        if (game.money >= 100) {
            this.attr.damage *= 2;
            this.attr.attSpeed *= 2;
            game.money -= 100;
        }
    };

    this.die = function() {
        var c = this.connections;
        for (var i = 0; i < c.length; i++) {
            c[i].base.destroySelf();
        }
        if(this.tempNetworkIndicator)
            this.tempNetworkIndicator.base.destroySelf();
    };

    this.startDrag = null;
    this.dragOffset = null;
    this.tempNetworkIndicator = null;
    this.ctrlDrag = false;
    this.mousedown = function (e) {
        this.startDrag = e;
        this.dragOffset = new Vector(this.tpos);
        this.dragOffset.sub(e);

        getGame(this).input.globalMouseMove[this.base.id] = this;
        getGame(this).input.globalMouseUp[this.base.id] = this;

        this.ctrlDrag = e.ctrlKey;

        if (!this.ctrlDrag) {
            if (this.tempNetworkIndicator) {
                this.tempNetworkIndicator.destroySelf();
            }
            this.tempNetworkIndicator = new SLine(this.startDrag, e, "green", 15, { 0: 1.0 });
            this.base.parent.base.addChild(this.tempNetworkIndicator);
        }
    };

    this.mouseout = function(e) {
        for (var i = 0; i < this.connections.length; i++) {
            this.connections[i].hover = false;
        }
    };

    this.mousemove = function(e) {
        for (var i = 0; i < this.connections.length; i++) {
            this.connections[i].hover = true;
        }

        if (this.startDrag) this.globalMouseMove(e);
    };

    this.globalMouseMove = function(e) {
        if (!this.ctrlDrag) {
            this.tempNetworkIndicator.end = e;
            return;
        }

        var eng = getEng(this);

        var vector = new Vector(e);
        vector.add(this.dragOffset);

        this.tryToMove(vector, eng);
    }

    this.mouseup = function (e) {
        var eng = this.base.rootNode;
        var game = eng.game;

        this.startDrag = null;

        delete getGame(this).input.globalMouseMove[this.base.id];
        delete getGame(this).input.globalMouseUp[this.base.id];

        if (!this.ctrlDrag && this.tempNetworkIndicator) {
            this.base.parent.base.removeChild(this.tempNetworkIndicator);
            this.tempNetworkIndicator = null;

            var towerSelected = findClosestToPoint(eng, "Tower", e, 0);
            if (towerSelected && towerSelected != this) {
                for (var i = 0; i < this.connections.length; i++)
                    if (this.connections[i].t2 == towerSelected)
                        return;

                var conn = new Tower_Connection(this, towerSelected);

                var parent = this.base.parent;
                if (parent) {
                //Have to add it to our parent, so it can draw above us.
                    parent.base.addChild(conn);
                    this.connections.push(conn);
                    towerSelected.connections.push(conn);
                } else {
                    //Probably just means we have been destroyed
                    fail("Crap, no parent in tower.");
                }

                game.select(this);
                getAnElement(this.base.children.Selectable).ignoreNext = true;
            }
        }
    };

    //Given that the user has told us to move this tower to the destination,
    //tries to move it as close as possible.
    this.tryToMove = function (destination, eng, initialPlacement) {
        var tower = this;
        tower.hidden = true;
        var e = destination;

        var originalPos = tower.tpos.clone();

        tower.tpos.x = e.x;
        tower.tpos.y = e.y;

        if (!initialPlacement && !findClosestToPoint(eng, "Tile", tower.tpos.center(), 0)) {
            //You cannot move to a position where there are no tiles
            tower.tpos.x = originalPos.x;
            tower.tpos.y = originalPos.y;

            tower.hidden = false;
            return;
        }

        function mergeToCollisions(tower, collisions) {
            mergeToArray(findAllWithinDistanceToRect(eng, "Tower", tower.tpos, 0), collisions);
            mergeToArray(findAllWithinDistanceToRect(eng, "Path_Piece", tower.tpos, 0), collisions);
            mergeToArray(findAllWithinDistanceToRect(eng, "Path_Start", tower.tpos, 0), collisions);
            mergeToArray(findAllWithinDistanceToRect(eng, "Path_End", tower.tpos, 0), collisions);
        }

        var collisions = [];
        mergeToCollisions(tower, collisions);

        if (collisions.length > 0) {
            var alignTo = collisions[0];
            var offset = minVecForDistanceRects(tower.tpos, alignTo.tpos, 1);

            e.x += offset.x;
            e.y += offset.y;
        }

        tower.tpos.x = e.x;
        tower.tpos.y = e.y;

        //This code is kinda buggy... but thats okay... in the future we will project a line
        //from the tower position to the cursor and just put the tower as far upon that line as possible.
        //(this projection code will be created for bullets and lasers anyway).
        tower.tpos.x = e.x;
        var collisions = [];
        mergeToCollisions(tower, collisions);
        if (collisions.length > 0) {
            tower.tpos.x = originalPos.x;
        }

        tower.tpos.y = e.y;
        var collisions = [];
        mergeToCollisions(tower, collisions);
        if (collisions.length > 0) {
            tower.tpos.y = originalPos.y;
        }
        tower.hidden = false;
    }
}

function canPlace(tower, pos, eng) {
    var game = eng.game;

    var originalPosX = tower.tpos.x;
    var originalPosY = tower.tpos.y;

    tower.recalculateAppearance(true);
    tower.tpos.x = pos.x;
    tower.tpos.y = pos.y;

    var towerRadius = tower.tpos.w / 2;

    var e = pos;
    var towerCollision = findClosestToRect(eng, "Tower", tower.tpos, 0);
    var pathOnTile = findClosestToRect(eng, "Path_Piece", tower.tpos, 0);
    var tileExist = findClosestToRect(eng, "Tile", tower.tpos, 0);

    tower.tpos.x = originalPosX;
    tower.tpos.y = originalPosY;

    if (!towerCollision && !pathOnTile && tileExist) {
        return true;
    }
    return false;
}

function tryPlaceTower(tower, pos, eng)
{
    var game = eng.game;

    tower.recalculateAppearance(true);
    tower.tpos.x = pos.x;
    tower.tpos.y = pos.y;

    var tileExist = findClosestToPoint(eng, "Tile", tower.tpos.center(), 0);

    if (canPlace(tower, pos, eng)) {
        game.gameBoard.base.addChild(tower);
        game.select(tower);
        if (tileExist) {
            getAnElement(tileExist.base.children.Selectable).ignoreNext = true;
        }
        return true;
    }
    return false;
};
