define([
    'sinon',
    'qunit',
    'src/youtube-player'
], function(
    Sinon,
    QUnit,
    YTPlayer
){
    "use strict";

    QUnit.module('Youtube Player Tests');


    QUnit.test('loading a player', function () {
        QUnit.expect(6);
        var html = '<video width="640" height="360" id="player1">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />' +
        '</video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player1');
        var player = new YTPlayer({
            el: videoEl
        });
        var loadSpy = Sinon.spy();
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {
            playVideo: function (){}
        };
        ytPlayerStub.returns(stubbedPlayer);
        player.load(loadSpy);
        QUnit.equal(loadSpy.callCount, 0, 'load callback was not yet fired because javascript file hasnt finished loading yet');
        // trigger script loaded
        window.onYouTubeIframeAPIReady();
        QUnit.equal(ytPlayerStub.args[0][0], videoEl.getAttribute('id'), 'after javascript file is loaded, YouTube player constructor was passed correct id as its first argument');
        var ytPlayerConstructorOptions = ytPlayerStub.args[0][1];
        QUnit.equal(ytPlayerConstructorOptions.width, videoEl.clientWidth, 'YouTube player constructor was passed width of video element');
        QUnit.equal(ytPlayerConstructorOptions.height, videoEl.clientHeight, 'YouTube player constructor was passed width of video element');
        QUnit.equal(loadSpy.callCount, 0, 'load callback was STILL not fired yet because player hasnt finished loading');
        // trigger player ready
        ytPlayerConstructorOptions.events.onReady({target: stubbedPlayer});
        QUnit.deepEqual(loadSpy.args[0], [stubbedPlayer], 'after player is done loading, load callback was fired with the player instance as the first arg');
        window.YT = origYT;
    });

    QUnit.test('playing a video', function () {
        QUnit.expect(4);
        var html = '<video width="640" height="360" id="player1"></video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player1');
        var playingClass = 'vid-playing';
        var player = new YTPlayer({
            el: videoEl,
            playingCssClass: playingClass
        });
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {playVideo: Sinon.spy()};
        ytPlayerStub.returns(stubbedPlayer);

        // load player
        player.load();
        window.onYouTubeIframeAPIReady(); // trigger script loaded
        ytPlayerStub.args[0][1].events.onReady({target: stubbedPlayer}); // trigger player loaded

        // test
        player.play();
        QUnit.ok(!videoEl.classList.contains(playingClass), 'when calling playVideo(), playing css class has NOT been added to the video element because the video element has no source');
        QUnit.equal(stubbedPlayer.playVideo.callCount, 0, 'youtube player playVideo() method was not called');
        // add source
        videoEl.innerHTML = '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />';

        player.play();
        QUnit.ok(videoEl.classList.contains(playingClass), 'when video element has a source, playing css class has been added to the video element');
        QUnit.equal(stubbedPlayer.playVideo.callCount, 1, 'youtube player playVideo() method was called');
        window.YT = origYT;
    });
});