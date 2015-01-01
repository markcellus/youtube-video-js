/** 
* Video - v0.0.4.
* https://github.com/mkay581/video.git
* Copyright 2015. Licensed MIT.
*/
(function (factory) {
    'use strict';
    // support both AMD and non-AMD
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'element-kit'], function (_) {
            return factory(_);
        });
    } else {
        factory(window._);
    }
})((function (_) {
    'use strict';

    var BaseVideo = function () {};

    BaseVideo.prototype = {

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

            BaseVideo.prototype.vidCount = BaseVideo.prototype.vidCount || 0;
            BaseVideo.prototype.vidCount++;

            this.vpid = 'v' + BaseVideo.prototype.vidCount;

        },

        /**
         * Adds an event listener to the media element.
         * @param event
         * @param listener
         */
        addEventListener: function (event, listener) {
            this.el.addEventListener.apply(this, arguments);
        },

        /**
         * Removes an event listener fromt the media element.
         * @param event
         * @param listener
         */
        removeEventListener: function (event, listener) {
            this.el.removeEventListener.apply(this, arguments);
        },

        load: function () {
            this.el.load();
        },

        /**
         * Plays the video from it’s current location.
         */
        play: function () {
            this.el.play();
        },

        /**
         * Pauses the video at the then-current time.
         */
        pause: function () {
            this.el.pause();
        },

        /**
         * Destroys the player instance.
         */
        destroy: function () {}

    };

    var YoutubeVideo = function (options) {
        this.initialize(options);
    };

    YoutubeVideo.prototype = _.extend({}, BaseVideo.prototype, {

        /**
         * Initialization.
         * @param {object} options - Options passed into instance
         * @extends BaseVideo
         * @param {HTMLVideoElement} options.el - The video element
         * @param {string} [options.autoplay] - A boolean of whether to automatically play the video once player is loaded
         * @param {string} [options.width] - The width of the player
         * @param {string} [options.height] - The height of the player
         * @param {string} [options.playingCssClass] - The css class that will be applied when a video starts playing
         * @param {string} [options.loadingCssClass] - The css class that will be applied when the player is loading
         */
        initialize: function (options) {

            var el = options.el || document.createDocumentFragment();

            this.options = _.extend({
                el: el,
                autoplay: el.getAttribute('autoplay'),
                width: el.getAttribute('width'),
                height: el.getAttribute('height'),
                playingCssClass: 'video-playing',
                loadingCssClass: 'video-loading'
            }, options);

            BaseVideo.prototype.initialize.call(this, this.options);

            YoutubeVideo.prototype.players = YoutubeVideo.prototype.players || {};

            this.el = this.options.el;

            // create parent div
            this._container = this.el.kit.appendOuterHtml('<div id="vplayer' + this.vpid + '-container"></div>');
        },

        /**
         * Gets the source url of the youtube video.
         * @returns {String|undefined} Returns the source url string if there is one
         */
        getSourceUrl: function () {
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
            this._container.kit.classList.add(this.options.loadingCssClass);
            this._loadScript(function () {
                this._buildPlayer(function (player) {
                    this.player = player;
                    this._container.kit.classList.remove(this.options.loadingCssClass);
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
            var id = 'vplayer' + this.vpid;

            // create youtube element
            this._ytEl = document.createElement('div');
            this._ytEl.setAttribute('id', id);
            this._container.appendChild(this._ytEl);

            // hide video element now that we have a div for our player
            this._container.removeChild(this.el);

            var instance = new YT.Player(id, {
                height: this.options.height,
                width: this.options.width,
                videoId: this.extractVideoIdFromUrl(this.getSourceUrl()),
                events: {
                    onReady: function (e) {
                        onComplete(e.target);
                    },
                    onStateChange: this._onStateChange.bind(this)
                }
            });

            YoutubeVideo.prototype.players[this.vpid] = this;

            return instance;
        },

        /**
         * Extracts the video id from a youtube url.
         * @returns {Number|string} - The video id extracted
         */
        extractVideoIdFromUrl: function (text) {
            if (text) {
                var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
                text = text.replace(re, '$1');
            }
            return text;
        },

        /**
         * Load the script required for video player.
         * @param callback
         * @private
         */
        _loadScript: function (callback) {
            if (YoutubeVideo.prototype._script) {
                callback ? callback() : null;
            } else {
                // Load the IFrame Player API code asynchronously.
                var script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(script, firstScriptTag);

                YoutubeVideo.prototype._script = script;

                // Replace the 'ytplayer' element with an <iframe> and
                // YouTube player after the API code downloads.
                window.onYouTubeIframeAPIReady = function () {
                    callback ? callback() : null;
                }.bind(this)
            }
        },

        /**
         * When the video's state changes.
         * @param {Number} state - The number representing the state of the video
         * @private
         */
        _onStateChange: function (state) {
            var stateMap = {
                '-1': {name: 'unstarted'},
                '0': {name: 'ended', method: this.onEnd},
                '1': {name: 'playing', method: this.onPlay},
                '2': {name: 'paused', method: this.onPause},
                '3': {name: 'buffering'},
                '5': {name: 'cued'}
            };

            state = '' + state; // to string
            if (stateMap[state].method) {
                stateMap[state].method.call(this);
            }
        },

        /**
         * Creates a new event and triggers it on the video element.
         * @param {String} event - The name of the event to trigger
         * @private
         */
        _triggerEvent: function (event) {
            // use old-way of constructing custom events for IE9 and IE10
            var e = document.createEvent('CustomEvent');
            e.initCustomEvent(event, false, false, null);
            this.el.dispatchEvent(e);
        },

        /**
         * Plays the video from it’s current location.
         */
        play: function () {
            // add class so things like play button image,
            // thumbnail/poster image, etc can be manipulated if needed
            if (this.getSourceUrl()) {
                this.player.playVideo();
            } else {
                console.warn('youtube video error: you cannot call play() method on a video element that has no youtube source url');
            }
        },

        /**
         * Plays the video from it’s current location.
         */
        onPlay: function () {
            // add class so things like play button image,
            // thumbnail/poster image, etc can be manipulated if needed
            this._container.classList.add(this.options.playingCssClass);
            this._triggerEvent('play');
        },

        /**
         * Pauses the video at the then-current time.
         */
        pause: function () {
            this.player.pauseVideo();
        },

        /**
         * When the video is paused.
         */
        onPause: function () {
            this._container.classList.remove(this.options.playingCssClass);
            this._triggerEvent('pause');
        },

        /**
         * Stops and cancels loading of the current video.
         */
        stop: function () {
            this.player.stopVideo();
        },

        /**
         * When the video has finished playing.
         */
        onEnd: function () {
            this._container.classList.remove(this.options.playingCssClass);
            this._triggerEvent('ended');
        },

        /**
         * Destroys the video instance.
         */
        destroy: function () {
            var script = YoutubeVideo.prototype._script,
                cachedPlayers = YoutubeVideo.prototype.players;

            // remove from cache
            delete cachedPlayers[this.vpid];

            if (script && !_.keys(cachedPlayers).length) {
                script.parentNode.removeChild(script);
                YoutubeVideo.prototype._script = null;
            }
            // get rid of container and place video element back in the dom exactly the way we found it
            this._container.parentNode.replaceChild(this.el, this._container);

            BaseVideo.prototype.destroy.call(this);
        }
    });

    return {
        Youtube: YoutubeVideo
    }

}));