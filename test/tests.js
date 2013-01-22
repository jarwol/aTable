function createTable(dataFunc, cols) {
    var columns = [];
    for (var i = 0; i < cols; i++) {
        columns.push({name : "Column " + i});
    }
    return new ATable({
        fetchData : dataFunc,
        columns : columns,
        el : "#qunit-fixture",
        height : 300,
        rowsToRender : 100
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

asyncTest("Remove rows", 5, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS + 2, "DOM table should have " + (table.visibleRows + BUFFER_ROWS + 2) + " rows");
        table.removeRows(2, true);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS, "DOM table should have " + (table.visibleRows + BUFFER_ROWS) + " rows");
        equal(parseInt(rows[1].cells[0].innerText), 2, "first cell rendered should contain 2");
        table.removeRows(2, false);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, table.visibleRows + BUFFER_ROWS - 2, "DOM table should have " + (table.visibleRows + BUFFER_ROWS - 2) + " rows");
        var expectedLastVal = rows.length - 1;
        equal(parseInt(rows[table.visibleRows + BUFFER_ROWS - 4].cells[0].innerText), expectedLastVal, "last cell rendered should contain " + expectedLastVal);
    });
});

asyncTest("Scroll table", 16, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        // Scroll down, but not enough to render any new rows in the table
        scrollAndTestContents(table, 4);
        // Scroll down enough to render new rows
        scrollAndTestContents(table, 1000);
        // Scroll back up some
        scrollAndTestContents(table, 900);
        // Scroll up more
        scrollAndTestContents(table, 100);
        // Scroll up to the top
        scrollAndTestContents(table, 0);
        // Scroll down past the rowsToRender mark
        scrollAndTestContents(table, table.rowHeight * 102);
        // Scroll to the bottom
        scrollAndTestContents(table, table.rows.length * table.rowHeight);
        // Scroll up a lot
        scrollAndTestContents(table, 5000);
    });
});

asyncTest("Random scroll stress test", 2000, function () {
    var table = createTable('fetchData100Rows1Col', 1);
    table.render(function () {
        start();
        var scrollHeight = table.tbodyElt[0].scrollHeight;
        for (var i = 1; i <= 1000; i++) {
            var scrollTop = Math.floor(Math.random() * (scrollHeight + 1));
            table.scrollTable({target : {scrollTop : scrollTop}});
            scrollAndTestContents(table, scrollTop);
        }
    });
});

function scrollAndTestContents(table, scrollTop) {
    var cols = table.columns.length;
    table.tbodyElt[0].scrollTop = scrollTop;
    table.scrollTable({target : {scrollTop : scrollTop}});
    var rows = table.tbodyElt.find("tr");
    var expectedFirstRow = parseInt(scrollTop / table.rowHeight);
    var expectedLastRow = expectedFirstRow + table.visibleRows + BUFFER_ROWS;
    if (expectedLastRow > table.rows.length) {
        expectedLastRow = table.rows.length;
        expectedFirstRow = expectedLastRow - table.visibleRows - BUFFER_ROWS;
        if (expectedFirstRow < 0) expectedFirstRow = 0;
    }
    equal(parseInt(rows[1].cells[0].innerText), expectedFirstRow * cols, "scrollTop = " + scrollTop + ": first cell rendered should contain " + expectedFirstRow * cols);
    equal(parseInt(rows[rows.length - 2].cells[0].innerText), (expectedLastRow - 1) * cols, "last row's first cell should contain " + (expectedLastRow - 1) * cols);
}
