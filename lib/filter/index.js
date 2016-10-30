import _ from 'lodash';
import metadata from './metadata';
import future_date from './future-date';

const filters = {
  metadata,
  future_date,
};

export default {
  /**
   * Whether a File is filtered by the applied filters.
   * @param {Object} appliedFilters Filters to apply to File.
   * @param {File} file File object.
   * @return {boolean} True if this file is filtered.
   */
  isFileFiltered(appliedFilters, file) {
    if (_.isEmpty(appliedFilters)) {
      return false;
    }

    return _.some(appliedFilters, (filterConfig, filterName) =>
      filters[filterName](file, filterConfig)
    );
  },
};
