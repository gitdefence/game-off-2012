function GitDefence(pos) {
    var engine = new Engine(pos, this);
    this.engine = engine;

    this.numTilesX = 16;
    this.numTilesY = 16;
    this.tileSize = 32;

    this.id = 0; //Shouldn't be needed (ids are in base)
    this.currentCost = 100;
    this.money = 1600; //Default to a much more reasonable value.
    if (DFlag.lotsamoney) {
        this.money = 10000;
    }
    this.health = 100;

    this.lastTowerHover = null;


    var hbox = new HBox();
    engine.base.addChild(hbox);

    this.towerbar = new Towerbar();
    hbox.add(this.towerbar, 64);

    var vbox = new VBox();
    hbox.add(vbox);
    this.gameInfoBar = new GameInfoBar();
    vbox.add(this.gameInfoBar, 32);
    this.gameBoard = new GameBoard(this);
    vbox.add(this.gameBoard);

    this.infobar = new Infobar();
    hbox.add(this.infobar, 200);

    var flowLayout = new FlowLayout();
    //hbox.add(flowLayout, 200);
    flowLayout.add(new Label().text("Testing"));
    flowLayout.add(new Label().text("The"));
    flowLayout.add(new Label().text("FlowLayout!"));
    for (var i = 0; i < 50; i++) {
        var hbox2 = new HBox();
        hbox2.add(new Label().text("Row " + i).align('left'));
        hbox2.add(new Button("Testing"));
        flowLayout.add(hbox2);
    }

    hbox.resize(pos);

    engine.globalResize = function (ev) {
        console.log("gitDefence globalResize", ev);
        hbox.resize(new Rect(0, 0, ev.width, ev.height));
    }

    this.globalSelectionChanged = {};

    var bugStart = getAnElement(this.engine.base.allChildren["Path_Start"]);

    this.lvMan = new LevelManager(bugStart);
    engine.base.addChild(this.lvMan);

    this.input = new InputHandler();
    var input = this.input;
    // We need to resize right away (shouldn't really have to... but we do)
    this.input.resizeEvent = pos;

    var selection = null;

    this.run = function (timestamp) {
        var eng = this.engine;
        eng.run(timestamp);

        this.input.handleEvents(eng);
    };

    this.draw = function (pen) {
        engine.base.draw(pen);

        if (selection) {
            pen.strokeStyle = selection.color;
            pen.fillStyle = "transparent";
            pen.lineWidth = 2;
            var p = selection.tpos.center();
            ink.circ(p.x, p.y, selection.attr.range, pen);
        }

        if (DFlag.quadtree.draw) {
            var hue = 0;
            for (var type in engine.base.allChildren) {
                pen.strokeStyle = hsla(hue, 50, 50, 0.5).str();
                drawTree(engine, type, pen);
                hue += 20;
            }
        }

        var hue = 0;
        function shadeBoxesRecursive(boxes, alpha) {
            for (var childKey in boxes) {
                var child = boxes[childKey];
                if (child.tpos) {
                    DRAW.rect(pen, child.tpos, hsla(hue, 50, 50, alpha).str());
                    hue += 20;
                }
                for (var type in child.base.children) {
                    shadeBoxesRecursive(child.base.children[type], alpha * 1.2);
                }
            }
        }
        if (DFlag.quadtree.shadeBoxes) {
            for (var type in engine.base.children) {
                shadeBoxesRecursive(engine.base.children[type], 0.05);
            }
        }
    }

    this.selection = function () {
        return selection;
    }

    this.select = function (object) {
        if (object && object.attr) {
            selection = object;
            this.infobar.redoObjLayout(selection);
        } else {
            this.unselect(selection);
        }
    }

    this.unselect = function (object) {
        if (object !== selection) return;
        selection = null;

        this.infobar.redoObjLayout(selection);
    }
}
