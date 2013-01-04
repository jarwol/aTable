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
asyncTest("Initial render 500 rows", 4, function () {
    var table = createTable();
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        equal(table.rows.length, 500, "table.rows should have 10 rows");
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, 102, "DOM table should have 102 rows");
    });
});

asyncTest("Remove rows", 5, function () {
    var table = createTable();
    table.render(function () {
        start();
        var rows = table.tbodyElt.find("tr");
        equal(rows.length, 102, "DOM table should have 102 rows");
        table.removeRows(2, true);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, 100, "DOM table should have 100 rows");
        equal(parseInt(rows[1].cells[0].innerText), 8, "first cell rendered should contain 8");
        table.removeRows(2, false);
        rows = table.tbodyElt.find("tr");
        equal(rows.length, 98, "DOM table should have 98 rows");
        equal(parseInt(rows[96].cells[0].innerText), 388, "last cell rendered should contain 388");
    });
});

asyncTest("Scroll table", 16, function () {
    var table = createTable();
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
    var table = createTable();
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
    table.tbodyElt[0].scrollTop = scrollTop;
    table.scrollTable({target : {scrollTop : scrollTop}});
    var rows = table.tbodyElt.find("tr");
    var expectedFirstRow = parseInt(scrollTop / table.rowHeight);
    var expectedLastRow = expectedFirstRow + table.rowsToRender;
    if (expectedLastRow >= table.rows.length) {
        expectedLastRow = table.rows.length - 1;
        expectedFirstRow = expectedLastRow - table.rowsToRender;
    }
    equal(parseInt(rows[1].cells[0].innerText), expectedFirstRow * 4, "scrollTop = " + scrollTop + ": first cell rendered should contain " + expectedFirstRow * 4);
    equal(parseInt(rows[100].cells[0].innerText), (expectedLastRow - 1) * 4, "last row's first cell should contain " + (expectedLastRow - 1) * 4);
}
