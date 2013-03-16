function createTable(dataFunc, cols) {
    var columns = [];
    for (var i = 0; i < cols; i++) {
        columns.push({name : "Column " + i});
    }
    return new ATable({
        fetchData : dataFunc,
        columns : columns,
        el : "#qunit-fixture",
        height : 300
    });
}

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

asyncTest("Dynamic data source", 2, function () {
    var table = createTable('fetchDataMultiple', 4);
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
    var table = createTable('fetchDataMultiple', 4);
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

asyncTest("Random scroll stress test", 4000, function () {
    var table = createTable('fetchData100Rows1Col', 1);
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
        table.moveColumn(0, 1);
        var row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 1, "first cell should contain 1");
        equal(row.cells[1].firstChild.innerHTML, 0, "second cell should contain 0");
        table.moveColumn(1, 0);
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 0, "first cell should contain 0");
        equal(row.cells[1].firstChild.innerHTML, 1, "second cell should contain 1");
        table.moveColumn(0, 3);
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 1, "first cell should contain 1");
        equal(row.cells[1].firstChild.innerHTML, 2, "second cell should contain 2");
        equal(row.cells[2].firstChild.innerHTML, 3, "first cell should contain 3");
        equal(row.cells[3].firstChild.innerHTML, 0, "second cell should contain 0");
        table.moveColumn(2, 0);
        row = table.tbodyElt.find("tr")[1];
        equal(row.cells[0].firstChild.innerHTML, 3, "first cell should contain 3");
        equal(row.cells[1].firstChild.innerHTML, 1, "second cell should contain 1");
        equal(row.cells[2].firstChild.innerHTML, 2, "first cell should contain 2");
        equal(row.cells[3].firstChild.innerHTML, 0, "second cell should contain 0");
    });
});

asyncTest("Resize columns", 22, function () {
    var table = createTable('fetchData1Row4Cols', 4);
    table.render(function () {
        start();
        resizeColumnAndTest(table, 0, 5);
        resizeColumnAndTest(table, 0, -3);
        resizeColumnAndTest(table, 1, 5);
        resizeColumnAndTest(table, 3, 5);
        resizeColumnAndTest(table, 3, -5);
        resizeColumnAndTest(table, 2, 0);
        resizeColumnAndTest(table, 0, -100);
        raises(function () {
            table.resizeColumn(5, 0);
        }, "resizing an invalid column index should throw an exception");
    });
});

asyncTest("Sort columns", 38, function () {
    var table = createTable('fetchData4Rows4Cols', 4);
    table.render(function () {
        start();
        equal(typeof table.rows.sortColumn, "undefined", "sort column should start undefined");
        ok(!isSorted(table), "table should start unsorted");
        ok(table.tableElt.find(".sortArrow").length === 0, "there should be no sort arrow");

        // Simulate sorting from the UI (no sortDescending parameter)
        table.sort(0);
        testSort(table, 0, false);
        table.sort(0);
        testSort(table, 0, true);
        table.sort(0);
        testSort(table, 0, false);
        table.sort(3);
        testSort(table, 3, false);

        // Sort via the API
        table.sort(2, true);
        testSort(table, 2, true);
        table.sort(2, true);
        testSort(table, 2, true);
        table.sort(2, false);
        testSort(table, 2, false);
    });
});

asyncTest("Move sorted columns", 25, function () {
    var table = createTable('fetchData4Rows4Cols', 4);
    table.render(function () {
        start();

        // Move sorted column
        table.sort(1);
        table.moveColumn(1, 0);
        testSort(table, 0, false);
        // Re-sort a moved sorted column
        table.sort(0);
        testSort(table, 0, true);
        // Move sorted column to the end
        table.moveColumn(0, 3);
        testSort(table, 3, true);
        // Move unsorted column to another unsorted column
        table.moveColumn(1, 2);
        testSort(table, 3, true);
        // Move unsorted column to a sorted column
        table.moveColumn(0, 3);
        testSort(table, 2, true);
    });
});

function testSort(table, colIdx, expectDescending) {
    ok(isSorted(table), "table should be sorted");
    var arrow = table.tableElt.find(".sortArrow");
    equal(arrow.length, 1, "there should only be one sort arrow");
    equal(arrow[0].parentElement.parentElement.cellIndex, colIdx, "sort arrow should be in column " + colIdx);

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

function resizeColumnAndTest(table, colIdx, change) {
    var row = table.tbodyElt.find("tr")[1];
    var col = table.columns.at(colIdx);
    var actualWidth = col.get('element').width();
    var attrWidth = col.get('width');
    var minWidth = getTextWidth(col.get('name')) + 20;
    var expectedWidth = actualWidth + change;
    if (expectedWidth < minWidth) expectedWidth = minWidth;
    stop();
    table.resizeColumn(colIdx, attrWidth + change, function () {
        start();
        row = table.tbodyElt.find("tr")[1];
        equal(col.get('element').width(), expectedWidth, "TH width should change by " + change + "px");
        equal(col.get('width'), attrWidth + change, "width attribute should change by " + change + "px");
        if (colIdx === table.columns.length - 1) {
            equal($(row.cells[colIdx]).width(), expectedWidth - table.scrollbarWidth + 2, "TD width should equal TH width - scrollbar width");
        }
        else {
            equal($(row.cells[colIdx]).width(), expectedWidth, "TD width should match TH width");
        }
    });
}

function scrollAndTestContents(table, scrollTop) {
    var cols = table.columns.length;
    table.tbodyElt[0].scrollTop = scrollTop;
    table.onTableScrolled({target : {scrollTop : scrollTop}});
    var rows = table.tbodyElt.find("tr");
    var expectedFirstRow = parseInt(scrollTop / table.rowHeight, 10) - BUFFER_ROWS;
    if (expectedFirstRow < 0) expectedFirstRow = 0;
    var expectedLastRow = expectedFirstRow + table.visibleRows + BUFFER_ROWS;
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