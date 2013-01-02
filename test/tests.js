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
asyncTest("Initial render 500 rows", 6, function () {
    var table = createTable();
    table.render(function () {
        start();
        ok(table.rowHeight > 0, "table.rowHeight should be positive");
        ok(table.visibleRows > 0, "table.visibleRows should be positive");
        equal(table.rows.length, 500, "table.rows should have 10 rows");
        equal(table.rowRange.first, 0, "first row to render should be 0");
        equal(table.rowRange.last, 100, "last row to render should be 100");
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

asyncTest("Scroll table", 20, function () {
    var table = createTable();
    table.render(function () {
        start();
        // Scroll down, but not enough to render any new rows in the table
        table.tbodyElt[0].scrollTop = 4;
        table.scrollTable({target : {scrollTop : 2}});
        equal(table.rowRange.first, 0, "first row to render should be 0");
        equal(table.rowRange.last, 100, "last row to render should be 100");
        equal(table.prevRowRange.first, 0, "previous first row to render should be 0");
        equal(table.prevRowRange.last, 100, "previous last row to render should be 100");

        // Scroll down enough to render new rows
        table.tbodyElt[0].scrollTop = 1000;
        table.scrollTable({target : {scrollTop : 1000}});
        var rows = table.tbodyElt.find("tr");
        var expectedFirstRow = parseInt(998 / table.rowHeight);
        equal(table.rowRange.first, expectedFirstRow, "first row to render should be " + expectedFirstRow);
        equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be " + (expectedFirstRow + table.rowsToRender));
        equal(parseInt(rows[1].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
        equal(parseInt(rows[100].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);

        // Scroll back up some
        table.tbodyElt[0].scrollTop = 900;
        table.scrollTable({target : {scrollTop : 900}});
        rows = table.tbodyElt.find("tr");
        expectedFirstRow -= parseInt(100 / table.rowHeight);
        equal(table.rowRange.first, expectedFirstRow, "first row to render should be " + expectedFirstRow);
        equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be " + (expectedFirstRow + table.rowsToRender));
        equal(parseInt(rows[1].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
        equal(parseInt(rows[100].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);

        // Scroll up more
        table.tbodyElt[0].scrollTop = 100;
        table.scrollTable({target : {scrollTop : 100}});
        rows = table.tbodyElt.find("tr");
        expectedFirstRow = parseInt(100 / table.rowHeight);
        equal(table.rowRange.first, expectedFirstRow, "first row to render should be " + expectedFirstRow);
        equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be " + (expectedFirstRow + table.rowsToRender));
        equal(parseInt(rows[1].cells[0].innerText), expectedFirstRow * 4, "first cell rendered should contain 0");
        equal(parseInt(rows[100].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);

        // Scroll up to the top
        table.tbodyElt[0].scrollTop = 0;
        table.scrollTable({target : {scrollTop : 0}});
        rows = table.tbodyElt.find("tr");
        equal(table.rowRange.first, 0, "first row to render should 0");
        equal(table.rowRange.last, 100, "last row to render should be 100");
        equal(parseInt(rows[1].cells[0].innerText), 0, "first cell rendered should contain 0");
        equal(parseInt(rows[100].cells[0].innerText), 396, "last row's first cell should contain 396");
    });
});

asyncTest("Random scroll stress test", 4000, function () {
    var table = createTable();
    table.render(function () {
        start();
        var scrollHeight = table.tbodyElt[0].scrollHeight;
        var bottomThreshold = (table.tbodyElt[0].scrollHeight - table.tbodyElt[0].clientHeight) * .8;
        var topThreshold = table.tbodyElt[0].scrollHeight * .1;
        for (var i = 1; i <= 1000; i++) {
            var scrollTop = Math.floor(Math.random() * (scrollHeight + 1));
            table.scrollTable({target : {scrollTop : scrollTop}});
            var rows = table.tbodyElt.find("tr");
            var expectedFirstRow;
            if(scrollTop > bottomThreshold && table.rowRange.first > table.prevRowRange.first){
                var rowsPast = parseInt((scrollTop - bottomThreshold) / table.rowHeight);
                expectedFirstRow = table.prevRowRange.first + rowsPast;
            }
            else if(scrollTop < topThreshold && table.rowRange.first < table.prevRowRange.first){
                var rowsPast = parseInt((topThreshold - scrollTop) / table.rowHeight);
                expectedFirstRow = table.prevRowRange.first - rowsPast;
            }
            else{
                expectedFirstRow = table.prevRowRange.first;
            }
            expectedFirstRow = expectedFirstRow >= 0 ? expectedFirstRow : 0;
            var expectedLastRow = expectedFirstRow + table.rowsToRender;
            expectedLastRow = expectedLastRow < table.rows.length ? expectedLastRow : table.rows.length - 1;
            if(expectedLastRow === table.rows.length) expectedFirstRow = expectedLastRow - table.rowsToRender;
            equal(table.rowRange.first, expectedFirstRow, "first row to render should be  " + expectedFirstRow);
            equal(table.rowRange.last, expectedLastRow, "last row to render should be " + expectedLastRow);
            equal(parseInt(rows[0].cells[0].innerText), table.rowRange.first * 4, "first cell rendered should contain " + table.rowRange.first * 4);
            equal(parseInt(rows[99].cells[0].innerText), (table.rowRange.last - 1) * 4, "last row's first cell should contain " + (table.rowRange.last - 1) * 4);
        }
    });
});