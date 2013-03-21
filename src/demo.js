var rows = [["Serenity","Hoggarth","AnnArbor","893-480-2917"],["Aubrey","Carrington","Akron","882-426-3914"],["Elizabeth","Crossman","Elizabeth","834-549-2681"],["Olivia","Michaelson","CorpusChristi","822-451-2876"],["Leah","Molligan","FortWorth","878-409-2664"],["Hannah","Turner","BatonRouge","877-551-3262"],["Kimberly","Morrison","Maryland","842-457-3294"],["Autumn","White","Flint","883-481-3673"],["Audrey","Nelson","Dayton","858-599-3194"],["Angelina","Gate","FortWorth","800-400-2278"]];

$(document).ready(function () {
    var table = new ATable({
        dataFunction : function (atable) {
            atable.receivedData(rows);
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
    //bigTable.render();
});
