//This file contains last ditch exception handling. You should use assertDefined
//or fail most of the time, causing your code to silently fail in release
//and hard fail in debug. However to prevent hard failures from unchecked code
//in release, we inevitably need some try catches.

//The reason these try catches are wrapped in functions is two fold:
//1) Reducing ugly exception handling from simple high-level framework code.
//2) Chrome exception rethrowing can blow away stack information (https://code.google.com/p/chromium/issues/detail?id=60240)
//   and they still haven't really fix it!


//These levels are used by you to pass into lastDitchErrorCheck to
//indicate how much recovery you provide. Each ditch value indicates
//you will 'try' to provide that much recovery (do be honest), but if you cannot
//you may end up acting like a previous level (this is expected to happen, no need
//to document this for every case).

//No point of this, but its here to illustrate a point.
//var LAST_DITCH_CRASH = -1;

//Provides no recovery, just ignores.
var LAST_DITCH_NO_RECOVERY = 0;

//Tries to recovery, but does it in a destructive manner.
var LAST_DITCH_DESTRUCTIVE_RECOVERY = 1;

//Tries to fix problems which may cause a crash. Some very minor information may
//be lost (maybe an object is rolled-back a bit), but for the most part the user
//would not mind any changes (no deleting objects!).
var LAST_DITCH_ATTEMPT_RECOVERY = 2;


//General behaviour:
//DFlag.debug: We run fncToRun normally
//!DFlag.debug: We run fncToRun in a try/catch and
//call fncOnFailure if it fails, passing fncOnFailure the error.

//failureRecoveryValue is used on failure (not in debug) to decide
//when we should run fncToRun normally (as in, if you are in a
//lastDitchErrorCheck with failureRecoveryValue > the current one,
//we run normally as its better that they provide the last ditch effort
//as they offer more!).

//Also, don't call console.error in your fncOnFailure, we call it automatically anyway.
//(And you cannot avoid this on purpose, this is last ditch and so if something goes wrong
//here is should ALWAYS be indicative of a bug, as you can still use try/catch if it is appropriate.)

var curLastDitchValue = -1;
function lastDitchErrorCheck(fncToRun, fncOnFailure, failureRecoveryValue) {
//DFlag should always exist, however this is lastDitch, so we might as well
//make it as safe as possible and check for DFlag (really really no point in crashing here).
    if (DFlag && DFlag.debug ||
        curLastDitchValue > failureRecoveryValue) {
        //We are in debug, so go crazy and run whatever!
        fncToRun();
    } else {
        var prevLastDitchValue = curLastDitchValue;
        curLastDitchValue = failureRecoveryValue;
        try {
            fncToRun();
        } catch (error) {
            console.error(error);
            fncOnFailure(error);
        } finally {
            curLastDitchValue = prevLastDitchValue;
        }
    }
}
