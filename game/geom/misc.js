// ALL DISTANCE IN HERE SHOULD BE DONE USING THE FOLLOWING PARADIGM:
// A distance or delta, or vecTo, etc should be:
//     vecTo(x, y) = y - x, so x + vecTo(x, y) = y...

// For all functions:
//  - rect in x, y, w, h format
//  - point in x, y format

function assertRectangle(rect) {
    return rect instanceof Rect && assertValid("assertRectangle", rect, rect.x, rect.y, rect.w, rect.h);
}

function assertVector(vect) {
    return vect instanceof Vector && assertValid("assertVector", vect, vect.x, vect.y);
}

//Gets the Vector from the a rect to a point.    
//Caveats
//If point is in rect then it returns Vector(0, 0).
//If vector is given, then it will fill in vector and return that)
function vecToRect(point, rect, vector) {
    if (!assertValid("vecToRect", rect, point) || !assertRectangle(rect))
        return new Vector(0, 0);
    
    if(!vector)
        vector = new Vector(0, 0);
    
    if (point.x > (rect.x + rect.w))
        vector.x = (rect.x + rect.w) - point.x;
    else if (point.x < rect.x)
        vector.x = rect.x - point.x;
    else
        vector.x = 0;
    
    if (point.y > (rect.y + rect.h))
        vector.y = (rect.y + rect.h) - point.y;
    else if (point.y < rect.y)
        vector.y = rect.y - point.y;
    else
        vector.y = 0;
    
    return vector;
}

//Gets the minimum distance from the point to the bounds of the rect
//(so if the point is inside it returns the vector to the closest side)
function minVecToOuterRect(point, rect, vector) {
    if (!assertValid("vecToRect", rect, point) || !assertRectangle(rect))
        return new Vector(0, 0);
    
    if(!vector)
        vector = new Vector(0, 0);
    
    var cenX = rect.x + rect.w / 2;
    if(point.x < cenX)
        vector.x = rect.x - point.x;
    else
        vector.x = (rect.x + rect.w) - point.x;
    
    var cenY = rect.y + rect.h / 2;
    if(point.y < cenY)
        vector.y = rect.y - point.y;
    else
        vector.y = (rect.y + rect.h) - point.y;
    
    return vector;
}

//Gets the minimum vector from rectOne to rectTwo to make them touch or overlap.
//(so 0 if they are already overlapping).
function minVecBetweenRects(rectOne, rectTwo) {
    var normal = minVecBetweenRectsOneWay(rectOne, rectTwo);
    var opposite = minVecBetweenRectsOneWay(rectTwo, rectOne);
    
    if(opposite.magSq() < normal.magSq()) {
        opposite.x *= -1;
        opposite.y *= -1;
        return opposite;
    }
    return normal;
}

//Gets the minimum vector from rectOne to rectTwo to make them touch.
//Basically just the minimum vec between the vertices of one and two.
function minVecBetweenRectsOneWay(rectOne, rectTwo) {
    if (!assertValid("minVecBetweenRects", rectOne, rectTwo) ||
        !assertRectangle(rectOne) || !assertRectangle(rectTwo))
        return new Vector(0, 0);
    
    var distance1 = vecToRect(new Vector(rectOne.x, rectOne.y), rectTwo);
    var distance2 = vecToRect(new Vector(rectOne.x + rectOne.w, rectOne.y), rectTwo);
    var distance3 = vecToRect(new Vector(rectOne.x, rectOne.y + rectOne.h), rectTwo);
    var distance4 = vecToRect(new Vector(rectOne.x + rectOne.w, rectOne.y + rectOne.h), rectTwo);
    
    var minimum = distance1;
    
    if (distance2.magSq() < minimum.magSq())
        minimum = distance2;
    
    if (distance3.magSq() < minimum.magSq())
        minimum = distance3;
    
    if (distance4.magSq() < minimum.magSq())
        minimum = distance4;
    
    return minimum;
}

//Gives the delta for one to be distance away from two
function minVecForDistanceRects(rectOne, rectTwo, distance) {
    if (!assertValid("minVecForDistanceRects", rectOne, rectTwo, distance) ||
        !assertRectangle(rectOne) || !assertRectangle(rectTwo))
        return new Vector(0, 0);
    
    var xIntersect = false;
    var xChange1 = rectTwo.x - (rectOne.x + rectOne.w); //Top of two to bottom of one
    var xChange2 = (rectTwo.x + rectTwo.w) - rectOne.x;
    var xChange = Math.abs(xChange1) < Math.abs(xChange2) ? xChange1 : xChange2;
    var xIntersect = Math.abs(xChange1) < Math.abs(xChange2) ? xChange1 < 0 : xChange2 > 0;
    
    var yIntersect = false;
    var yChange1 = rectTwo.y - (rectOne.y + rectOne.h);
    var yChange2 = (rectTwo.y + rectTwo.h) - rectOne.y;
    var yChange = Math.abs(yChange1) < Math.abs(yChange2) ? yChange1 : yChange2;
    var yIntersect = Math.abs(yChange1) < Math.abs(yChange2) ? yChange1 < 0 : yChange2 > 0;
    
    if(xIntersect && yIntersect) {
        if(Math.abs(xChange) > Math.abs(yChange)) {
            xChange = 0;
        } else {
            yChange = 0;
        }
    }
    
    if(xChange) {
        xChange += xChange > 0 ? distance : -distance;
    } else {
        yChange += yChange > 0 ? distance : -distance;
    }
    
    return new Vector(xChange, yChange);
}

//Gets the minimum vector for rectOne to be fully overlapped by rectTwo, or two by one
//Its behaviour is undefined if fully overlap is impossible (rectangles with one wide and one tall)
function minVecFullOverlapRects(rectOne, rectTwo) {
    if (!assertValid("minVecFullOverlapRects", rectOne, rectTwo) ||
        !assertRectangle(rectOne) || !assertRectangle(rectTwo))
        return new Vector(0, 0);
    
    if(rectTwo.w > rectOne.w) {
        var vect = minVecBetweenRects(rectTwo, rectOne);
        vect.x *= -1;
        vect.y *= -1;
        
        return vect;
    }
    
    
    var distance1 = vecToRect(new Vector(rectOne.x, rectOne.y), rectTwo);
    var distance2 = vecToRect(new Vector(rectOne.x + rectOne.w, rectOne.y), rectTwo);
    var distance3 = vecToRect(new Vector(rectOne.x, rectOne.y + rectOne.h), rectTwo);
    var distance4 = vecToRect(new Vector(rectOne.x + rectOne.w, rectOne.y + rectOne.h), rectTwo);
    
    var maximum = distance1;
    
    if (distance2.magSq() > maximum.magSq())
        maximum = distance2;
    
    if (distance3.magSq() > maximum.magSq())
        maximum = distance3;
    
    if (distance4.magSq() > maximum.magSq())
        maximum = distance4;
    
    return maximum;
}

//I just can't shake the feeling there is a much more efficient way to do this.
function rangeOverlap(startOne, endOne, startTwo, endTwo) {
    return (
        startOne < startTwo && endOne > startTwo ||
        startOne < endTwo && endOne > endTwo ||
        startTwo < startOne && endTwo > startOne ||
        startTwo < endOne && endTwo > endOne
    );
}
