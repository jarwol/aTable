var ATable = (function () {
    var SORT_ARROW_WIDTH = 15;
    var BUFFER_ROWS = 5;
    var RESIZE_PIXELS = 7;

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
             * @param {String|Function} options.dataFunction The dataFunction parameter can be one of two values:
             * <li>{String} the id of a <strong>&lt;script&gt;</strong> element containing a function called <strong>fetchData</strong> which is responsible for generating the table's dataset.
             * The function should call <strong>self.postMessage(rows, append);</strong> where <i>rows</i> is a 2-dimensional array of table values. If <i>append</i> is true, rows will be added to the table.
             * If false, the rows will completely replace the existing table.</li>
             * <li>{Function} a function responsible for generating the table's dataset. It should call <strong>this.receivedData(rows, append);</strong></li><br/>
             * *Note that both methods of returning table data may do so many times (e.g. a loop that continuously uses ajax polling to get new data from the server).
             * @param {String} options.el CSS selector of the DOM element in which to insert the rendered table
             * @param {int} options.height max height of the table in pixels
             * @param {boolean} [options.resizableColumns=true] set whether table columns are resizable
             * @param {boolean} [options.movableColumns=true] set whether table columns are movable
             * @param {boolean} [options.sortableColumns=true] set whether clicking on column headers sorts the table
             * @param {String} [options.sortColumn] name of the column by which to sort the table
             */
            initialize : function (options) {
                _.bindAll(this);
                if (typeof options.dataFunction === "string") {
                    this.dataWorker = createDataWorker(options.dataFunction, this.receivedData);
                }
                else if (typeof options.dataFunction === "function") {
                    this.dataFunction = options.dataFunction;
                    //_.bind(this.dataFunction, this);
                }
                this.reRenderTable = true;
                this.dataAppended = false;
                var err = validateTableArgs(options);
                if (err) throw err;
                setDefaultParameters(options);
                this.availableColumnsArray = [];

                this.availableColumnsHash = {};
                this.columns = initColumns(this, options);
                this.columns.bind("reset", this.render, this);
                this.columns.bind("sort", this.render, this);
                this.movableColumns = options.movableColumns;
                if (typeof options.sortColumn === "string") {
                    var i = this.columns.indexOf(options.sortColumn);
                    if (i >= 0) {
                        options.sortColumn = i;
                    }
                    else {
                        options.sortColumn = 0;
                    }
                }
                options.numColumns = this.columns.length;
                this.rows = new RowCollection([], options);
                this.rows.init = false;
                this.columnTarget = null;
                this.height = options.height;
                this.prevScrollTop = 0;
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
                "drop th div" : "onDropColumnHeader"
            },

            /**
             * Generates the ATable and adds it to the DOM
             * @param {function} callback function to call when the ATable is rendered
             * @return {ATable} a reference to this ATable
             */
            render : function (callback) {
                if (typeof callback === 'function') {
                    this.renderCallback = callback;
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
                else if (this.reRenderTable) {
                    this.reRenderTable = false;
                    params.columns = this.columns.toJSON();
                    params.rows = getRowData(this.rows);
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
                        displaySortArrow(this.columns.at(this.rows.sortColumn).get('element')[0], this.rows.sortDescending);
                    }
                    /* If a callback was passed to render(), invoke it after nulling out the reference. Otherwise we may
                     wind up in an infinite loop if the callback itself causes a render. */
                    if (typeof this.renderCallback === 'function') {
                        var cb = this.renderCallback;
                        this.renderCallback = null;
                        cb();
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
                var max = this.visibleRows + BUFFER_ROWS;
                if (scrollTop < prevScrollTop) {
                    first = this.rowRange.first;
                    last = this.rowRange.prevFirst;
                    if (this.rowRange.last <= this.rowRange.prevFirst) {
                        first = this.rowRange.first;
                        last = this.rowRange.last;
                    }
                    this.removeRows(last - first, false);
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
                    this.removeRows(last - first, true);
                    this.addRows(first, last, false);
                    adjustBufferRowHeights(this.tbodyElt[0], this.rows, this.rowHeight, this.rowRange.first);
                }
                else if (this.dataAppended) {
                    this.dataAppended = false;
                    if (this.rowRange.last < this.rows.length && this.rowRange.last < max) {
                        first = this.rowRange.last;
                        last = this.rows.length;
                        if (last > max) last = max;
                        this.addRows(first, last, false);
                        this.rowRange.last = last;
                    }
                    adjustBufferRowHeights(this.tbodyElt[0], this.rows, this.rowHeight, this.rowRange.first);
                }
                else {
                    this.refreshRows(this.rowRange.first);
                    return;
                }
                this.scrollbarWidth = getScrollbarWidth(this.tbodyElt[0]);
                if (this.scrollbarWidth > 0) {
                    var lastColWidth = this.columns.at(this.columns.length - 1).get('width');
                    this.tbodyElt.find('td:last-child>div').width(lastColWidth - this.scrollbarWidth);
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
             * @param {Node} rowToInsertBefore DOM row that the new row will precede
             */
            addRow : function (index, rowToInsertBefore) {
                var tr = document.createElement("tr");
                for (var i = 0; i < this.columns.length; i++) {
                    var div = document.createElement("div");
                    var width = this.columns.at(i).get('width');
                    div.style.width = width + "px";
                    div.innerHTML = this.rows.getValue(index, i);
                    var td = document.createElement("td");
                    td.appendChild(div);
                    tr.appendChild(td);
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
                var domRowsCount = rows.length - 2;
                if (domRowsCount < this.visibleRows + BUFFER_ROWS * 2 && domRowsCount < this.rows.length) {
                    this.addRows(this.rowRange.prevFirst, this.rowRange.last, true);
                }
                rows = this.tbodyElt[0].getElementsByTagName("tr");
                for (var i = 1; i < rows.length - 1; i++) {
                    var tr = rows[i];
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
                var newWidth = 1;
                for (var i = 0; i < cols.length; i++) {
                    newWidth += $(cols[i])[0].offsetWidth;
                }
                if ($.browser.mozilla) { // TODO - figure out a less hacky way to size the table elements correctly
                    newWidth--;
                }
                this.tableElt.width(newWidth);
                this.parentElt.width(newWidth);
            },

            doPostRender : function () {
                $("th").contextMenu({
                    menu : menu
                }, this.initColumnMenu);
                if (this.columns.length < 2) {
                    $("#columnMenu").disableContextMenuItems("#removeColumn");
                }
                else {
                    $("#columnMenu").enableContextMenuItems("#removeColumn");
                }
            },

            initColumnMenu : function (action, el, pos) {
                this.columnTarget = el.attr('id').split("_")[1];
                if (action === "addColumn") {
                    this.showAddColumnDialog(pos);
                }
                else if (action === "removeColumn") {
                    this.removeColumn(this.columnTarget);
                }
                else if (action === "renameColumn") {
                    this.showRenameColumnDialog(this.columnTarget, el.text(), pos);
                }
            },

            showAddColumnDialog : function (pos) {
                new EditColumnDialog({
                    editType : "add",
                    blotterType : this.blotterType,
                    callBack : this.addColumn,
                    columns : this.availableColumnsArray
                }).show(pos);
                return false; // Prevent default context menu from popping up
            },

            showRenameColumnDialog : function (col, colName, pos) {
                new EditColumnDialog({
                    editType : "rename",
                    blotterType : this.blotterType,
                    callBack : this.renameColumn
                }).show(pos, col, colName);
                return false; // Prevent default context menu from popping up
            },

            addColumn : function (col) {
                var column = this.columns.getByName(this.columnTarget);
                if (!this.columns.getByName(col) && this.availableColumnsHash[col]) {
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
                var col = this.columns.getByName(name);
                col.destroy();
                // Decrease the ordering of columns after delete
                for (var i = col.get('order'); i < this.columns.length; i++) {
                    var val = this.columns.at(i);
                    val.set({
                        order : val.get("order") - 1
                    });
                }
            },

            renameColumn : function (newName, field) {
                this.columns.renameColumn(field, newName);
            },

            filter : function (columnIdx, filterStr) {
                // TODO - implement table filtering
            },

            /**
             * Move a column to a different position, shifting all columns in between
             * @param {int} srcColumnIdx index of the column to be moved
             * @param {int} destColumnIdx destination index of the column
             */
            moveColumn : function (srcColumnIdx, destColumnIdx) {
                this.reRenderTable = true;
                this.rows.moveColumn(srcColumnIdx, destColumnIdx);
                this.columns.moveColumn(srcColumnIdx, destColumnIdx);
            },

            /**
             * Resize a column. Causes the table to re-render.
             * @param {int} columnIndex index of the column to resize
             * @param {int} newWidth new column size in pixels
             * @param {Function} [callback] optional callback to invoke once the table is rendered
             */
            resizeColumn : function (columnIndex, newWidth, callback) {
                var col = this.columns.at(columnIndex);
                if (!col) {
                    throw "Invalid column index: " + columnIndex;
                }
                col.set('width', newWidth);
                this.reRenderTable = true;
                this.render(callback);
            },

            /**
             * Sort the table rows by the specified column and order
             * @param {int} columnIndex index of the column to sort on
             * @param {boolean} [descending] sort in descending order
             */
            sort : function (columnIndex, descending) {
                if (columnIndex < 0 || columnIndex > this.columns.length) {
                    throw "Invalid column index: " + columnIndex;
                }
                this.tableElt.find(".sortArrow").remove();
                this.rows.setSortColumn(columnIndex);
                if (typeof descending === "boolean") {
                    this.rows.sortDescending = descending;
                }
                displaySortArrow(this.columns.at(columnIndex).get('element')[0], this.rows.sortDescending);
                this.rows.sort();
            },

            /**
             * Determine the rows that should be rendered in the DOM based on the scroll position
             * @private
             * @param {jQuery.Event} e jQuery scroll event
             */
            onTableScrolled : function (e) {
                if (this.prevScrollTop !== e.target.scrollTop) {
                    var firstRow = parseInt(e.target.scrollTop / this.rowHeight, 10) - BUFFER_ROWS;
                    if (firstRow < 0) firstRow = 0;
                    this.rowRange.prevFirst = this.rowRange.first;
                    this.rowRange.prevLast = this.rowRange.last;
                    this.rowRange.first = firstRow;
                    this.rowRange.last = firstRow + this.visibleRows + BUFFER_ROWS;
                    if (this.rowRange.last > this.rows.length) {
                        this.rowRange.last = this.rows.length;
                        this.rowRange.first = this.rowRange.last - this.visibleRows - BUFFER_ROWS;
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
                if (col < 0 || !this.columns.at(col).get('resizable')) {
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
                if (getResizeColumn(e) < 0) {
                    var th = $(e.target).closest("th")[0];
                    if (this.columns.at(th.cellIndex).get('sortable')) {
                        this.sort(th.cellIndex);
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
                // Mouse is in resize position
                if (col > -1) {
                    target = this.columns.at(col).get('element');
                    if (!this.columns.at(col).get('resizable')) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        return false;
                    }
                    var posCol = target.offset();
                    var posTable = this.tableElt.parent().offset();
                    var height = this.tableElt.height() + 2;
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
                    var gray = $("#grayout");
                    gray.css("display", "block").css("left", left).css("top", posCol.top - 1).css("height", height)
                        .css("width", width).attr('title', target[0].cellIndex);
                    // Firefox doesn't provide mouse coordinates in the 'drag' event, so we must use a document-level
                    // 'dragover' as a workaround
                    document.addEventListener('dragover', this.onResizeGrayout);
                    // Disable the default drag image by replacing it with an empty div
                    e.originalEvent.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
                    e.originalEvent.dataTransfer.setData("text", target[0].cellIndex);
                }
                // User is moving the column
                else if (this.movableColumns) {
                    e.target.style.opacity = 0.35;
                    e.originalEvent.dataTransfer.setData("text", target[0].cellIndex);
                }
                else {
                    e.preventDefault();
                }

            },

            /**
             * Grow or shrink the grayout resize indicator as the mouse moves
             * @private
             * @param {MouseEvent} e dragover event
             */
            onResizeGrayout : function (e) {
                var gray = $("#grayout");
                var pos = gray.offset();
                var colIdx = this.rows.getColumnIndex(Number(e.dataTransfer.getData("text")));
                var col = this.columns.at(colIdx).get('element');
                var width = e.pageX - pos.left;
                var textWidth = getTextWidth(col.text()) + SORT_ARROW_WIDTH;
                if (width >= textWidth) {
                    gray.css("width", width);
                }
                else {
                    gray.css("width", textWidth);
                }
            },

            /**
             * Resize a column when the resize operation ends or return the target column to its original style during a move operation
             * @private
             * @param {Event} e jQuery dragend event
             */
            onEndDragColumnHeader : function (e) {
                var gray = $("#grayout");
                if (gray.css("display") === "none") {
                    e.target.style.opacity = null;
                }
                else {
                    document.removeEventListener('dragover', this.onResizeGrayout, false);
                    var width = parseInt(e.originalEvent.clientX - gray.position().left - SORT_ARROW_WIDTH, 10);
                    var grayWidth = gray.width();
                    var colIndex = Number(gray.attr('title'));
                    var col = this.columns.at(colIndex);
                    var posCol = col.get('element').offset();
                    var posTable = this.tableElt.parent().offset();
                    if (posCol.left < posTable.left) {
                        grayWidth += (posTable.left - posCol.left);
                    }
                    width = width < grayWidth ? grayWidth : width;
                    gray.css("display", "none");
                    this.resizeColumn(colIndex, width);
                }
            },

            /**
             * Style the column header to indicate the dragged column may be moved there
             * @private
             * @param {jQuery.Event} e jQuery dragenter event
             */
            onDragEnterColumnHeader : function (e) {
                var colNum = e.originalEvent.dataTransfer.getData("text");
                if (this.movableColumns && $("#grayout").css("display") === "none") {
                    var th = $(e.target).closest("th")[0];
                    if (th.cellIndex != colNum) {
                        th.firstChild.classList.add("over");
                    }
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
                e.target.classList.remove("over");
            },

            /**
             * Initiate a move when a column is successfully dragged onto another column
             * @private
             * @param {Event} e jQuery drop event
             */
            onDropColumnHeader : function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }

                if (this.movableColumns && $("#grayout").css("display") === "none") {
                    var srcCol = Number(e.originalEvent.dataTransfer.getData("text"));
                    var destCol = e.target.parentElement.cellIndex;
                    if (e.target.tagName === "TH") {
                        destCol = e.target.cellIndex;
                        e.target.firstChild.classList.remove("over");
                    }
                    else {
                        e.target.classList.remove("over");
                    }
                    this.moveColumn(srcCol, destCol);
                }
            },

            /**
             * Generate the actual table markup and add it to the DOM
             * @private
             * @param {object} params Parameters needed to render the table
             * @return {DocumentFragment} the table DocumentFragment ready to be inserted into the DOM
             */
            generateTableHtml : function (params) {
                var topRowHeight = 0;
                if (this.tbodyElt) {
                    var height = this.tbodyElt[0].firstChild.style.height;
                    topRowHeight = height.substr(0, height.length - 2);
                }
                var headerRow = '<tr>';
                for (var i = 0; i < params.columns.length; i++) {
                    var widthStr = '';
                    var classStr = '';
                    if (params.columns[i].width) {
                        widthStr = 'style="width: ' + (params.columns[i].width) + 'px;"';
                    }
                    if (params.columns[i].sortable) {
                        classStr = ' className="sortable"';
                    }
                    headerRow += '<th draggable="true" ' + widthStr + classStr + '><div>' + params.columns[i].name + '</div></th>';
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
                tbody.style.height = this.height + "px";
                table.appendChild(tbody);
                var grayout = document.createElement("div");
                grayout.id = "grayout";
                frag.appendChild(parent);
                frag.appendChild(grayout);
                if (this.parentElt) {
                    this.el.removeChild(this.parentElt[0]);
                    this.el.removeChild(document.getElementById("grayout"));
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
                    this.rowHeight = row.offsetHeight;
                    tbody.removeChild(row);
                    this.visibleRows = parseInt(this.height / this.rowHeight, 10);
                }
                if (!this.rowRange) {
                    var last = this.visibleRows + BUFFER_ROWS;
                    if (last > params.rows.length) {
                        last = params.rows.length;
                    }
                    this.rowRange = {
                        first : 0,
                        last : last,
                        prevFirst : 0,
                        prevLast : last
                    };
                }

                var body = "<tr style='height: " + topRowHeight + "px;'></tr>";
                for (var j = this.rowRange.first; j < params.rows.length && j < this.rowRange.last; j++) {
                    body += '<tr>';
                    for (var k = 0; k < params.rows[j].row.length; k++) {
                        var width = params.columns[k].width;
                        body += '<td><div style="width: ' + width + 'px;">' + params.rows[j].row[k] + '</div></td>';
                    }
                    body += '</tr>';
                }
                body += "<tr style='height: " + (this.rowHeight * (params.rows.length - this.visibleRows - BUFFER_ROWS) - topRowHeight) + "px;'></tr>";
                thead.innerHTML = headerRow;
                tbody.innerHTML = body;
                this.scrollbarWidth = getScrollbarWidth(tbody);
                if (this.scrollbarWidth > 0) {
                    var lastColWidth = params.columns[params.columns.length - 1].width;
                    $(tbody).find('td:last-child>div').width(lastColWidth - this.scrollbarWidth);
                }
            },

            /**
             * Update the row collection with new data from the data worker
             * @param {Array[]} data matrix of row data returned by the data worker
             * @param {boolean} append if true, append new rows to the dataset, otherwise replace the dataset
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
                    this.rows.trigger("reset");
                }
                else {
                    this.reRenderTable = true;
                    this.rows.reset(rows);
                }
            },

            /**
             * Remove this aTable from the DOM, and unbind all events
             */
            close : function () {
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
        var bufferHeight = (rows.length - domRowCount) * rowHeight;
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
     * Gets thet index of the column which is in resize position
     * @private
     * @param {jQuery.Event} e jQuery mouse event
     * @returns {int} cellIndex of the column which the mouse is over, or -1 if the mouse is not in resize position
     */
    function getResizeColumn(e) {
        var mouseX = e.offsetX;
        var firstCol = !e.target.previousElementSibling;
        var th = $(e.target).closest("th")[0];

        if (typeof mouseX === "undefined") {
            mouseX = e.originalEvent.pageX - $(e.target).offset().left;
        }
        if (!firstCol && mouseX <= RESIZE_PIXELS + 1) {
            return th.previousElementSibling.cellIndex;
        }
        else if (e.target.offsetWidth - mouseX <= RESIZE_PIXELS) {
            return th.cellIndex;
        }
        return -1;
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
            return "Missing dataFunction arg: actual function or script tag id with fetchData function";
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
        if (window.Blob && window.Worker) {
            var blob = new Blob([document.querySelector('#' + dataFunctionTagId).textContent, " self.onmessage=function(){fetchData();};"]);
            var url = window.URL || window.webkitURL;
            var worker = new Worker(url.createObjectURL(blob));
            worker.onmessage = function (e) {
                callback(e.data.data, e.data.append);
            };
            return worker;
        }
        else {
            throw "Blob and Worker support required to use the web worker interface.";
        }
    }

    /**
     * Initialize the collection of table columns
     * @private
     * @param {ATable} table The Table which is being initialized
     * @param {Object} options parameter hash passed into the ATable constructor
     * @return {ColumnCollection} Backbone collection of Column models
     */
    function initColumns(table, options) {
        var columns = options.columns;
        for (var i = 0; i < columns.length; i++) {
            if (typeof columns[i].width === "undefined") {
                columns[i].width = getTextWidth(columns[i].name) + 20;
            }
            if (typeof columns[i].resizable === "undefined") {
                columns[i].resizable = options.resizableColumns;
            }
            if (typeof columns[i].sortable === "undefined") {
                columns[i].sortable = options.sortable;
            }
            columns[i].order = i;
            table.availableColumnsArray.push(columns[i].name);
            table.availableColumnsHash[columns[i].name] = true;
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
            rowArr.push({row : rows.getRow(i)});
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
     * Add an arrow indicating sort direction on the sort column header
     * @private
     * @param {HTMLElement} column the column header to which to add the sort arrow
     * @param {boolean} descending table is sorted descending
     */
    function displaySortArrow(column, descending) {
        var arrow = document.createElement("div");
        arrow.classList.add("sortArrow");
        if (descending) {
            arrow.innerHTML = "&darr;";
        }
        else {
            arrow.innerHTML = "&uarr;";
        }
        column.firstChild.appendChild(arrow);
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
    }
})();