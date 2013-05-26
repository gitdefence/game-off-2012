function Bug(startPath) {
    var self = this;
    var r = 8;

    self.attr = {};
    self.setBaseAttrs = function () {
        self.attr = {
            // For balancing these are now 0, we get everything from our alleles
            // (except speed, as we have to move, and value).
            // In the future tower will be like self.
            range:          0,
            damage:         0,
            maxHp:          0,
            hp:             0,
            hpRegen:        0,
            attSpeed:       0,
            speed:          0,
            hitCount:       0,
            kills:          0,
            value:          5,
        };
        self.attr.attackObjs = {}; //Index is allele group
        self.attr.targetStrategy = new targetStrategies.Random();
    }
    self.setBaseAttrs();

    self.tpos = new Rect(0, 0, r*2, r*2);

    self.base = new BaseObj(self, 11);
    var velocity = new Vector(1, 0).mag(self.attr.speed);

    //Will be replaced
    self.color = "transparent";
    self.borderColor =  "red";

    self.lineWidth = 1;
    self.radius = r;

    self.genes = new Genes();
    self.base.addChild(self.genes);


    self.base.addChild(new AttackCycle());

    self.base.addChild(new Selectable());

    self.curPath = startPath;

    var pathOffsetVector = new Vector(0, 0);

    self.added = function() {
        var game = getGame(self);

        var offset = Math.floor(((Math.random() - 0.5) * 0.25) * game.tileSize);
        //Apparently it looks better with no offset. Going to leave the offset code in,
        //incase we ever want to change it back.
        offset = 0;
        pathOffsetVector = new Vector(offset, offset);

        self.tpos.center(startPath.bugMovementTarget().add(pathOffsetVector));

        self.constantOne = 1;
        self.base.addChild(new UpdateTicker(self, "constantOne", "regenTick"));
    };

    self.regenTick = function() {
        if (self.attr.hp >= self.attr.maxHp) return;

        if (self.attr.hpRegen > 0) {
            self.attr.hp += self.attr.hpRegen;
            if (self.attr.hp > self.attr.maxHp) {
                self.attr.hp = self.attr.maxHp;
            }

            var game = getGame(self);
            if (game && self == game.selection()) {
                game.infobar.updateAttribute("hp");
            }
        }
    }

    var previousHp = -1;
    var canvasDirty = true;
    self.update = function(dt) {
        var cur = self.curPath;
        if (!cur) {
            self.destroyAtBase();
            return;
        }

        //We could also add pathOffsetVector to the path, but there are
        //multiple paths we have to worry about, so this is simplier.
        var offsetSelfPos = self.tpos.center().sub(pathOffsetVector);

        //Move towards the next rectangle.
        var vecToCurrent;
        vecToCurrent = cur.bugMovementTarget().sub(offsetSelfPos);

        var speed = self.attr.speed;
        var distance = dt * speed;

        self.tpos.moveOrigin(vecToCurrent.clone().setMag(distance));

        //If we cross the target, then we will be less than the distance we moved from the target.
        if (vecToCurrent.mag() <= distance) {
            self.curPath = self.curPath.nextPath;
        }

        // We only invalidate when our HP changes, since that covers most
        // cases, and other things don't really change much for bugs.'
        if (self.attr.hp === previousHp) return;

        canvasDirty = true;
        self.color = getInnerColorFromAttrs(self.attr);
        self.borderColor = getOuterColorFromAttrs(self.attr);
        previousHp = self.attr.maxHp;
    };

    self.destroyAtBase = function() {
        var game = self.base.rootNode.game;
        var eng = self.base.rootNode;

        game.health -= 5;

        if (game.health <= 0 && !eng.base.allLengths.GameOver) {
            eng.base.addChild(new GameOver());
        }

        self.base.destroySelf();
    };

    var canvas = new Canvas();
    self.draw = function(pen) {
        if (canvasDirty) {
            redraw(canvas);
            canvasDirty = false;
        }
        canvas.moveTo(new Vector(self.tpos.x - self.attr.range + self.tpos.w / 2, self.tpos.y - self.attr.range + self.tpos.w / 2));
        canvas.drawTo(pen);
    }

    function redraw(canvas) {
        var range = self.attr.range;
        canvas.resize(new Rect(0, 0, range*2, range*2));

        var pen = canvas.ctx();
        pen.save();
        pen.translate(
            range - self.tpos.x - self.tpos.w / 2,
            range - self.tpos.y - self.tpos.h / 2);
        actualRedraw(pen);
        pen.restore();
    }

    function actualRedraw(pen) {
        var pos = self.tpos;
        var cen = pos.center();

        var hpPercent = self.attr.hp / self.attr.maxHp;
        var hue = hpPercent * 135;

        DRAW.arc(pen, cen, self.radius + self.lineWidth,
                 0, Math.PI * 2 * hpPercent,
                 hsla(hue, 50, 50, 0).str(), 3,
                 hsla(hue, 90, 60, 1).str());

        DRAW.circle(pen, cen, self.radius,
                    self.color, 1, self.borderColor);

        DRAW.circle(pen, cen, self.attr.range,
                    setAlpha(self.color, 0.13));
    }
}
