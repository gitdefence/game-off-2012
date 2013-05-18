//KEEP THIS SHORT!
//IF THIS IS OVER 250 LINES THEN SPLIT IT INTO LOGICAL SECTIONS!

function hexPair(num) {
    num = Math.floor(num);
    return Math.min(Math.max(num, 16), 255).toString(16);
}

function swap(obj, one, two) {
    var temp = obj[one];
    obj[one] = obj[two];
    obj[two] = temp;
}

function mergeToArray(value, array) {
    if (nullOrUndefined(value))
        return array;

    if ((value.length === undefined || value.length !== 0)) {
        if (typeof value === "number") {
            array.push(value);
        } else if (value) {
            //This is probably the fastest way to check if it is probably an array, if it isn't and it has length... well then:
            //http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
            if (value.length !== undefined) {
                if (value.length > 0)
                    for (var key in value) //concat would mean when you call this you have to do arr = merg(val, arr)
                        array.push(value[key]);
            } else if (value) {
                array.push(value);
            }
        }
    }
    return array;
}


//Gets an element from object, or returns null if there are no objects
function getAnElement(object) {
    for (var key in object)
        return object[key];
    return null;
}

//Don't use this often! If you really need the count (length) you should keep track of it
function countElements(object) {
    var count = 0;
    for (var key in object)
        count++;
    return count;
}

function hasAtleastXElements(object, x) {
    if (!x)
        return true;

    for (var key in object) {
        x--;
        if (!x)
            return true;
    }

    return false;
}

//Standardization of the compare function, really simplify things...
function compare(a, b) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    } else {
        return 0;
    }
}

function sortArrayByProperty(a, prop) {
    a.sort(cmp)
    function cmp(a, b) {
        //This probably makes it slower... ah well, the main place it impacts is
        //sorting the zorder sort for drawing, which could be made faster in other ways.
        return compare(a[prop], b[prop]);
    }
}

/*
function findElementByProperty(obj, prop, value) {
    for (var key in obj) {
        if(obj[
    }
}
*/

//Needed to do stable sorts
function mergesort(array, fncLessEqualThan) {
    var array2 = new Array();

    var curArr = array;
    var dstArray = array2;

    var chunkSize = 2;
    while (chunkSize / 2 < array.length) {
        for (var ix = 0; ix < array.length; ix += chunkSize) {
            var iOne = ix;
            var middle = Math.min(ix + chunkSize / 2, array.length);
            var iTwo = middle;
            var end = Math.min(ix + chunkSize, array.length);

            var iDest = iOne;

            while (iOne < middle && iTwo < end) {
                if (fncLessEqualThan(curArr[iOne], curArr[iTwo])) {
                    dstArray[iDest++] = curArr[iOne++];
                } else {
                    dstArray[iDest++] = curArr[iTwo++];
                }
            }

            while (iTwo < end) {
                dstArray[iDest++] = curArr[iTwo++];
            }

            while (iOne < middle) {
                dstArray[iDest++] = curArr[iOne++];
            }
        }

        chunkSize *= 2;
        var temp = curArr;
        curArr = dstArray;
        dstArray = temp;
    }

    if (curArr == array) return;

    for (var ix = 0; ix < array.length; ix++) {
        array[ix] = curArr[ix];
    }
}

//Maintains original sort order for equivalent elements (see https://en.wikipedia.org/wiki/Sorting_algorithm#Stability)
function sortArrayByPropertyStable(a, prop) {
    mergesort(a, function (one, two) { return one[prop] <= two[prop]; });
}

function getSortedKeys(array) {
    var keys = [];
    for (var key in array)
        keys.push(key);
    keys.sort();
    return keys;
}

//If given an object it turns a random key from it
function pickRandom(array) {
    if(!assertDefined(array.length))
        return;

    return array[Math.floor(Math.random() * array.length)];
}

function pickRandomKey(object) {
    var keys = [];
    for(var key in object)
        keys.push(key)
    return keys[Math.floor(Math.random() * keys.length)];
}

//I could make ones for every single color piece... but using regex to set
//RGBA is retarded and incredibly inefficient, so I am just copy and pasting
//an answer from stack overlow...
//http://stackoverflow.com/questions/8177964/in-javascript-how-can-i-set-rgba-without-specifying-the-rgb
function setAlpha(color, newAlpha) {
    if (!assertDefined(color, newAlpha))
        return;
    return color.replace(/[^,]+(?=\))/, newAlpha);
}

function getSel(obj) {
    return obj.base.rootNode.game.selection();
}

function getGame(obj) {
    return obj.base.rootNode.game;
}

function getEng(obj) {
    return obj.base.rootNode;
}

//Great debate here over this topic:
//http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object
function cloneObject(object) {
    return jQuery.extend(true, {}, object);
}

function mergeObject(objectOne, objectTwo) {
    return jQuery.extend(true, objectOne, objectTwo);
}

function clamp(val, min, max) {
    //Like my code?
    if (isNaN(val))
        return min / 2 + max / 2;

    if (val < min) return min;
    else if (val > max) return max;
    else return val;
}


//makeTileFnc takes array[x], pen, Rect
function makeTiled(pen, makeTileFnc, array, boxBox, xNum, yNum, percentBuffer) {
    var width = boxBox.w / (xNum);
    var height = boxBox.h / (yNum);

    var xPos = boxBox.x + width * percentBuffer;
    var yPos = boxBox.y + height * percentBuffer;

    var drawnWidth = width * (1 - 2 * percentBuffer);
    var drawnHeight = height * (1 - 2 * percentBuffer);

    for (var key in array) {
        var value = array[key];
        if (xPos > boxBox.x + boxBox.w) {
            xPos = boxBox.x + width * percentBuffer;
            yPos += height;
        }

        if (makeTileFnc(value, pen, new Rect(xPos, yPos, drawnWidth, drawnHeight)))
            xPos += width;
    }
}

// From http://fitzgeraldnick.com/weblog/26/ with slight modifications
function bind(thisCtx, name /*, variadic args to curry */) {
    var args = Array.prototype.slice.call(arguments, 2);
    return function () {
        return thisCtx[name].apply(thisCtx, args.concat(Array.prototype.slice.call(arguments)));
    };
}

function loadScript(name) {
    var s = document.createElement('script')
    s.src = name + '.js';
    document.getElementById('scripts').appendChild(s);
}

function loadScripts(prefix, scripts) {
    for (var i = 0; i < scripts.length; i++) {
        loadScript(prefix + scripts[i]);
    }
}

// http://stackoverflow.com/questions/2607248/optimize-website-for-touch-devices
function isTouchDevice() {
   return "ontouchstart" in window;
}
