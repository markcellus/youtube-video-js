define(['./base-player', 'underscore', 'element-kit'], function (BasePlayer, _) {
    "use strict";

    var YoutubePlayer = function (options) {
        this.initialize(options);
    };

    YoutubePlayer.prototype = _.extend({}, BasePlayer.prototype, {

        /**
         * Initialization.
         * @param {object} options - Options passed into instance
         */
        initialize: function (options) {

            var el = options.el || document.createDocumentFragment();

            this.options = _.extend({
                el: el,
                autoplay: el.getAttribute('autoplay'),
                width: el.getAttribute('width'),
                height: el.getAttribute('height'),
                playingCssClass: 'video-playing',
                videoId: null
            }, options);

            BasePlayer.prototype.initialize.call(this, this.options);

            this.el = this.options.el;
        },

        /**
         * Gets the source url of the youtube video.
         * @returns {String|undefined} Returns the source url string if there is one
         */
        getSource: function () {
            var sources = this.el.getElementsByTagName('source'),
                i, count = sources.length, source;
            if (!this.src) {
                for (i = 0; i < count; i++) {
                    source = sources[i];
                    if (source.getAttribute('type') === 'video/youtube') {
                        this.src = source.getAttribute('src');
                        break;
                    }
                }
            }
            return this.src;
        },

        /**
         * Loads the video and reset the play head to the beginning of the video.
         * @param callback
         */
        load: function (callback) {
            this._loadScript(function () {
                this._buildPlayer(function (player) {
                    this.player = player;
                    if (callback) {
                        callback(player);
                    }
                }.bind(this));
            }.bind(this));
        },

        /**
         * Builds the player instance (creates it if doesnt already exist).
         * @param {Function} callback - The API will call this function when the video player is ready.
         */
        _buildPlayer: function (callback) {
            var done = function (player) {
                if (callback) {
                    callback(player);
                }
            };
            if (!this._p) {
                this._p = this._createPlayer(done);
            } else {
                done(this._p);
            }
        },

        /**
         * Creates and returns the player instance.
         * @param onComplete
         * @private
         */
        _createPlayer: function (onComplete) {
            // create parent div
            var id = 'vplayer' + this.vpid;

            this._container = this.el.kit.appendOuterHtml('<div id="' + id + '"></div>');
            // hide video element now that we have a div for our player

            this._container.removeChild(this.el);

            return new YT.Player(id, {
                height: this.options.height,
                width: this.options.width,
                videoId: this.options.videoId,
                events: {
                    onReady: function (e) {
                        onComplete(e.target);
                    }
                }
            });
        },

        /**
         * Load the script required for video player.
         * @param callback
         * @private
         */
        _loadScript: function (callback) {
            if (YoutubePlayer.prototype._script) {
                callback ? callback() : null;
            } else {
                // Load the IFrame Player API code asynchronously.
                var script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(script, firstScriptTag);

                YoutubePlayer.prototype._script = script;

                // Replace the 'ytplayer' element with an <iframe> and
                // YouTube player after the API code downloads.
                window.onYouTubeIframeAPIReady = function () {
                    callback ? callback() : null;
                }.bind(this)
            }
        },

        /**
         * Plays the video from it’s current location.
         */
        play: function () {
            // add class so things like play button image,
            // thumbnail/poster image, etc can be manipulated if needed
            if (this.getSource()) {
                this.el.classList.add(this.options.playingCssClass);
                this.player.playVideo();
            } else {
                console.warn('youtube video error: you cannot call play() method on a video element that has no youtube source url');
            }
        },

        /**
         * Pauses the video at the then-current time.
         */
        pause: function () {
            this.player.pauseVideo();
            this.el.classList.remove(this.options.playingCssClass);
        },

        /**
         * Stops and cancels loading of the current video.
         */
        stop: function () {
            this.player.stopVideo();
            this.el.classList.remove(this.options.playingCssClass);
        },

        /**
         * Transitions the video to a certain time.
         * @param {Number} time - The second that should
         */
        seekTo: function (time) {},

        /**
         * Destroys the video instance.
         */
        destroy: function () {
            var script = YoutubePlayer.prototype._script;
            if (script) {
                script.parentNode.removeChild(script);
                YoutubePlayer.prototype._script = null;
            }
            // get rid of container and place video element back in the dom exactly the way we found it
            if (this._container) {
                this._container.parentNode.replaceChild(this.el, this._container);
            }
            BasePlayer.prototype.destroy.call(this);
        }

    });

    return YoutubePlayer;
});