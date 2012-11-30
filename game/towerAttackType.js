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

    if(isNaN(target.attr.currentHp))
    {
        fail("darn it! got to figure out how this happens.");
    }

    target.attr.currentHp -= damage;    
    baseAttacker.attr.hitcount++;

    var newAttackType = baseAttacker.attr.attack_types[attackTemplate.currentAttPos + 1];

    if(newAttackType)
    {
        var newAttTemplate = cloneObject(attackTemplate); //Clone it just incase it has its own attributes
        newAttTemplate.attackType = newAttackType;
        newAttTemplate.attacker = attackTemplate.target;
        newAttTemplate.currentAttPos++;
        startAttack(newAttTemplate);
    }

    if(target.attr.currentHp < 0)
    {
        var sound = new Sound("snd/die.wav");
        target.base.destroySelf();

        if(getRealType(target) != "Tower")
            attacker.base.rootNode.money += target.attr.value;
    }
}

function startAttack(attackTemplate) {
    if(!assertDefined(attackTemplate))
        return;

    if(!assertDefined(attackTemplate.attacker))
        return;

    var ENG = attackTemplate.attacker.base.rootNode;
    var attackType = attackTemplate.attackType;

    var realAttacker = attackTemplate.baseAttacker;
    var attacker = attackTemplate.attacker;
    var prevTarget = attackTemplate.target;
    attackTemplate.target = realAttacker.attr.target_Strategy.run(attacker, prevTarget);

    if(attackTemplate.target)
    {
        var attackNode = new attackType.AttackNode(attackTemplate);

        ENG.base.addObject(attackNode);
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

//Attacks shouldn't modify the attacker's attribute (unless that is really the goal)
//If the attack does partial damage then it should create a copy and pass that on.
var allAttackTypes = {
    Laser: function laser() {
        this.damage_percent = 200;
        this.drawGlyph = function (pen, tPos) {
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

            ink.text(tPos.x, tPos.y, "N", pen);
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

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : "rgba(0,0,255,0)";
            
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
        this.drawGlyph = function (pen, tPos) {
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

            ink.text(tPos.x, tPos.y, "B", pen);
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
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

            ink.text(tPos.x, tPos.y, "CL", pen);
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

            this.color = getRealType(realAttacker) == "Bug" ? "rgba(255,0,0,0)" : "rgba(0,0,255,0)";
            
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
                            attacker.tPos.getCenter(), attacker.attr.range);

                    for(var key in this.attackTemplate.prevList)
                        this.attackTemplate.prevList[key].hidden = false;

                    if(!targets || !(targets.length > 0)) //Nothing left to chain to!
                        return;

                    var randomPos = Math.floor(Math.random() * targets.length);
                    this.attackTemplate.target = targets[randomPos];


                    var ENG = this.attackTemplate.attacker.base.rootNode;
                    //Resurrect ourself
                    ENG.base.addObject(new attackTemplate.attackType.AttackNode(this.attackTemplate));
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

            ink.text(tPos.x, tPos.y, "P", pen);
        };
        this.AttackNode = function(attackTemplate)
        {         
            this.base = new BaseObj(this, 15);
            
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
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

            ink.text(tPos.x, tPos.y, "PO", pen);
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

            this.color = "rgba(0, 255, 0, 0)";
            
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
                if(target.base.rootNode == this.base.rootNode &&
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
            //Draw text
            pen.fillStyle = "#000000";
            pen.font = tPos.h + "px arial";
            pen.textAlign = 'left';

            ink.text(tPos.x, tPos.y, "S", pen);
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

            this.color = "rgba(30, 144, 255, 1)";

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

//Not needed anymore... but if you have a radio option for something this
//is how you would set up the underlying attack types for it
var bugAttackTypes = {
    Laser: allAttackTypes.Laser
};


function drawAttributes(user, pen) {
    makeTiled(pen,
        function (obj, pen, pos) {
            if (typeof obj == "number")
                return false;
            if(!obj.drawGlyph)
                fail("not good");
            obj.drawGlyph(pen, pos);
            return true;
        },
        user.attr,
        new TemporalPos(
            user.tPos.x + user.tPos.w * 0.15,
            user.tPos.y + user.tPos.h * 0.4,
            user.tPos.w * 0.85,
            user.tPos.h * 0.6),
        2, 2,
        0.1);
}