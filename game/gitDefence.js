﻿function GitDefence(pos) {
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

        lastDitchErrorCheck(this.input.handleEvents.bind(this.input, eng), function (error) {
            //Wipe all input, and reset the screen
            this.input = new InputHandler();
            input = this.input;

            this.screenSystem.resetActiveScreen();
        }.bind(this), LAST_DITCH_ATTEMPT_RECOVERY);
    };

    this.draw = function (pen) {
        engine.base.draw(pen);

        //If this code expands seriously consider moving it to a real object.
        var drawSelection = function () {
            if (!selection) return;

            pen.strokeStyle = selection.color;
            pen.fillStyle = "transparent";
            pen.lineWidth = 2;
            var p = selection.tpos.center();
            ink.circ(p.x, p.y, selection.attr.range, pen);
        };

        //Exceptions do need to be handled here though, in my singular test case this specific code crashed,
        //so it can happen and there is no reason to believe it is any safer than any other code.
        lastDitchErrorCheck(drawSelection, function (error) {
            //If we fail, just clear the selection, this will prevent us from being run anyway!
            selection = null;
        }, LAST_DITCH_ATTEMPT_RECOVERY);
    }

    this.selection = function () {
        return selection;
    }

    this.select = function (object) {
        if (object && object.attr) {
            selection = object;
            this.infobar.updateAttr(object);
        } else {
            this.unselect(selection);
        }
    }

    this.unselect = function (object) {
        if (object !== selection) return;

        selection = null;
        this.infobar.clearDisplay();
    }
}
