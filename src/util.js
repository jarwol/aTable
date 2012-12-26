var Util = {
    /**
     * Format a timestamp or Date object into a human-readable String
     * @param val
     * Date or timestamp to format
     * @returns String representation of the formatted Date
     */
    formatDate : function formatDate(val) {
        return val;
        var date = new Date(val);
        if (date.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)) {
            return $.format.date(val, "h:mm:ss.SSS a");
        }
        else {
            return $.format.date(val);
        }
    },

    /**
     * Format a value to display in a blotter
     * @param val
     * value to format
     * @returns formatted entity field
     */
    formatEntityField : function formatEntityField(val) {
        return val;
        if (val === null) return null;
        if (typeof val === "number") {
            val = $.format.number(val, '#,###');
        }
        else if (typeof val === "date") {
            val = formatDate(val);
        }
        return val;
    },

    /**
     * Determine the width of a string when rendered on the page
     * @param text
     * @return {Number}
     */
    getTextWidth : function getTextWidth(text) {
        var o = $('<th>' + text + '</th>').css({
            'position' : 'absolute',
            'float' : 'left',
            'white-space' : 'nowrap',
            'visibility' : 'hidden'
        }).appendTo($('body'));
        var width = o.width();
        o.remove();
        return width;
    },

    /**
     * Swap two elements in an array
     * @param {Array} arr the array
     * @param {number} i first element's index
     * @param {number} j second element's index
     */
    swap : function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
};