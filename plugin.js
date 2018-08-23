'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.matchImageSnapshotOptions = matchImageSnapshotOptions;
exports.matchImageSnapshotResults = matchImageSnapshotResults;
exports.matchImageSnapshotPlugin = matchImageSnapshotPlugin;
exports.addMatchImageSnapshotPlugin = addMatchImageSnapshotPlugin;

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _diffSnapshot = require('jest-image-snapshot/src/diff-snapshot');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } /**
                                                                                                                                                                                                                              * Copyright (c) 2018-present The Palmer Group
                                                                                                                                                                                                                              *
                                                                                                                                                                                                                              * This source code is licensed under the MIT license found in the
                                                                                                                                                                                                                              * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                              */


const path = require('path');

let snapshotOptions = {};
let snapshotResults = {};
let snapshotRunning = false;
const kebabSnap = '-snap.png';
const dotSnap = '.snap.png';
const dotDiff = '.diff.png';

function matchImageSnapshotOptions(options = {}) {
  snapshotOptions = options;
  snapshotRunning = true;
  return null;
}

function matchImageSnapshotResults() {
  snapshotRunning = false;
  return snapshotResults;
}

function matchImageSnapshotPlugin({ path: screenshotPath }) {
  if (!snapshotRunning) {
    return null;
  }

  const {
    updateSnapshots,
    options: {
      failureThreshold = 0,
      failureThresholdType = 'pixel'
    } = {}
  } = snapshotOptions,
        options = _objectWithoutProperties(snapshotOptions.options, ['failureThreshold', 'failureThresholdType']);

  const receivedImageBuffer = _fsExtra2.default.readFileSync(screenshotPath);
  const screenshotFileName = screenshotPath.slice(screenshotPath.lastIndexOf(path.sep) + 1);
  const screenshotDir = screenshotPath.replace(screenshotFileName, '');
  const snapshotIdentifier = screenshotFileName.replace('.png', '');
  let snapshotsDir = screenshotDir.replace('screenshots', 'snapshots');

  if (options.customSnapshotsDir) {
    snapshotsDir = options.customSnapshotsDir + screenshotDir.split('screenshots')[1];
  }

  const snapshotKebabPath = path.join(snapshotsDir, `${snapshotIdentifier}${kebabSnap}`);
  const snapshotDotPath = path.join(snapshotsDir, `${snapshotIdentifier}${dotSnap}`);

  const diffDir = path.join(options.customSnapshotsDir ? screenshotDir : snapshotsDir, '__diff_output__');
  const diffDotPath = path.join(diffDir, `${snapshotIdentifier}${dotDiff}`);

  if (_fsExtra2.default.pathExistsSync(snapshotDotPath)) {
    _fsExtra2.default.copySync(snapshotDotPath, snapshotKebabPath);
  }

  snapshotResults = (0, _diffSnapshot.diffImageToSnapshot)(_extends({
    snapshotsDir,
    receivedImageBuffer,
    snapshotIdentifier,
    failureThreshold,
    failureThresholdType,
    updateSnapshot: updateSnapshots
  }, options));

  const { pass, added, updated, diffOutputPath } = snapshotResults;

  if (!pass && !added && !updated) {
    _fsExtra2.default.copySync(diffOutputPath, diffDotPath);
    _fsExtra2.default.removeSync(diffOutputPath);
    _fsExtra2.default.removeSync(snapshotKebabPath);

    if (options.customSnapshotsDir) {
      snapshotResults.diffOutputPath = diffDotPath;
      _fsExtra2.default.removeSync(path.dirname(diffOutputPath));
    }

    return {
      path: diffDotPath
    };
  }

  _fsExtra2.default.copySync(snapshotKebabPath, snapshotDotPath);
  _fsExtra2.default.removeSync(snapshotKebabPath);

  return {
    path: snapshotDotPath
  };
}

function addMatchImageSnapshotPlugin(on) {
  on('task', {
    'Matching image snapshot': matchImageSnapshotOptions,
    'Recording snapshot results': matchImageSnapshotResults
  });
  on('after:screenshot', matchImageSnapshotPlugin);
}