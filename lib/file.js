import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { createChecksum } from './checksum';
import log from './log';
import Url from './url';
import Parse from './parse';
import Plugin from './plugin';
import cache from './cache';
import {
  renderMarkdown,
} from './markdown';
import {
  renderTemplate,
  renderTemplateString,
  TemplateErrorMessage,
} from './template';
import {
  renderAndWriteFileWithPlugins,
} from './render';

export default class File {
  constructor(filePath = '', getConfig = () => {}) {
    /**
     * Absolute path to file location.
     * @type {string}
     */
    this.path = filePath;

    /**
     * Unique ID for this file. Right now an alias for the file's path.
     * @type {string}
     */
    this.id = this.path;

    /**
     * Frontmatter for this file. Can be undefined if a file has no frontmatter.
     * @type {object?}
     */
    this.frontmatter;

    /**
     * Permalink for this file.
     * @type {string}
     */
    this.permalink;

    /**
     * Template accessible data.
     * @type {Object.<string, Object>}
     */
    this.data = Object.create(null);

    /**
     * An array of Collections that this file belongs to.
     * @type {Set.<string>}
     */
    this.collections = new Set();

    /**
     * Get the global config object.
     * @type {Function}
     * @private
     */
    this._getConfig = getConfig;

    this.update();
  }

  /**
   * Update's File's data from the file system.
   */
  update() {
    /**
     * Raw contents of file, directly from file system.
     * @type {string} One long string.
     */
    const rawContent = fs.readFileSync(this.path, 'utf8');

    /**
     * Checksum hash of rawContent, for use in seeing if file is different.
     * @example:
     * 	'50de70409f11f87b430f248daaa94d67'
     * @type {string}
     */
    this.checksum = createChecksum(rawContent);

    // Parse file's frontmatter.
    const {
      data: frontmatter,
      // The file's text content.
      content,
    } = Parse.fromFrontMatter(rawContent);

    this.frontmatter = frontmatter;

    this.defaults = this._gatherDefaults();

    // Create new data object.
    this.data = Object.create(null);

    // Merge in new data that's accessible from template.
    _.merge(this.data, this.defaults, this.frontmatter, {
      // The content of the Page.
      content: content
    });

    this.permalink = this.data.permalink;

    this._calculateDestination();
  }

  /**
   * Gather default values that should be applied to this file.
   * @return {Object} Default values applied to this file.
   */
  _gatherDefaults() {
    // Defaults are sorted from least to most specific, so we iterate over them
    // in the reverse order to allow most specific first chance to apply their
    // values.
    return _.reduceRight(
      this._getConfig().get('file.defaults'),
      (acc, defaultObj) => {
        const { scope: { path, metadata }, values } = defaultObj;

        // If default path property is defined does it exist within this file's
        // path.
        const pathMatches = path != null ?
          this.path.includes(path) :
          true;

        // If metadata is set the does it match the file's metadata.
        const metadataMatches = _.isObject(metadata) ?
          _.isMatch(this.frontmatter, metadata) :
          true;

        // If we have a match then apply the values.
        if (pathMatches && metadataMatches) {
          return _.defaults(acc, values);
        }

        return acc;
      },
      {}
    );
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    let destinationUrl;

    /**
     * If the file itself wants to customize what its URL is then it will use
     * the `config.file.url_key` value of the File's frontmatter as the basis
     * for which the URL of this file should be.
     * So if you have a File with a frontmatter that has `url: /pandas/` then
     * the File's URL will be `/pandas/`.
     * @type {string?} url Relative path to file.
     */
    const url = this.frontmatter[this._getConfig().get('file.url_key')];

    if (url) {
      // If the individual File defined its own unique URL that gets first
      // dibs at setting the official URL for this file.
      destinationUrl = url;
    } else if (this.permalink) {
      // If the file has no URL but has a permalink set on it then use it to
      // find the URL of the File.
      destinationUrl = Url.interpolatePermalink(
        this.permalink,
        this.data
      );
    } else {
      // Path to file relative to root of project.
      const pathRelative = this.path.replace(
        this._getConfig().get('path.source'),
        ''
      );

      // If the file has no URL set and no permalink then use its relative file
      // path as its url.
      destinationUrl = Url.replaceMarkdownExtension(
        pathRelative,
        this._getConfig().get('markdown_extension')
      );
    }

    const fileSystemSafeDestination = Url.makeUrlFileSystemSafe(destinationUrl);

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = path.join(
      this._getConfig().get('path.destination'),
      fileSystemSafeDestination
    );

    this.data.url = Url.makePretty(fileSystemSafeDestination);
  }

  render(template, globalData) {
    template = _.isUndefined(this.data.template) ?
      template :
      this.data.template;
    let result = this.data.content;

    const templateData = {
      ...globalData,
      file: this.data
    };

    try {
      // Set result of content to result content.
      result = renderTemplateString(
        this.data.content,
        templateData
      );

      // Set result to file's contents.
      this.data.content = result;
    } catch (e) {
      log.error(e.message);
      throw new Error(`File: Could not render file's contents.\n` +
        `File: ${JSON.stringify(this)}`);
    }

    // Convert to HTML.
    // However if the File's frontmatter sets markdown value to false then
    // skip the markdown conversion.
    if (this.data.markdown !== false) {
      result = renderMarkdown(this.data.content);
      this.data.content = result;
    }

    if (
      !_.isNil(template) &&
      !(_.isString(template) && template.length === 0)
    ) {
      try {
        result = renderTemplate(template, templateData);
      } catch (e) {
        if (e.message.includes(TemplateErrorMessage.NO_TEMPLATE)) {
          throw new Error(`File: Template '${template}' not found.\n` +
            `File: ${JSON.stringify(this)}`);
        } else {
          throw e;
        }
      }
    }

    return result;
  }

  /**
   * Writes a given File object to the file system.
   * @param {Object} siteData Site wide data.
   * @return {Promise} Promise.
   */
  write(siteData) {
    if (this._getConfig().get('incremental') &&
        cache.get(this.path) === this.checksum) {
      return Promise.resolve();
    }

    return renderAndWriteFileWithPlugins(
      this,
      this.data.template,
      siteData,
      Plugin.Event.file.beforeRender,
      Plugin.Event.file.afterRender
    ).then(result => {
      // Save checksum to cache for incremental builds.
      cache.put(this.path, this.checksum);

      return result;
    });
  }

}
