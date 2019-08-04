module.exports = {
    git: {
        commitMessage: '${version}',
        requireCleanWorkingDir: false,
        requireUpstream: false,
        tagName: 'v${version}',
    },
    github: {
        release: true,
        releaseName: '${version}',
        releaseNotes: null,
    },
};
