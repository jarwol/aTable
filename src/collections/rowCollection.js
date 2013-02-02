var RowCollection = Backbone.Collection.extend({
    initialize : function (models, options) {
        this.columnOrder = [];
        if (options) {
            this.sortColumn = options.sortColumn;
            this.sortAscending = options.sortAscending != null ? options.sortAscending : false;
        }
        else {
            this.sortColumn = null;
            this.sortAscending = false;
        }
        for (var i = 0; i < options.numColumns; i++) {
            this.columnOrder.push(i);
        }
    },

    model : Row,

    /**
     * Get the table value from a (row, col) index, taking into account possible re-ordering of the columns
     * @param {number} rowIdx the row index of the cell
     * @param {number} colIdx the column index of the cell in the rendered table
     * @return {*} the value of the table cell at index (row, col)
     */
    getValue : function (rowIdx, colIdx) {
        var row = this.at(rowIdx).get('row');
        var actualCol = this.columnOrder[colIdx];
        return row[actualCol];
    },

    /**
     * Get the row values at a given index, taking into account possible re-ordering of the columns
     * @param {number} idx the row index
     * @return {Array} correctly-ordered array of row values
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
     * Get the actual column index in the row/column collection based on the index in the rendered table
     * @param {number} col the index of the column in the rendered table
     * @return {number} the column index in the collections
     */
    getColumnIndex : function (col) {
        return this.columnOrder[col];
    },

    /**
     * Re-order the columns after a column move operation
     * @param {number} src source index of the column
     * @param {number} dest destination index of the column
     */
    moveColumn : function (src, dest) {
        var sortCol = null;
        if (typeof this.sortColumn !== 'undefined') {
            sortCol = this.columnOrder[this.sortColumn];
        }
        if (src < dest) {
            for (var i = src; i < dest; i++) {
                if (sortCol === this.columnOrder[i]) {
                    this.sortColumn++;
                }
                Util.swap(this.columnOrder, i, i + 1);
            }
        }
        else {
            for (var i = src; i > dest; i--) {
                if (sortCol === this.columnOrder[i]) {
                    this.sortColumn--;
                }
                Util.swap(this.columnOrder, i, i - 1);
            }
        }
    },

    /**
     * Set the sort column of the row matrix, taking into account possible re-ordering of the columns
     * @param {number} col index of the sort column in the rendered table
     */
    setSortColumn : function (col) {
        if (this.sortColumn === col) {
            this.sortAscending = !this.sortAscending;
        }
        else {
            this.sortColumn = col;
        }
    },

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
            if (this.sortAscending) {
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
        if (this.sortAscending) {
            return ret;
        }

        return -ret;
    }
});