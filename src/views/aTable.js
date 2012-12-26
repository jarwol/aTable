var SORT_ARROW_WIDTH = 8;
var DEFAULT_ROWS_TO_RENDER = 100;

var ATable = Backbone.View.extend({
    initialize : function (options) {
        _.bindAll(this);
        this.reRenderTable = true;
        var err = validateTableArgs(options);
        if (err) {
            console.error(err);
            return;
        }

        this.availableColumnsArray = [];
        this.availableColumnsHash = {};
        this.columns = initColumns(this, options.columns);
        this.columns.bind("reset", this.render, this);
        this.columns.bind("sort", this.render, this);
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
        this.title = options.title;
        this.maxRows = options.maxRows || Number.MAX_VALUE;
        this.columnTarget = null;
        this.dataWorker = createDataWorker(options.fetchData, this.receivedData);
        this.height = options.height;
        this.rowsToRender = options.rowsToRender || DEFAULT_ROWS_TO_RENDER;
        this.rowRange = {
            first : 0,
            last : this.rowsToRender
        };
        this.prevRowRange = {
            first : -1,
            last : -1
        };
    },

    events : {
        "click th" : "sortTable",
        "mousemove th" : "mouseMoveColumn",
        "mouseleave th" : "mouseLeaveColumn",
        "dragstart th" : "startDragColumn",
        "dragend" : "endDragColumn",
        "dragenter th" : "dragEnterColumn",
        "dragover th" : "dragOverColumn",
        "dragleave th" : "dragLeaveColumn",
        "drop th" : "dropColumn"
    },

    /**
     * Generates the ATable and adds it to the DOM
     * @param {function} callback function to call when the ATable is rendered
     * @return {ATable} a reference to the ATable
     */
    render : function (callback) {
        if (typeof callback === 'function') {
            this.renderCallback = callback;
        }
        var params = {};
        if (!this.rows.init) {
            this.rows.bind("reset", this.render, this);
            this.rows.bind("sort", this.render, this);
            this.dataWorker.postMessage(null);
            return this;
        }
        else if (this.reRenderTable) {
            this.reRenderTable = false;
            params.columns = this.columns.toJSON();
            params.rows = getRowData(this.rows, this.maxRows);
            params.title = this.title;
            this.$el.html(this.generateTableHtml(params));
            this.tableElt = this.$el.find("table");
            this.parentElt = this.$el.find(".tableParent");
            // Set up on-demand row rendering variables
            this.tbodyElt = this.tableElt.find("tbody");
            this.tbodyElt.scroll(this.scrollTable);
            this.rowHeight = this.tbodyElt.find('tr:first-child').height();
            this.visibleRows = parseInt(this.tbodyElt.height() / this.rowHeight);
            this.bufferRows = parseInt((this.rowsToRender - this.visibleRows) / 2);
            var cols = this.tableElt.find("th");
            for (var i = 0; i < cols.length; i++) {
                this.columns.at(i).set('element', $(cols[i]));
            }
            this.sizeTable();
            displaySortArrow(this.rows, this.tableElt);
            if (typeof this.renderCallback === 'function') {
                this.renderCallback();
            }
        }
        else {
            this.renderRows();
        }
        return this;
    },

    renderRows : function () {
        if (this.rowRange.first === 0 || this.rowRange.first === this.rows.length - this.rowsToRender) return;
        if (this.rowRange.first < this.prevRowRange.first) {
            this.removeRows(this.rowRange.first - this.prevRowRange.first);
            this.addRows(this.rowRange.first, this.prevRowRange.first);
        }
        else if (this.rowRange.last > this.prevRowRange.last) {
            this.removeRows(this.rowRange.first - this.prevRowRange.first);
            this.addRows(this.prevRowRange.last, this.rowRange.last);
        }
        else {
            //    this.replaceRows();
        }
    },

    addRows : function (start, end) {
        for (var i = start; i < end; i++) {
            var tr = document.createElement("tr");
            for (var j = 0; j < this.columns.length; j++) {
                var div = document.createElement("div");
                var width = this.columns.at(j).get('element').width();
                div.style.width = width + "px";
                var text = document.createTextNode(this.rows.getValue(i, j));
                var td = document.createElement("td");
                div.appendChild(text);
                td.appendChild(div);
                tr.appendChild(td);
            }
            this.tbodyElt[0].appendChild(tr);
        }
    },

    removeRows : function (num) {
        var rows = this.tbodyElt[0].getElementsByTagName("tr");
        var start, end;
        if (num > 0) {
            start = 0;
            end = num;
        }
        else {
            start = rows.length - num;
            end = rows.length;
        }
        for (var i = start; i < end; i++) {
            var tr = rows[start];       // As rows are removed from DOM, they are removed from this array
            this.tbodyElt[0].removeChild(tr);
        }
    },

    replaceRows : function () {
        var rows = this.tbodyElt[0].getElementsByTagName("tr");
        if (rows.length > i) {
            var tr = rows[i];
            var tdList = tr.getElementsByTagName("div");
            for (var j = 0; j < tdList.length; j++) {
                var div = tdList[j];
                div.innerText = Util.formatEntityField(this.rows.getValue(i, j));
            }
        }
    },

    /**
     * Track the rows that are visible in the table, and render/remove rows as the table is scrolled
     * @param {jQuery.Event} e jQuery scroll event
     */
    scrollTable : function (e) {
        this.prevRowRange.first = this.rowRange.first;
        this.prevRowRange.last = this.rowRange.last;
        var firstRow = parseInt(e.target.scrollTop / this.rowHeight) - this.bufferRows;
        if (firstRow > this.rows.length - this.rowsToRender) {
            firstRow = this.rows.length - this.rowsToRender;
        }
        else if(firstRow < 0){
            firstRow = 0;
        }
        this.rowRange.first = firstRow;
        var lastRow = firstRow + this.rowsToRender;
        if (lastRow < this.rowsToRender) {
            lastRow = this.rowsToRender;
        }
        this.rowRange.last = lastRow > this.rows.length ? this.rows.length : lastRow;
        this.renderRows();
    },

    /**
     * Perform work that has to be done after rendering the blotter table
     */
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

    /**
     * Sort the row collection when a column header is clicked
     * @param {Event} e jQuery click event object
     */
    sortTable : function (e) {
        if (!this.mouseInResizePosition(e)) {
            this.tableElt.find(".sortArrow").remove();
            this.rows.setSortColumn(e.target.cellIndex);
            displaySortArrow(this.rows, this.tableElt);
            this.rows.sort();
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
            var rank = column.get("rank");
            for (var i = rank; i < this.columns.length; i++) {
                var val = this.columns.at(i);
                val.set({
                    rank : val.get("rank") + 1
                }, {
                    silent : true
                });
            }
            var textWidth = Util.getTextWidth(col) + 15;
            this.columns.add({
                columnName : col,
                entityField : col,
                blotterName : this.blotterType,
                rank : rank,
                width : textWidth
            });
            this.columns.save(this.admin);
        }
    },

    removeColumn : function (name) {
        var col = this.columns.getByName(name);
        col.destroy();
        // Decrease the ordering of columns after delete
        for (var i = col.get('rank'); i < this.columns.length; i++) {
            var val = this.columns.at(i);
            val.set({
                rank : val.get("rank") - 1
            });
        }
        this.columns.save(this.admin);
    },

    renameColumn : function (newName, field) {
        this.columns.renameColumn(field, newName);
    },

    mouseMoveColumn : function (event) {
        if (this.mouseInResizePosition(event)) {
            if ($(event.target).css("cursor") !== "e-resize") {
                $(event.target).css("cursor", "e-resize");
                $(event.target).css("opacity", 1);
            }
        }
        else {
            $(event.target).css("opacity", .8);
            $(event.target).css("cursor", "pointer");
        }
    },

    mouseLeaveColumn : function (event) {
        $(event.target).css("opacity", 1);
    },

    mouseInResizePosition : function (event) {
        var mouseX = this.getMouseColumnOffset(event);
        var firstCol = !event.target.previousElementSibling;
        return (!firstCol && mouseX <= 5) || event.target.offsetWidth - mouseX <= 4;
    },

    getMouseColumnOffset : function (event) {
        var mouseX = event.offsetX;
        if (mouseX == null) {
            mouseX = event.originalEvent.pageX - $(event.target).offset().left;
        }
        return mouseX;
    },

    /**
     * Explicitly set the width of the table based on the sum of the column widths
     */
    sizeTable : function () {
        var cols = this.$el.find("tbody>tr:first td");
        var newWidth = 1;
        for (var i = 0; i < cols.length; i++) {
            newWidth += $(cols[i])[0].offsetWidth;
        }
        var minWidth = this.parentElt.width();
        if (newWidth < minWidth) newWidth = minWidth;
        this.tableElt.width(newWidth);
    },

    /**
     * Event handler for the start of a column drag (move or resize)
     * @param {Event} e jQuery dragstart event
     */
    startDragColumn : function (e) {
        var target = $(e.target);
        // User is resizing the column
        if (this.mouseInResizePosition(e)) {
            if (this.getMouseColumnOffset(e) <= 4) {
                target = $(e.target.previousSibling);
            }
            else {
                target = $(e.target);
            }
            var pos = target.offset();
            var containerHeight = this.parentElt.height();
            var tableHeight = this.tableElt.height() + 2;
            var height = containerHeight < tableHeight ? containerHeight : tableHeight;
            var leftPad = target.css("padding-left");
            var rightPad = target.css("padding-right");
            // subtract 5 from width because if the grayout div overlaps the cursor, dragend is immediately invoked
            var width = target.width() + Number(leftPad.substring(0, leftPad.length - 2))
                + Number(rightPad.substring(0, rightPad.length - 2)) - 5;
            var gray = $("#grayout");
            gray.css("display", "block").css("left", pos.left).css("top", pos.top - 1).css("height", height + 1)
                .css("width", width).attr('title', target[0].cellIndex);
            // Firefox doesn't provide mouse coordinates in the 'drag' event, so we must use a document-level
            // 'dragover' as a workaround
            document.addEventListener('dragover', this.resizeGrayout);
            // Disable the default drag image by replacing it with an empty div
            e.originalEvent.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
        }
        // User is moving the column
        else {
            e.target.style.opacity = .35;
        }
        e.originalEvent.dataTransfer.setData("text", target[0].cellIndex);
    },

    /**
     * Grow or shrink the resize indicator as the mouse moves
     * @param {MouseEvent} e dragover event
     */
    resizeGrayout : function (e) {
        var gray = $("#grayout");
        var pos = gray.offset();
        var colIdx = this.rows.getColumnIndex(Number(e.dataTransfer.getData("text")));
        var col = this.columns.at(colIdx).get('element');
        var width = e.pageX - pos.left;
        var textWidth = 15; //Util.getTextWidth(col.text()) + SORT_ARROW_WIDTH;
        if (width >= textWidth) {
            gray.css("width", width);
        }
        else {
            gray.css("width", textWidth);
        }
    },

    /**
     * Resize a column when the resize operation ends or return the target column to its original style during a move operation
     * @param {Event} e jQuery dragend event
     */
    endDragColumn : function (e) {
        var gray = $("#grayout");
        if (gray.css("display") === "none") {
            e.target.style.opacity = 1;
        }
        else {
            document.removeEventListener('dragover', this.resizeGrayout, false);
            var width = parseInt(e.originalEvent.clientX - gray.position().left - 10);
            var grayWidth = gray.width();
            width = width < grayWidth ? grayWidth : width;
            gray.css("display", "none");
            var colIndex = Number(gray.attr('title'));
            var col = this.columns.at(colIndex);
            col.set({width : width});
            col.get('element').width(width);
            this.tableElt.find('td:nth-child(' + (colIndex + 1) + ') div').width(width);
            this.sizeTable();
        }
    },

    /**
     * Style the column header to indicate the dragged column may be moved there
     * @param {Event} e jQuery dragenter event
     */
    dragEnterColumn : function (e) {
        if ($("#grayout").css("display") === "none") {
            e.target.classList.add("over");
        }
    },

    dragOverColumn : function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
    },

    /**
     * Return the column header style to normal when a column is no long being dragged over it
     * @param {Event} e jQuery dragleave event
     */
    dragLeaveColumn : function (e) {
        e.target.classList.remove("over");
    },

    /**
     * Initiate a move when a column is successfully dragged onto another column
     * @param {Event} e jQuery drop event
     */
    dropColumn : function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.target.classList.remove("over");
        if ($("#grayout").css("display") === "none") {
            var srcCol = Number(e.originalEvent.dataTransfer.getData("text"));
            var destCol = e.target.cellIndex;
            this.reRenderTable = true;
            this.rows.moveColumn(srcCol, destCol);
            this.columns.moveColumn(srcCol, destCol);
        }
    },

    saveMouseState : function (event) {
        if (event.which === 1) {
            this.isMouseDown = true;
        }
        else {
            this.isMouseDown = false;
        }
    },

    /**
     * Generate the actual table markup
     * @param {object} params Parameters needed to render the table
     * @return {String} HTML to render
     */
    generateTableHtml : function (params) {
        var headerRow = '<tr>';
        for (var i = 0; i < params.columns.length; i++) {
            var widthStr = '';
            if (params.columns[i].width) {
                widthStr = 'style="width: ' + (params.columns[i].width + SORT_ARROW_WIDTH) + 'px;"';
            }
            headerRow += '<th draggable="true" ' + widthStr + '>' + params.columns[i].name + '</th>';
        }
        headerRow += '</tr>';
        var body = '';
        for (var i = this.rowRange.first; i < params.rows.length && i < this.rowRange.last; i++) {
            body += '<tr>';
            for (var j = 0; j < params.rows[i].row.length; j++) {
                body += '<td><div style="width: ' + (params.columns[j].width + SORT_ARROW_WIDTH) + 'px;">' + params.rows[i].row[j] + '</div></td>';
            }
            body += '</tr>';
        }

        var html = '<div class="atableParent">' +
            '<div class="atableTitleBar">' +
            (params.title ? '<span class="atableTitle">' + params.title + '</span>' : '') +
            '<input type="text" placeholder="search"></div>' +
            '<div class="atableContainer">' +
            '<table class="atable">' +
            '<thead>' + headerRow + '</thead>' +
            '<tbody style="height: ' + this.height + 'px;">' + body + '</tbody>' +
            '</table></div>' +
            '<div class="atableBottomBar"></div></div>' +
            '<div id="grayout"></div>';
        return html;
    },

    /**
     * Update the row collection with new data from the data worker
     * @param {Array[]} data Row data returned by the data worker
     */
    receivedData : function (data) {
        // Skip data refresh if we're in the middle of a column resize or possibly moving the scrollbar
        /*  if (this.isMouseDown || $("#grayout").css("display") !== "none") {
         return;
         }*/
        this.scrollLeft = this.$el.find(".table").scrollLeft();
        this.scrollTop = this.$el.find(".table").scrollTop();
        if (!this.rows.init) {
            this.rows.init = true;
        }
        this.rows.reset(data.map(function (row) {
            return {row : row};
        }));
    },

    close : function () {
        this.remove();
        this.unbind();
    }
});

function validateTableArgs(options) {
    if (options.columns !== null && options.columns.length === 0) {
        return "Cannot specify empty 'columns' array";
    }
    if (!options.fetchData) {
        return "Missing fetchData arg: script tag id containing function to fetch the table data.";
    }
    return null;
}

/**
 * Instantiate a web worker using the function in the inline script tag
 * @param {string} dataFunctionTagId DOM id of the script tag containing the data function
 * @param {function} callback Callback function to call when the worker returns with data
 * @return {Worker} Web worker that fetches table data on a separate thread
 */
function createDataWorker(dataFunctionTagId, callback) {
    var blob = new Blob([document.querySelector('#' + dataFunctionTagId).textContent, " self.onmessage=function(p){self.postMessage(fetchData(p));};"]);
    var url = window.URL || window.webkitURL;
    var worker = new Worker(url.createObjectURL(blob));
    worker.onmessage = function (e) {
        callback(e.data);
    }
    return worker;
}

/**
 * Initialize the collection of table columns
 * @param {Table} table The Table which is being initialized
 * @param {Array} columns Array of objects representing table columns
 * @return {ColumnCollection} collection of the table's Column models
 */
function initColumns(table, columns) {
    for (var i = 0; i < columns.length; i++) {
        if (typeof columns[i].width === "undefined") {
            columns[i].width = Util.getTextWidth(columns[i].name) + 10;
        }
        columns[i].order = i;
        table.availableColumnsArray.push(columns[i].name);
        table.availableColumnsHash[columns[i].name] = true;
    }
    return new ColumnCollection(columns);
}

/**
 * Return array of row arrays to be rendered by the table template
 * @param {RowCollection} rows Collection of Row models
 * @param {number} maxRows Max # of rows to render
 * @returns {Array} array of row value arrays
 */
function getRowData(rows, maxRows) {
    var rowArr = [];
    for (var i = 0; i < rows.length && i < maxRows; i++) {
        rowArr.push({row : rows.getRow(i)});
    }
    return rowArr;
}

/**
 * Add an arrow indicating sort direction on the sort column header
 * @param {RowCollection} rows the table's row collection
 * @param {object} tableElt the table's jQuery object
 */
function displaySortArrow(rows, tableElt) {
    if (typeof rows.sortColumn !== "undefined") {
        var arrow;
        if (rows.sortAscending) {
            arrow = "<div class='sortArrow'>&uarr;</div>";
        }
        else {
            arrow = "<div class='sortArrow'>&darr;</div>";
        }
        tableElt.find('th:nth-child(' + (rows.sortColumn + 1) + ')').append(arrow);
    }
}