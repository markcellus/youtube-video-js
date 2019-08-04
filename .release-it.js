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
    hooks: {
        'before:init': ['npm test'],
        'after:bump': 'npm run build-dist && banner-cli dist/*.js',
        'after:release':
            'echo Successfully released ${name} v${version} to ${repo.repository}.',
    },
};
