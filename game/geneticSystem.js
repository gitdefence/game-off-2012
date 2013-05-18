function Genes() {
    this.base = new BaseObj(this);
    this.tpos = new Rect(0, 0, 0, 0);

    this.alleles = {};


    var addingAlleles = false;
    this.startAlleleAdd = function() {
        addingAlleles = true;
    }
    this.endAlleleAdd = function() {
        addingAlleles = false;
        this.recalculateAttributes();
    }

    //Can't think of the best place to have this logic.
    //This place kind of makes sense, the genes kinda know
    //they are being displayed, so they try to inform who
    //is displaying them when they changed.
    this.updateInfoBarAttributes = function () {
        var game = getGame(this);

        var parent = this.base.parent;

        if (!parent || !game) return;

        //If our parent is selected, we are probably
        //being displayed
        if (game.selection() == parent) {
            game.infobar.updateAttr(parent);
        }
    }

    //Get/setter for the next allele the user can use on this tower.
    //They can trash the allele or use it, but they won't know what to
    //do until we show them what the allele is. We do this by displaying
    //information on top of the tower's statistics, so we need to expose
    //a way for the infobar to get at the allele is should be displaying.
    //This can of course return null if there is no next allele.
    //Calls updateInfoBarAttributes when you change the next allele, so
    //you don't have to.
    var topAllele = null;

    var hideTopAlleleVar = false;
    this.hideTopAllele = function (newValue) {
        hideTopAlleleVar = newValue;

        this.updateInfoBarAttributes();
    }
    this.topAllele = function (newTopAllele) {
        if (newTopAllele === undefined) {
            if (hideTopAlleleVar) return null;

            return topAllele;
        }

        topAllele = newTopAllele;

        this.updateInfoBarAttributes();
    }

    this.addAllele = function (allele) {
        if (!assertDefined(allele))
            return;

        var holder = this.base.parent;

        if (!assertDefined(holder))
            return;

        if (!assertDefined(allele.delta, allele.group))
            return;

        var group = allele.group;

        this.alleles[group] = allele;
        if(!addingAlleles)
            this.recalculateAttributes();
    };

    //This function is required, in case (which we really should for attack types) we
    //want to have alleles which apply a percentage change. If we do this, we also need
    //to make the alleles always applied in the same order.
    this.recalculateAttributes = function () {
        var holder = this.base.parent;
        holder.setBaseAttrs();

        for (var key in this.alleles) {
            this.alleles[key].apply(holder);
        }
        holder.attr.currentHp = holder.attr.hp;

        //I mean, this could happen, its not an error, you just have crap alleles
        //(However letting the range be 0 may cause errors. Also, no point in not drawing
        //it, might as well give them a little bit of range so a circle is at least drawn).
        if (holder.attr.range < 1) {
            holder.attr.range = 1;
        }

        this.updateInfoBarAttributes();
    }

    //Should only be called if you are fully replacing the targeting strategy and attack types
    this.replaceAlleles = function (newAlleles) {
        var holder = this.base.parent;
        holder.attr.targetStrategy = null;
        holder.attr.attackTypes = {};

        this.startAlleleAdd();

        for (var group in newAlleles) {
            this.addAllele(newAlleles[group]);
        }

        this.endAlleleAdd();
    };
}
