 //System to switch between different things being active (like game, menu, etc)
function ScreenSystem(canvas) {
    var pen = canvas.getContext("2d");

    var screens = {};
    var active = null;
    var activeName = null;

    this.addScreen = function (name, screen) {
        screens[name] = screen;
    }

    this.setActiveScreen = function (name) {
        if (active && active.input) {
            active.input.unBind(canvas);
        }

        active = screens[name];
        active.screenSystem = this;
        activeName = name;

        if (active.input) {
            active.input.bind(canvas);
        }

        if (active.gainFocus) active.gainFocus();
    }

    //This is used if something goes wrong with your active screen and you
    //want to reset our handling of it. Think of it as unplugging
    //and then replugging in your monitor. Essentially just calls setActiveScreen with
    //the currently active screen.
    this.resetActiveScreen = function () {
        if (!activeName) {
            //Technically nothing to do (its arguable), so I will do nothing to
            //prevent important exception code from easily failing.
            console.warn("Called resetActiveScreen before an active screen was set!");
            return;
        }
        this.setActiveScreen(activeName);
    }
    
    var reqAnim = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(cb) {
            window.setTimeout(function() {
                cb();
            }, 1000 / 60);
        };
    })();

    var sequentialFailures = 0;
    function tick() {
        if (active && active.run) {

            var fncMainTickCode = function () {
                active.run(Date.now());
                pen.clearRect(0, 0, canvas.width, canvas.height);
                active.draw(pen);
            };

            var fncLastDitchFailureCode = function(error) {
                sequentialFailures++;

                //Okay, my argument for telling the user about the failure and letting them continue:
                //The exception is either:
                //1) In run, so update. This means it might go away. Their state may
                //   be bad, but hey, they may keep on playing and not lose progress.
                //2) In draw. This means it will almost certainly keep happening. HOWEVER,
                //   it may happen late enough in the draw for them to still see SOME stuff,
                //   so it may be acceptable for them to continue.
                //Also, while exception checking in 'other' code may make this code redundant,
                //that exception checking may be moved, fail or miss stuff in new code, this
                //relatively futureproofs it (the screen really does have to be the highest level,
                //for design reasons any other system would likely be redundant).

                //This intentially only asks the user once for failure,
                //as if we keep getting exceptions but the user wants to continue... might as well
                //just let them be.
                if (sequentialFailures == 100) {
                    if (window.confirm(
                            "The last 100 frames have thrown an exception, do you want to terminate the program now?"
                        )) {
                        throw error;
                    }
                }
            };

            //Last ditch try catch, if this fails we kinda just give up
            lastDitchErrorCheck(fncMainTickCode, fncLastDitchFailureCode, LAST_DITCH_NO_RECOVERY);
        }
        reqAnim(tick.bind(this));
    }
    reqAnim(tick.bind(this));
}
