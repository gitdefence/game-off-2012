var uniqueBaseObjNumber = 1;
function BaseObj(holder, zindex, dynamicZIndex) {
    if (!assertDefined("BaseObj", holder))
        return;

    //Strange... but needed
    holder.base = this;

//Identifier properties
    this.type = getRealType(holder); //.constructor.name;
    if (dynamicZIndex)
        this.type += zindex;

    //If its not a string then the object degenerates to an array.
    this.id = 'q' + uniqueBaseObjNumber++;


//Drawing properties
    //Will be set to the position in the array it is in,
    //and so will be used to determine order when zindex is equal.
    this.zoffset = 0; //<--------- THIS IS ALSO QUADTREE MAINTAINED

    if (!zindex)
        zindex = 0;

    //Individual objects cannot change their zindex! If they are the same type they must have the same zindex!
    this.zindex = zindex;


//Hierarchical properties
    this.rootNode = holder; //Be default we are our own rootNode
    this.holder = holder;
    this.parent = null;

    //Organized by type, and then objects of objects (with the index the id)
    //so this.children['Tower']['q53'] could be a tower (depending on the unique id of the tower)
    //this.parent
    this.children = {};
    this.lengths = {}; //type to length, must be maintained manually (naturally)

    //Flattened structure of children, so grandchildren are in here, etc
    this.allChildren = {};
    this.allLengths = {};


    if (holder.tpos) {
        //Quadtree maintained properties
        //We default the quadtree to something, that way every object always has one
        var tempArrObjs = {};
        tempArrObjs[this.type] = {};
        tempArrObjs[this.type][this.id] = holder;
        this.curQuadTree = new QuadTree(tempArrObjs);
        //QuadTree will then set quadNode in us.
    }

    //This just makes easier to maintain our arrays. It doesn't really create them,
    //so array and arrayLengths must still be members initialized in our constructor
    function addToArray(BaseObj, obj, array, arrayLengths) {
        if (!assertDefined("addToArray", BaseObj, BaseObj[array], BaseObj[arrayLengths], obj, obj.base))
            return;

        if (!BaseObj[array][obj.base.type]) {
            BaseObj[array][obj.base.type] = {};
            BaseObj[arrayLengths][obj.base.type] = 0;
        }

        if (!BaseObj[array][obj.base.type][obj.base.id]) {
            BaseObj[array][obj.base.type][obj.base.id] = obj;
            BaseObj[arrayLengths][obj.base.type]++;
        }
    };

    this.addChild = function (obj) {
        if (!assertDefined("addChild", obj) || !assertDefined("addChild", obj.base))
            return;

        obj.base.parent = this.holder;
        obj.base.setRootNode(this.rootNode);

        addToArray(this, obj, "children", "lengths");

        if (obj.added)
            obj.added();
    };

    function removeFromArray(BaseObj, obj, array, arrayLengths) {
        if (!assertDefined(BaseObj) ||
            !assertDefined("removeFromArray", BaseObj, BaseObj[array], BaseObj[arrayLengths], obj, obj.base))
            return;

        if (!BaseObj[array][obj.base.type])
            return;

        if (BaseObj[array][obj.base.type][obj.base.id]) {
            delete BaseObj[array][obj.base.type][obj.base.id];
            BaseObj[arrayLengths][obj.base.type]--;
        }
    }

    this.eachChild = function (funcToExecute) {
        for (var type in this.children) {
            for (var id in this.children[type]) {
                if (funcToExecute(this.children[type][id])) {
                    return;
                }
            }
        }
    };

    this.removeChild = function (obj) {
        if (!assertDefined("removeChild", obj, obj.base))
            return;

        //Set its root node to itself to let it know we are no longer its parent
        obj.base.parent = obj;
        obj.base.setRootNode(obj);

        removeFromArray(this, obj, "children", "lengths");
    };

    this.destroySelf = function () {
        if (!this.parent) return;

        this.holder.base.callRaise("die");
        this.parent.base.removeChild(this.holder);

        //Also destroy our children (keeps allChildren working properly)
        this.eachChild(function (child) {
            if (child.base)
                child.base.destroySelf();
        });
    };

    this.setRootNode = function (rootNode) {
        if (!assertDefined("setRootNode", rootNode))
            return;

        //Remove stuff from old rootNode
        if (this.rootNode) {
            removeFromArray(this.rootNode.base, this.holder, "allChildren", "allLengths");
            if (this.rootNode.curQuadTree)
                this.rootNode.curQuadTree.removeFromTree(this.holder);
        }

        this.rootNode = rootNode;

        addToArray(this.rootNode.base, this.holder, "allChildren", "allLengths");
        if (this.rootNode.curQuadTree)
            this.rootNode.curQuadTree.addToTree(this.holder);

        this.eachChild(function (child) {
            if (child.base) {
                child.base.setRootNode(rootNode);
            }
        });
    };

    this.removeAllType = function (type) {
        if (this.children[type]) {
            this.children[type] = {};
            this.lengths[type] = 0;
        }
        //This is harder, you need to also remove them from their parents
        if (this.allChildren[type]) {
            for(var key in this.allChildren[type]) {
                var toRemove = this.allChildren[type][key];
                if(toRemove.base.parent != this.holder)
                    delete toRemove.base.parent.base.children[type][key];
            }
            this.allChildren[type] = {};
            this.allLengths[type] = 0;
        }
    };

    // Calls the function with the name on our object (and gives it arguments),
    // and calls raiseEvent on our children.
    // Update is basically just raiseEvent("update", dt)
    this.raiseEvent = function (name, args) {
        if (holder[name]) holder[name](args);

        this.eachChild(function (child) {
            if (child.base) {
                child.base.raiseEvent(name, args)
            }
        });
    };

    // Calls the function, then raises an event called "parent_" + name
    // to all of its children.
    this.callRaise = function (name, args) {
        if(holder[name] && !holder.hidden)
            holder[name](args);

        this.eachChild(function (child) {
            if (child && child["parent_" + name]) {
                child["parent_" + name](args);
            }
        });
    }

    this.setAttributeRecursive = function (attributeName, value) {
        this.holder[attributeName] = value;

        this.eachChild(function (child) {
            if (child.base) {
                child.base.setAttributeRecursive(attributeName, value);
            }
        });
    }

    this.canHandleEvent = function (eventName) {
        if (holder[eventName])
            return true;

        eventName = "parent_" + eventName;
        var childrenHandleIt = false;
        this.eachChild(function (child) {
            if (child.base && child.base.canHandleEvent(eventName)) {
                childrenHandleIt = true;
                return true;
            }
        });

        return childrenHandleIt;
    }

    this.update = function (dt) {
        if (holder.update) holder.update(dt);

        this.eachChild(function (child) {
            if (child.base) child.base.update(dt);
        });
    };

    var drawDirty = true;
    this.dirty = function () {
        drawDirty = true;
    }

    var canvas = new Canvas();
    function draw(pen) {
        if (holder.hidden) return;

        if (holder.draw) {
            // Provide the old API for compatability.
            holder.draw(pen);
        } else if (holder.redraw) {
            if (drawDirty) {
                canvas.resize(holder.tpos);
                holder.redraw(canvas);
                canvas.drawTo(pen);
                drawDirty = false;
            } else {
                canvas.drawTo(pen);
            }
        }
    }

    this.draw = function (pen) {
        draw(pen);

        //Sort objects by z-index (low to high) and then draw by that order
        var childWithZIndex = [];

        for (var key in this.children) {
            var child = this.children[key];
            if (getAnElement(child)) {
                childWithZIndex.push({
                    zindex: getAnElement(child).base.zindex,
                    array: child,
                });
            }
        }

        sortArrayByProperty(childWithZIndex, "zindex");

        if (DFlag.zindexCheck) {
            var lastZIndex = -1000000;
            for (var y = 0; y < childWithZIndex.length; y++) {
                if (childWithZIndex[y].zindex < lastZIndex) {
                    fail("Z SORTING MESSING UP (CRASH)!");
                    //sortArrayByProperty(childWithZIndex, "zindex");
                }
                lastZIndex = childWithZIndex[y].zindex;
            }
        }

        for (var y = 0; y < childWithZIndex.length; y++) {
            for (var key in childWithZIndex[y].array) {
                var child = childWithZIndex[y].array[key];
                child.base.draw(pen);
            }
        }
    };

}
