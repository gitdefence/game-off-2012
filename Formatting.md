Readability is always the most improtant thing! Apply these rules as much as practical, but don't do it blindly!

In general, try to follow Douglas Crockford's guidelines, he's written a lot of
JavaScript, so he probably knows what he's doing: http://javascript.crockford.com/code.html

Always use semicolons to terminate statements! [Automatic semicolon insertion](http://inimino.org/~inimino/blog/javascript_semicolons) can kill!

No space between function name and argument list

    function args(a, b) {
        return a + b;
    }

Same if there are no arguments
    
    function noArgs() {
        return 1;
    }

If the function is anonymous, a space should be added between the function keyword
and the parameter list.

    function () {
        return 1;
    }

Always use braces for control structures, unless the body is a single line.

    if (foobar) {
        foo();
        bar();
    }

If the body is a single line, braces are at your discresstion. It is generally
reccommended you use them, as they make maintenece easier, and don't take any
additional time to type once you get the muscle memory down. For example,
changing code from

    if (foobar) 
        return;

to

    if (foobar) {
        console.log("Returning!");
        return;
    }

requires changing four lines, messing up diffs and taking longer to type. If you had
simply typed

    if (foobar) {
        return;
    }

to begin with, then the change would have been much easier. This is especially apparent
when you have many nested control structures, such as

    if (foo)
        if (bar)
            for (var i = 0; i < 100; i++)
                dobar();

if you want to add a second statement to the middle if, you would probably do something like this:

    if (foo)
        if (bar) {
            console.log("Foo and bar!");
            for (var i = 0; i < 100; i++)
                dobar();
        }

Which takes significanly longer to parse and double check in you brain in order to ensure the braces
belong to the statments you think they belong to.

An additional problem can arrise if you want to add an else clause to the outermost if, something like
the following.

    if (foo)
        if (bar)
            for (var i = 0; i < 100; i++)
                dobar();
    else
        dofoo();

What's wrong with that? You've just fallen victim to the
[dangling else problem](http://www.dai-arc.polito.it/dai-arc/manual/tools/jcat/main/node101.html)!

Functions should have all of their arguments on the same line, except in extreme cases.
Generally speaking, if you have enough arguments that you need to break it onto multiple lines, you
need to either reduce the number of arguments to your function (over 4 or so is generally too many!),
or break up the expressions inside onto multiple lines. Please don't write code like this:

    DRAW.arc(pen, cen, this.radius + this.lineWidth,
        0, Math.PI * 2 * hpPercent,
        new HSLColor().h(hue).s(50).l(50).a(0).str(), 3,
        new HSLColor().h(hue).s(90).l(60).a(1).str());

Reading that code, it is impossible to know or remember what all of the parameters mean without
reading the function definition for DRAW.arc or being quite familiar with the code. If this had
been written istead as
    
    var circ = new Circle(cen, this.radius + this.lineWidth);
    var begin = 0;
    var end = Math.PI * 2 * hpPercent;
    DRAW.fillArc(pen, circ, begin, end, hsla(hue, 50, 50, 0));
    DRAW.strokeArc(pen, circ, begin, end, hsla(hue, 90, 60, 1), 2);

It is immediately apparent what all of the parameters mean and how they are intended to be used,
no additional familarity with the code required.
