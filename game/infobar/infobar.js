function Infobar(pos) {
    var self = this;
    self.base = new BaseObj(self, 14);

    self.tpos = pos;

    var buttonW = 100;

    //For each displayed item gives extra info to be displayed in brackets)
    self.extraInfo = {};

    var selectSomethingPrompt = new Label();

    var allelePoints = new AllelePointSystem();
    var outerVBox = new VBox();
    var attributeVBox = new FlowLayout();

    var attrInfos = null;
    var obj = null;
    var attackObjsVisual = null;

    var hover = false;

    //Add our buttons, should really be done just in the constructor with our given pos information
    //Added should be where everything is initialized. Objects must be declared in the class scope though,
    //and to reduce the chance of crashes they are constructed there also. 
    //However, they should be initialized in added.
    self.added = function () {
        selectSomethingPrompt.maxFontSize(20).lineSpacing(1.5).text(
            "Click on a bug or tower to display its information here.");

        outerVBox.add(attributeVBox);
        outerVBox.add(allelePoints, 220);
    };

    //Sets the current obj to obj, and redoes the layout for the object.
    self.redoObjLayout = function (newObj) {
        obj = newObj;

        if (obj) {
            attributeVBox.clear();

            attrInfos = new AttributeInfos(obj, null);
            attributeVBox.add(attrInfos);

            var targetStrats = new TargetStrategiesVisual(obj, null);
            attributeVBox.add(targetStrats);

            attackObjsVisual = new AttackObjsVisual(obj, null);
            attributeVBox.add(attackObjsVisual);
        }

        updateDisplay();

        self.updateDeltaAllele(obj);
    }

    self.resize = function (rect) {
        outerVBox.resize(rect);
        selectSomethingPrompt.resize(rect);
        self.tpos = rect;
    }

    function updateDisplay() {
        self.base.removeAllChildren();

        if (obj) {
            self.base.addChild(outerVBox);
        } else {
            self.base.addChild(selectSomethingPrompt);
        }

        //Causes the underlying layout to be redone.
        self.resize(self.tpos);
    }

    //This happens a lot, so we don't want to do the expensive layout.
    self.updateAttribute = function (attrName) {
        if (!attrInfos) return;

        attrInfos.updateAttribute(attrName);
    }

    self.updateAllAttributes = function () {
        if (!attrInfos) return;

        attrInfos.updateAllAttributes();
        attackObjsVisual.updateAttackInfo();

        self.resize(self.tpos);
    }

    //Called from allelePointSystem, and from us.
    self.updateDeltaAllele = function (newObj) {
        //If newObj == null then it means we are clearing the delta display.
        if (!(obj == newObj || newObj == null)) {
            fail("Call redoObjLayout if you want to redo the layout!");
        }

        if (!attrInfos) return;

        var deltaAllele = newObj && newObj.allelesGenerated && newObj.allelesGenerated[0];

        attrInfos.updateDeltaAllele(deltaAllele);
        attackObjsVisual.updateDeltaAllele(deltaAllele);

        self.resize(self.tpos);
    }

    self.mousemove = function () {
        if (!hover) return;

        hover = true;
        self.updateDeltaAllele(obj);
    }

    self.mouseout = function () {
        if (!hover) return;

        hover = false;
        self.updateDeltaAllele(obj);
    }

    self.sellTower = function() {
        obj.base.destroySelf();
    }
}
