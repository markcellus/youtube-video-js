define(function () {
    "use strict";

    var BasePlayer = function (options) {
        this.initialize(options);
    };

    BasePlayer.prototype = {

        /**
         * Initialization.
         * @param {object} options - Options passed into instance
         */
        initialize: function (options) {

            var el = options.el || document.createDocumentFragment();

            this.options = _.extend({
                el: el,
                src: el.getAttribute('src'),
                autoplay: el.getAttribute('autoplay')
            }, options);

            BasePlayer.prototype.vidCount = BasePlayer.prototype.vidCount || 0;
            BasePlayer.prototype.vidCount++;

            this.vpid = 'v' + BasePlayer.prototype.vidCount;

        },

        /**
         * Destroys the player instance.
         */
        destroy: function () {}

    };

    return BasePlayer;
});


