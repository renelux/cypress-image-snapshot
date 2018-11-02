'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addMatchImageSnapshotPlugin = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _constants = require('./constants');

var _compare = require('./compare');

var _compare2 = _interopRequireDefault(_compare);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let screenshotDetails = {};

const matchImageSnapshotPlugin = (name, options, config) => {
  // Check if we should skip the comparison, for example while debugging a case.
  if (options.skipCompare.call()) {
    return Promise.resolve('Snapshot Compare skipped.');
  }

  // Set all paths needed in our plugin.
  const relativePath = process.cwd();
  const screenshotPath = screenshotDetails.path.replace(config.screenshotsFolder, '');
  const screenshotFolder = screenshotDetails.path.replace(relativePath, '').replace(screenshotPath, '');

  const diffPath = _path2.default.join(relativePath, options.diffFolder || screenshotFolder, screenshotPath.replace('.png', options.dotDiff));

  const snapPath = _path2.default.join(relativePath, options.snapshotFolder || screenshotFolder, screenshotPath.replace('.png', options.dotSnap));

  return (0, _compare2.default)(snapPath, screenshotDetails.path, diffPath, config.env.updateSnapshots || false).then(({ diff, total, msg }) => {
    options.onDiffFinished.call(snapPath, screenshotDetails.path, diffPath);

    if (msg) {
      return msg;
    }

    if (options.thresholdType === 'pixel') {
      if (diff > options.threshold) {
        throw new Error(`Image comparison failed, the change of ${diff} is higher than the allowed ${options.threshold} pixels.`);
      }
    } else if (options.threshold === 'percentage') {
      const percentage = (total - diff) / total * 100;

      if (percentage > options.threshold) {
        throw new Error(`Image comparison failed, the change of ${diff} is higher than the allowed ${options.threshold} percentage.`);
      }
    }

    return 'Screenshot matched';
  });
};

const addMatchImageSnapshotPlugin = (on, config, pluginOptions) => {
  const pluginDefaults = {
    dotSnap: '.snap.png',
    dotDiff: '.diff.png',
    snapshotFolder: undefined,
    diffFolder: undefined,
    skipCompare: () => false,
    threshold: 0,
    thresholdType: 'pixel',
    onDiffFinished: () => {}
  };
  on('task', {
    [_constants.COMPARE]: (name, options) => matchImageSnapshotPlugin(name, _extends({}, pluginDefaults, pluginOptions, options), config)
  });
  on('after:screenshot', details => {
    screenshotDetails = details;
  });
};

exports.addMatchImageSnapshotPlugin = addMatchImageSnapshotPlugin;