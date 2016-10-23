'use strict';
import sinon from 'sinon';
import assert from 'assert';
import Youtube from '../src/youtube-video';
import _ from 'lodash';
import ResourceManager from 'resource-manager-js';

describe('Youtube Video Tests', function () {

    var origYouTubeIframeAPIReady;
    var origYT;
    var resourceManagerLoadScriptStub;
    var resourceManagerUnloadScriptStub;
    var stubbedYtPlayerApi;

    // trigger script loaded
    var triggerScriptLoad = function () {
        return new Promise(function (resolve) {
            // we are deferring to ensure promises are generated before testing
            _.defer(function () {
                // some tests dont have the onYouTubeIframeAPIReady set as a function
                if (window.onYouTubeIframeAPIReady) {
                    window.onYouTubeIframeAPIReady();
                    _.defer(resolve);
                } else {
                    resolve();
                }
            });
        });
    };

    //
    /**
     * trigger player ready
     * @param ytPlayer - Custom stubbed ytPlayer (if applicable)
     * @param ytPlayerApiObj - Optional object for api
     * @returns {Promise}
     */
    var triggerPlayerReady = function (ytPlayer, ytPlayerApiObj) {
        ytPlayer = ytPlayer || window.YT.Player;
        ytPlayerApiObj = ytPlayerApiObj || stubbedYtPlayerApi;
        return new Promise(function (resolve) {
            ytPlayer.args[0][1].events.onReady({target: ytPlayerApiObj});
            // we are deferring to ensure promises are generated before testing
            _.defer(resolve);
        });
    };

    beforeEach(function () {
        origYT = window.YT;
        stubbedYtPlayerApi = {
            playVideo: sinon.stub()
        };
        window.YT = {Player: sinon.stub().returns(stubbedYtPlayerApi)};
        origYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = null;
        resourceManagerLoadScriptStub = sinon.stub(ResourceManager, 'loadScript');
        resourceManagerLoadScriptStub.returns(Promise.resolve());
        resourceManagerUnloadScriptStub = sinon.stub(ResourceManager, 'unloadScript');
        resourceManagerUnloadScriptStub.returns(Promise.resolve());
    });

    afterEach(function () {
        window.YT = origYT;
        window.onYouTubeIframeAPIReady = origYouTubeIframeAPIReady;
        // guarantee a fresh start with script (to fake initial loads)
        Youtube.prototype._scriptLoaded = false;
        resourceManagerLoadScriptStub.restore();
        resourceManagerUnloadScriptStub.restore();
    });

    it('should passed proper youtube iFrame player api script path to ResourceManager on load()', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        player.load();
        assert.deepEqual(resourceManagerLoadScriptStub.args[0], ['https://www.youtube.com/iframe_api']);
        player.destroy();
    });

    it('should resolve load call with youtube player and return the youtube player instance after load() is called', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        window.YT.Player.returns(stubbedYtPlayerApi);
        var loadSpy = sinon.spy();
        player.load().then(loadSpy);
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.deepEqual(loadSpy.args[0][0], stubbedYtPlayerApi);
                player.destroy();
            });
        });
    });

    it('should place video element back under its original parent on destruction after load() call', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var parent = document.createElement('div');
        parent.appendChild(videoEl);
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                player.destroy();
                assert.equal(parent.childNodes[0], videoEl);
            });
        });
    });

    it('should detach the original video element from its original parent and append it inside a newly-created container element that sits inside video element\'s original parent', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var fixture = document.createElement('div');
        fixture.appendChild(videoEl);
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.equal(fixture.childNodes[0].childNodes[0], videoEl);
                player.destroy();
                assert.equal(fixture.childNodes[0], videoEl, 'after destroy, video element was put back in the DOM inside of its original parent');
            });
        });
    });

    it('should apply loading css class on load() call', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var parent = document.createElement('div');
        parent.appendChild(videoEl);
        var loadingCssClass = 'v-loading';
        var player = new Youtube({el: videoEl, loadingCssClass: loadingCssClass});
        player.load();
        return triggerScriptLoad().then(function () {
            assert.ok(videoEl.parentElement.classList.contains(loadingCssClass), 'loading css class is added after load call');
            return triggerPlayerReady().then(function () {
                assert.ok(!videoEl.parentElement.classList.contains(loadingCssClass), 'loading class is removed after player is ready');
                player.destroy();
            });
        });
    });

    it('should remove css loading class when script and player have loaded', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var parent = document.createElement('div');
        parent.appendChild(videoEl);
        var loadingCssClass = 'v-loading';
        var player = new Youtube({el: videoEl, loadingCssClass: loadingCssClass});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.ok(!videoEl.parentElement.classList.contains(loadingCssClass));
                player.destroy();
            });
        });
    });

    it('should pass correct configuration options to Youtube player constructor', function () {
        var videoId = 'nOEw9iiopwI';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />';
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                var ytPlayerConstructorOptions = window.YT.Player.args[0][1];
                assert.equal(ytPlayerConstructorOptions.width, 640);
                assert.equal(ytPlayerConstructorOptions.height, 360);
                assert.equal(ytPlayerConstructorOptions.videoId, videoId);
                assert.equal(ytPlayerConstructorOptions.playerVars.autoplay, 0);
                assert.equal(ytPlayerConstructorOptions.playerVars.v, videoId);
                player.destroy();
            });
        });
    });

    it('should pass autoplay option of 1 to Youtube player constructor if autoplay attr is true on video element', function () {
        var videoId = 'nOEw9iiopwI';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />';
        videoEl.setAttribute('autoplay', true);
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                var ytPlayerConstructorOptions = window.YT.Player.args[0][1];
                assert.equal(ytPlayerConstructorOptions.playerVars.autoplay, 1);
                player.destroy();
            });
        });
    });

    it('should load youtube\'s script via ResourceManager loadScript after load() is called', function () {
        var videoId = 'nOEw9iiopwI';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />';
        var player = new Youtube({el: videoEl});
        assert.equal(resourceManagerLoadScriptStub.callCount, 0, 'script element has NOT been added to DOM because load() hasnt been called');
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                player.destroy();
                assert.equal(resourceManagerLoadScriptStub.args[0][0], 'https://www.youtube.com/iframe_api');
            });
        });
    });

    it('should NOT call Resource Manager\'s loadScript a second time but still resolve load call, even when there are no instances', function (done) {
        var videoId = 'nOEw9iiopwI';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />';
        var firstPlayer = new Youtube({el: videoEl});
        firstPlayer.load();
        triggerScriptLoad().then(function () {
            triggerPlayerReady().then(() => {
                assert.equal(resourceManagerLoadScriptStub.callCount, 1);
                firstPlayer.destroy();
                var secondPlayer = new Youtube({el: videoEl});
                secondPlayer.load();
                triggerPlayerReady().then(() => {
                    assert.equal(resourceManagerLoadScriptStub.callCount, 1);
                    secondPlayer.destroy();
                    done();
                });
            });
        });
    });

    it('should add css playing active class when youtube player api triggers play event', function () {
        var playingClass = 'vid-playing';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.ok(!videoEl.parentElement.classList.contains(playingClass));
                // trigger youtube play event
                window.YT.Player.args[0][1].events.onStateChange({data: 1});
                assert.ok(videoEl.parentElement.classList.contains(playingClass), 'when video is played, playing css class has been added to the video container element');
                player.destroy();
            });
        });
    });

    it('should trigger playing event on video element when youtube player api triggers a play event', function () {
        var playingClass = 'vid-playing';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var playingSpy = sinon.spy();
        videoEl.addEventListener('playing', playingSpy);
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.equal(playingSpy.callCount, 0, 'playing event on the video element hasnt been triggered yet');
                // trigger play
                window.YT.Player.args[0][1].events.onStateChange({data: 1});
                assert.equal(playingSpy.callCount, 1, 'playing event on the video element has been triggered once');
                player.destroy();
            });
        });
    });

    it('should call playVideo method of youtube player instance when play() method is called', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
                player.play();
                assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
                player.destroy();
            });
        });
    });

    it('extracting video id from a url that begins with a direct link', function () {
        var videoEl = document.createElement('video');
        var player = new Youtube({el: videoEl});
        var videoId = 'nOEw9iiopwI';
        assert.equal(player.getVideoId('http://www.youtube.com/watch?v=' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    it('extracting video id from a youtube url that is a embed link', function () {
        var videoEl = document.createElement('video');
        // test url
        var player = new Youtube({el: videoEl});
        var videoId = 'nCJJdW20uZI';
        assert.equal(player.getVideoId('https://www.youtube.com/embed/' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    it('should pass any youtube video url params as key-value object pairs to playerVars options in Youtube player constructor when load is called', function () {
        var params = {
            v: 'nOEw9iiopwI',
            my: 'test'
        };
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML =
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + params.v + '&my=' + params.my + '" />';
        videoEl.setAttribute('autoplay', true);
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                var ytPlayerConstructorOptions = window.YT.Player.args[0][1];
                assert.equal(ytPlayerConstructorOptions.playerVars.v, params.v);
                assert.equal(ytPlayerConstructorOptions.playerVars.my, params.my);
                player.destroy();
            });
        });
    });

    it('attempting to play/pause a video before player has loaded does not throw an error', function () {
        var playingClass = 'vid-playing';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var eventListenerStub = sinon.stub(videoEl, 'addEventListener');
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
        var playSpy = sinon.spy(player, 'play');
        var stopSpy = sinon.spy(player, 'stop');
        var pauseSpy = sinon.spy(player, 'pause');
        // load player
        player.load();
        player.play();
        assert.ok(!playSpy.threw('TypeError'), 'calling play() before player\'s script has loaded does NOT throw error');
        player.pause();
        assert.ok(!pauseSpy.threw('TypeError'), 'calling pause() before player\'s script has loaded does NOT throw error');
        player.stop();
        assert.ok(!stopSpy.threw('TypeError'), 'calling stop() before player\'s script has loaded does NOT throw error');
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                player.play();
                playSpy.restore();
                stopSpy.restore();
                pauseSpy.restore();
                player.destroy();
                eventListenerStub.restore();
            });
        });
    });

    it('should create a parent div around the video element and add the css custom class passed as an option to it after calling load()', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=89dsj" />';
        var customWrapperClass = 'v-wrapper';
        var player = new Youtube({el: videoEl, customWrapperClass: customWrapperClass});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.ok(videoEl.parentElement.classList.contains(customWrapperClass));
                player.destroy();
            });
        });
    });

    it('should trigger loadstart event when load() is called', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        var loadStartSpy = sinon.spy();
        videoEl.addEventListener('loadstart', loadStartSpy);
        assert.equal(loadStartSpy.callCount, 0);
        player.load();
        assert.equal(loadStartSpy.callCount, 1);
        player.destroy();
    });

    it('should trigger canplay event on video element after load() call resolves', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var canPlaySpy = sinon.spy();
        videoEl.addEventListener('canplay', canPlaySpy);
        var player = new Youtube({el: videoEl});
        assert.equal(canPlaySpy.callCount, 0);
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                assert.equal(canPlaySpy.callCount, 1);
                player.destroy();
            });
        });
    });

    it('should resolve second player\'s load() call after first player\'s load() is called without having to load script a second time', function (done) {
        var firstVideoEl = document.createElement('video');
        firstVideoEl.setAttribute('width', 640);
        firstVideoEl.setAttribute('height', 360);
        firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var secondVideoEl = document.createElement('video');
        secondVideoEl.setAttribute('width', 640);
        secondVideoEl.setAttribute('height', 360);
        secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
        var firstStubbedYtPlayer = window.YT.Player.withArgs('vplayer1');
        var secondStubbedYtPlayer = window.YT.Player.withArgs('vplayer2');
        var firstStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        var secondStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        var firstPlayer = new Youtube({el: firstVideoEl});
        var secondPlayer = new Youtube({el: firstVideoEl});
        firstPlayer.load();
        var secondPlayerLoadSpy = sinon.spy();
        triggerScriptLoad(firstStubbedYtPlayer, firstStubbedYtPlayerApi).then(function () {
            triggerPlayerReady().then(function () {
                secondPlayer.load().then(secondPlayerLoadSpy);
                // defer to let all promises settle
                _.defer(function () {
                    triggerPlayerReady(secondStubbedYtPlayer, secondStubbedYtPlayerApi).then(function () {
                        assert.equal(secondPlayerLoadSpy.callCount, 1);
                        firstPlayer.destroy();
                        secondPlayer.destroy();
                        done();
                    });
                })
            });
        });
    });

    it('should call first player\'s pause() if it is playing when the second player is played', function (done) {
        var firstVideoEl = document.createElement('video');
        firstVideoEl.setAttribute('width', 640);
        firstVideoEl.setAttribute('height', 360);
        firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var secondVideoEl = document.createElement('video');
        secondVideoEl.setAttribute('width', 640);
        secondVideoEl.setAttribute('height', 360);
        secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
        var firstStubbedYtPlayer = window.YT.Player.withArgs('vplayer1');
        var secondStubbedYtPlayer = window.YT.Player.withArgs('vplayer2');
        var firstStubbedYtPlayerApi = {
            getPlayerState: sinon.stub(),
            pauseVideo: sinon.spy()
        };
        var secondStubbedYtPlayerApi = {
            getPlayerState: sinon.stub(),
            pauseVideo: sinon.spy()
        };
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        var firstPlayer = new Youtube({el: firstVideoEl});
        var secondPlayer = new Youtube({el: firstVideoEl});
        // TODO: find a better way to distinguish youtube player instances instead of using the internal ids
        firstPlayer.load();
        var secondPlayerLoadSpy = sinon.spy();
        triggerScriptLoad().then(function () {
            triggerPlayerReady(firstStubbedYtPlayer, firstStubbedYtPlayerApi).then(function () {
                secondPlayer.load().then(secondPlayerLoadSpy);
                // defer to let all promises settle
                _.defer(function () {
                    triggerPlayerReady(secondStubbedYtPlayer, secondStubbedYtPlayerApi).then(function () {
                        assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
                        // ensure that first video is in a playing state
                        firstStubbedYtPlayerApi.getPlayerState.returns(1);
                        // trigger play on second player
                        secondStubbedYtPlayer.args[0][1].events.onStateChange({data: 1});
                        assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 1);
                        assert.equal(secondStubbedYtPlayerApi.pauseVideo.callCount, 0);
                        firstPlayer.destroy();
                        secondPlayer.destroy();
                        done();
                    });
                })
            });
        });
    });

    it('should NOT call first player\'s pause() if it is NOT playing when the second player is played', function (done) {
        var firstVideoEl = document.createElement('video');
        firstVideoEl.setAttribute('width', 640);
        firstVideoEl.setAttribute('height', 360);
        firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var secondVideoEl = document.createElement('video');
        secondVideoEl.setAttribute('width', 640);
        secondVideoEl.setAttribute('height', 360);
        secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
        var firstStubbedYtPlayer = window.YT.Player.withArgs('vplayer1');
        var secondStubbedYtPlayer = window.YT.Player.withArgs('vplayer2');
        var firstStubbedYtPlayerApi = {
            getPlayerState: sinon.stub(),
            pauseVideo: sinon.spy()
        };
        var secondStubbedYtPlayerApi = {
            getPlayerState: sinon.stub(),
            pauseVideo: sinon.spy()
        };
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        var firstPlayer = new Youtube({el: firstVideoEl});
        var secondPlayer = new Youtube({el: firstVideoEl});
        // TODO: find a better way to distinguish youtube player instances instead of using the internal ids
        firstPlayer.load();
        var secondPlayerLoadSpy = sinon.spy();
        triggerScriptLoad().then(function () {
            triggerPlayerReady(firstStubbedYtPlayer, firstStubbedYtPlayerApi).then(function () {
                secondPlayer.load().then(secondPlayerLoadSpy);
                // defer to let all promises settle
                _.defer(function () {
                    triggerPlayerReady(secondStubbedYtPlayer, secondStubbedYtPlayerApi).then(function () {
                        // ensure that first video is in an unstarted state
                        firstStubbedYtPlayerApi.getPlayerState.returns(-1);
                        // trigger play on second player
                        secondStubbedYtPlayer.args[0][1].events.onStateChange({data: 1});
                        assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
                        firstPlayer.destroy();
                        secondPlayer.destroy();
                        done();
                    });
                })
            });
        });
    });

    it('should call youtube video player\'s playVideo method when calling play() method on the video element', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady(window.YT.Player, stubbedYtPlayerApi).then(function () {
                assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
                videoEl.play();
                assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
                player.destroy();
            });
        });
    });

    it('should call youtube video player\'s pauseVideo method when calling pause() method on the video element', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        player.load();
        var ytPlayerApi = {pauseVideo: sinon.stub()};
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady(window.YT.Player, ytPlayerApi).then(function () {
                assert.equal(ytPlayerApi.pauseVideo.callCount, 0);
                videoEl.pause();
                assert.equal(ytPlayerApi.pauseVideo.callCount, 1);
                player.destroy();
            });
        });
    });

    it('should call load() method when calling load() method on the video element', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        var loadStub = sinon.stub(player, 'load');
        assert.equal(loadStub.callCount, 0);
        videoEl.load();
        assert.equal(loadStub.callCount, 1);
        loadStub.restore();
        player.destroy();
    });

    it('should set video element visually directly underneath the wrapper after calling load() to prevent video from being out of view', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=89dsj" />';
        document.body.appendChild(videoEl);
        var customWrapperClass = 'v-wrapper';
        var player = new Youtube({el: videoEl, customWrapperClass: customWrapperClass});
        player.load();
        return triggerScriptLoad().then(function () {
            return triggerPlayerReady().then(function () {
                let wrapper = videoEl.parentElement;
                let generatedDiv = wrapper.childNodes[1];
                let scrolledDownAmount = wrapper.offsetTop - generatedDiv.offsetTop;
                console.log(scrolledDownAmount);
                assert.equal(scrolledDownAmount, 0);
                player.destroy();
                document.body.removeChild(videoEl);
            });
        });
    });

});


