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
         * @param useCapture
         */
        addEventListener: function (event, listener, useCapture) {
            this.el.addEventListener(event, listener, useCapture);
        },

        /**
         * Removes an event listener fromt the media element.
         * @param event
         * @param listener
         * @param useCapture
         */
        removeEventListener: function (event, listener, useCapture) {
            this.el.removeEventListener(event, listener, useCapture);
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
            YoutubeVideo.prototype.players[this.vpid] = this;

            this.el = this.options.el;
            this._origParent = this.el.parentNode;
            this._sourceUrl = this.getSourceUrl();

            // build player vars
            this._playerVars = _.extend({
                autoplay: this.options.autoplay ? 1 : 0
            }, this.getPlayerVars());

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
            // create parent div to show loading state
            this._container = document.createElement('div');
            this._container.setAttribute('id', 'vplayer' + this.vpid + '-container');
            
            if (this._origParent) {
                this._origParent.replaceChild(this._container, this.el);
            }

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

            return new YT.Player(id, {
                height: this.options.height,
                width: this.options.width,
                playerVars: this._playerVars,
                videoId: this.getVideoId(),
                events: {
                    onReady: function (e) {
                        onComplete(e.target);
                    },
                    onStateChange: this._onStateChange.bind(this)
                }
            });
        },

        /**
         * Generates playerVars from a Youtube URL and puts it into a neat little object.
         * @returns {Object}
         */
        getPlayerVars: function () {
            var queryString = this._sourceUrl.split('?')[1] || '',
                    a = queryString.split('&');
            if (a == '') return {};
            var b = {};
            for (var i = 0; i < a.length; ++i)
            {
                var p=a[i].split('=', 2);
                if (p.length == 1)
                    b[p[0]] = '';
                else
                    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
            }
            return b;
        },

        /**
         * Gets the current video id from a youtube url and returns it.
         * @returns {Number|string} - The video id extracted
         */
        getVideoId: function () {
            if (!this._videoId) {
                var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
                this._videoId = this._sourceUrl.replace(re, '$1');
            }
            return this._videoId;
        },

        /**
         * Load the script required for video player.
         * @param callback
         * @private
         */
        _loadScript: function (callback) {
            if (YoutubeVideo.prototype._scriptLoaded) {
                return callback ? callback() : null;
            }

            if (!YoutubeVideo.prototype._script) {
                // Load the IFrame Player API code asynchronously.
                var script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
                YoutubeVideo.prototype._script = script;
            }
            window.onYouTubeIframeAPIReady = function () {
                callback ? callback() : null;
                YoutubeVideo.prototype._scriptLoaded = true;
            }.bind(this)
        },

        /**
         * When the video's state changes.
         * @param {Object} obj - Youtube's data object
         * @param {Number} obj.state - The number representing the state of the video
         * @private
         */
        _onStateChange: function (obj) {
            var stateMap = {
                    '-1': {name: 'unstarted'},
                    '0': {name: 'ended', method: this.onEnd},
                    '1': {name: 'playing', method: this.onPlay},
                    '2': {name: 'paused', method: this.onPause},
                    '3': {name: 'buffering'},
                    '5': {name: 'cued'}
                },
                state = '' + obj.data; // to string
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
            if (!this.getSourceUrl()) {
                console.warn('youtube video error: you cannot call play() method on a video element that has no youtube source url');
            } else if (this.player) {
                this.player.playVideo();
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
            this.player ? this.player.pauseVideo() : null;
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
            this.player ? this.player.stopVideo() : null;
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

            // just in case destroy is called before youtube script callback happens
            if (this._container) {
                this._container.kit.classList.remove(this.options.loadingCssClass);
            }

            // remove from cache
            delete cachedPlayers[this.vpid];
            window.onYouTubeIframeAPIReady = function(){};

            if (script && !_.keys(cachedPlayers).length) {
                script.parentNode.removeChild(script);
                YoutubeVideo.prototype._script = null;
                YoutubeVideo.prototype._scriptLoaded = null;

            }

            // get rid of container and place video element back in the dom exactly the way we found it
            if (this._origParent && this._origParent.contains(this._container)) {
                this._origParent.replaceChild(this.el, this._container);
            }

            BaseVideo.prototype.destroy.call(this);
        }
    });

    return {
        Youtube: YoutubeVideo
    }

}));