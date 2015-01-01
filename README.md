#Video

A lightweight framework that allows you to easily play and control social network videos using the new HTML5 [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag. Videos
can be played, stopped, paused, and more all with simple html markup or with javascript.

The library supports [Youtube](youtube.com) videos currently. More players will be added in the next few weeks.

This Video Player library aims to mimick the methods and properties of HTML5's new `<video>` tag to offer a simple, easy-to-use API
which can be a lot easier when there are already so many video API's to deal with (i.e. Youtube, Facebook, Vine, Vimeo, etc).


##Usage

Suppose you have the following HTML in the DOM (A Youtube Video).

```html
<video width="640" height="360">
    <source type="video/youtube" src="http://www.youtube.com/watch?v=ye82js0sL32" />
</video>
```

To start controlling the video player with javascript all you need to do is [require](http://requirejs.org) the built [video-player.js file](https://github.com/mkay581/video-player/tree/master/dist) and instantiate a new instance using a `<video>` element on the page:

```javascript
require(['path/to/video-player/file'], function (Video) {
    // start a youtube video
    var video = new Video.Youtube({
          el: document.getElementsByTagName('video')[0]
      })
});
```
Once instantiated, the player instance exposes the [same methods that are available on the new HTML5 `<video>` element](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video#Controlling_media_playback).

```javascript
// load the video
video.load(function () {

    // play the video
    video.play();

    // stop the video
    video.stop();

});
```

You can also subscribe to [MediaEvents](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) provided by the <video> element:

```javascript

video.addEventListener('play', function () {
    // video has started!
});

video.addEventListener('ended', function () {
    // video has finished!
});
```

## Version History

*0.0.1 (12.30.14)*

* Video player now supports Youtube Videos for its initial release.



