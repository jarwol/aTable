function createTable() {
    return new ATable({
        fetchData : "fetchData500Rows4Cols",
        columns : [
            {name : "Column 1"},
            {name : "Column 2"},
            {name : "Column 3"},
            {name : "Column 4"}
        ],
        el : "#qunit-fixture",
        height : 300,
        rowsToRender : 100
    });
}

module("Row rendering");
asyncTest("Initial render 500 rows", 7, function () {
    var table = createTable();
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        ok(table.bufferRows > 0, "table.bufferRows should be positive");
        equal(table.rows.length, 500, "table.rows should have 10 rows");
        equal(table.rowRange.first, 0, "first row to render should be 0");
        equal(table.rowRange.last, 100, "last row to render should be 100");
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, 100, "DOM table should have 100 rows");

    });
});

asyncTest("Remove rows", 5, function () {
    var table = createTable();
    table.render(function () {
        start();
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, 100, "DOM table should have 100 rows");
        table.removeRows(2, true);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, 98, "DOM table should have 98 rows");
        equal(parseInt(rows[0].cells[0].innerText), 8, "first cell rendered should contain 8");
        table.removeRows(2, false);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, 96, "DOM table should have 96 rows");
        equal(parseInt(rows[95].cells[0].innerText), 388, "last cell rendered should contain 388");
    });
});

asyncTest("Scroll table", 16, function () {
    var table = createTable();
    table.render(function () {
        start();
        //Scroll down, but not enough to render any new rows in the table
        table.scrollTable({target : {scrollTop : 40}});
        equal(table.rowRange.first, 0, "previous first row to render should be 0");
        equal(table.rowRange.last, 100, "previous last row to render should be 100");
        equal(table.prevRowRange.first, 0, "previous first row to render should be 0");
        equal(table.prevRowRange.last, 100, "previous last row to render should be 100");

        // Scroll down enough to render new rows
        table.scrollTable({target : {scrollTop : 2000}});
        var rows = table.tbodyElt.find("tr");
        var expectedFirstRow = parseInt(2000 / table.rowHeight) - table.bufferRows;
        equal(table.rowRange.first, expectedFirstRow, "first row to render should be (2000 / rowHeight) - bufferRows = " + expectedFirstRow);
        equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be (firstRow + rowsToRender)");
        equal(parseInt(rows[0].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
        equal(parseInt(rows[99].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);

        // Scroll back up some
        table.scrollTable({target : {scrollTop : 1500}});
        rows = table.tbodyElt.find("tr");
        var expectedFirstRow = parseInt(1500 / table.rowHeight) - table.bufferRows;
        equal(table.rowRange.first, expectedFirstRow, "first row to render should be (1500 / rowHeight) - bufferRows = " + expectedFirstRow);
        equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be (firstRow + rowsToRender)");
        equal(parseInt(rows[0].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
        equal(parseInt(rows[99].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);

        // Scroll up to where the first row rendered should be 0
        table.scrollTable({target : {scrollTop : 0}});
        rows = table.tbodyElt.find("tr");
        equal(table.rowRange.first, 0, "first row to render should 0");
        equal(table.rowRange.last, 100, "last row to render should be 100");
        equal(parseInt(rows[0].cells[0].innerText), 0, "first cell rendered should contain 0");
        equal(parseInt(rows[99].cells[0].innerText), 396, "last row's first cell should contain 396");
    });
});

asyncTest("Random scroll stress test", 400, function () {
    var table = createTable();
    table.render(function () {
        start();
        var rows = table.tbodyElt.find("tr");
        var scrollHeight = table.tbodyElt[0].scrollHeight;
        for (var i = 1; i <= 100; i++) {
            var scrollTop = Math.floor(Math.random() * (scrollHeight + 1));
            table.scrollTable({target : {scrollTop : scrollTop}});
            var expectedFirstRow = parseInt(scrollTop / table.rowHeight) - table.bufferRows;
            expectedFirstRow = expectedFirstRow >= 0 ? expectedFirstRow : 0;
            var expectedLastRow = expectedFirstRow + table.rowsToRender;
            expectedLastRow = expectedLastRow < table.rows.length ? expectedLastRow : table.rows.length - 1;
            equal(table.rowRange.first, expectedFirstRow, "first row to render should be  " + expectedFirstRow);
            equal(table.rowRange.last, expectedLastRow, "last row to render should be " + expectedLastRow);
            equal(parseInt(rows[0].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
            equal(parseInt(rows[99].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);
        }


    });
});