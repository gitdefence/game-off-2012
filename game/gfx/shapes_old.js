function SLine(start, end, color, zorder, arrowHeadPercents) {
    //We do not maintain box!
    this.tpos = new Rect(start.x, start.y, end.x - start.x, end.y - start.y, 0, 0);
    this.base = new BaseObj(this, zorder, true);
    
    this.start = start;
    this.end = end;
    
    //Positions on line we add arrow heads.
    this.arrowHeadPercents = arrowHeadPercents;
    
    this.color = color;
    
    this.draw = function (pen) {
        pen.strokeStyle = this.color;
        pen.lineWidth = 2;
        
        if (!this.color)
            fail("should not happen.");
        
        var s = this.start;
        var e = this.end;
        
        ink.line(s.x, s.y, e.x, e.y, pen);
        
        for (var key in this.arrowHeadPercents) {
            var percent = this.arrowHeadPercents[key];
            
            var result = new Vector(s.x, s.y);
            var delta = new Vector(e.x, e.y);
            delta.sub(s);
            delta.mult(percent);
            result.add(delta);
            
            ink.arrowHead(s.x, s.y, result.x, result.y, pen);
        }
    };
}

function SCircle(center, radius, color, fillColor, zorder) {    
    this.radius = radius;
    this.color = color;
    this.fillColor = fillColor;

    this.tpos = new Rect(center.x - this.radius / 2, center.y - this.radius / 2, this.radius, this.radius);
    
    this.base = new BaseObj(this, zorder, true);

    this.lineWidth = 2;

    this.draw = function (pen) {
        var radius = this.radius;

        DRAW.circle(pen, this.tpos.center(), this.radius,
            this.fillColor, this.lineWidth, this.color);
    };
}

function AlphaDecay(lifetime, startAlpha, endAlpha) {
    this.base = new BaseObj(this);
    
    this.lifetime = lifetime;
    this.startAlpha = startAlpha;
    this.endAlpha = endAlpha;

    this.currentTime = 0;

    if (!assertValid(lifetime) || lifetime == 0) {
        lifetime = 1;
    }
    
    this.update = function (dt) {
        this.currentTime += dt;
        
        var currentAlpha = startAlpha + (endAlpha - startAlpha) * (this.currentTime / this.lifetime);
        
        this.base.parent.color = setAlpha(this.base.parent.color, currentAlpha);
        
        if (this.currentTime > this.lifetime) {
            this.base.parent.base.destroySelf();
        }
    }
}
