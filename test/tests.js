test("InitialRenderSmallData", function () {
    stop();
    var table = new Table({
        fetchData : "fetchData500Rows4Cols",
        columns : [
            {name : "Column 1"},
            {name : "Column 2"},
            {name : "Column 3"},
            {name : "Column 4"}
        ],
        el : "#content",
        height : 300,
        rowsToRender : 100
    }).render(function () {
            start();
            ok(table.rowHeight > 0, "table.rowHeight should be positive");
            ok(table.visibleRows > 0, "table.visibleRows should be positive");
            ok(table.bufferRows > 0, "table.bufferRows should be positive");
            equal(table.rows.length, 500, "table.rows should have 10 rows");
            equal(table.rowRange.first, 0, "first row to render should be 0");
            equal(table.rowRange.last, 100, "last row to render should be 100");
            
            table.scrollTable({target : {scrollTop : 40}});
            equal(table.rowRange.first, 0, "previous first row to render should be 0");
            equal(table.rowRange.last, 100, "previous last row to render should be 100");
            equal(table.prevRowRange.first, 0, "previous first row to render should be 0");
            equal(table.prevRowRange.last, 100, "previous last row to render should be 100");
            
            table.scrollTable({target : {scrollTop : 2000}});
            var expectedFirstRow = parseInt(2000 / table.rowHeight) - table.bufferRows;
            ok(expectedFirstRow > 0, "first row to render should be positive");
            equal(table.rowRange.first, expectedFirstRow, "first row to render should be (2000 / rowHeight) - bufferRows = " + expectedFirstRow);
            equal(table.rowRange.last, expectedFirstRow + table.rowsToRender, "last row to render should be (firstRow + rowsToRender)");
            
            //var rowToScroll = table.rowsToRender - table.bufferRows
        });
});