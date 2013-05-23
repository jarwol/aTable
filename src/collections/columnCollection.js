var ColumnCollection = Backbone.Collection.extend(
    /** @lends ColumnCollection.prototype */
    {
        /**
         * @class The ATable's collection of {@link Column} models
         * @augments Backbone.Collection
         * @constructs
         */
        initialize : function () {
        },

        model : Column,

        /**
         * Comparator function to force sorting of the columns by their <strong>order</strong> attribute
         * @private
         * @param {Column} col Column model to be sorted
         * @return {int} order of the column in the table
         */
        comparator : function (col) {
            return col.get("order");
        },

        /**
         * Change the label (display name) of a column
         * @param {String} name unique column name
         * @param {String} newLabel new label for the column
         */
        renameColumn : function renameColumn(name, newLabel) {
            if (!newLabel) {
                throw "Invalid column name";
            }
            var col = this.get(name);
            if (col) {
                col.set({label : newLabel});
            }
        },

        /**
         * Move a column to a new spot in the collection
         * @param {int} src the column's current index in the collection
         * @param {int} dest the destination index
         */
        moveColumn : function moveColumn(src, dest) {
            var col1 = this.at(src);
            var col2 = this.at(dest);

            if (!col1) {
                throw "Invalid column index: " + src;
            }
            if (!col2) {
                throw "Invalid column index: " + dest;
            }
            var order1 = col1.get("order");
            var order2 = col2.get("order");
            var col;
            if (order1 < order2) {
                for (var i = order1 + 1; i <= order2; i++) {
                    col = this.at(i);
                    col.set({order : col.get("order") - 1});
                }
            }
            else {
                for (var j = order1 - 1; j >= order2; j--) {
                    col = this.at(j);
                    col.set({order : col.get("order") + 1});
                }
            }
            col1.set({order : order2});
            this.sort();
        }
    });