var ColumnCollection = Backbone.Collection.extend(
    /** @lends ColumnCollection.prototype */
    {
        /**
         * @class The ATable's collection of {@link Column} models
         * @augments Backbone.Collection
         * @constructs
         */
        initialize : function () {
            this.modelsByName = {};
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

        getByName : function getByName(name) {
            return this.modelsByName[name];
        },

        renameColumn : function renameColumn(field, newName) {
            if (!newName) {
                throw "Invalid column name";
            }
            var col = this.modelsByName[field];
            if (col) {
                col.set({
                    name : newName
                });
            }
        },

        /**
         * Move a column to a new spot in the collection
         * @private
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
        },

        add : function add(models, options) {
            var that = this;
            models = _.isArray(models) ? models.slice() : [ models ];
            var newModels = [];
            _.forEach(models, function (col) {
                if (!(col instanceof Backbone.Model)) {
                    col = new Column(col);
                }
                if (!that.modelsByName[col.get('name')]) {
                    that.modelsByName[col.get('name')] = col;
                }
                newModels.push(col);
            });
            Backbone.Collection.prototype.add.call(this, newModels, options);
        },

        remove : function remove(models, options) {
            var that = this;
            models = _.isArray(models) ? models.slice() : [ models ];
            _.forEach(models, function (col) {
                if (that.modelsByName[col.get('name')]) {
                    delete that.modelsByName[col.get('name')];
                }
            });
            Backbone.Collection.prototype.remove.call(this, models, options);
        },

        reset : function reset(models, options) {
            this.modelsByName = {};
            Backbone.Collection.prototype.reset.call(this, models, options);
        }
    });