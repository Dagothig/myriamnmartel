let browserSync = require('browser-sync').create();

browserSync.init({
    baseDir: './public',
    server: './public',
    files: './public'
});
