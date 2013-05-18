function Bug(startPath) {
    var self = this;
    var r = 8;
    var cen = (function() {
        var p = startPath.tpos;
        var cen = p.center();
        cen.x += Math.floor((p.w - 2*r) * (Math.random() - 0.5));
        cen.y += Math.floor((p.h - 2*r) * (Math.random() - 0.5));
        return cen;
    }());

    self.attr = {};
    self.setBaseAttrs = function () {
        //Lol, prevCur...
        var prevCurHp = self.attr.hp || self.attr.currentHp;
        if(!prevCurHp)
            prevCurHp = 0;
        self.attr = {
            // For balancing these are now 0, we get everything from our alleles
            // (except speed, as we have to move, and value).
            // In the future tower will be like self.
            range:          0,
            damage:         0,
            hp:             0,
            currentHp:      0,
            hpRegen:        0,
            attSpeed:       0,
            speed:          0,
            hitCount:       0,
            kills:          0,
            value:          5,
        };
        self.attr.attackTypes = {}; //Index is allele group
        self.attr.targetStrategy = new targetStrategies.Random();
    }
    self.setBaseAttrs();

    self.tpos = new Rect(cen.x - r, cen.y - r, r * 2, r * 2);

    self.base = new BaseObj(self, 11);
    var velocity = new Vector(1, 0).mag(self.attr.speed);

    //Will be replaced
    self.color = "trasparent";
    self.borderColor =  "red";

    self.lineWidth = 1;
    self.radius = r;


    self.genes = new Genes();
    self.base.addChild(self.genes);



    self.base.addChild(new AttackCycle());

    self.base.addChild(new Selectable());

    self.curPath = startPath;

    self.added = function() {
        var game = getGame(self);

        var offset = Math.floor(((Math.random() - 0.5) * 0.5 + 0.5) * game.tileSize);
        self.pathOffsetVector = new Vector(offset, offset);

        self.constantOne = 1;
        self.base.addChild(new UpdateTicker(self, "constantOne", "regenTick"));
    };

    self.regenTick = function() {
        if (self.attr.hpRegen > 0) {
            self.attr.currentHp += self.attr.hpRegen;
        }
        if (self.attr.currentHp > self.attr.hp) {
            self.attr.currentHp = self.attr.hp;
        }
    }

    var previousHp = -1;
    var canvasDirty = true;
    self.update = function(dt) {
        //We could also add bugRelPathPos to the path, but there are
        //multiple paths we have to worry about, so this is simplier.
        var offsetSelfPos = self.tpos.center().sub(self.pathOffsetVector);

        var cur = self.curPath;
        if (cur instanceof Path_End && minVecBetweenRects(self.tpos, cur.tpos).mag() == 0) {
            self.destroyAtBase();
        }

        //Move towards the next rectangle.
        var vecToCurrent = cur.tpos.origin().sub(offsetSelfPos);

        var speed = self.attr.speed;

        var velocity = vecToCurrent;
        velocity.setMag(speed);
        self.tpos.moveOrigin(velocity.clone().mult(dt));

        //If we cross the target, then we will be less than the distance we moved from the target.
        if (cur.tpos.origin().sub(offsetSelfPos).mag() <= speed * dt) {
            self.curPath = self.curPath.nextPath;
        }

        // We only invalidate when our HP changes, since that covers most
        // cases, and other things don't really change much for bugs.'
        if (self.attr.currentHp === previousHp) return;

        canvasDirty = true;
        self.color = getInnerColorFromAttrs(self.attr);
        self.borderColor = getOuterColorFromAttrs(self.attr);
        previousHp = self.attr.hp;
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
        canvas.moveTo(new Vector(self.tpos.x - self.attr.range, self.tpos.y - self.attr.range));
        canvas.drawTo(pen);
    }

    function redraw(canvas) {
        var range = self.attr.range;
        canvas.resize(new Rect(0, 0, range*2 + self.tpos.w, range*2 + + self.tpos.h));

        var pen = canvas.ctx();
        pen.save();
        pen.translate(
            range - self.tpos.x,
            range - self.tpos.y);
        actualRedraw(pen);
        pen.restore();
    }

    function actualRedraw(pen) {
        var pos = self.tpos;
        var cen = pos.center();

        var hpPercent = self.attr.currentHp / self.attr.hp;
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
