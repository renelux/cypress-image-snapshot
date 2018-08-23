'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Copyright (c) 2018-present The Palmer Group
                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                   * This source code is licensed under the MIT license found in the
                                                                                                                                                                                                                                                                   * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                   */

exports.matchImageSnapshotCommand = matchImageSnapshotCommand;
exports.addMatchImageSnapshotCommand = addMatchImageSnapshotCommand;

var _constants = require('./constants');

const updateSnapshots = Cypress.env('updateSnapshots') || false;

function matchImageSnapshotCommand(defaultOptions) {
  return function matchImageSnapshot(subject, maybeName, commandOptions) {
    const options = _extends({}, defaultOptions, (typeof maybeName === 'string' ? commandOptions : maybeName) || {});

    cy.task(_constants.MATCH, {
      updateSnapshots,
      options
    });

    const name = typeof maybeName === 'string' ? maybeName : undefined;
    const target = subject ? cy.wrap(subject) : cy;
    target.screenshot(name, options);

    return cy.task(_constants.RECORD).then(({
      pass,
      added,
      updated,
      diffRatio,
      diffPixelCount,
      diffOutputPath
    }) => {
      if (!pass && !added && !updated) {
        const differencePercentage = diffRatio * 100;
        throw new Error(`Screenshot was ${differencePercentage}% different from saved snapshot with ${diffPixelCount} different pixels.\n  See diff for details: ${diffOutputPath}`);
      }
    });
  };
}

function addMatchImageSnapshotCommand(maybeName = 'matchImageSnapshot', maybeOptions) {
  const options = typeof maybeName === 'string' ? maybeOptions : maybeName;
  const name = typeof maybeName === 'string' ? maybeName : 'matchImageSnapshot';
  Cypress.Commands.add(name, {
    prevSubject: ['optional', 'element', 'window', 'document']
  }, matchImageSnapshotCommand(options));
}