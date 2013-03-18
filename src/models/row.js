var Row = Backbone.Model.extend(
    /** @lends Row.prototype */
    {
        /**
         * @class Backbone Model representation of a table row
         * @augments Backbone.Model
         * @constructs
         */
        initialize : function () {
        },
        
        defaults : {
            row : []
        }
    });