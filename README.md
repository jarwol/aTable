#aTable

Fast, interactive Javascript table component built on Backbone.js. Simply pass in a list of columns and a function that returns the table's dataset (2D array of cell values), and you'll have a beautifully-rendered HTML table with an extensive feature set:
* **Small DOM footprint** - Rows are added and removed as the table is scrolled, allowing aTable to be extremely fast even for huge amounts of rows.
* **Sortable** - Click any column header to sort by that column.
* **Resizable columns** - Drag between column headers to resize columns.
* **Moveable columns** - Click and drag column headers to move columns.

####Easy API - interact with the table programmatically
* Resize a column  - `atable.resizeColumn(columnIndex, newWidth, callback)`
* Move a column - `atable.moveColumn(sourceIndex, destIndex)`
* Sort the table   - `atable.sort(sortColumn, sortDescending)`
