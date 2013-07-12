var RowCollection = (function () {
    return Backbone.Collection.extend(
        /** @lends RowCollection.prototype */
        {
            /**
             * @class Backbone Collection of {@link Row} models representing the dataset of the table
             * @augments Backbone.Collection
             * @constructs
             * @function initialize
             * @param {Row[]} models initial set of Row models to add to the collection
             * @param {Object} options hash of parameters
             * @param {ColumnCollection} options.columns the table's column collection
             * @param {int} [options.sortColumn] index of the column by which to sort the table
             * @param {Function} options.formatter function that formats the raw row data into the values display in the table
             * @param {boolean} [options.sortDescending=false] if true, sort the rows in descending order
             */
            initialize : function (models, options) {
                this.init = false;
                this.columnOrder = [];
                this.columns = options.columns;
                this.filterObj = null;
                this.visibleCount = models.length;
                this.formatter = options.formatter;
                if (options) {
                    this.sortColumn = options.sortColumn;
                    this.sortDescending = options.sortDescending !== null ? options.sortDescending : false;
                }
                else {
                    this.sortColumn = null;
                    this.sortDescending = false;
                }
                for (var i = 0; i < options.columns.length; i++) {
                    this.columnOrder.push(i);
                }
            },

            model : Row,

            /**
             * Get the table value at position (rowIdx, colIdx)
             * @function getValue
             * @param {int} rowIdx the row index of the cell
             * @param {int} colIdx the column index of the cell in the DOM table
             * @returns {*} the value of the table cell at index (row, col)
             */
            getValue : function (rowIdx, colIdx) {
                var row = this.at(rowIdx).get('row');
                var actualCol = this.columnOrder[colIdx];
                return row[actualCol];
            },

            /**
             * Set the value at position (rowIdx, ColIdx) to <b>val</b>
             * @function setValue
             * @param {int} rowIdx row index of the new value
             * @param {int} colIdx column index of the new value
             * @param {String} val new value to set
             */
            setValue : function(rowIdx, colIdx, val){
                var row = this.at(rowIdx).get('row');
                var actualCol = this.columnOrder[colIdx];
                row[actualCol] = val;
            },

            /**
             * Get the row values at a given index
             * @function getRow
             * @param {int} idx the row index
             * @returns {Array} array of values in the row
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
             * @function getColumnIndex
             * @param {int} col the index of the column in the DOM table
             * @returns {int} the column index in the collection
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
             * Filter the collection by setting visible=false on rows that don't contain filterStr in the specified column
             * @function filter
             * @param {int} colIdx index of the column to filter on
             * @param {*} filterStr check specified column for existence of this string
             * @param {boolean} [caseSensitive=false] do a case-sensitive search when filtering
             * @returns {boolean} true if the filter was applied, false otherwise
             */
            filter : function (colIdx, filterStr, caseSensitive) {
                filterStr = filterStr.toString();
                if (!this.filterObj || filterStr !== this.filter.str || this.filter.column !== colIdx || this.filter.caseSensitive !== caseSensitive) {
                    this.filterObj = {
                        str : filterStr,
                        column : colIdx,
                        caseSensitive : caseSensitive
                    };
                    this.visibleCount = 0;
                    var that = this;
                    this.each(function (row) {
                        if (!that.passesFilter(row.get('row'))) {
                            row.set({visible : false});
                        }
                        else {
                            row.set({visible : true});
                            that.visibleCount++;
                        }
                    });
                    return true;
                }
                return false;
            },

            /**
             * Determine whether a row passes the filter (if one exists)
             * @function passesFilter
             * @param {Array} row array of data representing a single row
             * @returns {boolean} true if the row passes the filter, false otherwise
             */
            passesFilter : function (row) {
                if (row && this.filterObj) {
                    var actualVal = row[this.columnOrder[this.filterObj.column]].toString();
                    var filterVal = this.filterObj.str;
                    if (!this.filterObj.caseSensitive) {
                        actualVal = actualVal.toUpperCase();
                        filterVal = filterVal.toUpperCase();
                    }
                    return actualVal.indexOf(filterVal) !== -1;
                }
                return true;
            },

            /**
             * Comparator function to sort rows according to the sort column's datatype
             * @private
             * @param {Row} row row model to sort
             * @returns {int} value to be compared against other rows to determine sorting
             */
            comparator : function (row) {
                var colIdx = this.columnOrder[this.sortColumn];
                var val = this.formatter(row.get('row')[colIdx], this.indexOf(row), colIdx, this.columns.at(colIdx).get('name'));
                var ret = 0;

                if (typeof val === "number") {
                    ret = val;
                }
                else if (typeof val === "object") {
                    if (val instanceof Date) {
                        ret = val.getTime();
                    }
                }
                else if (typeof val === "string") {
                    val = $("<div>" + val + "</div>").text();
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
            },

            /**
             * Override Backbone collection.add method to support row filtering
             * @function add
             * @param {Row|Row[]} rows Row model or array of models to add to this collection
             * @param {Object} options hash of options to pass to Backbone.Collection.add
             */
            add : function (rows, options) {
                options = options || {};
                if (Object.prototype.toString.call(rows) === "[object Array]") {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        if (!(row instanceof Row)) {
                            row = new Row(row);
                        }
                        var vis = this.passesFilter(row.get('row'));
                        row.set({visible : vis});
                        if (vis) this.visibleCount++;
                    }
                }
                else {
                    if (!(rows instanceof Row)) {
                        rows = new Row(rows);
                    }
                    var visible = this.passesFilter(rows.get('row'));
                    rows.set({visible : visible});
                    if (visible) this.visibleCount++;
                }
                if(typeof this.sortColumn !== "number") options.sort = false;
                Backbone.Collection.prototype.add.call(this, rows, options);
            },

            reset : function (rows, options) {
                options = options || {};
                this.visibleCount = 0;
                if(typeof this.sortColumn !== "number") options.sort = false;
                Backbone.Collection.prototype.reset.call(this, rows, options);
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