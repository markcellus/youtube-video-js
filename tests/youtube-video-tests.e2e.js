import { Selector } from 'testcafe';

fixture`Youtube Video Tests`.page`http://localhost:2201/youtube-video.html`;

test('changes displayed content to "playing" when you click play', async (t) => {
    const body = Selector('body');
    const display = body.find('.video-state');
    const video = body.find('youtube-video');

    await t.expect(display.textContent).notEql('playing');
    await t.click(video); // click video PLAY button here
    await t.expect(display.textContent).eql('playing');
});
