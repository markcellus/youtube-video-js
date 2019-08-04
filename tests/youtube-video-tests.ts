import { YoutubeVideoElement } from '../src/youtube-video';
import sinon from 'sinon/pkg/sinon-esm';
import 'chai/chai.js';

declare global {
    interface Window {
        YT: any;
        chai: Chai.ChaiStatic;
    }
}

const { assert } = window.chai;

describe('Youtube Video Tests', function() {
    let origYouTubeIframeAPIReady;
    let fakePlayerConstructor;
    let stubbedYtPlayerApi;
    let testContainer;
    let origYT;

    function triggerYoutubeEvent(eventName) {
        const YOUTUBE_EVENTS = {
            playing: 1,
            pause: 2,
            ended: 0,
        };
        const [, youtubePlayerArg] = fakePlayerConstructor.args[0];
        youtubePlayerArg.events.onStateChange({
            data: YOUTUBE_EVENTS[eventName],
        });
    }

    beforeEach(async function() {
        stubbedYtPlayerApi = {
            playVideo: sinon.stub(),
            pauseVideo: sinon.stub(),
            destroy: sinon.stub(),
        };
        fakePlayerConstructor = sinon.stub();
        class FakePlayer {
            constructor(ytEl, props, ...args) {
                fakePlayerConstructor(ytEl, props, ...args);
                // immediately trigger player's load completion
                props.events.onReady({ target: stubbedYtPlayerApi });
            }
        }
        origYT = window.YT;
        window.YT = {
            Player: FakePlayer,
        };
        origYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
        Object.defineProperty(window, 'onYouTubeIframeAPIReady', {
            set() {
                // @ts-ignore
                YoutubeVideoElement.triggerYoutubeIframeAPIReady();
            },
            configurable: true,
        });
        testContainer = document.createElement('div');
        document.body.appendChild(testContainer);
    });

    afterEach(async function() {
        document.body.removeChild(testContainer);
        window.onYouTubeIframeAPIReady = origYouTubeIframeAPIReady;
        window.YT = origYT;
    });

    it('should load proper iFrame player api script when load() is called and remove it from the dom when removed', async function() {
        var videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        testContainer.appendChild(videoEl);
        const query = 'script[src="https://www.youtube.com/iframe_api"]';
        await videoEl.load(); // wait for API to be ready
        assert.equal(document.querySelectorAll(query).length, 1);
        assert.equal(stubbedYtPlayerApi.destroy.callCount, 0);
        testContainer.removeChild(videoEl);
        assert.equal(document.querySelectorAll(query).length, 0);
        assert.equal(stubbedYtPlayerApi.destroy.callCount, 1);
    });

    it('should pass the right options to the youtube player constructor when load is called and resolve load call with youtube player instance', async function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        const videoId = 'nOEw9iiopwI';
        const playerWidth = '640';
        const playerHeight = '360';
        videoEl.setAttribute('width', playerWidth);
        videoEl.setAttribute('height', playerHeight);
        videoEl.setAttribute(
            'src',
            `http://www.youtube.com/watch?v=${videoId}`
        );
        const playerElement = document.createElement('div');
        let createPlayerElementStub = sinon
            .stub(YoutubeVideoElement.prototype, 'createYTPlayerElement')
            .returns(playerElement);
        testContainer.appendChild(videoEl);
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
    });

    it('should pass autoplay option of 1 to Youtube player constructor if autoplay attr is true on video element', async function() {
        var videoId = 'nOEw9iiopwI';
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            `http://www.youtube.com/watch?v=${videoId}`
        );
        videoEl.setAttribute('autoplay', 'true');
        testContainer.appendChild(videoEl);
        await videoEl.load();
        const [, constructorOptionArgs] = fakePlayerConstructor.args[0];
        assert.equal(constructorOptionArgs.playerVars.autoplay, 1);
    });

    it('should trigger appropriate events on video element when youtube player api triggers its events', async function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        testContainer.appendChild(videoEl);
        const loadStartSpy = sinon.spy();
        const playingSpy = sinon.spy();
        const playSpy = sinon.spy();
        const canPlaySpy = sinon.spy();
        const pauseSpy = sinon.spy();
        const endedSpy = sinon.spy();
        testContainer.appendChild(videoEl);
        videoEl.addEventListener('loadstart', loadStartSpy);
        videoEl.addEventListener('playing', playingSpy);
        videoEl.addEventListener('play', playSpy);
        videoEl.addEventListener('canplay', canPlaySpy);
        videoEl.addEventListener('pause', pauseSpy);
        videoEl.addEventListener('ended', endedSpy);
        assert.equal(
            loadStartSpy.callCount,
            0,
            'loadstart event hasnt been triggered yet'
        );
        assert.equal(
            canPlaySpy.callCount,
            0,
            'canplay event hasnt been triggered yet'
        );
        await videoEl.load();
        assert.equal(canPlaySpy.callCount, 1, 'canplay event triggered yet');
        assert.equal(
            loadStartSpy.callCount,
            1,
            'loadstart event triggered yet'
        );
        assert.equal(
            playingSpy.callCount,
            0,
            'playing event hasnt been triggered yet'
        );
        assert.equal(
            playSpy.callCount,
            0,
            'play event hasnt been triggered yet'
        );
        triggerYoutubeEvent('playing');
        assert.equal(
            playingSpy.callCount,
            1,
            'playing event has been triggered once'
        );
        assert.equal(
            playSpy.callCount,
            1,
            'play event has been triggered once'
        );
        triggerYoutubeEvent('pause');
        assert.equal(
            pauseSpy.callCount,
            1,
            'pause event has been triggered after video has been paused'
        );
        triggerYoutubeEvent('ended');
        assert.equal(
            endedSpy.callCount,
            1,
            'end event has been triggered after video ends'
        );
    });

    it('should call playVideo method of youtube player instance when play() method is called', async function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        testContainer.appendChild(videoEl);
        await videoEl.load();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
        videoEl.play();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
    });

    it('returns the correct video id from a url that begins with a direct link', function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        var videoId = 'nOEw9iiopwI';
        videoEl.setAttribute(
            'src',
            `http://www.youtube.com/watch?v=${videoId}`
        );
        testContainer.appendChild(videoEl);
        assert.equal(videoEl.videoId, videoId);
    });

    it('returns the correct video id from a youtube url that is a embed link', function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        var videoId = 'nCJJdW20uZI';
        videoEl.setAttribute('src', `http://www.youtube.com/embed/${videoId}`);
        testContainer.appendChild(videoEl);
        assert.equal(videoEl.videoId, videoId);
    });

    it('should pass any youtube video url params as key-value object pairs to playerVars options in Youtube player constructor when load is called', async function() {
        var params = {
            v: 'nOEw9iiopwI',
            my: 'test',
        };
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            `http://www.youtube.com/watch?v=${params.v}&my=${params.my}`
        );
        testContainer.appendChild(videoEl);
        await videoEl.load();
        var [, ytPlayerConstructorOptions] = fakePlayerConstructor.args[0];
        assert.equal(ytPlayerConstructorOptions.playerVars.v, params.v);
        assert.equal(ytPlayerConstructorOptions.playerVars.my, params.my);
    });

    it('attempting to play/pause a video before player has loaded does not throw an mediaError', async function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        testContainer.appendChild(videoEl);
        var playSpy = sinon.spy(videoEl, 'play');
        var pauseSpy = sinon.spy(videoEl, 'pause');
        videoEl.load();
        videoEl.play();
        assert.ok(
            !playSpy.threw('TypeError'),
            "calling play() before player's script has loaded does NOT throw mediaError"
        );
        videoEl.pause();
        assert.ok(
            !pauseSpy.threw('TypeError'),
            "calling pause() before player's script has loaded does NOT throw mediaError"
        );
        videoEl.play();
        playSpy.restore();
        pauseSpy.restore();
    });

    it("should resolve first and second player's load() call when load() calls on the video elements are made before the script has a chance to load", async function() {
        var firstVideoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        firstVideoEl.setAttribute('width', '640');
        firstVideoEl.setAttribute('height', '360');
        firstVideoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        var secondVideoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        secondVideoEl.setAttribute('width', '640');
        secondVideoEl.setAttribute('height', '360');
        secondVideoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=sk23sha'
        );
        var firstPlayerElement = document.createElement('div');
        var secondPlayerElement = document.createElement('div');
        let createPlayerStub = sinon.stub(
            YoutubeVideoElement.prototype,
            'createYTPlayerElement'
        );
        // we will be triggering api ready manually for this test
        Object.defineProperty(window, 'onYouTubeIframeAPIReady', {
            set() {},
            configurable: true,
        });
        createPlayerStub.onFirstCall().returns(firstPlayerElement);
        createPlayerStub.onSecondCall().returns(secondPlayerElement);
        var firstStubbedYtPlayer = fakePlayerConstructor.withArgs(
            firstPlayerElement
        );
        var secondStubbedYtPlayer = fakePlayerConstructor.withArgs(
            secondPlayerElement
        );
        var firstStubbedYtPlayerApi = { getPlayerState: sinon.stub() };
        var secondStubbedYtPlayerApi = { getPlayerState: sinon.stub() };
        firstStubbedYtPlayer.returns(firstStubbedYtPlayerApi);
        secondStubbedYtPlayer.returns(secondStubbedYtPlayerApi);
        testContainer.appendChild(firstVideoEl);
        testContainer.appendChild(secondVideoEl);
        var firstPlayerLoadSpy = sinon.spy();
        const firstVideoLoadPromise = firstVideoEl.load();
        firstVideoLoadPromise.then(firstPlayerLoadSpy);
        var secondPlayerLoadSpy = sinon.spy();
        const secondVideoLoadPromise = secondVideoEl.load();
        secondVideoLoadPromise.then(secondPlayerLoadSpy);
        assert.equal(firstPlayerLoadSpy.callCount, 0);
        assert.equal(secondPlayerLoadSpy.callCount, 0);
        // @ts-ignore
        YoutubeVideoElement.triggerYoutubeIframeAPIReady(); // trigger api ready
        await firstVideoLoadPromise;
        await secondVideoLoadPromise;
        assert.equal(firstPlayerLoadSpy.callCount, 1);
        assert.equal(secondPlayerLoadSpy.callCount, 1);
        createPlayerStub.restore();
    });

    it("should call youtube video player's methods when calling play and pause methods on the video element", async function() {
        const videoEl = document.createElement(
            'youtube-video'
        ) as YoutubeVideoElement;
        videoEl.setAttribute('width', '640');
        videoEl.setAttribute('height', '360');
        videoEl.setAttribute(
            'src',
            'http://www.youtube.com/watch?v=nOEw9iiopwI'
        );
        testContainer.appendChild(videoEl);
        await videoEl.load();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 0);
        videoEl.play();
        assert.equal(stubbedYtPlayerApi.playVideo.callCount, 1);
        assert.equal(stubbedYtPlayerApi.pauseVideo.callCount, 0);
        videoEl.pause();
        assert.equal(stubbedYtPlayerApi.pauseVideo.callCount, 1);
    });

    describe('when multiple videos are on a page', function() {
        let firstVideoEl, secondVideoEl;
        let firstPlayerElement, secondPlayerElement;
        let firstStubbedYtPlayerApi, secondStubbedYtPlayerApi;
        let firstPlayerConstructorStub, secondPlayerConstructorStub;
        let createYTPlayerElementStub;

        beforeEach(function() {
            firstVideoEl = document.createElement(
                'youtube-video'
            ) as YoutubeVideoElement;
            firstVideoEl.setAttribute('width', '640');
            firstVideoEl.setAttribute('height', '360');
            firstVideoEl.setAttribute(
                'src',
                'http://www.youtube.com/watch?v=nOEw9iiopwI'
            );
            secondVideoEl = document.createElement(
                'youtube-video'
            ) as YoutubeVideoElement;
            secondVideoEl.setAttribute('width', '640');
            secondVideoEl.setAttribute('height', '360');
            secondVideoEl.setAttribute(
                'src',
                'http://www.youtube.com/watch?v=sk23sha'
            );
            firstPlayerElement = document.createElement('div');
            secondPlayerElement = document.createElement('div');
            createYTPlayerElementStub = sinon.stub(
                YoutubeVideoElement.prototype,
                'createYTPlayerElement'
            );
            createYTPlayerElementStub.onFirstCall().returns(firstPlayerElement);
            createYTPlayerElementStub
                .onSecondCall()
                .returns(secondPlayerElement);
            firstStubbedYtPlayerApi = {
                getPlayerState: sinon.stub(),
                pauseVideo: sinon.spy(),
                playVideo: sinon.spy(),
                destroy: sinon.spy(),
            };
            secondStubbedYtPlayerApi = {
                getPlayerState: sinon.stub(),
                pauseVideo: sinon.spy(),
                playVideo: sinon.spy(),
                destroy: sinon.spy(),
            };
            firstPlayerConstructorStub = sinon.stub();
            secondPlayerConstructorStub = sinon.stub();
            class FakeMultiPlayer {
                constructor(ytEl, props, ...args) {
                    let stubbedApi;
                    if (ytEl === firstPlayerElement) {
                        firstPlayerConstructorStub(ytEl, props, ...args);
                        stubbedApi = firstStubbedYtPlayerApi;
                    } else if (ytEl === secondPlayerElement) {
                        stubbedApi = secondStubbedYtPlayerApi;
                        secondPlayerConstructorStub(ytEl, props, ...args);
                    }
                    props.events.onReady({ target: stubbedApi });
                    return stubbedApi;
                }
            }
            origYT = window.YT;
            window.YT = {
                Player: FakeMultiPlayer,
            };
        });

        afterEach(function() {
            createYTPlayerElementStub.restore();
            window.YT = origYT;
        });

        it("should call first player's pause() if it is playing when the youtube triggers playing on second video", async function() {
            testContainer.appendChild(firstVideoEl);
            testContainer.appendChild(secondVideoEl);
            await firstVideoEl.load();
            await secondVideoEl.load();
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
            firstVideoEl.play();
            firstPlayerConstructorStub.args[0][1].events.onStateChange({
                data: 1,
            }); /// trigger play on youtube's api
            firstStubbedYtPlayerApi.getPlayerState.returns(1);
            secondVideoEl.play();
            secondPlayerConstructorStub.args[0][1].events.onStateChange({
                data: 1,
            }); // trigger play on youtube's api
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 1);
            assert.equal(secondStubbedYtPlayerApi.pauseVideo.callCount, 0);
        });

        it("should NOT call first player's pause() if it is NOT playing when the second player is played", async function() {
            testContainer.appendChild(firstVideoEl);
            testContainer.appendChild(secondVideoEl);
            await firstVideoEl.load();
            await secondVideoEl.load();
            // ensure that first video is in an unstarted state
            firstStubbedYtPlayerApi.getPlayerState.returns(-1);
            // trigger play on second player
            secondPlayerConstructorStub.args[0][1].events.onStateChange({
                data: 1,
            });
            assert.equal(firstStubbedYtPlayerApi.pauseVideo.callCount, 0);
        });
    });
});
