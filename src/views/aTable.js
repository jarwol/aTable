var ATable = (function () {
    var BUFFER_ROWS = 5;
    var RESIZE_PIXELS = 7;
    var MIN_COLUMN_WIDTH = 20;

    return Backbone.View.extend(
        /** @lends ATable.prototype */
        {
            /**
             * @class The master Backbone View that instantiates the table. The constructor accepts a hash of parameters.
             * @augments Backbone.View
             * @constructs
             * @param {Object} options hash of parameters
             * @param {Object[]} options.columns array of objects defining the table columns. Each object has the following properties:
             * @param {String} options.columns.name name of the column. This value must be unique.
             * @param {String} [options.columns.label=name] displayed name of the column. Unlike name, the label need not be unique.
             * @param {int} [options.columns.width] explicit width of the column in pixels
             * @param {boolean} [options.columns.resizable=true] set whether the column is resizable. This value takes precedence over <strong>options.resizableColumns</strong>.
             * @param {boolean} [options.columns.sortable=true] set whether the table can be sorted on this column. This value takes precedence over <strong>options.sortableColumns</strong>.
             * @param {boolean} [options.columns.visible=true] set whether the column is visible
             * @param {String} [options.columns.cellClasses] space-separated list of CSS classes to apply to the content of all of this column's cells
             * @param {String|Function} options.dataFunction The dataFunction parameter can be one of two values:
             * <li>{String} the id of a <strong>&lt;script&gt;</strong> element containing a function which has the same name as the script id.
             * The function should call <strong>self.postMessage({data: rows, append: append});</strong> where <i>rows</i> is a 2-dimensional array of table values. If <i>append</i> is true, rows will be added to the table.
             * If false, the rows will completely replace the existing table.</li>
             * <li>{Function} a function responsible for generating the table's dataset. It should have one parameter, <strong>atable</strong>, and call <strong>atable.receivedData(rows, append);</strong> to deliver data to the table</li><br/>
             * *Note that both methods of returning table data may do so many times (e.g. a loop that continuously uses ajax polling to get new data from the server).
             * @param {String} options.el CSS selector of the DOM element in which to insert the rendered table
             * @param {int} options.height max height of the table in pixels
             * @param {boolean} [options.resizableColumns=true] set whether table columns are resizable
             * @param {boolean} [options.movableColumns=true] set whether table columns are movable
             * @param {boolean} [options.sortableColumns=true] set whether clicking on column headers sorts the table
             * @param {String} [options.cellClasses] space-separated list of CSS classes to apply to the content of all the cells in the table
             * @param {String} [options.sortColumn] name of the column by which to sort the table
             * @see http://jarwol.com/aTable
             */
            initialize : function (options) {
                _.bindAll(this);
                if (typeof options.dataFunction === "string") {
                    this.dataWorker = createDataWorker(options.dataFunction, this.receivedData);
                }
                else if (typeof options.dataFunction === "function") {
                    this.dataFunction = options.dataFunction;
                }
                this.formatter = options.formatter || function (val, row, col, colName) {
                    return val
                };
                this.browser = detectBrowser();
                this.renderTable = true;
                this.dataAppended = false;
                var err = validateTableArgs(options);
                if (err) throw err;
                setDefaultParameters(options);
                /**
                 * The collection of Column models representing the table columns
                 * @type {ColumnCollection}
                 */
                this.columns = initColumns(options);
                this.columns.bind("reset", this.render, this);
                this.columns.bind("sort", this.render, this);
                this.columns.bind("change:visible", this.render, this);
                this.movableColumns = options.movableColumns;
                if (typeof options.sortColumn === "string") {
                    var i = this.columns.indexOf(options.sortColumn);
                    if (i > 0) {
                        options.sortColumn = i;
                    }
                    else {
                        options.sortColumn = 0;
                    }
                }
                options.numColumns = this.columns.length;
                /**
                 * The collection of Row models containing the table's data
                 * @type {RowCollection}
                 */
                this.rows = new RowCollection([], options);
                this.height = options.height;
                this.prevScrollTop = 0;
                /**
                 * Unique id of this atable on the page
                 * @type {int}
                 */
                this.atableId = 0;
            },

            events : {
                "click th" : "onClickColumnHeader",
                "mousemove th" : "onMouseMoveColumnHeader",
                "mouseleave th" : "onMouseLeaveColumnHeader",
                "dragstart th" : "onStartDragColumnHeader",
                "dragend" : "onEndDragColumnHeader",
                "dragenter th div" : "onDragEnterColumnHeader",
                "dragover th div" : "onDragOverColumnHeader",
                "dragleave th div" : "onDragLeaveColumnHeader",
                "drop th div" : "onDropColumnHeader",
                "blur td div" : "onCellValueChanged"
            },

            /**
             * Generates the ATable and adds it to the DOM
             * @param {function} [callback] function to call when the ATable is rendered
             * @return {ATable} a reference to this ATable
             */
            render : function (callback) {
                if (typeof callback === 'function') {
                    this.renderCallback = _.once(callback);
                }
                var params = {};
                if (!this.rows.init) {
                    this.rows.bind("reset", this.render, this);
                    this.rows.bind("sort", this.render, this);
                    if (this.dataWorker) {
                        this.dataWorker.postMessage(null);
                    }
                    else {
                        this.dataFunction(this);
                    }
                    return this;
                }
                else if (this.renderTable === true) {
                    this.renderTable = false;
                    params.columns = this.columns.toJSON();
                    params.rows = getRowData(this.rows);
                    params.visibleCount = this.rows.visibleCount;
                    if (this.tbodyElt) {
                        this.prevScrollTop = this.tbodyElt[0].scrollTop;
                    }
                    this.generateTableHtml(params);
                    var cols = this.tableElt.find("th");
                    for (var i = 0; i < cols.length; i++) {
                        this.columns.at(i).set('element', $(cols[i]));
                    }
                    this.tbodyElt[0].scrollTop = this.prevScrollTop;
                    $("tbody:not(.scrollBound)").addClass("scrollBound").bind('scroll', this.onTableScrolled);
                    this.sizeTable();
                    if (typeof this.rows.sortColumn === "number") {
                        this.displaySortArrow(this.columns.at(this.rows.sortColumn).get('name'), this.rows.sortDescending);
                    }
                    if (typeof this.renderCallback === 'function') {
                        this.renderCallback();
                    }
                }
                else {
                    this.renderRows(this.prevScrollTop, this.tbodyElt[0].scrollTop);
                }
                return this;
            },

            /**
             * Add/remove rows from the DOM, or replace data in the current rows
             * @private
             * @param {int} prevScrollTop previous scrollTop value in pixels
             * @param {int} scrollTop current scrollTop value in pixels
             */
            renderRows : function (prevScrollTop, scrollTop) {
                var first, last;
                var addedRows = (this.rowRange.last - this.rowRange.first) - (this.rowRange.prevLast - this.rowRange.prevFirst);
                var max = this.visibleRows + BUFFER_ROWS;
                if (scrollTop < prevScrollTop) {
                    first = this.rowRange.first;
                    last = this.rowRange.prevFirst;
                    if (this.rowRange.last <= this.rowRange.prevFirst) {
                        first = this.rowRange.first;
                        last = this.rowRange.last;
                    }
                    this.removeRows(last - first - addedRows, false);
                    this.addRows(first, last, true);
                    adjustBufferRowHeights(this.tbodyElt[0], this.rows, this.rowHeight, this.rowRange.first);
                }
                else if (scrollTop > prevScrollTop) {
                    first = this.rowRange.prevLast;
                    last = this.rowRange.last;

                    if (this.rowRange.first >= this.rowRange.prevLast) {
                        first = this.rowRange.first;
                        last = this.rowRange.last;
                    }
                    this.removeRows(last - first - addedRows, true);
                    this.addRows(first, last, false);
                    adjustBufferRowHeights(this.tbodyElt[0], this.rows, this.rowHeight, this.rowRange.first);
                }
                else if (this.dataAppended) {
                    this.dataAppended = false;
                    if (this.rowRange.last < this.rows.visibleCount && this.rowRange.last < max) {
                        first = this.rowRange.last;
                        last = this.rows.visibleCount;
                        if (last > max) last = max;
                        this.addRows(first, last, false);
                        this.rowRange.last = last;
                    }
                    adjustBufferRowHeights(this.tbodyElt[0], this.rows, this.rowHeight, this.rowRange.first);
                    this.resizeIndicator.style.height = (this.tableElt.height() + 1) + "px";
                }
                else {
                    this.refreshRows(this.rowRange.first);
                    return;
                }
                this.scrollbarWidth = getScrollbarWidth(this.tbodyElt[0]);
                if (this.scrollbarWidth > 0) {
                    var cols = this.tableElt.find('th');
                    var lastColWidth = this.columns.get(cols[cols.length - 1].getAttribute('data-column')).get('width');
                    this.resizeColumnElements(cols.length - 1, lastColWidth);
                }
                this.prevScrollTop = this.tbodyElt[0].scrollTop;
            },

            /**
             * Append or prepend table rows to the DOM
             * @private
             * @param {int} start index in the row data collection of the first row to add
             * @param {int} end index in the row data collection of the last row to add
             * @param {boolean} prepend add rows to the beginning of the table
             */
            addRows : function (start, end, prepend) {
                var firstRow = this.tbodyElt[0].firstChild;
                var lastRow = this.tbodyElt[0].lastChild;
                var rowToInsertBefore = prepend ? firstRow.nextElementSibling : lastRow;
                for (var i = start; i < end; i++) {
                    this.addRow(i, rowToInsertBefore);
                }
            },

            /**
             * Add a new row to the DOM
             * @private
             * @param {int} index which row in the RowCollection to add to the DOM
             * @param {HTMLRowElement} rowToInsertBefore DOM row that the new row will precede
             */
            addRow : function (index, rowToInsertBefore) {
                var tr = document.createElement("tr");
                tr.setAttribute("data-row", index);
                for (var i = 0; i < this.columns.length; i++) {
                    var col = this.columns.at(i);
                    if (col.get('visible')) {
                        var div = document.createElement("div");
                        if (col.get('cellClasses')) {
                            div.setAttribute('class', col.get('cellClasses'));
                        }
                        var width = col.get('width');
                        div.style.width = width + "px";
                        div.innerHTML = this.formatter(this.rows.getValue(index, i), index, i, col.get('name'));
                        var td = document.createElement("td");
                        td.appendChild(div);
                        tr.appendChild(td);
                    }
                }
                this.tbodyElt[0].insertBefore(tr, rowToInsertBefore);
            },

            /**
             * Remove table rows from the DOM
             * @private
             * @param {int} numRows number of rows to remove
             * @param {boolean} removeFromBeginning remove rows from the beginning of the table
             */
            removeRows : function (numRows, removeFromBeginning) {
                var start, end;
                if (numRows > this.visibleRows + BUFFER_ROWS * 2) {
                    numRows = this.visibleRows + BUFFER_ROWS * 2;
                }
                if (removeFromBeginning) {
                    start = 2;
                    end = numRows + 2;
                }
                else {
                    var count = this.tbodyElt[0].childElementCount - 2;
                    start = count + 2 - numRows;
                    end = count + 2;
                }
                for (var i = start; i < end; i++) {
                    this.tableElt[0].deleteRow(start);
                }
            },

            /**
             * Refresh the data in the rendered table rows with what is currently in the row data collection
             * @private
             * @param {int} firstRow index of the first row rendered
             */
            refreshRows : function (firstRow) {
                var rows = this.tbodyElt[0].getElementsByTagName("tr");
                for (var i = 1; i < rows.length - 1; i++) {
                    var tr = rows[i];
                    tr.setAttribute("data-row", firstRow + i - 1);
                    var tdList = tr.getElementsByTagName("div");
                    for (var j = 0; j < tdList.length; j++) {
                        var div = tdList[j];
                        div.innerHTML = this.rows.getValue(firstRow + i - 1, j);
                    }
                }
            },

            /**
             * Explicitly set the width of the table based on the sum of the column widths
             * @private
             */
            sizeTable : function () {
                var cols = this.tableElt.find("th");
                var newWidth = 0;
                for (var i = 0; i < cols.length; i++) {
                    newWidth += $(cols[i])[0].offsetWidth;
                }
                this.tableElt.width(newWidth);
                this.parentElt.width(newWidth);
            },

            /* TODO - implement add/remove
             addColumn : function (col) {
             var column = this.columns.get(this.columnTarget);
             if (!this.columns.get(col) && this.availableColumnsHash[col]) {
             // Increase the ordering of columns after insert
             var order = column.get("order");
             for (var i = order; i < this.columns.length; i++) {
             var val = this.columns.at(i);
             val.set({
             order : val.get("order") + 1
             }, {
             silent : true
             });
             }
             var textWidth = getTextWidth(col) + 15;
             this.columns.add({
             columnName : col,
             entityField : col,
             blotterName : this.blotterType,
             order : order,
             width : textWidth
             });
             this.columns.save(this.admin);
             }
             },

             removeColumn : function (name) {
             var col = this.columns.get(name);
             col.destroy();
             // Decrease the ordering of columns after delete
             for (var i = col.get('order'); i < this.columns.length; i++) {
             var val = this.columns.at(i);
             val.set({
             order : val.get("order") - 1
             });
             }
             },
             */

            /**
             * Filter the table by displaying only rows which contain <b>filterStr</b> in the contents of <b>column</b>
             * @param {String} column name of the column to filter on
             * @param {String} filterStr check specified column for existence of this string
             * @param {boolean} [caseSensitive=false] use caseSensitive filtering
             */
            filter : function (column, filterStr, caseSensitive) {
                var col = this.columns.get(column);
                if (!col) throw "Invalid column name";
                if (this.rows.filter(col.get('order'), filterStr, caseSensitive)) {
                    this.renderTable = true;
                    this.render();
                }
            },

            /**
             * Change the label (display name) of a column
             * @param {String} name unique name of the column
             * @param {String} newLabel new label for the column
             */
            renameColumn : function (name, newLabel) {
                this.columns.renameColumn(name, newLabel);
            },

            /**
             * Move a column to a different position, shifting all columns in between
             * @param {String|int} column name or position of the column to be moved
             * @param {String|int} dest name of the column currently in the desired position, or the position itself
             */
            moveColumn : function (column, dest) {
                var col, destCol;
                if (typeof column === "string") {
                    col = this.columns.get(column);
                }
                else if (typeof column === "number") {
                    col = this.getColumnByPosition(column);
                }
                if (typeof dest === "string") {
                    destCol = this.columns.get(dest);
                }
                else if (typeof dest === "number") {
                    destCol = this.getColumnByPosition(dest);
                }
                if (!col) throw "Invalid source column: " + column;
                if (!destCol) throw "Invalid dest column: " + dest;
                if (column === dest) return;
                this.renderTable = true;
                this.renderCallback = function () {
                    this.trigger("moveColumn", col.get('name'), col.get('order'), destCol.get('order'));
                };
                this.rows.moveColumn(col.get('order'), destCol.get('order'));
                this.columns.moveColumn(col.get('order'), destCol.get('order'));
            },

            /**
             * Resize a column. Causes the table to re-render.
             * @param {String} column name of the column to resize
             * @param {int} newWidth new column width in pixels
             */
            resizeColumn : function (column, newWidth) {
                var col = this.columns.get(column);
                if (!col) throw "Invalid column name: " + column;
                if (newWidth < MIN_COLUMN_WIDTH) newWidth = MIN_COLUMN_WIDTH;
                col.set('width', newWidth);
                this.resizeColumnElements(col.get('element')[0].cellIndex, newWidth);
            },

            /**
             * Sort the table rows by the specified column and order
             * @param {String} column name of the column to sort on
             * @param {boolean} [descending=false] sort in descending order
             */
            sort : function (column, descending) {
                var col = this.columns.get(column);
                if (!col) throw "Invalid column name: " + column;
                this.rows.setSortColumn(col.get('order'));
                if (typeof descending === "boolean") {
                    this.rows.sortDescending = descending;
                }
                this.displaySortArrow(column, this.rows.sortDescending);
                this.rows.sort();
            },

            /**
             * Make a column visible, causing it to render
             * @param {String} name unique column name
             */
            showColumn : function (name) {
                var column = this.columns.get(name);
                if (column) {
                    this.renderTable = true;
                    column.set({visible : true});
                    this.renderTable = false;
                }
                else {
                    throw "Invalid column name: " + name;
                }
            },

            /**
             * Make a column invisible, causing it to not render
             * @param {String} name unique column name
             */
            hideColumn : function (name) {
                var column = this.columns.get(name);
                if (column) {
                    this.renderTable = true;
                    column.set({visible : false});
                    this.renderTable = false;
                }
                else {
                    throw "Invalid column name: " + name;
                }
            },

            /**
             * Returns the Column given its position in the set of <strong>visible</strong> columns
             * @param {int} position index of the column, ignoring any invisible columns
             * @returns {Column} the column model at <strong>position</strong>, or null if the position is invalid
             */
            getColumnByPosition : function (position) {
                var cols = this.tableElt.find('th');
                if (position < 0 || position > cols.length) return null;
                return this.columns.get(cols[position].getAttribute('data-column'));
            },

            /**
             * Determine the rows that should be rendered in the DOM based on the scroll position
             * @private
             * @param {jQuery.Event} e jQuery scroll event
             */
            onTableScrolled : function (e) {
                if (this.prevScrollTop !== e.target.scrollTop) {
                    var firstVisibleRow = parseInt(e.target.scrollTop / this.rowHeight, 10);
                    var firstRenderedRow = firstVisibleRow - BUFFER_ROWS;
                    if (firstRenderedRow < 0) firstRenderedRow = 0;
                    this.rowRange.prevFirst = this.rowRange.first;
                    this.rowRange.prevLast = this.rowRange.last;
                    this.rowRange.first = firstRenderedRow;
                    this.rowRange.last = firstVisibleRow + this.visibleRows + BUFFER_ROWS;
                    if (this.rowRange.last > this.rows.visibleCount) {
                        this.rowRange.last = this.rows.visibleCount;
                        this.rowRange.first = Math.max(0, this.rowRange.last - this.visibleRows - BUFFER_ROWS);
                    }
                    this.renderRows(this.prevScrollTop, e.target.scrollTop);
                }
            },

            /**
             * Set the cursor to e-resize if mouse is in between column headers
             * @private
             * @param {jQuery.Event} e jQuery mouse event
             */
            onMouseMoveColumnHeader : function (e) {
                var col = getResizeColumn(e);
                var th = $(e.target).closest("th")[0];
                if (!col || !this.columns.get(col).get('resizable')) {
                    th.style.cursor = null;
                }
                else {
                    th.style.cursor = "e-resize";
                }
            },

            /**
             * Ensure the resize cursor style is removed when the cursor leaves a column header
             * @private
             * @param {jQuery.Event} e jQuery mouseleave event
             */
            onMouseLeaveColumnHeader : function (e) {
                var th = $(e.target).closest("th")[0];
                th.style.cursor = null;
            },

            /**
             * Sort the row collection when a column header is clicked
             * @private
             * @param {jQuery.Event} e jQuery click event object
             */
            onClickColumnHeader : function (e) {
                if (!getResizeColumn(e)) {
                    var th = $(e.target).closest("th")[0];
                    if (this.columns.get(th.getAttribute('data-column')).get('sortable')) {
                        this.sort(th.getAttribute('data-column'));
                    }
                }
            },

            /**
             * Event handler for the start of a column drag (move or resize)
             * @private
             * @param {jQuery.Event} e jQuery dragstart event
             */
            onStartDragColumnHeader : function (e) {
                var target = $(e.target);
                var col = getResizeColumn(e);
                // Mouse in resize position
                if (col) {
                    var column = this.columns.get(col);
                    target = column.get('element');
                    if (!column.get('resizable')) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        return false;
                    }
                    var posCol = target.offset();
                    var posTable = this.tableElt.parent().offset();
                    var height = this.tableElt.height() + 1;
                    var leftPad = target.css("padding-left");
                    var rightPad = target.css("padding-right");
                    var left, diff;
                    if (posCol.left < posTable.left) {
                        left = posTable.left;
                        diff = posTable.left - posCol.left;
                    }
                    else {
                        left = posCol.left;
                        diff = 0;
                    }
                    // subtract 5 from width because if the grayout div overlaps the cursor, dragend is immediately invoked
                    var width = target.width() - diff + Number(leftPad.substring(0, leftPad.length - 2))
                        + Number(rightPad.substring(0, rightPad.length - 2)) - 5;
                    $(this.resizeIndicator).css("display", "block").css("left", left).css("top", posCol.top - 1).css("height", height)
                        .css("width", width).attr('data-column', target[0].getAttribute('data-column'));
                    // Some browsers implement drag-and-drop differently, making it a poor choice for resize functionality
                    //  use mousemove/mouseup events instead
                    document.addEventListener('mousemove', this.onDragResizeIndicator, false);
                    document.addEventListener('mouseup', this.onEndDragColumnHeader, false);
                    e.preventDefault();
                }
                // User is moving the column
                else if (this.movableColumns) {
                    e.target.style.opacity = 0.35;
                    e.originalEvent.dataTransfer.setData("text", this.atableId + '.' + target[0].getAttribute('data-column'));
                }
                else {
                    e.preventDefault();
                }
            },

            /**
             * Grow or shrink the resize indicator as the mouse moves
             * @private
             * @param {MouseEvent} e dragover event
             */
            onDragResizeIndicator : function (e) {
                var pos = $(this.resizeIndicator).offset();
                var column = this.columns.get(this.resizeIndicator.getAttribute("data-column"));
                var width = e.pageX - pos.left;
                if (width < MIN_COLUMN_WIDTH) {
                    width = MIN_COLUMN_WIDTH;
                }
                this.resizeIndicator.style.width = width + "px";
            },

            /**
             * Resize a column when the resize operation ends or return the target column to its original style during a move operation
             * @private
             * @param {Event} e jQuery dragend event
             */
            onEndDragColumnHeader : function (e) {
                if ($(this.resizeIndicator).css("display") === "none") {
                    e.target.style.opacity = null;
                }
                else {
                    document.removeEventListener('mousemove', this.onDragResizeIndicator, false);
                    document.removeEventListener('mouseup', this.onDragResizeIndicator, false);
                    var gray = this.resizeIndicator;
                    var width = parseInt(e.clientX - $(gray).position().left, 10);
                    var grayWidth = gray.scrollWidth;
                    var col = this.columns.get(gray.getAttribute('data-column'));
                    var posCol = col.get('element').offset();
                    var posTable = this.tableElt.parent().offset();
                    if (posCol.left < posTable.left) {
                        grayWidth += (posTable.left - posCol.left);
                    }
                    width = width < grayWidth ? grayWidth : width;
                    gray.style.display = "none";
                    this.resizeColumn(col.get('name'), width);
                }
            },

            /**
             * Style the column header to indicate the dragged column may be moved there
             * @private
             * @param {jQuery.Event} e jQuery dragenter event
             */
            onDragEnterColumnHeader : function (e) {
                var col = e.originalEvent.dataTransfer.getData("text");
                var th = $(e.target).closest("th")[0];
                if (th.getAttribute('data-column') !== col) {
                    $(th.firstChild).addClass("over");
                }
            },

            /**
             * Prevent browser default drag and drop behavior
             * @private
             * @param {jQuery.Event} e jQuery dragover event
             */
            onDragOverColumnHeader : function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
            },

            /**
             * Return the column header style to normal when a column is no longer being dragged over it
             * @private
             * @param {jQuery.Event} e jQuery dragleave event
             */
            onDragLeaveColumnHeader : function (e) {
                $(e.target).removeClass("over");
            },

            /**
             * Initiate a move when a column is successfully dragged onto another column
             * @private
             * @param {jQuery.Event} e jQuery drop event
             */
            onDropColumnHeader : function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                var data = e.originalEvent.dataTransfer.getData("text");
                var parts = data.split('.');
                if (this.movableColumns && parts[0] == this.atableId) {
                    var srcCol = parts[1];
                    var destCol = e.target.parentNode.getAttribute('data-column');
                    if (e.target.tagName === "TH") {
                        destCol = e.target.getAttribute('data-column');
                    }
                    this.moveColumn(srcCol, destCol);
                }
                if (e.target.tagName === "TH") {
                    $(e.target.firstChild).removeClass("over");
                }
                else {
                    $(e.target).removeClass("over");
                }
            },

            /**
             * Modify the data in the row collection when the user edits a cell
             * @param {jQuery.Event} e jQuery blur event
             */
            onCellValueChanged : function (e) {
                var oldVal = e.target.getAttribute('data-origVal');
                var val = e.target.innerHTML;
                if (oldVal !== val) {
                    e.target.setAttribute('data-origVal', val);
                    var rowNum = e.target.parentNode.parentNode.getAttribute('data-row');
                    this.rows.setValue(parseInt(rowNum, 10), e.target.parentNode.cellIndex, val);
                }
            },

            /**
             * Add an arrow indicating sort direction on the sort column header
             * @private
             * @param {String} column the name of the sort column
             * @param {boolean} descending table is sorted descending
             */
            displaySortArrow : function (column, descending) {
                var arrow = this.tableElt.find('.sortArrow');
                if (!arrow.length) {
                    arrow = document.createElement("div");
                    arrow.className = "sortArrow";
                }
                else {
                    arrow = arrow[0];
                    var divWidth = arrow.parentNode.scrollWidth;
                    this.resizeColumnElements(arrow.parentNode.parentNode.cellIndex, divWidth - arrow.scrollWidth);
                    arrow.parentNode.removeChild(arrow);
                }
                if (descending) {
                    arrow.innerHTML = "&darr;";
                }
                else {
                    arrow.innerHTML = "&uarr;";
                }
                var col = this.columns.get(column).get('element')[0];
                col.firstChild.insertBefore(arrow, col.firstChild.firstChild);
                this.resizeColumnElements(col.cellIndex, col.firstChild.scrollWidth + arrow.scrollWidth);
            },

            /**
             * Ensure all of the cells in a column are the correct width
             * @private
             * @param {int} cellIndex index of the column in the DOM
             * @param {int} width width in pixels
             */
            resizeColumnElements : function (cellIndex, width) {
                var headers = this.tableElt.find("th");
                headers[cellIndex].firstChild.style.width = width + "px";
                var col = this.columns.get(headers[cellIndex].getAttribute('data-column'));
                col.set({width : width});
                if (cellIndex === headers.length - 1) {
                    width -= this.scrollbarWidth;
                }
                this.tbodyElt.find('td:nth-child(' + (cellIndex + 1) + ')>div').each(function () {
                    this.style.width = width + "px";
                });
                this.sizeTable();
            },

            /**
             * Generate the actual table markup and add it to the DOM
             * @private
             * @param {Object} params Parameters needed to render the table
             * @return {DocumentFragment} the table DocumentFragment ready to be inserted into the DOM
             */
            generateTableHtml : function (params) {
                var topRowHeight = 0;
                var lastCol;
                if (this.tbodyElt) {
                    var height = this.tbodyElt[0].firstChild.style.height;
                    topRowHeight = height.substr(0, height.length - 2);
                }
                var headerRow = '<tr>';
                for (var i = 0; i < params.columns.length; i++) {
                    if (params.columns[i].visible) {
                        lastCol = params.columns[i];
                        var widthStr = '';
                        var classStr = '';
                        widthStr = 'style="width: ' + (params.columns[i].width) + 'px;"';
                        if (params.columns[i].sortable) {
                            classStr = ' class="sortable"';
                        }
                        headerRow += '<th draggable="true" ' + classStr + ' data-column="' + params.columns[i].name + '"><div ' + widthStr + '>' + params.columns[i].label + '</div></th>';
                    }
                }
                headerRow += '</tr>';

                var frag = document.createDocumentFragment();
                var parent = document.createElement("div");
                parent.className = "atableParent";
                var table = document.createElement("table");
                table.className = "atable";
                parent.appendChild(table);
                var thead = document.createElement("thead");
                table.appendChild(thead);
                var tbody = document.createElement("tbody");
                tbody.style.maxHeight = this.height + "px";
                table.appendChild(tbody);
                frag.appendChild(parent);
                if (!this.resizeIndicator) {
                    createResizeIndicator(this);
                    frag.appendChild(this.resizeIndicator);
                }
                if (this.parentElt) {
                    this.el.removeChild(this.parentElt[0]);
                }
                this.el.appendChild(frag);

                this.tableElt = $(table);
                this.parentElt = $(parent);
                this.tbodyElt = $(tbody);

                if (!this.rowHeight) {
                    var row = document.createElement("tr");
                    row.innerHTML = "<td>0</td>";
                    row.style.visibility = "hidden";
                    row.style.position = "absolute";
                    tbody.appendChild(row);
                    this.rowHeight = $(row).outerHeight();
                    tbody.removeChild(row);
                    this.visibleRows = parseInt(this.height / this.rowHeight, 10);
                }
                if (!this.rowRange) {
                    var last = this.visibleRows + BUFFER_ROWS;
                    if (last > params.visibleCount) {
                        last = params.visibleCount;
                    }
                    this.rowRange = {
                        first : 0,
                        last : last,
                        prevFirst : 0,
                        prevLast : last
                    };
                }

                var body = "<tr style='height: " + topRowHeight + "px;'></tr>";
                var displayCount = 0;
                for (var j = this.rowRange.first; j < params.rows.length && displayCount < this.rowRange.last; j++) {
                    if (params.rows[j].visible) {
                        body += '<tr data-row="' + j + '">';
                        for (var k = 0; k < params.rows[j].row.length; k++) {
                            if (params.columns[k].visible) {
                                var width = params.columns[k].width;
                                var editable = params.columns[k].editable ? "contenteditable='true' " : '';
                                var classes = "";
                                if (params.columns[k].cellClasses) {
                                    classes = " class='" + params.columns[k].cellClasses + "'";
                                }
                                var value = this.formatter(params.rows[j].row[k], j, k, params.columns[k].name);
                                body += '<td' + classes + '><div data-origVal="' + value + '" ' + editable + 'style="width: ' + width + 'px;">' + params.rows[j].row[k] + '</div></td>';
                            }
                        }
                        body += '</tr>';
                        displayCount++;
                    }
                }
                body += "<tr style='height: " + (this.rowHeight * (params.visibleCount - this.visibleRows - BUFFER_ROWS) - topRowHeight) + "px;'></tr>";
                $(thead).html(headerRow);
                $(tbody).html(body);
                this.scrollbarWidth = getScrollbarWidth(tbody);
                if (this.scrollbarWidth > 0) {
                    var lastColWidth = lastCol.width;
                    $(tbody).find('td:last-child>div').width(lastColWidth - this.scrollbarWidth);
                }
            },

            /**
             * Update the row collection with new data from the data function
             * @param {Array[]} data matrix of row data returned by the data function
             * @param {boolean} [append] if true, append new rows to the dataset, otherwise replace the dataset
             */
            receivedData : function (data, append) {
                this.scrollTop = this.$el.find(".table").scrollTop();
                if (!this.rows.init) {
                    this.rows.init = true;
                }
                var rows = [];
                for (var i = 0; i < data.length; i++) {
                    rows.push(new Row({row : data[i]}));
                }
                if (append) {
                    this.dataAppended = true;
                    this.rows.add(rows);
                    this.render();
                }
                else {
                    this.rows.reset(rows);
                }
            },

            /**
             * Remove this aTable from the DOM, and unbind all events
             */
            close : function () {
                if (this.resizeIndicator) {
                    document.removeChild(this.resizeIndicator);
                }
                this.remove();
                this.unbind();
            }
        });

    /**
     * Set the heights of the top and bottom buffer row in order to keep the scrollbar size/position correct
     * @private
     * @param {HTMLElement} tbody the table's tbody element
     * @param {RowCollection} rows the collection of Row models
     * @param {int} rowHeight height of a row in pixels
     * @param {int} firstRowIdx index in the row collection of the first rendered row
     */
    function adjustBufferRowHeights(tbody, rows, rowHeight, firstRowIdx) {
        var domRowCount = tbody.childElementCount - 2;
        var bufferHeight = (rows.visibleCount - domRowCount) * rowHeight;
        if (bufferHeight < 0) {
            tbody.firstChild.style.height = 0;
            tbody.lastChild.style.height = 0;
        }
        else {
            var topHeight = firstRowIdx * rowHeight;
            var bottomHeight = bufferHeight - topHeight;
            tbody.firstChild.style.height = topHeight + "px";
            tbody.lastChild.style.height = bottomHeight + "px";
        }
    }

    /**
     * Create a semi-transparent gray div that will indicate a resize operation is occurring
     * @param {ATable} atable the ATable itself
     * @returns {HTMLElement} div that will become visible as the user resizes a column
     */
    function createResizeIndicator(atable) {
        var nextId = 0;
        $('.resizeIndicator').each(function () {
            nextId = parseInt(this.id.split("resize")[1], 10) + 1;
        });
        var gray = document.createElement("div");
        gray.className = "resizeIndicator";
        gray.id = "resize" + nextId;
        atable.atableId = nextId;
        atable.resizeIndicator = gray;
    }

    /**
     * Gets thet index of the column which is in resize position
     * @private
     * @param {jQuery.Event} e jQuery mouse event
     * @returns {String} name of the column which the mouse is over, or null if the mouse is not in resize position
     */
    function getResizeColumn(e) {
        var mouseX = e.offsetX;
        var firstCol = !e.target.previousElementSibling;
        var th = $(e.target).closest("th")[0];

        if (typeof mouseX === "undefined") {
            mouseX = e.originalEvent.pageX - $(e.target).offset().left;
        }
        if (!firstCol && mouseX <= RESIZE_PIXELS + 1) {
            return th.previousElementSibling.getAttribute('data-column');
        }
        else if (e.target.offsetWidth - mouseX <= RESIZE_PIXELS) {
            return th.getAttribute('data-column');
        }
        return null;
    }

    /**
     * Ensure that required parameters are passed into the constructor correctly
     * @private
     * @param {Object} options hash of parameters
     * @returns {String} if parameters are valid, return null. if invalid, return message describing the invalid parameter
     */
    function validateTableArgs(options) {
        if (options.columns !== null && options.columns.length === 0) {
            return "Columns array missing or empty";
        }
        if (!options.dataFunction) {
            return "Missing dataFunction arg: actual function or script tag id with data function";
        }
        return null;
    }

    /**
     * Instantiate a web worker using the function in the inline script tag
     * @private
     * @param {String} dataFunctionTagId DOM id of the script tag containing the data function
     * @param {Function} callback Callback function to call when the worker returns with data
     * @return {Worker} Web worker that fetches table data on a separate thread
     */
    function createDataWorker(dataFunctionTagId, callback) {
        var blob;
        var data = document.querySelector('#' + dataFunctionTagId).textContent + " self.onmessage=function(){" + dataFunctionTagId + "();};";
        if (typeof Blob === "function") {
            blob = new Blob([data]);
        }
        else {
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            if (!BlobBuilder) {
                throw "Blob support required to use the web worker interface.";
            }
            var builder = new BlobBuilder();
            builder.append(data);
            blob = builder.getBlob();
        }
        if (Worker) {
            var url = window.URL || window.webkitURL;
            var worker = new Worker(url.createObjectURL(blob));
            worker.onmessage = function (e) {
                callback(e.data.data, e.data.append);
            };
            return worker;
        }
        else {
            throw "Worker support required to use the web worker interface.";
        }
    }

    /**
     * Initialize the collection of table columns
     * @private
     * @param {Object} options parameter hash passed into the ATable constructor
     * @return {ColumnCollection} Backbone collection of Column models
     */
    function initColumns(options) {
        var columns = options.columns;
        for (var i = 0; i < columns.length; i++) {
            if (typeof columns[i].width === "undefined") {
                columns[i].width = getTextWidth(columns[i].label) + 20;
            }
            if (typeof columns[i].resizable === "undefined") {
                columns[i].resizable = options.resizableColumns;
            }
            if (typeof columns[i].sortable === "undefined") {
                columns[i].sortable = options.sortable;
            }
            if (typeof columns[i].label === "undefined") {
                columns[i].label = columns[i].name;
            }
            if (typeof columns[i].visible === "undefined") {
                columns[i].visible = true;
            }
            if (typeof columns[i].editable === "undefined") {
                columns[i].editable = options.editable;
            }
            if (typeof columns[i].cellClasses === "undefined") {
                columns[i].cellClasses = options.cellClasses;
            }
            columns[i].order = i;
        }
        return new ColumnCollection(columns);
    }

    /**
     * Return array of row arrays to be rendered by the table
     * @private
     * @param {RowCollection} rows Collection of Row models
     * @returns {Array} array of row value arrays
     */
    function getRowData(rows) {
        var rowArr = [];
        for (var i = 0; i < rows.length; i++) {
            rowArr.push({row : rows.getRow(i), visible : rows.at(i).get('visible')});
        }
        return rowArr;
    }

    /**
     * Get the width of the scrollbar, if it's present
     * @private
     * @param {HTMLElement} elt element to check the scrollbar width
     * @return {int} width in pixels
     */
    function getScrollbarWidth(elt) {
        return elt ? elt.offsetWidth - elt.clientWidth : 0;
    }

    /**
     * Determine the width of a string when rendered on the page
     * @private
     * @param {String} text string to check the width of when rendered in a <th>
     * @return {int} width of the rendered text in pixels
     */
    function getTextWidth(text) {
        var o = $('<th>' + text + '</th>').css({
            'position' : 'absolute',
            'float' : 'left',
            'white-space' : 'nowrap',
            'visibility' : 'hidden'
        }).appendTo($('body'));
        var width = o.width();
        o.remove();
        return width;
    }

    /**
     * Set default values for parameters that weren't passed into the constructor
     * @private
     * @param {Object} options hash of parameters passed into the constructor
     */
    function setDefaultParameters(options) {
        if (typeof options.resizableColumns === "undefined") {
            options.resizableColumns = true;
        }
        if (typeof options.movableColumns === "undefined") {
            options.movableColumns = true;
        }
        if (typeof options.sortable === "undefined") {
            options.sortable = true;
        }
        if (typeof options.editable === "undefined") {
            options.editable = false;
        }
    }

    /**
     * Detect the browser in order to avoid certain browser-specific bugs
     * @private
     * @returns {String} name of the browser
     */
    function detectBrowser() {
        var browser = null;
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("safari") > -1) {
            if (ua.indexOf("chrome") > -1) {
                browser = "chrome";
            }
            else {
                browser = "safari";
            }
        }
        return browser;
    }
})();