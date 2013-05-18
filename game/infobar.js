//Gives a visual representation for how alleles impact various attributes.
function AlleleVisual(obj, attrName) {
    var self = this;

    this.base = new BaseObj(self, 11);
    this.tpos = new Rect(0, 0, 0, 0);

    var attrChanges = [];

    for (var key in obj.genes.alleles) {
        var allele = obj.genes.alleles[key];
        for (var key in allele.delta) {
            if (key == attrName) {
                var impact = allele.delta[key];
                attrChanges.push(impact);
            }
        }
    }

    self.resize = function (rect) {
        this.tpos = rect;
    }

    self.redraw = function (canvas) {
        var pen = canvas.ctx();

        var boxWidth = 1;

        var x = boxWidth;
        var y = boxWidth;
        var w = 0;
        var h = this.tpos.h - boxWidth * 2;

        for (var ix = 0; ix < attrChanges.length; ix++) {
            w = Math.log(Math.abs(attrChanges[ix])) * 5;
            DRAW.rect(pen, new Rect(x, y, w, h),
                           attrChanges[ix] >= 0 ? "Green" : "Red",
                           boxWidth,
                           "White");
            x += w;
        }
    }
}

/*
for (var key in obj.genes.alleles) {
    var allele = obj.genes.alleles[key];
    for (var key in allele.delta) {
        if (key == name) {
            var impact = allele.delta[key];
            if (impact < 0)
                startX += addBarPart(impact) * (impact < 0 ? -1 : 1);
        }
    }
}

var direction = val < 0 ? -1 : +1;
    var curWidth = (Math.log(Math.abs(val) / baseStat + 2)) *
    factor * direction;
    */

function AttributeInfo(attrHolder, attrName) {
    var self = this;
    self.base = new BaseObj(self, 10);

    var infoParts = new HBox();

    var attrNameLabel = new Label(attrName).align("left");
    var alleleInfo = new AlleleVisual(attrHolder, attrName);
    var attrValueLabel = new Label(attrHolder.attr[attrName]);

    self.added = function () {
        self.base.addChild(infoParts);

        infoParts.add(attrNameLabel);
        infoParts.add(alleleInfo);
        infoParts.add(attrValueLabel);
    }

    self.resize = function (rect) {
        this.tpos = rect;
        infoParts.resize(rect);
    }
}

function Infobar(pos) {
    this.base = new BaseObj(this, 14);
    this.tattr = null;

    this.tpos = pos;

    var buttonW = 100;

    //For each displayed item gives extra info to be displayed in brackets)
    this.extraInfo = {};

    var allelePoints = new AllelePointSystem();
    var outerVBox = new VBox();
    var attributeHBox = new HBox();
    var attributeVBox = new VBox();

    //Add our buttons, should really be done just in the constructor with our given pos information
    this.added = function () {
        this.clearDisplay();

        this.base.addChild(outerVBox);

        outerVBox.add(attributeHBox);
        outerVBox.add(allelePoints, 220);

        attributeHBox.add(attributeVBox);
    };

    this.resize = function (rect) {
        outerVBox.resize(rect);
        this.tpos = rect;
        //this.allelePoints.resize(new Rect(rect.x, rect.y + rect.h - 200, rect.w, 190));
    }

    this.obj = null;
    this.updateAttr = function (obj) {
        this.base.setAttributeRecursive("hidden", false);

        this.obj = obj;

        attributeVBox.clear();

        for (var attr in obj.attr) {
            attributeVBox.add(new AttributeInfo(obj, attr), 30);
        }

        attributeVBox.resize(this.tpos);

        return;
    }

    this.clearDisplay = function () {
        this.base.setAttributeRecursive("hidden", true);
    }

    /*
    this.draw = function (pen) {
        pen.fillStyle = "green";
        pen.font = "15px courier";

        var xs = this.tpos.x + 10;
        var xe = this.tpos.x + this.tpos.w - 10;
        var y = this.tpos.y + 15;

        if (!this.obj || !this.obj.attr) {
            ink.text(xs, y, "[no selection]", pen);
            return;
        }

        ink.text(xs, y, formatToDisplay(getRealType(this.obj)), pen);
        var yPos = y + 20;
        var xPos = xs;

        var ourWidth = xe - xs;

        var baseStats = getRealType(this.obj) == "Tower" ? TowerStats : TowerStats;

        var obj = this.obj;

        pen.font = "10px courier";

        var extraInfo = this.extraInfo;
        var extraInfoDisplayed = {};

        function displayAttributes(attrs) {
            // Good fucking luck figuring out how this works!
            for (var attrName in attrs) {
                var value = attrs[attrName];

                var arrayAttr = value;
                if (getRealType(arrayAttr) != "Array") {
                    arrayAttr = [];
                    arrayAttr.push(value);
                }

                pen.color = "Green";
                pen.fillStyle = "Transparent";
                //ink.rect(xs, y, (xe - xs), 15, pen);

                // Baby go down down down down dowwwwwn
                for (var key in arrayAttr) {
                    var val = arrayAttr[key];
                    function tryPrintAsNumber(val, name, extraInfo) {
                        if (typeof val != "number")
                            return false;

                        var valtxt = prefixNumber(val, 1);
                        if (defined(extraInfo[name])) {
                            valtxt = "(" + round(extraInfo[name], 3) + ") " + valtxt;
                            extraInfoDisplayed[name] = true;
                        }

                        var nametxt = formatToDisplay(name);

                        var baseStat = baseStats[name];

                        // We need to go deeper!
                        if (defined(baseStat)) {
                            pen.color = "White";
                            pen.fillStyle = "Purple";
                            var startX = xPos - 3;
                            var startY = yPos - 10;
                            var totalWidth = ourWidth + 6;
                            var totalHeight = 15;
                            var totalStat = Math.max(baseStat, 0);
                            var factor = 1 * totalWidth * 0.5 / 10;
                            startX += totalWidth * 0.5;

                            function addBarPart(val) {
                                var direction = val < 0 ? -1 : +1;
                                var curWidth = (Math.log(Math.abs(val) / baseStat + 2)) *
                                factor * direction;
                                if (val > 0) {
                                    pen.fillStyle = "Green";
                                    ink.rect(startX, startY, curWidth, totalHeight * 0.5, pen);
                                }
                                else {
                                    pen.fillStyle = "Red";
                                    ink.rect(startX, startY + totalHeight * 0.5, curWidth,
                                    totalHeight * 0.5, pen);
                                }
                                return curWidth;
                            }

                            //addBarPart(val - baseStat);
                            for (var key in obj.genes.alleles) {
                                var allele = obj.genes.alleles[key];
                                // His subconcious is fighting us! They have an army!
                                for (var key in allele.delta) {
                                    if (key == name) {
                                        var impact = allele.delta[key];
                                        // I'm sorry, you're stuck here forever now. This is the point of no return...
                                        if (impact > 0)
                                            startX += addBarPart(impact) * (impact < 0 ? -1 : 1);
                                    }
                                }
                            }
                            startX -= 2;
                            for (var key in obj.genes.alleles) {
                                var allele = obj.genes.alleles[key];
                                for (var key in allele.delta) {
                                    if (key == name) {
                                        var impact = allele.delta[key];
                                        if (impact < 0)
                                            startX += addBarPart(impact) * (impact < 0 ? -1 : 1);
                                    }
                                }
                            }
                        }

                        pen.color = "Green";
                        pen.fillStyle = "White";
                        pen.textAlign = 'left';
                        ink.text(xPos, yPos, nametxt, pen);
                        pen.textAlign = 'right';
                        ink.text(xe, yPos, valtxt, pen);
                        yPos += 15;
                        return true;
                    }

                    if (!tryPrintAsNumber(val, attrName, extraInfo)) {
                        yPos += 5;

                        var nameText = formatToDisplay(getRealType(val));

                        var subExtraInfo = {};
                        if (defined(extraInfo[nameText]) && !extraInfoDisplayed[nameText]) {
                            subExtraInfo = extraInfo[nameText];
                            extraInfoDisplayed[nameText] = true;
                            nameText = "(" + extraInfo[nameText].added + ") " + nameText;
                        }

                        pen.color = "Green";
                        pen.fillStyle = "Green";
                        pen.textAlign = 'center';
                        pen.font = "14px courier";
                        ink.text((xs + xe) / 2, yPos, nameText, pen);
                        pen.font = "10px courier";
                        yPos += 20;
                        for (var subAttr in val) {
                            tryPrintAsNumber(val[subAttr], subAttr, subExtraInfo);
                        }
                    }
                } //End of looping through arrays within attributes

            } //End of attribute loop
        } //End of display attribute function

        displayAttributes(this.obj.attr);

        //var extraInfo = this.extraInfo;
        //var extraInfoDisplayed = {};

        var undisplayedExtra = {};

        for (var key in extraInfo) {
            if (!extraInfoDisplayed[key])
                undisplayedExtra[key] = new extraInfo[key]();
        }

        displayAttributes(undisplayedExtra);
    }
    //End of draw
    */

    this.sellTower = function() {
        this.obj.base.destroySelf();
    }
}
