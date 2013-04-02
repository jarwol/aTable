var BUFFER_ROWS = 5;

module("Row rendering");
asyncTest("Initial render 100 rows", 4, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        equal(table.rows.length, 100, "table.rows should have 100 rows");
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS + 2, "DOM table should have " + (table.visibleRows + BUFFER_ROWS + 2) + " rows");
    });
});

asyncTest("Initial render 10 rows", 4, function () {
    var table = createTable('fetchData10Rows1Col', 1);
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        equal(table.rows.length, 10, "table.rows should have 10 rows");
        var rows = table.tbodyElt.find("tr");
        var expectedRows = table.visibleRows + BUFFER_ROWS + 2;
        if (expectedRows > 12) expectedRows = 12;
        equal(rows.length, expectedRows, "DOM table should have " + expectedRows + " rows");
    });
});

asyncTest("Initial render 0 rows", 4, function () {
    var table = createTable('fetchData0Rows', 1);
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        equal(table.rows.length, 0, "table.rows should have 0 rows");
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, 2, "DOM table should have 2 rows");
    });
});

asyncTest("Render with invisible column", 2, function () {
    var table = new ATable({
        dataFunction : function (atable) {
            atable.receivedData([
                [0, 1, 2]
            ]);
        },
        columns : [
            {name : "Column 1", visible : true},
            {name : "Column 2", visible : false},
            {name : "Column 3"}
        ],
        height : 300
    });
    table.render(function () {
        start();
        equal(table.columns.length, 3, "column collection should have 3 models");
        var cols = table.tableElt.find("th");
        equal(cols.length, 2, "there should be 2 rendered columns");
    });
});

asyncTest("Dynamic data source", 2, function () {
    var table = createTable('fetchDataMultiple', 1);
    table.render(function () {
        setTimeout(function () {
            start();
            equal(table.rows.length, 50, "table.rows should have 50 rows");
            var rows = table.tbodyElt.find("tr");
            var expectedRows = table.visibleRows + BUFFER_ROWS + 2;
            equal(rows.length, expectedRows, "DOM table should have " + expectedRows + " rows");
        }, 100);
    });
});

asyncTest("Dynamic data source - callback function", 2, function () {
    var table = createTable(function (atable) {
        var count = 0;
        var interval = setInterval(function () {
            if (count >= 40) clearInterval(interval);
            var rows = [];
            for (var i = 1; i <= 10; i++, count++) {
                rows.push([count]);
            }
            atable.receivedData(rows, true);
        }, 1);
    }, 1);

    table.render(function () {
        setTimeout(function () {
            start();
            equal(table.rows.length, 50, "table.rows should have 50 rows");
            var rows = table.tbodyElt.find("tr");
            var expectedRows = table.visibleRows + BUFFER_ROWS + 2;
            equal(rows.length, expectedRows, "DOM table should have " + expectedRows + " rows");
        }, 100);
    });
});

asyncTest("Remove rows", 5, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS + 2, "DOM table should have " + (table.visibleRows + BUFFER_ROWS + 2) + " rows");
        table.removeRows(2, true);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS, "DOM table should have " + (table.visibleRows + BUFFER_ROWS) + " rows");
        equal(parseInt(rows[1].cells[0].firstChild.innerHTML, 10), 2, "first cell rendered should contain 2");
        table.removeRows(2, false);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS - 2, "DOM table should have " + (table.visibleRows + BUFFER_ROWS - 2) + " rows");
        var expectedLastVal = rows.length - 1;
        equal(parseInt(rows[table.visibleRows + BUFFER_ROWS - 4].cells[0].firstChild.innerHTML, 10), expectedLastVal, "last cell rendered should contain " + expectedLastVal);
    });
});

asyncTest("Scroll table", 32, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        // Scroll down, but not enough to render any new rows in the table
        scrollAndTestContents(table, 4);
        // Scroll down enough to render new rows
        scrollAndTestContents(table, 300);
        // Scroll back up some
        scrollAndTestContents(table, 200);
        // Scroll up more
        scrollAndTestContents(table, 100);
        // Scroll up to the top
        scrollAndTestContents(table, 0);
        // Scroll down past the visibleRows + BUFFER_ROWS mark
        scrollAndTestContents(table, table.rowHeight * (table.visibleRows + BUFFER_ROWS) + 50);
        // Scroll to the bottom
        scrollAndTestContents(table, table.rows.length * table.rowHeight);
        // Scroll up a lot
        scrollAndTestContents(table, 100);
    });
});

asyncTest("Scroll table - dynamic data source", 32, function () {
    var table = createTable('fetchDataMultiple', 1);
    table.render(function () {
        setTimeout(function () {
            start();
            // Scroll down, but not enough to render any new rows in the table
            scrollAndTestContents(table, 4);
            // Scroll down enough to render new rows
            scrollAndTestContents(table, 300);
            // Scroll back up some
            scrollAndTestContents(table, 200);
            // Scroll up more
            scrollAndTestContents(table, 100);
            // Scroll up to the top
            scrollAndTestContents(table, 0);
            // Scroll down past the visibleRows + BUFFER_ROWS mark
            scrollAndTestContents(table, table.rowHeight * (table.visibleRows + BUFFER_ROWS) + 50);
            // Scroll to the bottom
            scrollAndTestContents(table, table.rows.length * table.rowHeight);
            // Scroll up a lot
            scrollAndTestContents(table, 100);
        }, 100);
    });
});

asyncTest("Random scroll stress test - big table", 4000, function () {
    var table = createTable('fetchData100000Rows1Col', 1);
    table.render(function () {
        start();
        var scrollHeight = table.tbodyElt[0].scrollHeight;
        for (var i = 1; i <= 1000; i++) {
            var scrollTop = Math.floor(Math.random() * (scrollHeight + 1));
            table.onTableScrolled({target : {scrollTop : scrollTop}});
            scrollAndTestContents(table, scrollTop);
        }
    });
});

module("Column Operations");
asyncTest("Reorder columns", 12, function () {
    var table = createTable('fetchData1Row4Cols', 4);
    table.render(function () {
        start();
        table.moveColumn("col1", "col2");
        var row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 1, "first cell should contain 1");
        equal(row.cells[1].firstChild.innerHTML, 0, "second cell should contain 0");
        table.moveColumn(1, 0);             // Test
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 0, "first cell should contain 0");
        equal(row.cells[1].firstChild.innerHTML, 1, "second cell should contain 1");
        table.moveColumn("col1", "col4");
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 1, "first cell should contain 1");
        equal(row.cells[1].firstChild.innerHTML, 2, "second cell should contain 2");
        equal(row.cells[2].firstChild.innerHTML, 3, "first cell should contain 3");
        equal(row.cells[3].firstChild.innerHTML, 0, "second cell should contain 0");
        table.moveColumn("col3", "col1");
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 1, "first cell should contain 1");
        equal(row.cells[1].firstChild.innerHTML, 3, "second cell should contain 3");
        equal(row.cells[2].firstChild.innerHTML, 0, "first cell should contain 0");
        equal(row.cells[3].firstChild.innerHTML, 2, "second cell should contain 2");
    });
});

asyncTest("Resize columns", 22, function () {
    var table = createTable('fetchData1Row4Cols', 4);
    table.render(function () {
        start();
        resizeColumnAndTest(table, "col1", 5);
        resizeColumnAndTest(table, "col1", -3);
        resizeColumnAndTest(table, "col2", 5);
        resizeColumnAndTest(table, "col4", 5);
        resizeColumnAndTest(table, "col4", -5);
        resizeColumnAndTest(table, "col3", 0);
        resizeColumnAndTest(table, "col1", -100);
        raises(function () {
            table.resizeColumn(5, 0);
        }, "resizing an invalid column index should throw an exception");
    });
});

asyncTest("Sort table", 38, function () {
    var table = createTable('fetchData4Rows4Cols', 4);
    table.render(function () {
        start();
        equal(typeof table.rows.sortColumn, "undefined", "sort column should start undefined");
        ok(!isSorted(table), "table should start unsorted");
        ok(table.tableElt.find(".sortArrow").length === 0, "there should be no sort arrow");

        // Simulate sorting from the UI (no sortDescending parameter)
        table.sort("col1");
        testSort(table, "col1", false);
        table.sort("col1");
        testSort(table, "col1", true);
        table.sort("col1");
        testSort(table, "col1", false);
        table.sort("col4");
        testSort(table, "col4", false);

        // Sort via the API
        table.sort("col3", true);
        testSort(table, "col3", true);
        table.sort("col3", true);
        testSort(table, "col3", true);
        table.sort("col3", false);
        testSort(table, "col3", false);
    });
});

asyncTest("Move sorted columns", 25, function () {
    var table = createTable('fetchData4Rows4Cols', 4);
    table.render(function () {
        start();

        // Move sorted column
        table.sort("col2");
        table.moveColumn("col2", "col1");
        testSort(table, "col2", false);
        // Re-sort a moved sorted column
        table.sort("col2");
        testSort(table, "col2", true);
        // Move sorted column to the end
        table.moveColumn("col2", "col4");
        testSort(table, "col2", true);
        // Move unsorted column to another unsorted column
        table.moveColumn("col1", "col3");
        testSort(table, "col2", true);
        // Move unsorted column to a sorted column
        table.moveColumn("col1", "col4");
        testSort(table, "col2", true);
    });
});

asyncTest("Show/hide columns", 6, function () {
    var table = new ATable({
        dataFunction : function (atable) {
            atable.receivedData([
                [0, 1, 2]
            ]);
        },
        columns : [
            {name : "col1", label : "Column 1", visible : true},
            {name : "col2", label : "Column 2", visible : false},
            {name : "col3", label : "Column 3"}
        ],
        height : 300
    });
    table.render(function () {
        start();
        table.showColumn("col2");
        equal(table.columns.length, 3, "column collection should have 3 models");
        var cols = table.tableElt.find("th");
        equal(cols.length, 3, "there should be 3 rendered columns");
        table.hideColumn("col2");
        cols = table.tableElt.find("th");
        equal(cols.length, 2, "there should be 2 rendered columns");
        table.hideColumn("col1");
        cols = table.tableElt.find("th");
        equal(cols.length, 1, "there should be 1 rendered column");
        table.hideColumn("col1");
        cols = table.tableElt.find("th");
        equal(cols.length, 1, "there should be 1 rendered column");
        table.hideColumn("col3");
        cols = table.tableElt.find("th");
        equal(cols.length, 0, "there should be 0 rendered columns");
    });
});

/****************************************************************************************
 * Utility functions
 ****************************************************************************************/

function createTable(dataFunc, cols) {
    var columns = [];
    for (var i = 0; i < cols; i++) {
        columns.push({name : "col" + (i + 1)});
    }
    return new ATable({
        dataFunction : dataFunc,
        columns : columns,
        el : "#qunit-fixture",
        height : 300
    });
}

function testSort(table, column, expectDescending) {
    var col = table.columns.get(column);
    ok(isSorted(table), "table should be sorted");
    var arrow = table.tableElt.find(".sortArrow");
    equal(arrow.length, 1, "there should only be one sort arrow");
    equal(arrow[0].parentElement.parentElement.cellIndex, col.get('order'), "sort arrow should be in column " + col.get('order'));

    if (expectDescending) {
        equal(arrow.text().charCodeAt(0), 8595, "sort arrow direction should be down");
        ok(table.rows.sortDescending, "table should be sorted descending");
    }
    else {
        equal(arrow.text().charCodeAt(0), 8593, "sort arrow direction should be up");
        ok(!table.rows.sortDescending, "table should be sorted ascending");
    }
}

function isSorted(table) {
    if (typeof table.rows.sortColumn !== "number") {
        return false;
    }
    var val1, val2;
    // Check that the rows collection is sorted
    for (var i = 0; i < table.rows.length - 1; i++) {
        val1 = table.rows.getValue(i, table.rows.sortColumn);
        val2 = table.rows.getValue(i + 1, table.rows.sortColumn);
        if (table.rows.sortDescending && val1 < val2) return false;
        else if (!table.rows.sortDescending && val1 > val2) return false;
    }
    // Check that the DOM table is sorted
    var rows = table.tbodyElt.find("tr");
    for (var j = 1; j < rows.length - 2; j++) {
        val1 = parseInt(rows[j].cells[table.rows.sortColumn].firstChild.innerHTML, 10);
        val2 = parseInt(rows[j + 1].cells[table.rows.sortColumn].firstChild.innerHTML, 10);
        if (table.rows.sortDescending && val1 < val2) return false;
        else if (!table.rows.sortDescending && val1 > val2) return false;
    }
    return true;
}

function resizeColumnAndTest(table, column, change) {
    var row = table.tbodyElt.find("tr")[1];
    var col = table.columns.get(column);
    var actualWidth = col.get('element').width();
    var attrWidth = col.get('width');
    var minWidth = getTextWidth(col.get('name')) + 20;
    var expectedWidth = actualWidth + change;
    if (expectedWidth < minWidth) expectedWidth = minWidth;
    table.resizeColumn(column, attrWidth + change);
    row = table.tbodyElt.find("tr")[1];
    equal(col.get('element').width(), expectedWidth, "TH width should change by " + change + "px");
    equal(col.get('width'), attrWidth + change, "width attribute should change by " + change + "px");
    if (col.get('order') === table.columns.length - 1) {
        equal($(row.cells[col.get('order')]).width(), expectedWidth - table.scrollbarWidth + 2, "TD width should equal TH width - scrollbar width");
    }
    else {
        equal($(row.cells[col.get('order')]).width(), expectedWidth, "TD width should match TH width");
    }
}

function scrollAndTestContents(table, scrollTop) {
    var cols = table.columns.length;
    table.tbodyElt[0].scrollTop = scrollTop;
    table.onTableScrolled({target : {scrollTop : scrollTop}});
    var rows = table.tbodyElt.find("tr");
    var firstVisibleRow = parseInt(scrollTop / table.rowHeight, 10);
    var expectedFirstRow = firstVisibleRow - BUFFER_ROWS;
    if (expectedFirstRow < 0) expectedFirstRow = 0;
    var expectedLastRow = firstVisibleRow + table.visibleRows + BUFFER_ROWS;
    if (expectedLastRow > table.rows.length) {
        expectedLastRow = table.rows.length;
        expectedFirstRow = expectedLastRow - table.visibleRows - BUFFER_ROWS;
        if (expectedFirstRow < 0) expectedFirstRow = 0;
    }
    equal(parseInt(rows[1].cells[0].firstChild.innerHTML, 10), expectedFirstRow * cols, "scrollTop = " + scrollTop + ": first cell rendered should contain " + expectedFirstRow * cols);
    equal(parseInt(rows[rows.length - 2].cells[0].firstChild.innerHTML, 10), (expectedLastRow - 1) * cols, "last row's first cell should contain " + (expectedLastRow - 1) * cols);
    equal(table.rowRange.first * table.rowHeight, rows[0].clientHeight, "height of top buffer row should equal " + table.rowRange.first * table.rowHeight);
    equal((table.rows.length - table.rowRange.last) * table.rowHeight, rows[rows.length - 1].clientHeight, "height of bottom buffer row should equal " + (table.rows.length - table.rowRange.last) * table.rowHeight);
}

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