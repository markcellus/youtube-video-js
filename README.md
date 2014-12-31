#Video Player

A lightweight framework that allows you to easily play and control social network videos using the new HTML5 [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag. Videos
can be played, stopped, paused, and more all with simple html markup or with javascript.

The library supports [Youtube](youtube.com) videos currently. More players will be added in the next few weeks.

This Video Player library aims to mimick the methods and properties of HTML5's new `<video>` tag to offer a simple, easy-to-use API
which can be a lot easier when there are already so many video API's to deal with (i.e. Youtube, Facebook, Vine, Vimeo, etc).


##Usage

Suppose you have the following HTML in the DOM.

```html
<video width="640" height="360">
    <source type="video/youtube" src="http://www.youtube.com/watch?v=ye82js0sL32" />
</video>
```

To control the video with javascript all you need to do is the following:

```javascript
require(['path/to/video-player/file'], function (VideoPlayer) {
    var videoEl = document.getElementsByTagName('video')[0];

    // start a youtube video
    var player = new VideoPlayer.Youtube({
        el: videoEl
    });

    // load the video
    player.load(function () {

        // play the video
        player.play();

        // stop the video
        player.stop();

    });
});
```

## Version History

*0.0.1 (12.30.15)*

* Video player now supports Youtube Videos for its initial release.



