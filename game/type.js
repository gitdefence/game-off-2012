function assertValid(functionName) {
    var allDefined = true;

    for(var i = 0; i < arguments.length; i++)
    {
        if (nullOrUndefined(arguments[i]) ||
            //isFinite also checks for NaN
            typeof arguments[i] == "number" && !isFinite(arguments[i]))
        {
            fail("Variable is required but is undefined in " + functionName);
            allDefined = false;
        }
    }

    return allDefined;
}

function defined() {
    for (var i = 0; i < arguments.length; i++) {
        //if (typeof arguments[i] === "undefined") {
        if (nullOrUndefined(arguments[i]) || realIsNan(arguments[i]))
        {
            return false;
        }
    }
    return true;
}

//Well this looks kinda expensive, so try not to use it?
function getRealType(object) {
    //This nan check shouldn't be needed, but sometimes things (like attributes)
    //go to NaN and I can't figure out why.
    if (!realIsNan(object) && !assertValid(object))
        return "undefined";

    //http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript    
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((object).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
}

function nullOrUndefined(object) {
    return typeof object === "undefined" || object === null;
}

function realIsNan(object) {
    return typeof object == "number" && isNaN(object);
}
