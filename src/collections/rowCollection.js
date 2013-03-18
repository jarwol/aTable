var RowCollection = (function () {
    return Backbone.Collection.extend(
        /** @lends RowCollection.prototype */
        {
            /**
             * @class Backbone Collection of {@link Row} models representing the dataset of the table
             * @augments Backbone.Collection
             * @constructs
             * @param models initial set of {@link Row} models to add to the collection 
             * @param {Object} options hash of parameters
             * @param {int} [options.sortColumn] index of the column by which to sort the table
             * @param {boolean} [options.sortDescending=false] if true, sort the rows in descending order
             */
        initialize : function (models, options) {
            this.columnOrder = [];
            if (options) {
                this.sortColumn = options.sortColumn;
                this.sortDescending = options.sortDescending !== null ? options.sortDescending : false;
            }
            else {
                this.sortColumn = null;
                this.sortDescending = false;
            }
            for (var i = 0; i < options.numColumns; i++) {
                this.columnOrder.push(i);
            }
        },

        model : Row,

        /**
         * Get the table value at position (rowIdx, colIdx)
         * @param {int} rowIdx the row index of the cell
         * @param {int} colIdx the column index of the cell in the DOM table
         * @return {*} the value of the table cell at index (row, col)
         */
        getValue : function (rowIdx, colIdx) {
            var row = this.at(rowIdx).get('row');
            var actualCol = this.columnOrder[colIdx];
            return row[actualCol];
        },

        /**
         * Get the row values at a given index
         * @param {int} idx the row index
         * @return {Array} array of values in the row
         */
        getRow : function (idx) {
            var row = this.at(idx).get('row');
            var ret = [];
            for (var i = 0; i < row.length; i++) {
                var col = this.columnOrder[i];
                ret.push(row[col]);
            }
            return ret;
        },

        /**
         * Get the actual column index in the column collection from the index in the DOM table
         * @param {int} col the index of the column in the DOM table
         * @return {int} the column index in the collection
         */
        getColumnIndex : function (col) {
            return this.columnOrder[col];
        },

        /**
         * Re-order the columns after a column move operation
         * @private
         * @param {int} src source index of the column
         * @param {int} dest destination index of the column
         */
        moveColumn : function (src, dest) {
            if (src < dest) {
                if (this.sortColumn > src && this.sortColumn <= dest) {
                    this.sortColumn--;
                }
                else if (this.sortColumn === src) {
                    this.sortColumn = dest;
                }
                for (var i = src; i < dest; i++) {
                    swap(this.columnOrder, i, i + 1);
                }
            }
            else {
                if (this.sortColumn < src && this.sortColumn >= dest) {
                    this.sortColumn++;
                }
                else if (this.sortColumn === src) {
                    this.sortColumn = dest;
                }
                for (var j = src; j > dest; j--) {
                    swap(this.columnOrder, j, j - 1);
                }
            }
        },

        /**
         * Set the sort column of the row matrix
         * @private
         * @param {int} col index of the sort column in the rendered table
         */
        setSortColumn : function (col) {
            if (this.sortColumn === col) {
                this.sortDescending = !this.sortDescending;
            }
            else {
                this.sortColumn = col;
            }
        },

        /**
         * Comparator function to sort rows according to the sort column its datatype
         * @private
         * @param {Row} row row model to sort
         * @return {int} value to be compared against other rows to determine sorting
         */
        comparator : function (row) {
            var val = row.get('row')[this.columnOrder[this.sortColumn]];
            var ret = null;

            if (typeof val === "number") {
                ret = val;
            }
            else if (typeof val === "object") {
                if (val instanceof Date) {
                    ret = val.getTime();
                }
                else {
                    ret = 0;
                }
            }
            else if (typeof val === "string") {
                if (!this.sortDescending) {
                    return val;
                }
                else {
                    val = val.toLowerCase();
                    val = val.split("");
                    val = _.map(val, function (letter) {
                        return String.fromCharCode(-(letter.charCodeAt(0)));
                    });
                    return val.join('');
                }
            }
            if (!this.sortDescending) {
                return ret;
            }
            return -ret;
        }
    });

    /**
     * Swap two elements in an array
     * @private
     * @param {Array} arr the array
     * @param {int} i first element's index
     * @param {int} j second element's index
     */
    function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
})();