function Path_End(x, y, w, h) {
    var self = this;
    self.tpos = new Rect(x, y, w, h);
    self.base = new BaseObj(self, 2);

    self.setNextPath = function (nextPath) {
        self.nextPath = nextPath;
    }

    self.bugMovementTarget = function () {
        return self.tpos.center();
    }

    self.drawToGameboard = function (pen) {
        var p = self.tpos;
        pen.fillStyle = "grey";
        pen.strokeStyle = "lightgreen";
        ink.rect(p.x, p.y, p.w, p.h, pen);
    };
}

function Path_Start(x, y, w, h) {
    var self = this;
    self.tpos = new Rect(x, y, w, h);
    self.base = new BaseObj(self, 2);

    self.setNextPath = function (nextPath) {
        self.nextPath = nextPath;
    }

    self.bugMovementTarget = function () {
        return self.tpos.center();
    }

    self.drawToGameboard = function (pen) {
        var p = self.tpos;
        pen.fillStyle = "yellow";
        pen.strokeStyle = "lightgreen";
        ink.rect(p.x, p.y, p.w, p.h, pen);
    };
}

function Path_Piece(x, y, w, h) {
    var self = this;
    self.tpos = new Rect(x, y, w, h);
    self.base = new BaseObj(self, 3);

    self.setNextPath = function (nextPath) {
        self.nextPath = nextPath;
    }

    self.bugMovementTarget = function () {
        return self.tpos.origin();
    }

    self.drawToGameboard = function (pen) {
        if (!self.nextPath) return;

        //Unfortunately we do not reflect our w or h in our drawing...
        //hopefully they line up with our relation to our next path or
        //else collision detection with towers will be off.
        var start = self.bugMovementTarget();
        var end = self.nextPath.bugMovementTarget();

        pen.strokeStyle = "blue";
        pen.lineWidth = 2;
        ink.arrow(start.x, start.y, end.x, end.y, pen);
    }
}
