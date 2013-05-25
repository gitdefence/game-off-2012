//Saves some code with some simple verification. Not really that useful.
function setStrokeAndColor(pen, borderWidth, borderColor) {
    if(borderWidth) {
        pen.lineWidth = borderWidth;
        pen.strokeStyle = borderColor;
    }
    else {
        borderWidth = 0;
        pen.lineWidth = 0;
        pen.strokeStyle = "transparent";
    }
    
    return borderWidth;
}

DRAW = {
    circle: function(pen, centerPos, r, insideColor, borderWidth, borderColor) {
        DRAW.arc(pen, centerPos, r, 0, Math.PI * 2, insideColor, borderWidth, borderColor);
    },
    arcRect: function(pen, rect, insideColor, borderWidth, borderColor) {
        var centerPos = new Vector(rect.x + rect.w/2, rect.y + rect.h/2);
        var r = rect.w/2 + rect.h/2; //Hmm... maybe not best
        DRAW.arc(pen, centerPos, r, 0, Math.PI * 2, insideColor, borderWidth, borderColor);
    },
    arc: function(pen, centerPos, r, angleStart, angleEnd, insideColor, borderWidth, borderColor) {
        borderWidth = borderWidth || 0;

        //Fix for Quentin's chrome. Tried uninstalling, 
        //reinstalling grpahics drivers, etc. This is the only
        //thing I could fix.
        borderWidth = Math.min(borderWidth, 0.99);

        //This insures it is defined, and sets some useful stuff.
        //Not need for us specifically, but every other function in this file
        //uses it, so we maintain consistency.
        borderWidth = setStrokeAndColor(pen, borderWidth, borderColor);

        pen.beginPath();
        pen.arc(centerPos.x, centerPos.y, Math.abs(r - borderWidth), angleStart, angleEnd, false);
        if(pen.strokeStyle != "transparent") {
            pen.stroke();
        }
        if(insideColor != "transparent") {
            pen.fillStyle = insideColor;
            pen.fill();
        }
    },
    piePiece: function(pen, centerPos, r, angleStart, angleEnd, insideColor, borderWidth, borderColor) {
        borderWidth = setStrokeAndColor(pen, borderWidth, borderColor);
        
        pen.fillStyle = insideColor;
        
        pen.beginPath();
        pen.arc(centerPos.x, centerPos.y, r, angleStart, angleEnd, false);
        pen.lineTo(centerPos.x, centerPos.y);
        pen.closePath();
        pen.fill();
        pen.stroke();
    },
    rect: function(pen, rect, insideColor, borderWidth, borderColor) {
        borderWidth = setStrokeAndColor(pen, borderWidth, borderColor);
        
        pen.fillStyle = insideColor;
        
        pen.beginPath();
        pen.rect(rect.x + borderWidth / 2, rect.y + borderWidth / 2,
                 rect.w - borderWidth, rect.h - borderWidth);
        pen.fill();
        pen.stroke();
    },
    line: function(pen, startVector, endVector, lineColor, lineWidth) {
        setStrokeAndColor(pen, lineWidth, lineColor);
                
        pen.beginPath();
        pen.moveTo(startVector.x, startVector.y);
        pen.lineTo(endVector.x, endVector.y);
        pen.stroke();
    },
};
