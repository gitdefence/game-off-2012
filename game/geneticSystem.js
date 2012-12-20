function Genes() {
    this.base = new BaseObj(this);

    this.alleles = {};

    var replaceAllele = false;
    this.addAllele = function (group, allele) {
        if (!assertDefined(group, allele))
            return;

        var holder = this.base.parent;

        if (!assertDefined(holder))
            return;

        if (!assertDefined(allele.delta))
            return;

        if (replaceAllele || !allele.delta.attack) {
            if (this.alleles[group])
                this.alleles[group].unapply(holder);

            this.alleles[group] = allele;

            this.alleles[group].apply(holder);
        } else {
            //Should fix attack types not properly being removed
            var alleleCopy = cloneObject(this.alleles);
            alleleCopy[group] = allele;
            this.replaceAlleles(alleleCopy);
        }
    };

    //Should only be called if you are fully replacing the targeting strategy and attack types
    this.replaceAlleles = function (newAlleles) {
        var holder = this.base.parent;
        holder.attr.target_Strategy = null;
        holder.attr.attack_types = [];

        replaceAllele = true;

        for (var alleleGroup in this.alleles)
            if (this.alleles[alleleGroup]) {
                this.alleles[alleleGroup].unapply(holder);
                // Is this really what you want to do?
                // Yes, delete removes it from the object.
                delete this.alleles[alleleGroup];
            }

        for (var group in newAlleles) {
            this.addAllele(group, newAlleles[group]);
        }

        replaceAllele = false;
    };
}