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

    this.recalculateAttributes = function () {
        var holder = this.base.parent;
        holder.setBaseAttrs();

        for (var key in this.alleles) {
            this.alleles[key].apply(holder);
        }
        holder.attr.currentHp = holder.attr.hp;

        this.updateInfoBarAttributes();
    }

    //Should only be called if you are fully replacing the targeting strategy and attack types
    this.replaceAlleles = function (newAlleles) {
        var holder = this.base.parent;
        holder.attr.targetStrategy = null;
        holder.attr.attackTypes = [];

        this.startAlleleAdd();

        for (var group in newAlleles) {
            this.addAllele(newAlleles[group]);
        }

        this.endAlleleAdd();
    };
}
