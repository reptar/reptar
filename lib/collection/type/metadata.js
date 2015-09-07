import isUndefined from 'lodash/lang/isUndefined';
import reduce from 'lodash/collection/reduce';
import chunk from 'lodash/array/chunk';
import each from 'lodash/collection/each';

import CollectionBase from '../base';

/**
 * A collection that derives its content from a match in a files yaml
 * frontmatter data.
 */
export default class MetadataCollection extends CollectionBase {
  constructor(name, collectionConfig) {
    super(name, collectionConfig);

    /**
     * Object which holds a mapping of metadata value to the files that contain
     * the metadata property.
     * For example with metadata of 'tags' you'd have:
     * {
     * 	'tag-name': [file, file],
     * 	'other-tag': [file, file]
     * }
     * @type {Object.<string, Array.<File>>}
     */
    this.metadataFiles;
  }

  /**
   * Checks to see if this file passes all requirements to be considered a part
   * of this collection.
   * @param {File} file File object.
   * @return {boolean} true if the file meets all requirements.
   */
  _isFileInCollection(file) {
    return !isUndefined(file.data[this.metadata]) && !this.isFiltered(file);
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Array.<Files>} files Array of files.
   * @return {Collection}
   */
  populate(files) {
    // Initialize template data.
    this.data.metadata = {};

    // Store files that are in our collection.
    this.metadataFiles = reduce(files, (all, file) => {
      if (!this._isFileInCollection(file)) {
        return all;
      }

      let metadataValues = file.data[this.metadata];
      if (!Array.isArray(metadataValues)) {
        metadataValues = [metadataValues];
      }

      metadataValues.forEach(value => {
        all[value] = all[value] || [];

        all[value].push(file);

        // Add data to template accessible object.
        this.data.metadata[value] = this.data.metadata[value] || [];
        this.data.metadata[value].push(file.data);
      });

      return all;
    }, {});

    this._createCollectionPages();

    return this;
  }

  /**
   * Create CollectionPage objects for our Collection.
   * @return {boolean} True if we successfully created CollectionPages.
   * @private
   */
  _createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.pagination &&
          this.pagination.permalinkIndex && this.pagination.permalinkPage)) {
      return false;
    }

    if (this.metadataFiles) {
      // Create CollectionPage objects to represent our pagination pages.
      each(this.metadataFiles, (files, metadataKey) => {
        // Sort files.
        files = CollectionBase.sortFiles(files, this.sort);

        // Break up our array of files into arrays that match our defined
        // pagination size.
        let pages = chunk(files, this.pagination.size);

        pages.forEach((pageFiles, index) => {
          let collectionPage = this.createPage(index);

          collectionPage.setData({
            // Extra template information.
            metadata: metadataKey,

            // Files in the page.
            files: pageFiles,

            // How many pages in the collection.
            total_pages: pages.length,

            // Posts displayed per page
            per_page: this.pagination.size,

            // Total number of posts
            total: files.length
          });

          // Add to our array of pages.
          this.pages.push(collectionPage);
        });
      });
    }

    this._linkPages(
      // ShouldLinkPrevious
      (previous, collectionPage) => {
        // With metadata collections all pages aren't made in the same context.
        // i.e. for a tag metadata collection you'll have 3 pages with metadata
        // value of 'review', and 2 pages of value 'tutorial'. These different
        // metadata values should not be linked.
        return previous && this.metadataFiles &&
          previous.data.metadata === collectionPage.data.metadata;
      },
      // ShouldLinkNext
      (next, collectionPage) => {
        // With metadata collections all pages aren't made in the same context.
        // i.e. for a tag metadata collection you'll have 3 pages with metadata
        // value of 'review', and 2 pages of value 'tutorial'. These different
        // metadata values should not be linked.
        return next && this.metadataFiles &&
          next.data.metadata === collectionPage.data.metadata;
      }
    );

    return true;
  }
}
