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

let compareOptions = {};
let compareResult = {};

const matchImageSnapshotPlugin = (details, config) => {
  // Check if we should skip the comparison, for example while debugging a case.
  if (compareOptions.skipCompare.call()) {
    return Promise.resolve('Snapshot Compare skipped.');
  }

  // Set all paths needed in our plugin.
  const relativePath = process.cwd();
  const screenshotPath = details.path.replace(config.screenshotsFolder, '');
  const screenshotFolder = details.path.replace(relativePath, '').replace(screenshotPath, '');

  const diffPath = _path2.default.join(relativePath, compareOptions.diffFolder || screenshotFolder, screenshotPath.replace('.png', compareOptions.dotDiff));

  const snapPath = _path2.default.join(relativePath, compareOptions.snapshotFolder || screenshotFolder, screenshotPath.replace('.png', compareOptions.dotSnap));

  return (0, _compare2.default)(snapPath, details.path, diffPath, config.env.updateSnapshots || false, compareOptions.onDiffFinished).then(({ diff, total, message }) => {
    if (message) {
      compareResult.message = message;
      return { path: snapPath };
    }

    if (compareOptions.thresholdType === 'pixel') {
      if (diff > compareOptions.threshold) {
        compareResult.error = `Image comparison failed, the change of ${diff} is higher than the allowed ${compareOptions.threshold} pixels.`;
        return { path: diffPath };
      }
    } else if (compareOptions.threshold === 'percentage') {
      const percentage = (total - diff) / total * 100;

      if (percentage > compareOptions.threshold) {
        compareResult.error = `Image comparison failed, the change of ${diff} is higher than the allowed ${compareOptions.threshold} percentage.`;
        return { path: diffPath };
      }
    }

    compareResult.message = 'Screenshot matched';
    return { path: snapPath };
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
    onDiffFinished: undefined
  };
  on('task', {
    [_constants.COMPARE_OPTIONS]: options => {
      compareOptions = _extends({}, pluginDefaults, pluginOptions, options);
      compareResult = { error: null, message: null };
      return null;
    },
    [_constants.COMPARE_RESULT]: () => {
      console.log(compareResult);
      if (compareResult.error) {
        throw new Error(compareResult.error);
      }

      return Promise.resolve(compareResult.message);
    }
  });
  on('after:screenshot', details => matchImageSnapshotPlugin(details, config));
};

exports.addMatchImageSnapshotPlugin = addMatchImageSnapshotPlugin;