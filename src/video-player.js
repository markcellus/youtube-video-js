define(function () {
    "use strict";

    var VideoPlayer = function (options) {
        this.initialize(options);
    };

    VideoPlayer.prototype = {

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

        },

        /**
         * Destroys the player instance.
         */
        destroy: function () {}

    };

    return VideoPlayer;
});

