# nodeinsider
A script to replace the broken python khinsider one.

### How to use
This script requires node 18 or higher.

- Clone this repository
- Install dependencies : `npm i`
- `node nodeinsider -i <albumid> -o <output folder>`

Album will be downloaded to `$OUTPUT/$ALBUM_NAME`, like `test/KINGDOM HEARTS Birth by Sleep & 3582 Days Original Soundtrack` for example.

### Options

- `--disableart` will not download artworks.
- `--dump <file>` will dump all download links to the specified file, and skip downloading. If `--disableart` is also specified, image URLs will be ommited.

> [!CAUTION]
> Dump is appending to the output file. If the file already exists, links will be appended.

> [!TIP]
> Downloader is single threaded and not that optimized; If you're using this script at a large scale, you might want to dump links to a file then use an actual threaded downloader such as `aria2` or similar.

### Tired of going to the repo's folder and typing stuff manually?

I suggest you create a wrapper around this; here's an example bash script you can add to your path :

```bash
#!/bin/bash
export PATH_TO_REPO=~/nodeinsider
node $PATH_TO_REPO/nodeinsider.js $@
```

If you're on Windows, here's a similar script :

```cmd
@echo off
set pathtorepo="C:\\example\\nodeinsider"
node %pathtorepo%\nodeinsider.js %*
```

Save this as `nodeinsider.cmd`, put it in your path, and you're good.