'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _pngjs = require('pngjs');

var _pixelmatch = require('pixelmatch');

var _pixelmatch2 = _interopRequireDefault(_pixelmatch);

var _crypto = require('crypto');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const compare = (snapshot, latest, output, update, callback, threshold = 0.01) => new Promise((resolve, reject) => {
    const latestImg = _pngjs.PNG.sync.read(_fs2.default.readFileSync(latest));

    if (update || !_fs2.default.existsSync(snapshot)) {
        _fsExtra2.default.ensureFileSync(snapshot);
        _fs2.default.writeFileSync(snapshot, _pngjs.PNG.sync.write(latestImg, { filterType: 4 }));
        resolve({ diff: 0, total: 0, msg: "Snapshot did not exist we created it for you!" });
    }

    const snapshotImg = _pngjs.PNG.sync.read(_fs2.default.readFileSync(snapshot));

    const snapshotHash = (0, _crypto.createHash)('sha1').update(snapshotImg.data).digest('base64');
    const latestHash = (0, _crypto.createHash)('sha1').update(latestImg.data).digest('base64');

    if (snapshotHash === latestHash) {
        resolve({ diff: 0, total: 0, msg: "File hash matched no need for pixel by pixel compare!" });
    }

    if (snapshotImg.width !== latestImg.width || snapshotImg.height !== latestImg.height) {
        // Check if the DPI setting of the screen is different to provide better error handling.
        if (snapshotImg.width % latestImg.width === 0 && snapshotImg.height % latestImg.height === 0 || latestImg.width % snapshotImg.width === 0 && latestImg.height % snapshotImg.height === 0) {
            reject(new Error(`Size of the images compare are not equal, this is likely to DPI settings please ensure you run the test cases on a screen with the same DPI settings.`));
        }

        reject(new Error(`Size of the images to compare need to be equal, snapshot ${snapshotImg.width}x${snapshotImg.height} vs latest ${latestImg.width}x${latestImg.height}.`));
    };

    const diffImg = new _pngjs.PNG({ width: snapshotImg.width, height: snapshotImg.height });

    const diffPixels = (0, _pixelmatch2.default)(snapshotImg.data, latestImg.data, diffImg.data, snapshotImg.width, snapshotImg.height, { threshold });

    if (diffPixels > 0) {
        if (typeof callback === 'function') {
            callback.call({ latestImg, snapshotImg, diffImg, snapshotPath: snapshot, latestPath: latest, diffPath: output, diffPixels, threshold });
        } else {
            const { width, height } = snapshotImg;

            const compositeDiffImg = new _pngjs.PNG({
                width: width * 3,
                height
            });

            _pngjs.PNG.bitblt(snapshotImg, compositeDiffImg, 0, 0, width, height, 0, 0);
            _pngjs.PNG.bitblt(diffImg, compositeDiffImg, 0, 0, width, height, width, 0);
            _pngjs.PNG.bitblt(latestImg, compositeDiffImg, 0, 0, width, height, width * 2, 0);

            _fsExtra2.default.ensureFileSync(output);
            _fs2.default.writeFileSync(output, _pngjs.PNG.sync.write(compositeDiffImg, { filterType: 4 }));
        }
    }

    resolve({ diff: diffPixels, total: snapshotImg.width * snapshotImg.height });
});

exports.default = compare;