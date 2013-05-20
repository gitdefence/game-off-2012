Infobar.InfobarClass = function InfobarClass() {
    var self = this;
    self.base = new BaseObj(self, 14);
    self.tpos = new Rect(0, 0, 1, 1);

    var selectSomethingPrompt = new Label();

    var allelePoints = new AllelePointSystem();
    var ourLayout = new VBox();
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

        ourLayout.add(attributeVBox);
        ourLayout.add(allelePoints, 220);

        updateDisplay();
    };

    function redoObjLayout(obj) {
        //Don't set the obj to null, set noDisplayObject and then call updateDisplay.
        //This is much more efficient.
        if (!assertValid(obj)) {
            return;
        }

        attributeVBox.clear();

        attrInfos = new Infobar.AttributeInfos(obj, null);
        attributeVBox.add(new PaddingControl(attrInfos)
                                    .constantBuffer(new Rect(0, 0, 0, 10)));

        targetStrats = new Infobar.NestedObjsVisual({ targetBase: obj.attr.targetStrategy }, "Target Strategy", "target");
        attributeVBox.add(new PaddingControl(targetStrats)
                                    .constantBuffer(new Rect(0, 10, 0, 10)));

        attackObjsVisual = new Infobar.NestedObjsVisual(obj.attr.attackObjs, "Attack Types", "attack");
        attributeVBox.add(new PaddingControl(attackObjsVisual)
                                    .constantBuffer(new Rect(0, 10, 0, 10)));

        self.updateDeltaAllele(obj);

        self.base.dirtyLayout();
    }

    self.resize = function (rect) {
        ourLayout.resize(rect);
        selectSomethingPrompt.resize(rect);
        self.tpos = rect;
    }

    var selectedObject = null;
    function updateDisplay() {
        self.base.removeAllChildren();

        if (selectedObject) {
            self.base.addChild(ourLayout);
        } else {
            self.base.addChild(selectSomethingPrompt);
        }

        self.base.dirtyLayout();
    }

    self.updateDisplayObj = function (newObj) {
        if (newObj == null) {
            //This is an optimization, it allows us to almost never have to
            //actually redo our layout.
            selectedObject = null;
            updateDisplay();
            return;
        }

        selectedObject = newObj;

        if (prevObj && getRealType(newObj) == getRealType(prevObj)) {
            //If its the same type, we can just update the attributes.
            prevObj = newObj;

            //Tell all our children they need to display different stuff,
            //its up to them to do this fast or slowly...
            attrInfos.updateObject(newObj);
            attackObjsVisual.updateAttackObjs(newObj.attr.attackObjs);
            targetStrats.updateAttackObjs({ targetBase: newObj.attr.targetStrategy });

            self.updateDeltaAllele(newObj);
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
        targetStrats.updateAttackObjs({ targetBase: prevObj.attr.targetStrategy });

        //Our attributes number on the otherhand cannot change, so we can just update them
        attrInfos.updateAllAttributes();

        //This is unfortunate, it would be nice if we didn't need to relayout attrInfos,
        //but its size may depend on attackObjsVisual targetStrats 
        self.base.dirtyLayout();
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

        //This is unfortunate, it would be nice if we didn't need to relayout attrInfos,
        //but its size may depend on attackObjsVisual targetStrats 
        self.base.dirtyLayout();
    }
}
