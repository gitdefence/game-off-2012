function Genes() {
    var self = this;
    self.base = new BaseObj(self);
    self.tpos = new Rect(0, 0, 0, 0);

    self.alleles = {};


    var addingAlleles = false;
    self.startAlleleAdd = function() {
        addingAlleles = true;
    }
    self.endAlleleAdd = function() {
        addingAlleles = false;
        self.recalculateAttributes();
    }

    //If we are selected, causes
    function updateInfoBarAttributes () {
        var game = getGame(self);

        var parent = self.base.parent;

        if (!parent || !game) return;

        //If our parent is selected, we are probably
        //being displayed
        if (game.selection() == parent) {
            game.infobar.updateAllAttributes();
        }
    }

    self.addAllele = function (allele) {
        if (!assertDefined(allele))
            return;

        var holder = self.base.parent;

        if (!assertDefined(holder))
            return;

        if (!assertDefined(allele.delta, allele.group))
            return;

        var group = allele.group;

        self.alleles[group] = allele;
        if(!addingAlleles)
            self.recalculateAttributes();
    };

    //This function is required, in case (which we really should for attack types) we
    //want to have alleles which apply a percentage change. If we do this, we also need
    //to make the alleles always applied in the same order.
    self.recalculateAttributes = function () {
        var holder = self.base.parent;
        holder.setBaseAttrs();

        for (var key in self.alleles) {
            self.alleles[key].apply(holder);
        }
        holder.attr.hp = holder.attr.maxHp;

        //I mean, this could happen, its not an error, you just have crap alleles
        //(However letting the range be 0 may cause errors. Also, no point in not drawing
        //it, might as well give them a little bit of range so a circle is at least drawn).
        if (holder.attr.range < 1) {
            holder.attr.range = 1; 
        }

        updateInfoBarAttributes();
    }

    //Should only be called if you are fully replacing the targeting strategy and attack types
    self.replaceAlleles = function (newAlleles) {
        var holder = self.base.parent;
        holder.attr.targetStrategy = null;
        holder.attr.attackTypes = {};

        self.startAlleleAdd();

        for (var group in newAlleles) {
            self.addAllele(newAlleles[group]);
        }

        self.endAlleleAdd();
    };
}
