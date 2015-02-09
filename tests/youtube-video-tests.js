define([
    'sinon',
    'qunit',
    'test-utils',
    'src/video'
], function(
    Sinon,
    QUnit,
    TestUtils,
    Video
){
    "use strict";

    QUnit.module('Youtube Video Tests');

    QUnit.test('loading a video', function () {
        QUnit.expect(15);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player1">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />' +
        '</video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var loadSpy = Sinon.spy();
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {
            playVideo: function (){}
        };
        ytPlayerStub.returns(stubbedPlayer);
        var videoEl = document.getElementById('player1');
        var loadingCssClass = 'v-loading';
        var player = new Video.Youtube({
            el: videoEl,
            loadingCssClass: loadingCssClass
        });
        // setup server
        QUnit.deepEqual(videoEl.parentNode, player._container, 'after initialization, a new container was created that now encapsulates the video element');
        player.load(loadSpy);
        QUnit.ok(player._container.classList.contains(loadingCssClass), 'after calling load(), loading css class was added to container');
        QUnit.equal(loadSpy.callCount, 0, 'load callback was not yet fired because javascript file hasnt finished loading yet');
        // trigger script loaded
        window.onYouTubeIframeAPIReady();
        var youtubeElId = 'vplayerv1';
        var youtubeEl = document.getElementById(youtubeElId);
        QUnit.equal(youtubeEl.getAttribute('id'), youtubeElId, 'after javascript file is loaded, a new container was created with a unique id attribute');
        QUnit.ok(!videoEl.parentNode, 'the original video element has been removed from the DOM');
        QUnit.equal(ytPlayerStub.args[0][0], youtubeEl.getAttribute('id'), 'YouTube player constructor was passed unique id attribute of the new container that was created as its first argument');
        var ytPlayerConstructorOptions = ytPlayerStub.args[0][1];
        QUnit.equal(ytPlayerConstructorOptions.width, 640, 'YouTube player constructor was passed width of video element');
        QUnit.equal(ytPlayerConstructorOptions.height, 360, 'YouTube player constructor was passed height of video element');
        QUnit.equal(ytPlayerConstructorOptions.videoId, videoId, 'YouTube player constructor was passed correct video id');
        QUnit.equal(loadSpy.callCount, 0, 'load callback was STILL not fired yet because player hasnt finished loading');
        QUnit.ok(player._container.classList.contains(loadingCssClass), 'container still has loading css class');
        // trigger player ready
        ytPlayerConstructorOptions.events.onReady({target: stubbedPlayer});
        QUnit.deepEqual(loadSpy.args[0], [stubbedPlayer], 'after player is done loading, load callback was fired with the player instance as the first arg');
        QUnit.ok(!player._container.classList.contains(loadingCssClass), 'container no longer has loading css class');
        player.destroy();
        QUnit.equal(document.getElementById(youtubeElId), null, 'video container was removed from the DOM');
        QUnit.equal(videoEl.parentNode, fixture, 'video element was put back in the DOM inside of its original parent');
        window.YT = origYT;
    });

    QUnit.test('script loading', function () {
        QUnit.expect(4);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player1">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player1');
        var player = new Video.Youtube({el: videoEl});
        var scriptUrl = 'https://www.youtube.com/iframe_api';
        // setup server
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 0, 'script element has NOT been added to DOM because load() hasnt been called');
        player.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() is called, script element is added to DOM');
        QUnit.ok(document.querySelectorAll('script[src="' + scriptUrl + '"]')[0].async, 'script has truthy async value');
        player.destroy();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 0, 'after destroying last instance, script element is finally removed from the DOM');
        window.YT = origYT;
    });

    QUnit.test('script existence when there are multiple instances', function () {
        QUnit.expect(6);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player1">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player1');
        var firstPlayer = new Video.Youtube({el: videoEl});
        var scriptUrl = 'https://www.youtube.com/iframe_api';
        // setup server
        firstPlayer.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() on first instance is called, script element is added to DOM');
        var secondPlayer = new Video.Youtube({el: videoEl});
        secondPlayer.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() is called on a second instance, script element is NOT added to the DOM a second time');
        firstPlayer.destroy();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after destroying first instance, script element is still left hanging out in the DOM, even when it hasnt finished loading yet, because there is another instance present');
        var thirdPlayer = new Video.Youtube({el: videoEl});
        thirdPlayer.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() is called on a third instance, script element is NOT added to the DOM a second time');
        window.onYouTubeIframeAPIReady(); // trigger script loaded
        secondPlayer.destroy();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after destroying second instance after script has loaded, script element is still left hanging out in the DOM because there is another instance present');
        thirdPlayer.destroy();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 0, 'after destroying last instance, script element is finally removed from the DOM');
        window.YT = origYT;
    });

    QUnit.test('when a video is played', function () {
        QUnit.expect(4);
        var html = '<video width="640" height="360" id="player1">' +
                        '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />' +
                    '</video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var playingClass = 'vid-playing';
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {playVideo: Sinon.spy()};
        ytPlayerStub.returns(stubbedPlayer);
        var videoEl = document.getElementById('player1');

        var player = new Video.Youtube({
            el: videoEl,
            playingCssClass: playingClass
        });
        // load player
        player.load();
        window.onYouTubeIframeAPIReady(); // trigger script loaded
        ytPlayerStub.args[0][1].events.onReady({target: stubbedPlayer}); // trigger player loaded
        // test
        QUnit.ok(!player._container.classList.contains(playingClass), 'initially there is no playing css class added to the video container element because the video isnt playing');
        var playSpy = Sinon.spy();
        videoEl.addEventListener('play', playSpy);
        QUnit.equal(playSpy.callCount, 0, 'play event on the video element hasnt been triggered yet');
        ytPlayerStub.args[0][1].events.onStateChange({data: 1}); // trigger play
        QUnit.ok(player._container.classList.contains(playingClass), 'when video is played, playing css class has been added to the video container element');
        QUnit.equal(playSpy.callCount, 1, 'play event on the video element has been triggered once');
        player.destroy();
        window.YT = origYT;
    });

    QUnit.test('extracting video id from a url', function () {
        QUnit.expect(2);
        QUnit.equal(Video.Youtube.prototype.extractVideoIdFromUrl('http://www.youtube.com/watch?v=nOEw9i3opwI'), 'nOEw9i3opwI', 'correct video id was returned');
        QUnit.equal(Video.Youtube.prototype.extractVideoIdFromUrl('https://www.youtube.com/embed/nCJJdW20uZI'), 'nCJJdW20uZI', 'correct video id was returned');
    });

    QUnit.test('attempting to play/pause a video before player has loaded', function () {
        QUnit.expect(3);
        var html = '<video width="640" height="360" id="player1">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var playingClass = 'vid-playing';
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {playVideo: Sinon.spy()};
        ytPlayerStub.returns(stubbedPlayer);
        var videoEl = document.getElementById('player1');
        var player = new Video.Youtube({el: videoEl, playingCssClass: playingClass});
        var playSpy = Sinon.spy(player, 'play');
        var stopSpy = Sinon.spy(player, 'stop');
        var pauseSpy = Sinon.spy(player, 'pause');
        // load player
        player.load();
        player.play();
        QUnit.ok(!playSpy.threw('TypeError'), 'calling play() before player\'s script has loaded does NOT throw error');
        player.pause();
        QUnit.ok(!pauseSpy.threw('TypeError'), 'calling pause() before player\'s script has loaded does NOT throw error');
        player.stop();
        QUnit.ok(!stopSpy.threw('TypeError'), 'calling stop() before player\'s script has loaded does NOT throw error');
        // trigger script loaded
        window.onYouTubeIframeAPIReady();
        player.play();
        // trigger player loaded
        ytPlayerStub.args[0][1].events.onReady({target: stubbedPlayer});
        player.play();
        // test
        playSpy.restore();
        stopSpy.restore();
        pauseSpy.restore();
        player.destroy();
        window.YT = origYT;
    });

});