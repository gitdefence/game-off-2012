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
    var prevObj = null;
    var attackObjsVisual = null;
    var targetStrats = null;

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

        updateDisplay();
    };

    //This takes an object so we can do the layout once for an object, and then
    //not have to do it again when displaying the same object.
    function redoObjLayout(obj) {
        //Don't set the obj to null, set noDisplayObject and then call updateDisplay.
        //This is much more efficient.
        if (!assertDefined(obj)) {
            return;
        }

        attributeVBox.clear();

        attrInfos = new AttributeInfos(obj, null);
        attributeVBox.add(new PaddingControl(
                                    attrInfos,
                                    new Rect(0, 0, 0, 10),
                                    new Rect(0, 0, 0, 0)
                                ));

        targetStrats = new NestedObjsVisual({target: obj.attr.targetStrategy}, "Target Strategy", "target");
        attributeVBox.add(new PaddingControl(
                                    targetStrats,
                                    new Rect(0, 10, 0, 10),
                                    new Rect(0, 0, 0, 0)
                                ));

        attackObjsVisual = new NestedObjsVisual(obj.attr.attackObjs, "Attack Types", "attack");
        attributeVBox.add(new PaddingControl(
                                    attackObjsVisual,
                                    new Rect(0, 10, 0, 10),
                                    new Rect(0, 0, 0, 0)
                                ));

        self.resize(self.tpos);

        self.updateDeltaAllele(obj);
    }

    self.resize = function (rect) {
        outerVBox.resize(rect);
        selectSomethingPrompt.resize(rect);
        self.tpos = rect;
    }

    var noDisplayObject = true;
    function updateDisplay() {
        self.base.removeAllChildren();

        if (!noDisplayObject) {
            self.base.addChild(outerVBox);
        } else {
            self.base.addChild(selectSomethingPrompt);
        }

        //Causes the underlying layout to be redone.
        if (self.tpos) {
            self.resize(self.tpos);
        }
    }

    self.updateDisplayObj = function (newObj) {
        if (newObj == null) {
            //This is an optimization, it allows us to almost never have to
            //actually redo our layout.
            noDisplayObject = true;
            updateDisplay();
            return;
        }

        noDisplayObject = false;

        if (prevObj && getRealType(newObj) == getRealType(prevObj)) {
            //If its the same type, we can just update the attributes.
            prevObj = newObj;

            //Tell all our children they need to display different stuff,
            //its up to them to do this fast or slowly...
            attrInfos.updateObject(newObj);
            attackObjsVisual.updateAttackObjs(newObj.attr.attackObjs);
            targetStrats.updateAttackObjs({ target: newObj.attr.targetStrategy });
        } else {
            prevObj = newObj;
            redoObjLayout(newObj);
        }

        updateDisplay();
    }

    //This happens a lot, so we don't want to do the expensive layout.
    self.updateAttribute = function (attrName) {
        if (!attrInfos) return;

        attrInfos.updateAttribute(attrName);
    }

    self.updateAllAttributes = function () {
        if (!attrInfos) return;

        //Our attackObjs or targeting strategy may have a different quantity of objects,
        //so we cannot just update them.
        attackObjsVisual.updateAttackObjs(prevObj.attr.attackObjs);
        targetStrats.updateAttackObjs({ target: prevObj.attr.targetStrategy });

        //Our attributes number on the otherhand cannot change, so we can just update them
        attrInfos.updateAllAttributes();

        self.resize(self.tpos);
    }

    //Called from allelePointSystem, and from us.
    self.updateDeltaAllele = function (newObj) {
        //If newObj == null then it means we are clearing the delta display.
        if (!(prevObj == newObj || newObj == null)) {
            fail("Call redoObjLayout if you want to redo the layout!");
        }

        if (!attrInfos) return;

        var deltaAllele = newObj && newObj.allelesGenerated && newObj.allelesGenerated[0];

        attrInfos.updateDeltaAllele(deltaAllele);
        attackObjsVisual.updateDeltaAllele(deltaAllele);
        targetStrats.updateDeltaAllele(deltaAllele);

        self.resize(self.tpos);
    }
}
