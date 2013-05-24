//Takes tower and target, does the attack, and returns everything it hit (as an array, or a single object)

//This function grows too slowly!
function damageToTime(damage) {
    damage += 1;
    return (Math.log(Math.log(Math.abs(damage))) / Math.E + 1) / 2;
}

function applyAttack(attackTemplate) {
    var target = attackTemplate.target;
    var attacker = attackTemplate.attacker;
    var damage = attackTemplate.damage;
    var baseAttacker = attackTemplate.baseAttacker;
    var attackObjs = baseAttacker.attr.attackObjs;

    if(!assertValid(target, attacker, damage, baseAttacker, attackObjs))
        return;

    if(isNaN(target.attr.hp)) {
        fail("darn it! got to figure out how this happens.");
    }

    var game = getGame(target) || getGame(attacker) || getGame(baseAttacker);

    target.attr.hp -= damage;
    baseAttacker.attr.hitCount++;

    if(target == game.selection()) {
        game.infobar.updateAttribute("hp");
    }

    if(baseAttacker == game.selection()) {
        game.infobar.updateAttribute("hitCount");
    }

    var attackKeys = Object.keys(attackObjs).sort();
    var curAttackIndex = attackKeys.indexOf(attackTemplate.currentAtbox);

    var newattackObj = attackObjs[attackKeys[curAttackIndex + 1]];

    if(curAttackIndex >= 0 && newattackObj) {
        var newAttTemplate = cloneObject(attackTemplate); //Clone it just incase it has its own attributes
        newAttTemplate.attackObj = newattackObj;
        newAttTemplate.attacker = attackTemplate.target;
        newAttTemplate.currentAtbox = attackKeys[curAttackIndex + 1];
        startAttack(newAttTemplate);
    }

    if(target.attr.hp <= 0) {
        target.base.destroySelf();

        baseAttacker.attr.kills++;

        if(getRealType(target) != "Tower" && game)
            game.money += target.attr.value;
    }
}

function startAttack(attackTemplate) {
    if(!assertValid(attackTemplate))
        return;

    if(!assertValid(attackTemplate.attacker))
        return;

    if(attackTemplate.damage < 0)
        return;

    var eng = attackTemplate.attacker.base.rootNode;
    var attackObj = attackTemplate.attackObj;

    var realAttacker = attackTemplate.baseAttacker;
    var attacker = attackTemplate.attacker;
    var prevTarget = attackTemplate.target;

    if (assertValid(realAttacker.attr.targetStrategy)) {
        attackTemplate.target = realAttacker.attr.targetStrategy.run(attacker, prevTarget);
    } else {
        attackTemplate.target = new targetStrategies.Random().run(attacker, prevTarget);
    }

    if (attackTemplate.target) {
        var attackNode = new attackObj.AttackNode(attackTemplate);

        eng.base.addChild(attackNode);
    }
}

function AttackTemplate(attackObj, attacker, target, damage, baseAttacker, currentAtbox)
{
    this.attackObj = attackObj;

    this.attacker = attacker;
    this.target = target;
    this.damage = damage;

    this.baseAttacker = baseAttacker;
    this.currentAtbox = currentAtbox;
}

//This is needed because old glyphs draw in the wrong spot. This fixes that.
function adjustBoxForOldGlyphs(box) {
    box = box.clone();

    box.x += box.w * 0.20;
    box.y += box.h * 0.85;
    box.w *= 0.75;
    box.h *= 0.75;

    return box;
}

//Each glyph should illustrate
//1) charge (user.attackCycle.chargePercent)
//2) damage (user.attr.damage

//Attacks shouldn't modify the attacker's attribute (unless that is really the goal)
//If the attack does partial damage then it should create a copy and pass that on.
var allAttackTypes = {
    //Each charge bar is constant damage, number of rows relates to charge speed (1 row per constant time)
    Laser: function laser() {
        this.damagePercent = 200;
        this.drawGlyph = function (pen, box) {
            box = adjustBoxForOldGlyphs(box);

            //Draw text
            pen.fillStyle = "#000000";
            pen.font = box.h + "px arial";
            pen.textAlign = 'left';

            var start = new Vector(box.x + box.w * 0.1, box.y - box.h * 0.2);
            var end = new Vector(box.x + (box.w*0.7), box.y - box.h);

            pen.strokeStyle = globalColorPalette.laser;
	        pen.lineWidth = 2;
	        ink.line(start.x, start.y, end.x, end.y, pen);

            pen.lineWidth = 0.8;

            var dist = cloneObject(start);
            dist.sub(end);
            dist = dist.mag() * 0.3;

            end = start;

            for(var i = 0; i <= Math.PI * 2; i += Math.PI / 3 * 0.5)
            {
                start = cloneObject(end);

                var delta = new Vector(Math.cos(i) * dist, Math.sin(i) * dist);
                start.add(delta);

                pen.strokeStyle = globalColorPalette.laser;
	            pen.lineWidth = 2;
	            ink.line(start.x, start.y, end.x, end.y, pen);
            }
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackObj;
            attackTemplate.damage *= ourStats.damagePercent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : globalColorPalette.laser;

            //AlphaDecay destroys us
            var line = new SLine(attacker.tpos.center(), target.tpos.center(), this.color, 12);
            this.base.addChild(new AlphaDecay(damageToTime(realAttacker.attr.damage), 1, 0));

            this.base.addChild(line);

            applyAttack(this.attackTemplate);

            this.update = function()
            {
                line.color = this.color;
            };
        };
    },
    Bullet: function bullet() {
        this.bulletSpeed = 50;
        this.damagePercent = 300;
        this.drawGlyph = function (pen, box) {
            DRAW.circle(pen, box.center(), box.w/2, "orange", 2, "white");
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackObj;
            attackTemplate.damage *= ourStats.damagePercent / 100;

            var realAttacker = attackTemplate.baseAttacker;
            var attacker = attackTemplate.attacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            this.color = "Orange";

            var bulletSpeed = attackTemplate.attackObj.bulletSpeed;

            var dis = attacker.tpos.center();
            dis.sub(target.tpos.center());
            dis = Math.sqrt(dis.magSq());

            var us = this;
            function onImpact()
            {
                if(target.base.rootNode instanceof Engine)
                    applyAttack(attackTemplate);
                us.base.destroySelf();
            }

            var r = 5;
            if(realAttacker.base.type == "Bug")
                r = 2;

            var bullet = new SCircle(attacker.tpos.center(), r, "White", "Orange", 15);
            var motionDelay = new MotionDelay(attacker.tpos.center(), target.tpos.center(),
                                    dis / bulletSpeed, onImpact);
            bullet.base.addChild(motionDelay);

            this.base.addChild(bullet);

            this.update = function()
            {
                motionDelay.end = target.tpos.center();
            }
        };
    },
    //Average best case (so enough enemies to fully chain) is:
    // - chance / (chance - 1)
    Chain: function chainLightning() {
        this.chainChance = 80;
        this.repeatDelay = 0.3;
        this.drawGlyph = function (pen, box) {
            box = adjustBoxForOldGlyphs(box);

            var w = box.w;
            var h = box.h;

            var offsetList =
                [3, 2, -3, 0, 5, 3, -4, 0, 5, 3,
                2, 0,
                -5, -3, 3, 0, -4, -3, 2, 0, -4, -2];

            var start = new Vector(box.x, box.y);
            var end = new Vector(box.x, box.y);

            var scale = 8;

            pen.beginPath();

            pen.fillStyle = globalColorPalette.chainLightning;
            pen.strokeStyle = globalColorPalette.chainLightning;

            pen.moveTo(start.x, start.y);

            for(var i = 0; i < offsetList.length; i += 2)
            {
                start = cloneObject(end);
                end = new Vector(start.x + w * (offsetList[i] / scale), start.y - h * (offsetList[i + 1] / scale));
                pen.strokeStyle = globalColorPalette.chainLightning;
	            pen.lineWidth = 0.5;
                pen.lineTo(end.x, end.y);
                pen.stroke();
            }

            pen.closePath();
            pen.fill();

        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);
            this.attackTemplate = attackTemplate;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            this.chainChance = attackTemplate.attackObj.chainChance;
            this.repeatDelay = attackTemplate.attackObj.repeatDelay;

            this.color = globalColorPalette.chainLightning;

            //AlphaDecay destroys us
            var line = new SLine(attacker.tpos.center(), target.tpos.center(), this.color, 12);
            this.base.addChild(new AlphaDecay(this.repeatDelay, 1, 0));

            this.base.addChild(line);

            applyAttack(this.attackTemplate);

            this.update = function()
            {
                line.color = this.color;
            };

            this.die = function()
            {
                if(Math.random() < this.chainChance / 100)
                {
                    //This is basically just a custom targeting strategy
                    this.attackTemplate.attacker = this.attackTemplate.target;
                    var attacker = this.attackTemplate.target;
                    var rootAttacker = this.attackTemplate.target;
                    var prevTarget = this.attackTemplate.target;

                    if(!this.attackTemplate.prevList)
                        this.attackTemplate.prevList = [];
                    this.attackTemplate.prevList.push(this.attackTemplate.target);

                    //Make all previous targets hidden so we don't target them again
                    for(var key in this.attackTemplate.prevList)
                        this.attackTemplate.prevList[key].hidden = true;

                    var targetType = prevTarget ? getRealType(prevTarget) : (getRealType(attacker) == "Bug" ? "Tower" : "Bug");
                    var targets = findAllWithin(attacker.base.rootNode, targetType,
                            attacker.tpos.center(), rootAttacker.attr.range);

                    for(var key in this.attackTemplate.prevList)
                        this.attackTemplate.prevList[key].hidden = false;

                    if(!targets || !(targets.length > 0)) //Nothing left to chain to!
                        return;

                    var randomPos = Math.floor(Math.random() * targets.length);
                    this.attackTemplate.target = targets[randomPos];


                    var eng = this.attackTemplate.attacker.base.rootNode;
                    //Resurrect ourself
                    eng.base.addChild(new attackTemplate.attackObj.AttackNode(this.attackTemplate));
                }
            };
        };
    },
    Pulse: function pulse() {
        this.damagePercent = 30;
        this.effectRange = 25;
        this.chargeTime = 1;
        this.drawGlyph = function (pen, box) {
            box.clone().shrink(2);
            DRAW.circle(pen, box.center(), box.w * 0.5, setAlpha(globalColorPalette.pulse, 0.5));
            DRAW.circle(pen, box.center(), box.w * 0.4, setAlpha(globalColorPalette.pulse, 0.5));
            DRAW.circle(pen, box.center(), box.w * 0.2, setAlpha(globalColorPalette.pulse, 0.5));
            DRAW.circle(pen, box.center(), box.w * 0.1, setAlpha(globalColorPalette.pulse, 0.5));
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 8);

            this.attackTemplate = attackTemplate ;

            var ourStats = attackTemplate.attackObj;
            attackTemplate.damage *= ourStats.damagePercent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var prevTarget = this.attackTemplate.target;

            var baseAttacker = attackTemplate.baseAttacker;

            var effectRange = baseAttacker.attr.range * attackTemplate.attackObj.effectRange / 100;
            var chargeTime = attackTemplate.attackObj.chargeTime;

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : "rgba(0,0,255,0)";

            //AlphaDecay destroys us
            var circle = new SCircle(attacker.tpos.center(), effectRange, this.color, this.color, 8);
            this.base.addChild(new AttributeTween(0.2, 0.6, chargeTime, "charged", "alpha"));

            this.base.addChild(circle);

            this.alpha = 0;
            this.update = function()
            {
                circle.color = setAlpha(circle.color, this.alpha);
                circle.fillColor = setAlpha(circle.color, this.alpha);
            };

            this.charged = function()
            {
                this.base.addChild(new SimpleCallback(0.1, "fire"));
                circle.color = "rgba(255,255,255,0.6)";
            };

            this.fire = function()
            {
                attackTemplate = this.attackTemplate;

                var baseAttacker = attackTemplate.baseAttacker;
                var attacker = attackTemplate.attacker;
                var realAttacker = attackTemplate.baseAttacker;
                var target = attackTemplate.target;
                attackTemplate.damage *= attackTemplate.attackObj.damagePercent / 100;
                var prevTarget = this.attackTemplate.target;

                var chargeTime = attackTemplate.attackObj.chargeTime;
                //We do our own targeting (we hit everything around the attacker)

                //This is basically just a custom targeting strategy
                var targetType = prevTarget ? getRealType(prevTarget) : (getRealType(attacker) == "Bug" ? "Tower" : "Bug");
                var targets = findAllWithin(baseAttacker.base.rootNode, targetType,
                        attacker.tpos.center(), effectRange);

                this.targets = targets;

                for(var key in this.targets)
                {
                    this.attackTemplate.target = this.targets[key];
                    applyAttack(this.attackTemplate);
                }
                this.base.destroySelf();
            };
        };
    },
    //Average is (basically its a best case chain):
    // - chance / (chance - 1)
    DOT: function poison() {
        this.repeatChance = 80;
        this.repeatDelay = 0.3;
        this.damagePercent = 30;
        this.drawGlyph = function (pen, box) {
            box = adjustBoxForOldGlyphs(box);
            var circlePos = [0.2, 0.25, 0.1,
                            0.5, 0.1, 0.1,
                            0.8, 0.25, 0.1,
                            0.2, 0.65, 0.1,
                            0.5, 0.5, 0.1,
                            0.8, 0.65, 0.1,
                            0.5, 0.85, 0.1];

            for(var i = 0; i < circlePos.length; i += 3)
            {
                pen.strokeStyle = globalColorPalette.poison;
                pen.fillStyle = globalColorPalette.poison;
	            pen.lineWidth = 1;
                ink.circ(box.x+(box.w*circlePos[i]), box.y-(box.w*circlePos[i + 1]),
                    box.w * circlePos[i + 2], pen);
            }


            //ink.text(box.x, box.y, "PO", pen);
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackObj;
            attackTemplate.damage *= ourStats.damagePercent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            this.repeatChance = attackTemplate.attackObj.repeatChance;
            this.repeatDelay = attackTemplate.attackObj.repeatDelay;

            this.color = globalColorPalette.poison;

            //AlphaDecay destroys us
            var line = new SLine(attacker.tpos.center(), target.tpos.center(), this.color, 12);
            this.base.addChild(new AttributeTween(1, 0, this.repeatDelay, "tick", "alpha"));

            this.base.addChild(line);

            var poisonIndicator = new SCircle(target.tpos.center(), 8, this.color, this.color, 14);
            this.base.addChild(poisonIndicator);

            this.alpha = 0;
            this.poisonAlpha = 0;
            this.update = function()
            {
                line.color = setAlpha(line.color, this.alpha);
                poisonIndicator.color = setAlpha(poisonIndicator.color, this.poisonAlpha);
                poisonIndicator.fillColor = setAlpha(poisonIndicator.fillColor, this.alpha);
                poisonIndicator.tpos.x = target.tpos.center().x;
                poisonIndicator.tpos.y = target.tpos.center().y;
            };

            this.nothing = function(){}

            this.tick = function()
            {
                var eng = this.base.rootNode;

                if(target.base.rootNode == eng &&
                    Math.random() < this.repeatChance / 100)
                {
                    this.base.addChild(new AttributeTween(1, 0, this.repeatDelay * 0.5, "nothing", "poisonAlpha"));
                    this.base.addChild(new SimpleCallback(this.repeatDelay, "tick"));

                    applyAttack(this.attackTemplate);
                }
                else
                {
                    this.base.destroySelf();
                }
            };
        };
    },
    Slow: function slow() {
        this.slowPercent = 50;
        this.slowTime = 2.5;
        this.drawGlyph = function (pen, box) {
            box = adjustBoxForOldGlyphs(box);
            var w = box.w;
            var h = box.h;

            var offsetList =
                [5, -20, 5, 20,
                10, -50, 10, 30,
                5, -50, 7, 50,
                5, -90, 7, 100,
                5, -50, 7, 50,
                7, -50, 7, 30,
                10, -50, 10, 30,
                10, 60, -110, 0
                ];

            var start = new Vector(box.x - w * 0.1, box.y - w);
            var end = new Vector(box.x - w * 0.1, box.y - w);

            var scale = 100;

            pen.beginPath();

            pen.fillStyle = globalColorPalette.slow;
            pen.strokeStyle = "rgba(255, 255, 255, 1)";

            pen.moveTo(start.x, start.y);

            for(var i = 0; i < offsetList.length; i += 2)
            {
                start = cloneObject(end);
                end = new Vector(start.x + w * (offsetList[i] / scale), start.y - h * (offsetList[i + 1] / scale));
                pen.strokeStyle = globalColorPalette.chainLightning;
	            pen.lineWidth = 0.5;
                pen.lineTo(end.x, end.y);
                pen.stroke();
            }

            pen.closePath();
            pen.fill();
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);
            this.attackTemplate = attackTemplate;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            var slow = attackTemplate.attackObj.slowPercent / 100;
            var slowTime = attackTemplate.attackObj.slowTime;

            this.color = globalColorPalette.slow;

            var line = new SLine(attacker.tpos.center(), target.tpos.center(), this.color, 12);
            line.base.addChild(new AlphaDecay(slowTime, 1, 0));
            this.base.addChild(line);

            var slow = new SlowEffect(slow);
            slow.base.addChild(new Lifetime(slowTime));

            target.base.addChild(slow);

            applyAttack(this.attackTemplate);

            this.update = function()
            {
                line.end = target.tpos.center();
            };
        };
    },
};

var towerAttackTypes = {
    Laser: allAttackTypes.Laser,
    Bullet: allAttackTypes.Bullet,
    Chain: allAttackTypes.Chain,
    Pulse: allAttackTypes.Pulse,
    DOT: allAttackTypes.DOT,
    Slow: allAttackTypes.Slow
};

//Not needed anymore... but if you have a radio option for something this
//is how you would set up the underlying attack types for it
var bugAttackTypes = {
    BugBullet: allAttackTypes.Bullet
};


function drawAttributes(user, pen) {
    if(user.lineWidth) {
        user.tpos.x += user.lineWidth;
        user.tpos.y += user.lineWidth;
        user.tpos.w -= Math.ceil(user.lineWidth * 2);
        user.tpos.h -= Math.ceil(user.lineWidth * 2);
    }

    //We do this so we can draw the target strategy like an attackObj
    var glyphArray = [];

    glyphArray.push(user.attr.targetStrategy);

    var attackObjKeys = Object.keys(user.attr.attackObjs).sort();
    for(var key in attackObjKeys)
        glyphArray.push(user.attr.attackObjs[attackObjKeys[key]]);
    
    makeTiled(pen,
        function (obj, pen, pos) {
            if (typeof obj == "number")
                return false;
            if(!obj.drawGlyph)
                fail("not good");

            DRAW.rect(
                pen,
                new Rect(pos.x, pos.y, pos.w, pos.h),
                "transparent",
                1,
                "rgba(255, 255, 255, 0.5)");

            obj.drawGlyph(pen, pos, user);
            return true;
        },
        glyphArray,
        user.tpos.clone(),
        2, 2,
        0.01);

    if(user.lineWidth) {
        user.tpos.x -= user.lineWidth;
        user.tpos.y -= user.lineWidth;
        user.tpos.w += Math.ceil(user.lineWidth * 2);
        user.tpos.h += Math.ceil(user.lineWidth * 2);
    }
}
