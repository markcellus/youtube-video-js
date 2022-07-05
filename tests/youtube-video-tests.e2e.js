import { Selector } from 'testcafe';

fixture`Youtube Video Tests`
    .page`http://localhost:2201/examples/youtube-video.html`;

test('changes displayed content to "playing" when video is played', async (t) => {
    const body = Selector('body');
    const display = body.find('.video-state');
    await t.expect(display.textContent).notEql('playing');
    const video = body.find('youtube-video');
    await t.click(video);
    await t.expect(display.textContent).eql('playing');
});
