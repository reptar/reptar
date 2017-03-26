'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _some2 = require('lodash/some');

var _some3 = _interopRequireDefault(_some2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _metadata = require('./metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _futureDate = require('./future-date');

var _futureDate2 = _interopRequireDefault(_futureDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const filters = {
  metadata: _metadata2.default,
  futureDate: _futureDate2.default
};

exports.default = {
  /**
   * Whether a File is filtered by the applied filters.
   * @param {Object} appliedFilters Filters to apply to File.
   * @param {File} file File object.
   * @return {boolean} True if this file is filtered.
   */
  isFileFiltered(appliedFilters, file) {
    if ((0, _isEmpty3.default)(appliedFilters)) {
      return false;
    }

    return (0, _some3.default)(appliedFilters, (filterConfig, filterName) => filters[filterName](file, filterConfig));
  }
};