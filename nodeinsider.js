const { program } = require('commander');
const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const sanitize = require("sanitize-filename");
const path = require('path');
const cheerio = require('cheerio');
const prefix = "https://downloads.khinsider.com/game-soundtracks/album";
const songPagePrefix = "https://downloads.khinsider.com";
const artworkRegex = /(?<=\/)[^\/\?#]+(?=[^\/]*$)/;

(async () => {

    program
        .requiredOption('-i, --id <ost id>', 'ID of the soundtrack (that part after game-soundtracks/album)')
        .option('-o, --output <folder>', 'Where to download')
        .option('--disableart', 'Disable art download')
        .option('--dump <file>', 'Dump all download links to the specified file, and skip downloading.')
    program.parse(process.argv);
    const options = program.opts();

    if (!options.output && !options.dump) {
        console.error('error : you must either specify an output directory or --dump.');
        process.exit(1);
    }

    console.log(`Fetching songlist...`);
    const initialSonglist = await fetch(`${prefix}/${options.id}`);
    const initialSonglistBody = await initialSonglist.text();
    const initSonglistDOM = cheerio.load(initialSonglistBody);
    const songlist = [];
    const artworks = [];
    initSonglistDOM(`.playlistDownloadSong > a`).each((i, el) => {
        songlist.push(initSonglistDOM(el).attr("href"));
    });
    initSonglistDOM('.albumImage > a').each((i, el) => {
        artworks.push(initSonglistDOM(el).attr("href"));
    })

    if (!songlist) {
        console.error('Album not found. Make sure you pasted the right id!');
        process.exit(1);
    }

    const album = initSonglistDOM('h2').prop('innerText');
    const sanitizedAlbumName = sanitize(album);
    if (album !== sanitizedAlbumName) {
        console.log('WARN : Album name had to be sanitized. Please double check the output.')
    }
    console.log(`Album name : ${album}`)
    console.log(`Found ${songlist.length} songs.`);

    if (!options.dump && !fs.existsSync(path.join(options.output, sanitizedAlbumName))) {
        fs.mkdirSync(path.join(options.output, sanitizedAlbumName), { recursive: true });
    }

    if (!options.disableart) {
        console.log(`Processing artworks...`);
        for (const art of artworks) {
            const filename = path.join(options.output, sanitizedAlbumName, artworkRegex.exec(art)[0]);
            if (!fs.existsSync(filename) && !options.dump) await downloadFile(art, filename);
            if (options.dump) fs.appendFileSync(options.dump, `${art}\n`)
        }
    }

    let progress = 0;
    console.log('Processing songs...');
    for (const song of songlist) {
        progress += 1;
        const resp = await fetch(`${songPagePrefix}${song}`);
        const body = await resp.text();
        const $ = cheerio.load(body);
        const url = $('#pageContent > p:nth-child(10) > a:nth-child(1)').prop('href');
        if (options.dump) {
            fs.appendFileSync(options.dump, `${url}\n`)
        } else {
            const songName = $('#pageContent > p:nth-child(6) > b:nth-child(3)').prop('innerText');
            const filename = path.join(options.output, sanitizedAlbumName, `${`${progress}`.padStart(2, '0')}. ${songName}.flac`);
            if (fs.existsSync(filename)) {
                console.log(`(${progress}/${songlist.length}) "${songName}" has already been downloaded, skipping`);
            } else {
                console.log(`(${progress}/${songlist.length}) Downloading "${songName}"`);
                await downloadFile(url, filename);
            }
        }
    }
    console.log('Done.');
})();

async function downloadFile(url, filename) {
    const response = await fetch(url);
    const body = Readable.fromWeb(response.body);
    const ws = fs.createWriteStream(filename);
    await finished(body.pipe(ws));
}