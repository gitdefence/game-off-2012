//Takes tower and target, does the attack, and returns everything it hit (as an array, or a single object)

//This function grows too slowly!
function damageToTime(damage) {
    damage += 1;
    return (Math.log(Math.log(damage)) / Math.E + 1) / 2;
}

function applyAttack(attackTemplate) {
    var target = attackTemplate.target;
    var attacker = attackTemplate.attacker;
    var damage = attackTemplate.damage;
    var baseAttacker = attackTemplate.baseAttacker;
    
    if(!assertDefined(target, attacker, damage, baseAttacker))
        return;

    if(isNaN(target.attr.currentHp)) {
        fail("darn it! got to figure out how this happens.");
    }

    target.attr.currentHp -= damage;    
    baseAttacker.attr.hitCount++;

    var newAttackType = baseAttacker.attr.attack_types[attackTemplate.currentAttPos + 1];

    if(newAttackType) {
        var newAttTemplate = cloneObject(attackTemplate); //Clone it just incase it has its own attributes
        newAttTemplate.attackType = newAttackType;
        newAttTemplate.attacker = attackTemplate.target;
        newAttTemplate.currentAttPos++;
        startAttack(newAttTemplate);
    }

    if(target.attr.currentHp <= 0) {
        var game = getGame(target) || getGame(attacker) || getGame(baseAttacker);

        var sound = new Sound("snd/die.wav");
        target.base.destroySelf();

        baseAttacker.attr.kills++;

        if(getRealType(target) != "Tower" && game)
            game.money += target.attr.value;
    }
}

function startAttack(attackTemplate) {
    if(!assertDefined(attackTemplate))
        return;

    if(!assertDefined(attackTemplate.attacker))
        return;

    if(attackTemplate.damage < 0)
        return;

    var eng = attackTemplate.attacker.base.rootNode;
    var attackType = attackTemplate.attackType;

    var realAttacker = attackTemplate.baseAttacker;
    var attacker = attackTemplate.attacker;
    var prevTarget = attackTemplate.target;
    if(realAttacker.attr.target_Strategy)
        attackTemplate.target = realAttacker.attr.target_Strategy.run(attacker, prevTarget);
    else
        attackTemplate.target = new targetStrategies.Random().run(attacker, prevTarget);

    if(attackTemplate.target)
    {
        var attackNode = new attackType.AttackNode(attackTemplate);

        eng.base.addObject(attackNode);
    }
}

function AttackTemplate(attackType, attacker, target, damage, baseAttacker, currentAttPos)
{
    this.attackType = attackType;

    this.attacker = attacker; 
    this.target = target; 
    this.damage = damage; 

    this.baseAttacker = baseAttacker;
    this.currentAttPos = currentAttPos;    
}


//Each glyph should illustrate
//1) charge (user.attackCycle.chargePercent)
//2) damage (user.attr.damage

//Attacks shouldn't modify the attacker's attribute (unless that is really the goal)
//If the attack does partial damage then it should create a copy and pass that on.
var allAttackTypes = {
    //Each charge bar is constant damage, number of rows relates to charge speed (1 row per constant time)
    Laser: function laser() {
        this.damage_percent = 200;
        this.drawGlyph = function (pen, tPos, user) {
            var baseColor = globalColorPalette.laser;

            var bufferPercent = 0.15;

            tPos.x += tPos.w * bufferPercent;
            tPos.y += tPos.h * bufferPercent;

            tPos.w *= (1 - bufferPercent * 2);
            tPos.h *= (1 - bufferPercent * 2);

            var percentCharge = user.attackCycle.chargePercent;
            var damage = user.attr.damage;

            var damagePerModule = 0.1;

            var damageModules = Math.ceil(damage / damagePerModule);
            var modulesFilled = damage * percentCharge / damagePerModule;

            var timePerRow = 0.5;

            var rows = user.attackCycle.maxCounter / timePerRow;



            var posX = 0;
            var posY = 0;
            var width = rows / damageModules;
            var height = 1 / rows;



            var widthBuffer = 0.2;
            var heightBuffer = 0.1;

            while(damageModules > 0) {
                function drawPart(color) {
                    DRAW.rect(pen, new Rect(
                        posX + width * widthBuffer,
                        posY + height * heightBuffer,
                        width * (1 - widthBuffer * 2),
                        height * (1 - heightBuffer * 2)).scale(tPos), color);
                }

                if(modulesFilled >= 1) {
                    drawPart("blue");
                } else {
                    drawPart("grey");
                }

                posX += width;

                if(posX >= 1) {
                    posX = 0;
                    posY += height;
                }

                modulesFilled--;
                damageModules--;
            }

            //Original glyph code
            /*
             var start = new Vector(tPos.x + tPos.w * 0.1, tPos.y - tPos.h * 0.2);
             var end = new Vector(tPos.x + (tPos.w*0.7), tPos.y - tPos.h);

             pen.strokeStyle = baseColor;
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
             */
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);         
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackType;
            attackTemplate.damage *= ourStats.damage_percent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;            

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : globalColorPalette.laser;
            
            //AlphaDecay destroys us
            var line = new Line(attacker.tPos.getCenter(), target.tPos.getCenter(), this.color, 12);        
            this.base.addObject(new AlphaDecay(damageToTime(realAttacker.attr.damage), 1, 0));

            this.base.addObject(line);

            applyAttack(this.attackTemplate);

            this.sound = new Sound("snd/Laser_Shoot.wav");
            this.sound.play();
        
            this.update = function()
            {
                line.color = this.color;
            };
        };
    },
    Bullet: function bullet() {
        this.bullet_speed = 50;
        this.damage_percent = 300;
        this.drawGlyph = function (pen, tPos, user) {
            tPos = cloneProperties(user.tPos);

            //tPos.x += tPos.w * 0.07;
            //tPos.y += tPos.h * 0.01;


            var baseColor = globalColorPalette.laser;

            var percentCharge = user.attackCycle.chargePercent;


            var damage = user.attr.damage;
            var totalTime = user.attackCycle.maxCounter;
            var curTime = user.attackCycle.attackCounter;

            //Slingshot
            var damageIncrements = damage / 0.1;

            //var pullback = 0.3;
            var projectileArea = damageIncrements * 10; //Input area

            var projectileTargetSpeed = 50; //Input speed
            var elasticCoefficient = 30000; //Input coefficient (elastic strength)


            var projectileRadius = Math.sqrt(projectileArea / 4);
            var mass = projectileArea;

            //Elastic energy formula is:
            //0.5(x^2*coefficient)
            //Speed energy formula is:
            //0.5(v^2)* m

            //So pull back distance
            //x = v * sqrt(mass / coefficient)

            var pullbackDist = projectileTargetSpeed * Math.sqrt(mass / elasticCoefficient);

            //Also equals 0.5 * speed * speed * mass
            var energyNeeded = 0.5 * pullbackDist * pullbackDist * elasticCoefficient;

            //When released:
            //Acceleration = coefficient / m
            //x = 1/2 acceleration * t^2
            //So time is sqrt(2*pullbackDist/acceleration) = t
            var acceleration = elasticCoefficient / mass;
            var timeAfterRelease = Math.sqrt(2 * pullbackDist / acceleration);


            var timeToCharge = totalTime - timeAfterRelease;

            var posX = tPos.x - projectileRadius + tPos.w * 0.5;
            var posY = tPos.y - projectileRadius + tPos.h * 0.5;

            var width = projectileRadius * 2;
            var height = projectileRadius * 2;


            if(curTime < timeToCharge) {
                //Charging
                var energyRate = energyNeeded / timeToCharge;
                var curEnergy = energyRate * curTime;

                //Energy = 0.5*x*x*coefficient, so x = Math.sqrt(2*energy/coefficient)
                var curX = Math.sqrt(2*curEnergy/elasticCoefficient);
                posY += curX;
            } else {
                //Releasing
                var timeReleased = curTime - timeToCharge;
                var curX = 0.5 * acceleration * timeReleased * timeReleased;
                posY += pullbackDist - curX;
            }

            var color = baseColor;


            pen.beginPath();

            pen.strokeStyle = "rgba(255, 255, 255, 0.5)";
            pen.fillStyle = "yellow";

            pen.lineWidth = 1;
            ink.rect(tPos.x, tPos.y, tPos.w, tPos.h, pen);
            pen.closePath();

            DRAW.arcRect(pen, new Rect(tPos.x, tPos.y, tPos.w, tPos.h), "grey");

            DRAW.arcRect(pen, new Rect(posX, posY, width, height), color);

            /*
	        pen.lineWidth = 0;
	        pen.fillStyle = "#ffffff";        
            pen.strokeStyle = "transparent";
	        ink.circ(tPos.x+(tPos.w*0.35), tPos.y-(tPos.w*0.5), tPos.w*0.4, pen);

    	    pen.strokeStyle = "transparent";
            pen.fillStyle = "orange";
	        ink.circ(tPos.x+(tPos.w*0.35), tPos.y-(tPos.w*0.5), tPos.w*0.3, pen);
            */
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);         
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackType;
            attackTemplate.damage *= ourStats.damage_percent / 100;

            var realAttacker = attackTemplate.baseAttacker;
            var attacker = attackTemplate.attacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;            

            this.color = "Orange";

            var bulletSpeed = attackTemplate.attackType.bullet_speed;

            var dis = attacker.tPos.getCenter();
            dis.sub(target.tPos.getCenter());
            dis = Math.sqrt(dis.magSq());

            var us = this;
            function onImpact()
            {
                //A hackish way to check if both still exist
                if(target.base.rootNode == attacker.base.rootNode)
                    applyAttack(attackTemplate);
                us.base.destroySelf();
            }

            var r = 5;
            if(realAttacker.base.type == "Bug")
                r = 2;

            var bullet = new Circle(attacker.tPos.getCenter(), r, "White", "Orange", 15);
            var motionDelay = new MotionDelay(attacker.tPos.getCenter(), target.tPos.getCenter(),
                                    dis / bulletSpeed, onImpact);
            bullet.base.addObject(motionDelay);

            this.base.addObject(bullet);

            this.sound = new Sound("snd/Laser_Shoot.wav");
            this.sound.play();            

            this.update = function()
            {
                motionDelay.end = target.tPos.getCenter();
            }
        };
    },
    //Average best case (so enough enemies to fully chain) is:
    // - chance / (chance - 1)
    Chain: function chain_lightning() {
        this.chain_chance = 80;
        this.repeatDelay = 0.3;
        this.drawGlyph = function (pen, tPos) {
            var w = tPos.w;
            var h = tPos.h;

            var offsetList = 
                [3, 2, -3, 0, 5, 3, -4, 0, 5, 3,
                2, 0,
                -5, -3, 3, 0, -4, -3, 2, 0, -4, -2];

            var start = new Vector(tPos.x, tPos.y);
            var end = new Vector(tPos.x, tPos.y);

            var scale = 8;

            pen.beginPath();

            pen.fillStyle = globalColorPalette.chain_lightning;
            pen.strokeStyle = globalColorPalette.chain_lightning;

            pen.moveTo(start.x, start.y);

            for(var i = 0; i < offsetList.length; i += 2)
            {
                start = cloneObject(end);
                end = new Vector(start.x + w * (offsetList[i] / scale), start.y - h * (offsetList[i + 1] / scale));
                pen.strokeStyle = globalColorPalette.chain_lightning;
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

            this.chain_chance = attackTemplate.attackType.chain_chance;
            this.repeatDelay = attackTemplate.attackType.repeatDelay;

            this.color = globalColorPalette.chain_lightning;
            
            //AlphaDecay destroys us
            var line = new Line(attacker.tPos.getCenter(), target.tPos.getCenter(), this.color, 12);        
            this.base.addObject(new AlphaDecay(this.repeatDelay, 1, 0));

            this.base.addObject(line);

            applyAttack(this.attackTemplate);

            this.sound = new Sound("snd/Laser_Shoot.wav");
            this.sound.play();
        
            this.update = function()
            {
                line.color = this.color;
            };

            this.die = function()
            {
                if(Math.random() < this.chain_chance / 100)
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
                            attacker.tPos.getCenter(), rootAttacker.attr.range);

                    for(var key in this.attackTemplate.prevList)
                        this.attackTemplate.prevList[key].hidden = false;

                    if(!targets || !(targets.length > 0)) //Nothing left to chain to!
                        return;

                    var randomPos = Math.floor(Math.random() * targets.length);
                    this.attackTemplate.target = targets[randomPos];


                    var eng = this.attackTemplate.attacker.base.rootNode;
                    //Resurrect ourself
                    eng.base.addObject(new attackTemplate.attackType.AttackNode(this.attackTemplate));
                }
            };
        };
    },
    Pulse: function pulse() {
        this.damage_percent = 30;
        this.effect_range = 50;
        this.charge_time = 1;
        this.drawGlyph = function (pen, tPos) {
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

	        pen.fillStyle = setAlpha(globalColorPalette.pulse, 0.5);
	        pen.strokeStyle = "transparent";
	        ink.circ(tPos.x+(tPos.w*0.3), tPos.y-(tPos.w*0.5), tPos.w*0.5, pen);

            pen.fillStyle = setAlpha(globalColorPalette.pulse, 0.5);
	        pen.strokeStyle = "transparent";
	        ink.circ(tPos.x+(tPos.w*0.3), tPos.y-(tPos.w*0.5), tPos.w*0.4, pen);

            pen.fillStyle = setAlpha(globalColorPalette.pulse, 0.5);
	        pen.strokeStyle = "transparent";
	        ink.circ(tPos.x+(tPos.w*0.3), tPos.y-(tPos.w*0.5), tPos.w*0.2, pen);

            pen.fillStyle = setAlpha(globalColorPalette.pulse, 0.5);
	        pen.strokeStyle = "transparent";
	        ink.circ(tPos.x+(tPos.w*0.3), tPos.y-(tPos.w*0.5), tPos.w*0.1, pen);
        };
        this.AttackNode = function(attackTemplate)
        {         
            this.base = new BaseObj(this, 8);
            
            this.attackTemplate = attackTemplate ;

            var ourStats = attackTemplate.attackType;
            attackTemplate.damage *= ourStats.damage_percent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var prevTarget = this.attackTemplate.target;

            var effect_range = attackTemplate.attackType.effect_range;
            var charge_time = attackTemplate.attackType.charge_time;

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : "rgba(0,0,255,0)";

            //AlphaDecay destroys us
            var circle = new Circle(attacker.tPos.getCenter(), effect_range, this.color, this.color, 8);
            this.base.addObject(new AttributeTween(0.2, 0.6, charge_time, "charged", "alpha"));

            this.base.addObject(circle);

            
            this.sound = new Sound("snd/Laser_Shoot.wav");
            this.sound.play();
        
            this.alpha = 0;
            this.update = function()
            {
                circle.color = setAlpha(circle.color, this.alpha);
                circle.fillColor = setAlpha(circle.color, this.alpha);
            };
            
            this.charged = function()
            {
                this.base.addObject(new SimpleCallback(0.1, "fire"));
                circle.color = "rgba(255,255,255,0.6)";
            };

            this.fire = function()
            {
                attackTemplate = this.attackTemplate;

                var attacker = attackTemplate.attacker;
                var realAttacker = attackTemplate.baseAttacker;
                var target = attackTemplate.target;
                attackTemplate.damage *= attackTemplate.attackType.damage_percent / 100;
                var prevTarget = this.attackTemplate.target;
                
                var charge_time = attackTemplate.attackType.charge_time;
                //We do our own targeting (we hit everything around the attacker)
                            
                //This is basically just a custom targeting strategy
                var targetType = prevTarget ? getRealType(prevTarget) : (getRealType(attacker) == "Bug" ? "Tower" : "Bug");
                var targets = findAllWithin(attacker.base.rootNode, targetType, 
                        attacker.tPos.getCenter(), effect_range);

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
        this.repeat_chance = 80;
        this.repeatDelay = 0.3;
        this.damage_percent = 30;
        this.drawGlyph = function (pen, tPos) {

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
                ink.circ(tPos.x+(tPos.w*circlePos[i]), tPos.y-(tPos.w*circlePos[i + 1]), 
                    tPos.w * circlePos[i + 2], pen);
            }
            
            
            //ink.text(tPos.x, tPos.y, "PO", pen);
        };
        this.AttackNode = function(attackTemplate)
        {
            this.base = new BaseObj(this, 15);         
            this.attackTemplate = attackTemplate;

            var ourStats = attackTemplate.attackType;
            attackTemplate.damage *= ourStats.damage_percent / 100;

            var attacker = attackTemplate.attacker;
            var realAttacker = attackTemplate.baseAttacker;
            var target = attackTemplate.target;
            var damage = attackTemplate.damage;

            this.repeat_chance = attackTemplate.attackType.repeat_chance;
            this.repeatDelay = attackTemplate.attackType.repeatDelay;

            this.color = globalColorPalette.poison;
            
            //AlphaDecay destroys us
            var line = new Line(attacker.tPos.getCenter(), target.tPos.getCenter(), this.color, 12);
            this.base.addObject(new AttributeTween(1, 0, this.repeatDelay, "tick", "alpha"));

            this.base.addObject(line);
            
            var poisonIndicator = new Circle(target.tPos.getCenter(), 8, this.color, this.color, 14);
            this.base.addObject(poisonIndicator);            
      
            this.alpha = 0;
            this.poisonAlpha = 0;
            this.update = function()
            {
                line.color = setAlpha(line.color, this.alpha);
                poisonIndicator.color = setAlpha(poisonIndicator.color, this.poisonAlpha);
                poisonIndicator.fillColor = setAlpha(poisonIndicator.fillColor, this.alpha);
                poisonIndicator.tPos.x = target.tPos.getCenter().x;
                poisonIndicator.tPos.y = target.tPos.getCenter().y;
            };

            this.nothing = function(){}

            this.tick = function()
            {
                var eng = this.base.rootNode;

                if(target.base.rootNode == eng &&
                    Math.random() < this.repeat_chance / 100)
                {                    
                    this.base.addObject(new AttributeTween(1, 0, this.repeatDelay * 0.5, "nothing", "poisonAlpha"));
                    this.base.addObject(new SimpleCallback(this.repeatDelay, "tick"));

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
        this.slow_percent = 50;
        this.slow_time = 2.5;
        this.drawGlyph = function (pen, tPos) {
            var w = tPos.w;
            var h = tPos.h;

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

            var start = new Vector(tPos.x - w * 0.1, tPos.y - w);
            var end = new Vector(tPos.x - w * 0.1, tPos.y - w);

            var scale = 100;

            pen.beginPath();

            pen.fillStyle = globalColorPalette.slow;
            pen.strokeStyle = "rgba(255, 255, 255, 1)";

            pen.moveTo(start.x, start.y);

            for(var i = 0; i < offsetList.length; i += 2)
            {
                start = cloneObject(end);
                end = new Vector(start.x + w * (offsetList[i] / scale), start.y - h * (offsetList[i + 1] / scale));
                pen.strokeStyle = globalColorPalette.chain_lightning;
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

            var slow = attackTemplate.attackType.slow_percent / 100;
            var slow_time = attackTemplate.attackType.slow_time;

            this.color = globalColorPalette.slow;

            var line = new Line(attacker.tPos.getCenter(), target.tPos.getCenter(), this.color, 12);        
            line.base.addObject(new AlphaDecay(slow_time, 1, 0));
            this.base.addObject(line);            
            
            var slow = new SlowEffect(slow);
            slow.base.addObject(new Lifetime(slow_time));

            target.base.addObject(slow);

            applyAttack(this.attackTemplate);

            this.update = function()
            {
                line.end = target.tPos.getCenter();
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
}

//Not needed anymore... but if you have a radio option for something this
//is how you would set up the underlying attack types for it
var bugAttackTypes = {
    BugBullet: allAttackTypes.Bullet
};


function drawAttributes(user, pen) {
    if(user.lineWidth) {
        user.tPos.x += user.lineWidth;
        user.tPos.y += user.lineWidth;
        user.tPos.w -= Math.ceil(user.lineWidth * 2);
        user.tPos.h -= Math.ceil(user.lineWidth * 2);
    }

    makeTiled(pen,
        function (obj, pen, pos) {
            if (typeof obj == "number")
                return false;
            if(!obj.drawGlyph)
                fail("not good");            

            obj.drawGlyph(pen, pos, user);
            return true;
        },
        user.attr,
        new TemporalPos(
            user.tPos.x,
            user.tPos.y,
            user.tPos.w,
            user.tPos.h),
        2, 2,
        0.01);

    makeTiled(pen,
        function (obj, pen, pos) {
            if (typeof obj == "number")
                return false;

            pen.beginPath();

            pen.strokeStyle = "rgba(255, 255, 255, 0.5)";
            pen.fillStyle = "transparent";

            pen.lineWidth = 1;
            ink.rect(pos.x, pos.y, pos.w, pos.h, pen);

            pen.closePath();

            return true;
        },
        user.attr,
        new TemporalPos(
            user.tPos.x,
            user.tPos.y,
            user.tPos.w,
            user.tPos.h ),
        2, 2,
        0.01);

    if(user.lineWidth) {
        user.tPos.x -= user.lineWidth;
        user.tPos.y -= user.lineWidth;
        user.tPos.w += Math.ceil(user.lineWidth * 2);
        user.tPos.h += Math.ceil(user.lineWidth * 2);
    }
}

//Draws a hexagon
/*
 var damagePerModule = 0.1;

 var damageModules = Math.ceil(damage / damagePerModule);
 var modulesFilled = damage * percentCharge / damagePerModule;

 //Hexagon fill is:
 //Layer size = layer * 6, layer 0 is 1... but we exclude layer 0 for now
 //So layer number = (width - 1) / 2
 //number = ((layer number) * 6 + 6) / 2 * (layer number)
 //number = ((layer number) + 1) * 3 * (layer number)
 //number/3 = lr^2 + lr
 //x = (-b +- sqrt(b^2 - 4ac))/(2a)
 //x = (sqrt(1 + 4n/3) - 1) / 2... rounded up
 //1, 6, 12, 18
 //So total width is:


 var circleWidths = Math.ceil(Math.sqrt(1 + 4 * damageModules / 3)) + 1;

 //damageModules = 18;

 tPos = cloneProperties(tPos);
 //tPos.x -= tPos.w * percentCharge;

 //tPos.x = percentCharge / 2;

 tPos.x += tPos.w * 0.07;
 tPos.y += tPos.h * 0.01;

 tPos.w *= 0.85;
 tPos.h *= 0.85;

 var width = 1 / circleWidths / 2;
 var height = 1 / circleWidths / 2;
 var posX = (1 - percentCharge / 2) - width * 1.5;
 var posY = percentCharge / 2 - height * 1.5;

 var moveDelta = width * 2;

 var angle = 0;
 var curDist = 0;
 var curMove = 1;

 var angleIncrement = Math.PI / 3;
 var angleChanges = 5.5;

 while(damageModules > 0) {
 function drawPart(color) {
 DRAW.arcRect(pen, new Rect(posX, posY, width, height).scale(tPos), color);
 }

 drawPart("grey");

 if(modulesFilled >= 1) {
 drawPart("yellow");
 }

 posX += Math.cos(angle) * moveDelta;
 posY += Math.sin(angle) * moveDelta;

 curDist++;

 if(curDist >= curMove) {
 curDist = 0;
 angle += angleIncrement;

 if(angle > angleIncrement * angleChanges) {
 angle = 0;
 curDist = 0;
 curMove++;

 posX += Math.cos(angleIncrement * 4) * moveDelta;
 posY += Math.sin(angleIncrement * 4) * moveDelta;
 }
 }

 modulesFilled--;
 damageModules--;
 }
 */
