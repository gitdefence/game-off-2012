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
    var attributeVBox = new VBox();

    var hover = false;

    //Add our buttons, should really be done just in the constructor with our given pos information
    //Added should be where everything is initialized. Objects must be declared in the class scope though,
    //and to reduce the chance of crashes they are constructed there also. 
    //However, they should be initialized in added.
    self.added = function () {
        selectSomethingPrompt.setTextType(new Text().maxFontSize(20).lineSpacing(1.5).text(
            "Click on a bug or tower to display its information here."));

        outerVBox.add(attributeVBox);
        outerVBox.add(allelePoints, 220);

        updateDisplay();
    };

    self.resize = function (rect) {
        outerVBox.resize(rect);
        selectSomethingPrompt.resize(rect);
        self.tpos = rect;
    }

    function updateDisplay() {
        self.base.removeAllChildren();

        if (self.obj) {
            self.base.addChild(outerVBox);
        } else {
            self.base.addChild(selectSomethingPrompt);
        }
    }

    self.obj = null;
    self.updateAttr = function (obj) {
        self.obj = obj;

        if (self.obj) {
            attributeVBox.clear();

            var topAllele = null;
            if (hover) {
                topAllele = obj.allelesGenerated && obj.allelesGenerated[0];
            }

            /*
            for (var attr in obj.attr) {
                if (attr == "targetStrategy" || attr == "attackTypes") continue;

                attributeVBox.add(new AttributeInfo(obj, attr, topAllele), 30);
            }
            */

            var attrInfos = new AttributeInfos(obj, topAllele);
            attributeVBox.add(attrInfos, attrInfos.optimalHeight());

            var targetStrats = new TargetStrategiesVisual(obj, topAllele);
            attributeVBox.add(targetStrats, targetStrats.optimalHeight());
            attributeVBox.add(new AttackTypesVisual(obj, topAllele));

            attributeVBox.resize(self.tpos);
        }

        updateDisplay();
    }

    self.update = function () {
        //self.updateAttr(self.obj);
    }

    self.mousemove = function () {
        if (!hover) {
            hover = true;
            self.updateAttr(self.obj);
        }
    }

    self.mouseout = function () {
        if (hover) {
            hover = false;
            self.updateAttr(self.obj);
        }
    }

    self.sellTower = function() {
        self.obj.base.destroySelf();
    }
}
