import Youtube from '../src/youtube-video.js';
import sinon from '../node_modules/sinon/pkg/sinon-esm.js';
import '../node_modules/chai/chai.js';

const { assert } = chai;

describe('Youtube Video Tests', function () {

    let origYouTubeIframeAPIReady;
    let fakePlayerConstructor;
    let stubbedYtPlayerApi;

    function triggerYoutubeEvent(eventName) {
        const YOUTUBE_EVENTS = {
            playing: 1,
            pause: 2,
            ended: 0
        };
        const [, youtubePlayerArg] = fakePlayerConstructor.args[0];
        youtubePlayerArg.events.onStateChange({data: YOUTUBE_EVENTS[eventName]});
    }

    beforeEach(async function () {
        stubbedYtPlayerApi = {
            playVideo: sinon.stub(),
            pauseVideo: sinon.stub()
        };
        fakePlayerConstructor = sinon.stub();
        class FakePlayer {
            constructor(ytEl, props) {
                fakePlayerConstructor(...arguments);
                // immediately trigger player's load completion
                props.events.onReady({target: stubbedYtPlayerApi});
            }
        }
        window.YT = {Player: FakePlayer};
        origYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
        Object.defineProperty(window, 'onYouTubeIframeAPIReady', {
            set() {
                Youtube.prototype._triggerYoutubeIframeAPIReady();
            },
            configurable: true,
        });
    });

    afterEach(async function () {
        window.onYouTubeIframeAPIReady = origYouTubeIframeAPIReady;
    });

    it('should load proper iFrame player api script when load() is called', function() {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        videoEl.load();
        const ytScripts = document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]');
        assert.equal(ytScripts.length, 1);
        player.destroy();
    });

    it('should pass the right options to the youtube player constructor when load is called and resolve load call with youtube player instance', async function () {
        var videoEl = document.createElement('video');
        const playerWidth = 640;
        const playerHeight = 360;
        videoEl.setAttribute('width', playerWidth);
        videoEl.setAttribute('height', playerHeight);
        const videoId = 'nOEw9iiopwI';
        videoEl.innerHTML = `<source type="video/youtube" src="http://www.youtube.com/watch?v=${videoId}" />`;
        const playerElement = document.createElement('div');
        let createPlayerElementStub = sinon.stub(Youtube.prototype, 'createPlayerElement').returns(playerElement);
        var player = new Youtube({el: videoEl});
        const resolvedValue = await videoEl.load();
        const [firstArg, constructorOptionArgs] = fakePlayerConstructor.args[0];
        assert.deepEqual(firstArg, playerElement);
        assert.equal(constructorOptionArgs.height, playerHeight);
        assert.equal(constructorOptionArgs.width, playerWidth);
        assert.equal(constructorOptionArgs.videoId, videoId);
        assert.equal(constructorOptionArgs.playerVars.autoplay, 0);
        assert.equal(constructorOptionArgs.playerVars.v, videoId);
        assert.deepEqual(resolvedValue, stubbedYtPlayerApi);
        createPlayerElementStub.restore();
        player.destroy();
    });

    it('should place video element back under its original parent on destruction after load() call', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var parent = document.createElement('div');
        parent.appendChild(videoEl);
        var player = new Youtube({el: videoEl});
        await videoEl.load();
        player.destroy();
        assert.equal(parent.childNodes[0], videoEl);
    });

    it('should detach the original video element from its original parent and append it inside a newly-created container element that sits inside video element\'s original parent', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var fixture = document.createElement('div');
        fixture.appendChild(videoEl);
        var player = new Youtube({el: videoEl});
        await videoEl.load();
        assert.equal(fixture.childNodes[0].childNodes[0], videoEl);
        player.destroy();
        assert.equal(fixture.childNodes[0], videoEl, 'after destroy, video element was put back in the DOM inside of its original parent');
    });

    it('should apply loading css class when player is loading and remove it when done loading', function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var parent = document.createElement('div');
        parent.appendChild(videoEl);
        var loadingCssClass = 'v-loading';
        var player = new Youtube({el: videoEl, loadingCssClass: loadingCssClass});
        const loadPromise = videoEl.load();
        assert.ok(videoEl.parentElement.classList.contains(loadingCssClass), 'loading css class is added after load call');
        return loadPromise.then(() => {
            assert.ok(!videoEl.parentElement.classList.contains(loadingCssClass), 'loading class is removed after player is ready');
            player.destroy();
        });
    });


    it('should pass autoplay option of 1 to Youtube player constructor if autoplay attr is true on video element', async function () {
        var videoId = 'nOEw9iiopwI';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = `<source type="video/youtube" src="http://www.youtube.com/watch?v=${videoId}" />`;
        videoEl.setAttribute('autoplay', true);
        var player = new Youtube({el: videoEl});
        await videoEl.load();
        const [, constructorOptionArgs] = fakePlayerConstructor.args[0];
        assert.equal(constructorOptionArgs.playerVars.autoplay, 1);
        player.destroy();
    });


    it('should add and remove css playing active class to/from the video container element per playing, pausing, and ending the video', async function () {
        var playingClass = 'vid-playing';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
        await videoEl.load();
        assert.ok(!videoEl.parentElement.classList.contains(playingClass));
        triggerYoutubeEvent('playing');
        assert.ok(videoEl.parentElement.classList.contains(playingClass), 'when video is played, css class has been added');
        triggerYoutubeEvent('pause');
        assert.isNotOk(videoEl.parentElement.classList.contains(playingClass), 'when video is paused, css class has been removed');
        // play again
        triggerYoutubeEvent('playing');
        assert.ok(videoEl.parentElement.classList.contains(playingClass), 'when video is played, css class has been added');
        // trigger youtube end event
        triggerYoutubeEvent('ended');
        assert.isNotOk(videoEl.parentElement.classList.contains(playingClass), 'when video has ended, css class has been removed');
        player.destroy();
    });

    it('should trigger appropriate events on video element when youtube player api triggers its events', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        const loadStartSpy = sinon.spy();
        const playingSpy = sinon.spy();
        const playSpy = sinon.spy();
        const canPlaySpy = sinon.spy();
        const pauseSpy = sinon.spy();
        const endedSpy = sinon.spy();
        var player = new Youtube({el: videoEl});
        videoEl.addEventListener('loadstart', loadStartSpy);
        videoEl.addEventListener('playing', playingSpy);
        videoEl.addEventListener('play', playSpy);
        videoEl.addEventListener('canplay', canPlaySpy);
        videoEl.addEventListener('pause', pauseSpy);
        videoEl.addEventListener('ended', endedSpy);
        assert.equal(loadStartSpy.callCount, 0, 'loadstart event hasnt been triggered yet');
        assert.equal(canPlaySpy.callCount, 0, 'canplay event hasnt been triggered yet');
        await videoEl.load();
        assert.equal(canPlaySpy.callCount, 1, 'canplay event triggered yet');
        assert.equal(loadStartSpy.callCount, 1, 'loadstart event triggered yet');
        assert.equal(playingSpy.callCount, 0, 'playing event hasnt been triggered yet');
        assert.equal(playSpy.callCount, 0, 'play event hasnt been triggered yet');
        triggerYoutubeEvent('playing');
        assert.equal(playingSpy.callCount, 1, 'playing event has been triggered once');
        assert.equal(playSpy.callCount, 1, 'play event has been triggered once');
        triggerYoutubeEvent('pause');
        assert.equal(pauseSpy.callCount, 1, 'pause event has been triggered after video has been paused');
        triggerYoutubeEvent('ended');
        assert.equal(endedSpy.callCount, 1, 'end event has been triggered after video ends');
        player.destroy();
    });

    it('should call playVideo method of youtube player instance when play() method is called', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        await videoEl.load();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
        videoEl.play();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
        player.destroy();
    });

    it('getVideoId() returns the correct video id from a url that begins with a direct link', function () {
        var videoEl = document.createElement('video');
        var player = new Youtube({el: videoEl});
        var videoId = 'nOEw9iiopwI';
        assert.equal(player.getVideoId('http://www.youtube.com/watch?v=' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    it('getVideoId() returnthe correct video id from a youtube url that is a embed link', function () {
        var videoEl = document.createElement('video');
        // test url
        var player = new Youtube({el: videoEl});
        var videoId = 'nCJJdW20uZI';
        assert.equal(player.getVideoId('https://www.youtube.com/embed/' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    it('should pass any youtube video url params as key-value object pairs to playerVars options in Youtube player constructor when load is called', async function () {
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
        await videoEl.load();
        var [, ytPlayerConstructorOptions] = fakePlayerConstructor.args[0];
        assert.equal(ytPlayerConstructorOptions.playerVars.v, params.v);
        assert.equal(ytPlayerConstructorOptions.playerVars.my, params.my);
        player.destroy();
    });

    it('attempting to play/pause a video before player has loaded does not throw an error', async function () {
        var playingClass = 'vid-playing';
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
        var playSpy = sinon.spy(videoEl, 'play');
        var pauseSpy = sinon.spy(videoEl, 'pause');
        videoEl.load();
        videoEl.play();
        assert.ok(!playSpy.threw('TypeError'), 'calling play() before player\'s script has loaded does NOT throw error');
        videoEl.pause();
        assert.ok(!pauseSpy.threw('TypeError'), 'calling pause() before player\'s script has loaded does NOT throw error');
        videoEl.play();
        playSpy.restore();
        pauseSpy.restore();
        player.destroy();
    });

    it('should create a parent div around the video element and add the css custom class passed as an option to it after calling load()', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=89dsj" />';
        var customWrapperClass = 'v-wrapper';
        var player = new Youtube({el: videoEl, customWrapperClass: customWrapperClass});
        await videoEl.load();
        assert.ok(videoEl.parentElement.classList.contains(customWrapperClass));
        player.destroy();
    });

    it('should resolve second player\'s load() call after first player\'s load() is called without having to load script a second time', async function () {
        var firstVideoEl = document.createElement('video');
        firstVideoEl.setAttribute('width', 640);
        firstVideoEl.setAttribute('height', 360);
        firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var secondVideoEl = document.createElement('video');
        secondVideoEl.setAttribute('width', 640);
        secondVideoEl.setAttribute('height', 360);
        secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
        var firstPlayerElement = document.createElement('div');
        var secondPlayerElement = document.createElement('div');
        let createPlayerStub = sinon.stub(Youtube.prototype, 'createPlayerElement');
        createPlayerStub.onFirstCall().returns(firstPlayerElement);
        createPlayerStub.onSecondCall().returns(secondPlayerElement);
        var firstStubbedYtPlayer = fakePlayerConstructor.withArgs(firstPlayerElement);
        var secondStubbedYtPlayer = fakePlayerConstructor.withArgs(secondPlayerElement);
        var firstStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        var secondStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        var firstPlayer = new Youtube({el: firstVideoEl});
        var secondPlayer = new Youtube({el: secondVideoEl});
        const firstLoadPromise = firstVideoEl.load();
        const firstPlayerLoadSpy = sinon.spy();
        firstLoadPromise.then(firstPlayerLoadSpy);
        var secondPlayerLoadSpy = sinon.spy();
        const secondLoadPromise = secondVideoEl.load();
        secondLoadPromise.then(secondPlayerLoadSpy);
        return Promise.all([firstLoadPromise, secondLoadPromise]).then(() => {
            assert.ok(secondPlayerLoadSpy.calledAfter(firstPlayerLoadSpy));
            firstPlayer.destroy();
            secondPlayer.destroy();
            createPlayerStub.restore();
        });
    });

    it('should resolve first and second player\'s load() call when  if load() calls on the video elements are made before the script has a chance to load', function () {
        var firstVideoEl = document.createElement('video');
        firstVideoEl.setAttribute('width', 640);
        firstVideoEl.setAttribute('height', 360);
        firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var secondVideoEl = document.createElement('video');
        secondVideoEl.setAttribute('width', 640);
        secondVideoEl.setAttribute('height', 360);
        secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
        var firstPlayerElement = document.createElement('div');
        var secondPlayerElement = document.createElement('div');
        let createPlayerStub = sinon.stub(Youtube.prototype, 'createPlayerElement');
        createPlayerStub.onFirstCall().returns(firstPlayerElement);
        createPlayerStub.onSecondCall().returns(secondPlayerElement);
        var firstStubbedYtPlayer = fakePlayerConstructor.withArgs(firstPlayerElement);
        var secondStubbedYtPlayer = fakePlayerConstructor.withArgs(secondPlayerElement);
        var firstStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        var secondStubbedYtPlayerApi = {getPlayerState: sinon.stub()};
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        var firstPlayer = new Youtube({el: firstVideoEl});
        var secondPlayer = new Youtube({el: secondVideoEl});
        var firstPlayerLoadSpy = sinon.spy();
        const firstVideoLoadPromise = firstVideoEl.load();
        firstVideoLoadPromise.then(firstPlayerLoadSpy);
        var secondPlayerLoadSpy = sinon.spy();
        const secondVideoLoadPromise = secondVideoEl.load();
        secondVideoLoadPromise.then(secondPlayerLoadSpy);
        return Promise.all([firstVideoLoadPromise, secondVideoLoadPromise]).then(() => {
            assert.equal(firstPlayerLoadSpy.callCount, 1);
            assert.equal(secondPlayerLoadSpy.callCount, 1);
            firstPlayer.destroy();
            secondPlayer.destroy();
            createPlayerStub.restore();
        });
    });

    it('should call youtube video player\'s methods when calling play and pause methods on the video element', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
        var player = new Youtube({el: videoEl});
        await videoEl.load();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
        videoEl.play();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
        assert.equal(stubbedYtPlayerApi.pauseVideo.callCount, 0);
        videoEl.pause();
        assert.equal(stubbedYtPlayerApi.pauseVideo.callCount, 1);
        player.destroy();
    });

    it('should set video element visually directly underneath the wrapper after calling load() to prevent video from being out of view', async function () {
        var videoEl = document.createElement('video');
        videoEl.setAttribute('width', 640);
        videoEl.setAttribute('height', 360);
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=89dsj" />';
        document.body.appendChild(videoEl);
        var customWrapperClass = 'v-wrapper';
        var player = new Youtube({el: videoEl, customWrapperClass: customWrapperClass});
        await videoEl.load();
        let wrapper = videoEl.parentElement;
        let generatedDiv = wrapper.childNodes[1];
        let scrolledDownAmount = wrapper.offsetTop - generatedDiv.offsetTop;
        assert.equal(scrolledDownAmount, 0);
        player.destroy();
        document.body.removeChild(videoEl);
    });

    describe('when multiple videos are on a page', function () {

        let firstVideoEl, secondVideoEl;
        let firstPlayerElement, secondPlayerElement;
        let firstStubbedYtPlayerApi, secondStubbedYtPlayerApi;
        let firstPlayerConstructorStub, secondPlayerConstructorStub;

        beforeEach(function() {
            firstVideoEl = document.createElement('video');
            firstVideoEl.setAttribute('width', 640);
            firstVideoEl.setAttribute('height', 360);
            firstVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';
            secondVideoEl = document.createElement('video');
            secondVideoEl.setAttribute('width', 640);
            secondVideoEl.setAttribute('height', 360);
            secondVideoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=sk23sha" />';
            firstPlayerElement = document.createElement('div');
            secondPlayerElement = document.createElement('div');
            sinon.stub(Youtube.prototype, 'createPlayerElement');
            Youtube.prototype.createPlayerElement.onFirstCall().returns(firstPlayerElement);
            Youtube.prototype.createPlayerElement.onSecondCall().returns(secondPlayerElement);
            firstStubbedYtPlayerApi = {
                getPlayerState: sinon.stub(),
                pauseVideo: sinon.spy()
            };
            secondStubbedYtPlayerApi = {
                getPlayerState: sinon.stub(),
                pauseVideo: sinon.spy()
            };
            firstPlayerConstructorStub = sinon.stub();
            secondPlayerConstructorStub = sinon.stub();
            class FakeMultiPlayer {
                constructor(ytEl, props) {
                    let stubbedApi = stubbedYtPlayerApi;
                    if (ytEl === firstPlayerElement) {
                        firstPlayerConstructorStub(...arguments);
                        stubbedApi = firstStubbedYtPlayerApi;
                    } else if (ytEl === secondPlayerElement) {
                        stubbedApi = secondStubbedYtPlayerApi;
                        secondPlayerConstructorStub(...arguments);
                    }
                    props.events.onReady({target: stubbedApi});
                    return stubbedApi;
                }
            }
            window.YT = {Player: FakeMultiPlayer};
        });

        afterEach(function() {
            Youtube.prototype.createPlayerElement.restore();
        });

        it('should call first player\'s pause() if it is playing when the second player is played', async function () {
            var firstPlayer = new Youtube({el: firstVideoEl});
            var secondPlayer = new Youtube({el: secondVideoEl});
            await firstVideoEl.load();
            await secondVideoEl.load();
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
            // ensure that first video is in a playing state
            firstStubbedYtPlayerApi.getPlayerState.returns(1);
            // trigger play on second player
            secondPlayerConstructorStub.args[0][1].events.onStateChange({data: 1});
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 1);
            assert.equal(secondStubbedYtPlayerApi.pauseVideo.callCount, 0);
            firstPlayer.destroy();
            secondPlayer.destroy();
        });

        it('should NOT call first player\'s pause() if it is NOT playing when the second player is played', async function () {
            var firstPlayer = new Youtube({el: firstVideoEl});
            var secondPlayer = new Youtube({el: secondVideoEl});
            await firstVideoEl.load();
            await secondVideoEl.load();
            // ensure that first video is in an unstarted state
            firstStubbedYtPlayerApi.getPlayerState.returns(-1);
            // trigger play on second player
            secondPlayerConstructorStub.args[0][1].events.onStateChange({data: 1});
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
            firstPlayer.destroy();
            secondPlayer.destroy();
        });
    });

});

