//Currently no alleles are really stored in here as alleles are dynamically generated to create
//a random component to the allele system (randomly generated from a set of discrete values though).

var changeNextGlobalChance = null;
//Choices is an object with key as CDF (so the last should be 1)
function choose(choices) {
    var randomValue = Math.random();

    if (changeNextGlobalChance) {
        randomValue = changeNextGlobalChance;
        changeNextGlobalChance = null;
    }

    var realChoices = [];
    for (var chance in choices) {
        var obj = {};
        obj.chance = chance;
        obj.choice = choices[chance];
        realChoices.push(obj);
    }

    realChoices.sort(function (a, b) { return a.chance - b.chance; });

    var curValue = 0;
    for (var key in realChoices) {
        if (randomValue < realChoices[key].chance) {
            return realChoices[key].choice;
        }
    }
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

var AllAlleleGroups = {
    //Should likely have better names
    //EACH ONE OF THESE SHOULD HAVE MORE THAN ONE PHENOTYPE!
    //(Ex, one could be +10 range, of +5 range (moderate bonus)
    //two could be +1000 range of +50 damage (major bonus)
    //three could be... etc
    //Make some for all of the attack types and target strategies.
    //Some major bonuses

//BASELINE BONUS
    rangeBase: function () { return choose(
        {
            0.5: { range: 30 }, //Roughly even distribution of base stats
            0.7: { range: 50 },
            0.9: { range: 70 },
            1: { range: 150 },  //With a minor chance of huge benefit (this is really good, as
                                //no matter what the target tower stats the best phenotype
                                //for this allele will improve it or make it the same).
        }); },

    damageBase: function () { return choose(
        {
            0.5: { damage: 3 }, //Roughly even distribution of base stats
            0.7: { damage: 5 },
            0.9: { damage: 7 },
            1: { damage: 15 },  //With a minor chance of huge benefit (this is really good, as
                                //no matter what the target tower stats the best phenotype
                                //for this allele will improve it or make it the same).
        }); },

    hpBase: function () { return choose(
        {
            0.5: { maxHp: 30 },
            0.7: { maxHp: 50 },
            0.9: { maxHp: 70 },
            1: { maxHp: 150 },
        }); },

    hpRegenBase: function () { return choose(
        {
            0.5: { hpRegen: 3 },
            0.7: { hpRegen: 5 },
            0.9: { hpRegen: 7 },
            1: { hpRegen: 15 },
        }); },

    attSpeedBase: function () { return choose(
        {
            0.5: { attSpeed: 0 },
            0.7: { attSpeed: 0.2 },
            0.9: { attSpeed: 0.3 },
            1: { attSpeed: 0.5 },
        }); },

    attack1: function () { if(DFlag.lateGameSpeedTest) return {attack: allAttackTypes.DOT};
        return choose(
        {
            0.166: { attack: allAttackTypes.Laser },
            0.333: { attack: allAttackTypes.Bullet },
            0.500: { attack: allAttackTypes.Chain },
            0.666: { attack: allAttackTypes.Pulse },
            0.833: { attack: allAttackTypes.DOT },
            1.0: { attack: allAttackTypes.Slow },
        }); },

    targetBase: function () { if(DFlag.lateGameSpeedTest) {target: targetStrategies.Random};
        return choose(
        {
            0.333: { target: targetStrategies.Closest },
            0.666: { target: targetStrategies.Random },
            1.000: { target: targetStrategies.Farthest },
        }); },
//BONUS BASELINE

//BONUS ATTACKS
//Bonus attack or damage bonus
    attack2: function () { if(DFlag.lateGameSpeedTest) return {attack: allAttackTypes.DOT};
        return choose(
        {
            //0.760: { damage: 10 },
            0.800: { attack: allAttackTypes.Laser },
            0.840: { attack: allAttackTypes.Bullet },
            0.880: { attack: allAttackTypes.Chain },
            0.920: { attack: allAttackTypes.Pulse },
            0.960: { attack: allAttackTypes.DOT },
            1.000: { attack: allAttackTypes.Slow },
        }); },
//Bonus attack or attack speed bonus
    attack3: function () { if(DFlag.lateGameSpeedTest) return {attack: allAttackTypes.DOT};
        return choose(
        {
            //0.800: { attSpeed: 2 },
            0.840: { attack: allAttackTypes.Bullet },
            0.880: { attack: allAttackTypes.Chain },
            0.920: { attack: allAttackTypes.Pulse },
            0.960: { attack: allAttackTypes.DOT },
            1.000: { attack: allAttackTypes.Slow },
        }); },
//BONUS ATTACKS

//ATTRIBUTE SPECIALIZATIONS (these give the tower unique
//tradeoffs which should make it a distinct tower type (like high damage low attack speed)
    specization1: function () { return choose(
        {
            //Hard to kill
            0.25: { hpRegen: 50, maxHp: 200, damage: -13, attSpeed: -1 },
            //Gene spreader
            0.50: { upload: 50, download: -4, range: -80 },
            //Pew pew pew
            0.75: { attSpeed: 2, damage: -13},
            //Boom
            1.00: { attSpeed: -1, damage: 13},
        }); },
    specization2: function () { return choose(
        {
            //Nothing
            0.80: { range: 1 },
            //Germ
            0.85: { hpRegen: 50, maxHp: -100},
            //Why!?
            0.90: { attSpeed: -1, damage: -13, range: 200 },
            //Fatty
            0.95: { hpRegen: -50, maxHp: 1000},
            //Super-charge (not sure if this will work?)
            1.00: { hp: 1000},
        }); },
//ATTRIBUTE SPECIALIZATIONS

//SCARCE MEDIUM BONUS
    rangeMediumBonus: function () { return choose(
        {
            0.5: { },
            0.7: { range: 50 },
            0.9: { range: 70 },
            1: { range: 150 },
        }); },

    damageMediumBonus: function () { return choose(
        {
            0.5: { },
            0.7: { damage: 5 },
            0.9: { damage: 7 },
            1: { damage: 15 },
        }); },

    hpMediumBonus: function () { return choose(
        {
            0.5: { },
            0.7: { maxHp: 50 },
            0.9: { maxHp: 70 },
            1: { maxHp: 150 },
        }); },

    hpRegenMediumBonus: function () { return choose(
        {
            0.5: { },
            0.7: { hpRegen: 5 },
            0.9: { hpRegen: 7 },
            1: { hpRegen: 15 },
        }); },

    attSpeedMediumBonus: function () { return choose(
        {
            0.5: { },
            0.7: { attSpeed: 0.2 },
            0.9: { attSpeed: 0.3 },
            1: { attSpeed: 0.5 },
        }); },
//SCARCE MEDIUM BONUS

//RARE SUPER BONUS
    rangeSuperBonus: function () { return choose(
        {
            0.5: { },
            0.7: { range: 50 },
            0.9: { range: 70 },
            1: { range: 150 },
        }); },

    damageSuperBonus: function () { return choose(
        {
            0.9: { },
            1: { damage: 30 },
        }); },

    hpSuperBonus: function () { return choose(
        {
            0.9: { },
            1: { maxHp: 250 },
        }); },

    hpRegenSuperBonus: function () { return choose(
        {
            0.9: { },
            1: { hpRegen: 25 },
        }); },

    attSpeedSuperBonus: function () { return choose(
        {
            0.9: { },
            1: { attSpeed: 3.5 },
        }); },
//RARE SUPER BONUS
};

//All alleles must be balanced, they either specialize in one of many aspects or are a tradeoff
var TowerAlleles =
{
    rangeBase: function () { return {range: Math.floor(random(250, 260))}; },
    damageBase: function () { return choose(
        {
            0.5: { damage: 1 },
            0.7: { damage: 1.3 },
            1: { damage: 1.5 },
        }); },
    hpBase: function () { return choose(
        {
            0.5: { maxHp: 100 },
            0.7: { maxHp: 130 },
            1: { maxHp: 150 },
        }); },
    hpRegenBase: function () { return choose(
        {
            0.5: { hpRegen: 1.0 },
            0.7: { hpRegen: 1.3 },
            1: { hpRegen: 1.5 },
        }); },
    attSpeedBase: function () { return {attSpeed: round(random(0.9, 1.1), 1)}; },

    //Specializations:

    //Spec group 1:


    spec1: function () { return pickRandom(
        [
            { maxHp: 100, hpRegen: 1, range: -50 }, //Bruiser part 1
            { maxHp: 200, hpRegen: 2, damage: -0.8 }, //Bruiser part 2
            { damage: -0.5, attSpeed: 1 }, //Pew pew
            { damage: 10, attSpeed: -0.85 }, //BOOM!
        ]); },


};

var BugAlleles =
{
    rangeBase: function () { return choose(
        {
            0.5: { range: 250 },
            0.7: { range: 270 },
            1: { range: 290 },
        }); },
    damageBase: function () { return choose(
        {
            0.5: { damage: 0.4 },
            0.7: { damage: 0.6 },
            1: { damage: 1.0 },
        }); },
    hpBase: function () { return {maxHp: Math.floor(random(8, 15))}; },
    attSpeedBase: function () { return choose(
        {
            0.5: { attSpeed: 0.5 },
            0.7: { attSpeed: 0.75 },
            1: { attSpeed: 1 },
        }); },
    movementSpeedBase: function () { return choose(
        {
            0.5: { speed: 15 },
            0.7: { speed: 20 },
            1: { speed: 25 },
        }); },

};
