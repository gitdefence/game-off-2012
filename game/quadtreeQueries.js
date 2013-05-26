function findAllWithinDistanceToRect(engine, type, targetRect, maxDistance) {
    if (!engine.curQuadTree) {
        //I want to crash... but this is legitimate.
        return null;
    }

    if (!assertValid("findAllWithinDistanceToRect", engine, type, targetRect)) {
        return null;
    }

    if (!engine.curQuadTree.objTrees[type]) {
        return null;
    }

    var relevantQuadTree = engine.curQuadTree.objTrees[type].tree;
    var relevantArray = engine.base.allChildren[type];

    var within = [];

    if (DFlag.logn && DFlag.logn.findAllWithinDistanceToRect)
        DFlag.logn.findAllWithinDistanceToRect.max += relevantArray.length;

    findClosestGeneric(relevantQuadTree, relevantArray,
        function (splitX, axisPos) {
            if (splitX) {
                if ((targetRect.x + targetRect.w) < axisPos) return -1;
                else if (targetRect.x > axisPos) return 1;
                else return 0;
            } else {
                if ((targetRect.y + targetRect.h) < axisPos) return -1;
                else if (targetRect.y > axisPos) return 1;
                else return 0;
            }
        },
        function (rect) {
            return minVecBetweenRects(targetRect, rect).magSq();
        },
        maxDistance * maxDistance, false, within);

    return within;
}

function findClosestToRect(engine, type, targetRect, maxDistance) {
    if (!engine.curQuadTree) {
        //I want to crash... but this is legitimate.
        return null;
    }

    if (!assertValid("findClosestToPoint", engine, type, targetRect)) {
        return null;
    }

    if (!engine.curQuadTree.objTrees[type]) {
        return null;
    }

    var relevantQuadTree = engine.curQuadTree.objTrees[type].tree;
    var relevantArray = engine.base.allChildren[type];

    var within = [];

    if (DFlag.logn && DFlag.logn.findClosestToRect) {
        DFlag.logn.findClosestToRect.max += relevantArray.length;
    }

    var closest = findClosestGeneric(relevantQuadTree, relevantArray,
        function (splitX, axisPos) {
            if (splitX) {
                if ((targetRect.x + targetRect.w) < axisPos) return -1;
                else if (targetRect.x > axisPos) return 1;
                else return 0;
            } else {
                if ((targetRect.y + targetRect.h) < axisPos) return -1;
                else if (targetRect.y > axisPos) return 1;
                else return 0;
            }
        },
        function (rect) {
            return minVecBetweenRects(targetRect, rect).magSq();
        },
        maxDistance * maxDistance, true);

    return closest;
}

//This code is mildly inconsistent and probably shouldn't be used with
//a rect as the target, try to only use a point as the target just to be sure.
function findClosestToPoint(engine, type, target, maxDistance) {
    if (!engine.curQuadTree) {
        //I want to crash... but this is legitimate.
        return null;
    }

    if (!assertValid("findClosestToPoint", engine, type, target)) {
        return null;
    }

    if (!engine.curQuadTree.objTrees[type]) {
        return null;
    }

    var relevantQuadTree = engine.curQuadTree.objTrees[type].tree;
    var relevantArray = engine.base.allChildren[type];

    var within = [];

    if (DFlag.logn && DFlag.logn.findClosestToPoint) {
        DFlag.logn.findClosestToPoint.max += relevantArray.length;
    }

    if (DFlag.logn && DFlag.logn.findClosestToPoint) {
        var realClosest = null;
        var realClosDisSq = maxDistance * maxDistance;
        for (var x = 0; x < relevantArray.length; x++) {
            returnedObj = relevantArray[x];

            var disSquared = vecToRect(target, returnedObj.tpos).magSq();

            if (disSquared <= realClosDisSq) {
                realClosest = returnedObj;
                realClosDisSq = disSquared;
            }
        }
    }

    var closest = findClosestGeneric(relevantQuadTree, relevantArray,
        function (splitX, axisPos) {
            if (splitX) {
                if ((target.x + (target.w ? target.w : 0)) < axisPos) return -1;
                else if (target.x > axisPos) return 1;
                else return 0;
            } else {
                if ((target.y + (target.h ? target.h : 0)) < axisPos) return -1;
                else if (target.y > axisPos) return 1;
                else return 0;
            }
        },
        function (rect) {
            return vecToRect(target, rect).magSq();
        },
        maxDistance * maxDistance, true);

    return closest;
}

// Finds the all the objects within a certain radius of target.
//
// Input:
// - engine.(QuadTree)curQuadTree
// - type is type of the object you want to query for.
// - target.x and target.y (position of the base point)
// - maxDistance means the objects returned must be <= maxDistance away (so 0 is fine)
function findAllWithin(engine, type, target, maxDistance) {
    if (!engine.curQuadTree) {
        //I want to crash... but this is legitimate.
        return null;
    }

    if (!assertValid("findAllWithin", engine, type, target)) {
        return null;
    }

    if (!engine.curQuadTree.objTrees[type]) {
        return null;
    }

    var relevantQuadTree = engine.curQuadTree.objTrees[type].tree;
    var relevantArray = engine.base.allChildren[type];
    
    var within = [];

    if (DFlag.logn && DFlag.logn.findAllWithin) {
        DFlag.logn.findAllWithin.max += relevantArray.length;
    }

    findClosestGeneric(relevantQuadTree, relevantArray, 
        function (splitX, axisPos)  {
            if(splitX) {
                if ((target.x + (target.w ? target.w : 0)) < axisPos) return -1;
                else if (target.x > axisPos) return 1;
                else return 0;
            } else {
                if ((target.y + (target.h ? target.h : 0)) < axisPos) return -1;
                else if (target.y > axisPos) return 1;
                else return 0;
            }
        },
        function(rect) {
            return vecToRect(target, rect).magSq();
        },
        maxDistance * maxDistance, false, within);

    return within;
}

// Don't use findClosestGeneric if you don't know how it works!
//
// MaxDistance can greatly reduce our time, especially if you just
// want to use this to find intersections instead of closest.
//
// targetFunction returns a number when given a bool specifing the axis
// (true for x, false for y) and the position on that axis.
// targetFunction returns -ve numbers if the target is below that axis
// +ve numbers if it is above and 0 if it intersecting the axis.
//
// Target distance returns the distance (squared) from the target to a given rect.
function findClosestGeneric(quadtree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned) {
    if (!quadtree) {
        //Not error checking, just being lazy about the recursive calls in this function
        return;
    }

    //We should do this before we are called... and then we can do it much more efficiently
    //(not just because it reduces a function call), but then the code would be way bigger
    //and much more complex

    var minDisSqrBounds = targetDistance(quadtree.bounds);

    //Then it is impossible and we will never find a better collision
    if (minDisSqrBounds > minDisSquared) return null;

    var closestObj = null;

    if (DFlag.logn && DFlag.logn.findClosestGeneric) {
        DFlag.logn.findClosestGeneric.total += quadtree.indexCount;
    }

    function recalcClosest() {
        if (onlyFindOne && returnedObj) {
            closestObj = returnedObj;
            minDisSquared = targetDistance(returnedObj.tpos);
        }
    }

    //This is the brute force part of the algorithm
    for (var id in quadtree.ids) {
        returnedObj = array[id];

        if (!returnedObj || returnedObj.hidden) {
            continue; //THIS SHOULDN'T HAPPEN! IT IS EVIDENCE OF A BUG!
        }

        var disSquared = targetDistance(returnedObj.tpos);

        if (disSquared <= minDisSquared) {
            if (onlyFindOne) {
                closestObj = returnedObj;
                minDisSquared = disSquared;
            } else {
                returned.push(returnedObj);
            }
        }
    }

    //We still might have objects on us if this is false, but if it is true
    //it means be have no branches
    if (quadtree.leaf) {
        return onlyFindOne ? closestObj : null;
    }

    var curD = quadtree.splitX ? "x" : "y";

    var splitNumber = targetFunction(quadtree.splitX, quadtree.splibox);


    //splitNumber determines query order
    if (splitNumber < 0) {
        returnedObj = findClosestGeneric(quadtree.lessTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.splitTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.greaterTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();
    } else if (splitNumber > 0) {
        returnedObj = findClosestGeneric(quadtree.greaterTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.splitTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.lessTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();
    } else {
        returnedObj = findClosestGeneric(quadtree.splitTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.lessTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();

        returnedObj = findClosestGeneric(quadtree.greaterTree, array, targetFunction, targetDistance, minDisSquared, onlyFindOne, returned);
        recalcClosest();
    }

    return onlyFindOne ? closestObj : null;
}

function drawTree(engine, type, pen) {
    if (engine.curQuadTree.objTrees[type]) {
        drawBranch(engine.curQuadTree.objTrees[type].tree, pen);
    }

    function drawBranch(quadtree, pen) {
        if (!quadtree) return;

        DRAW.rect(pen, quadtree.bounds, "transparent", 2, pen.strokeStyle);

        drawBranch(quadtree.lessTree, pen);
        drawBranch(quadtree.splitTree, pen);
        drawBranch(quadtree.greaterTree, pen);
    }
}
