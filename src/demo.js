$(document).ready(function () {
    var table = new ATable({
        dataFunction : function (atable) {
            atable.receivedData(rows.slice(0, 10));
        },
        columns : [
            {name : "first", label : "First Name"},
            {name : "last", label : "Last Name"},
            {name : "city", label: "City"},
            {name : "phone", label : "Phone #"}
        ],
        el : "#staticData10Rows",
        height : 600
    });
    table.render();

    var bigTable = new ATable({
        dataFunction : "fetchStockData",
        columns : [
            {name : "symbol", label : "Symbol"},
            {name : "company", label : "Company Name"},
            {name : "close", label: "Prev. Close"},
            {name : "open", label : "Open"},
            {name : "bid", label : "Bid"},
            {name : "ask", label : "Ask"},
            {name : "notes", label : "Notes"}
        ],
        el : "#dynamicAjax",
        height : 600
    });
    bigTable.render();
});