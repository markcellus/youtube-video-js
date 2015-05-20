var Sinon = require('sinon');
var QUnit = require('qunit');
var TestUtils = require('test-utils');
var Youtube = require('../src/youtube-video');

module.exports = (function () {
    'use strict';

    QUnit.module('Youtube Video Tests');

    QUnit.test('loading a video', function () {
        QUnit.expect(11);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player776">' +
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
        var videoEl = document.getElementById('player776');
        var loadingCssClass = 'v-loading';
        var player = new Youtube({
            el: videoEl,
            loadingCssClass: loadingCssClass
        });
        // setup server
        player.load(loadSpy);
        QUnit.ok(player._container.classList.contains(loadingCssClass), 'after calling load(), loading css class was added to container');
        QUnit.equal(loadSpy.callCount, 0, 'load callback was not yet fired because javascript file hasnt finished loading yet');
        // trigger script loaded
        window.onYouTubeIframeAPIReady();
        QUnit.ok(!videoEl.parentNode, 'the original video element has been removed from the DOM');
        var ytPlayerConstructorOptions = ytPlayerStub.args[0][1];
        QUnit.equal(ytPlayerConstructorOptions.width, 640, 'YouTube player constructor was passed width of video element');
        QUnit.equal(ytPlayerConstructorOptions.height, 360, 'YouTube player constructor was passed height of video element');
        QUnit.equal(ytPlayerConstructorOptions.videoId, videoId, 'YouTube player constructor was passed correct video id');
        QUnit.equal(loadSpy.callCount, 0, 'load callback was STILL not fired yet because player hasnt finished loading');
        QUnit.ok(player._container.classList.contains(loadingCssClass), 'container still has loading css class');
        // trigger player ready
        ytPlayerConstructorOptions.events.onReady({target: stubbedPlayer});
        QUnit.deepEqual(loadSpy.args[0][0], stubbedPlayer, 'after player is done loading, load callback was fired with the player instance as the first arg');
        QUnit.ok(!player._container.classList.contains(loadingCssClass), 'container no longer has loading css class');
        player.destroy();
        QUnit.equal(fixture.childNodes[0], videoEl, 'video element was put back in the DOM inside of its original parent');
        window.YT = origYT;
    });

    QUnit.test('script loading', function () {
        QUnit.expect(4);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player77">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player77');
        var player = new Youtube({el: videoEl});
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
        var html = '<video width="640" height="360" id="player32">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=' + videoId + '" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        fixture.innerHTML = html;
        var videoEl = document.getElementById('player32');
        var firstPlayer = new Youtube({el: videoEl});
        var scriptUrl = 'https://www.youtube.com/iframe_api';
        // setup server
        firstPlayer.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() on first instance is called, script element is added to DOM');
        var secondPlayer = new Youtube({el: videoEl});
        secondPlayer.load();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after load() is called on a second instance, script element is NOT added to the DOM a second time');
        firstPlayer.destroy();
        QUnit.equal(document.querySelectorAll('script[src="' + scriptUrl + '"]').length, 1, 'after destroying first instance, script element is still left hanging out in the DOM, even when it hasnt finished loading yet, because there is another instance present');
        var thirdPlayer = new Youtube({el: videoEl});
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
        var html = '<video width="640" height="360" id="player45">' +
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
        var videoEl = document.getElementById('player45');

        var player = new Youtube({
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

    QUnit.test('extracting video id from a url that begins with a direct link', function () {
        QUnit.expect(1);
        var videoEl = document.createElement('video');
        var player = new Youtube({el: videoEl});
        var videoId = 'nOEw9iiopwI';
        QUnit.equal(player.getVideoId('http://www.youtube.com/watch?v=' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    QUnit.test('extracting video id from a youtube url that is a embed link', function () {
        QUnit.expect(1);
        var videoEl = document.createElement('video');
        // test url
        var player = new Youtube({el: videoEl});
        var videoId = 'nCJJdW20uZI';
        QUnit.equal(player.getVideoId('https://www.youtube.com/embed/' + videoId), videoId, 'correct video id was returned');
        player.destroy();
    });

    QUnit.test('query parameters from a url', function () {
        QUnit.expect(2);
        var videoEl = document.createElement('video');
        videoEl.innerHTML = '<source type="video/youtube" />';
        var fixture = document.getElementById('qunit-fixture');
        fixture.appendChild(videoEl);
        // test url
        videoEl.getElementsByTagName('source')[0].setAttribute('src', 'http://www.youtube.com/watch?v=nOEw9i3opwI&rel=0');
        var player = new Youtube({el: videoEl});
        QUnit.deepEqual(player.getPlayerVars(), {v: 'nOEw9i3opwI', rel: "0"}, 'correct video id was returned');
        player.destroy();
        // test url
        videoEl.getElementsByTagName('source')[0].setAttribute('src', 'https://www.youtube.com/embed/nCJJdW20uZI?autoplay=true&blah');
        var player = new Youtube({el: videoEl});
        QUnit.deepEqual(player.getPlayerVars(), {autoplay: 'true', blah: ''}, 'correct video id was returned');
        player.destroy();
    });

    QUnit.test('attempting to play/pause a video before player has loaded', function () {
        QUnit.expect(3);
        var html = '<video width="640" height="360" id="player89">' +
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
        var videoEl = document.getElementById('player89');
        var player = new Youtube({el: videoEl, playingCssClass: playingClass});
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

    QUnit.test('autoplay', function () {
        QUnit.expect(1);
        var html = '<video width="640" height="360" id="player87">' +
            '<source type="video/youtube" src="http://www.youtube.com/watch?v=nOEw9iiopwI" />' +
            '</video>';
        var fixture = document.getElementById('qunit-fixture');
        fixture.innerHTML = html;
        var origYT = window.YT;
        var ytPlayerStub = Sinon.stub();
        window.YT = {Player: ytPlayerStub};
        var stubbedPlayer = {playVideo: Sinon.spy()};
        ytPlayerStub.returns(stubbedPlayer);
        var videoEl = document.getElementById('player87');
        videoEl.setAttribute('autoplay', 'true'); // add autoplay
        var player = new Youtube({el: videoEl});
        player.load(); // load player
        window.onYouTubeIframeAPIReady(); // trigger script loaded
        QUnit.equal(ytPlayerStub.args[0][1].playerVars.autoplay, 1, 'when video element has autoplay attribute, new Youtube Video constructor is passed playerVars.autoplay set to 1');
        player.destroy();
        window.YT = origYT;
    });

    QUnit.test('applying a custom wrapper class to video', function () {
        QUnit.expect(1);
        var videoId = 'nOEw9iiopwI';
        var html = '<video width="640" height="360" id="player776">' +
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
        var videoEl = document.getElementById('player776');
        var customWrapperClass = 'v-wrapper';
        var player = new Youtube({
            el: videoEl,
            customWrapperClass: customWrapperClass
        });
        // setup server
        player.load(loadSpy);
        QUnit.ok(player._container.classList.contains(customWrapperClass), 'after calling load(), custom wrapper css class was added to container');
        // trigger script loaded
        window.onYouTubeIframeAPIReady();
        var ytPlayerConstructorOptions = ytPlayerStub.args[0][1];
        // trigger player ready
        ytPlayerConstructorOptions.events.onReady({target: stubbedPlayer});
        player.destroy();
        window.YT = origYT;
    });

})();

