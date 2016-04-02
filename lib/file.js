import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import isUndefined from 'lodash/isUndefined';
import merge from 'lodash/merge';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
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
     * An array of CollectionPages that this file belongs to.
     * @type {Set.<string>}
     */
    this.collectionPages = new Set();

    /**
     * Get the global config object.
     * @type {Function}
     * @private
     */
    this._getConfig = getConfig;

    this.updateDataFromFileSystem();
  }

  updateDataFromFileSystem() {
    /**
     * Raw contents of file, directly from file system.
     * @TODO: perhaps don't keep reference to this?
     * @type {string} One long string.
     */
    this.rawContent = fs.readFileSync(this.path, 'utf8');

    /**
     * Checksum hash of rawContent, for use in seeing if file is different.
     * @example:
     * 	'50de70409f11f87b430f248daaa94d67'
     * @type {string}
     */
    this.checksum = crypto.createHash('md5')
      .update(this.rawContent, 'utf8').digest('hex');

    // Parse file's frontmatter.
    let parsedFile = Parse.fromFrontMatter(this.rawContent);

    /**
     * Just the file's text content.
     * @type {string}
     */
    let content = parsedFile.content;

    /**
     * If the file itself wants to customize what its URL is then it will use
     * the `config.file.url_key` value of the File's frontmatter as the basis
     * for which the URL of this file should be.
     * So if you have a File with a frontmatter that has `url: /pandas/` then
     * the File's URL will be `/pandas/`.
     * @type {string?} url Relative path to file.
     */
    this.url = parsedFile.data[this._getConfig().get('file.url_key')];

    // Merge in new data that's accessible from template.
    merge(this.data, parsedFile.data, {
      // The content of the Page.
      content: content
    });

    this._calculateDestination();
  }

  /**
   * Path to file relative to root of project.
   * @type {string}
   */
  get pathRelative() {
    return this.path.replace(this._getConfig().get('path.source'), '');
  }

  /**
   * Set new permalink configuration this file should use.
   * @param {string} newPermalink New permalink.
   */
  setPermalink(newPermalink) {
    this.permalink = newPermalink;
    this._calculateDestination();
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    let destinationUrl;
    if (this.url) {
      // If the individual File defined its own unique URL that gets first
      // dibs at setting the official URL for this file.
      destinationUrl = this.url;
    } else if (this.permalink) {
      // If the file has no URL but has a permalink set on it then use it to
      // find the URL of the File.
      destinationUrl = Url.interpolatePermalink(
        this.permalink,
        this.data
      );
    } else {
      // If the file has no URL set and no permalink then use its relative file
      // path as its url.
      destinationUrl = this.pathRelative;

      const markdownExtensions = this._getConfig().get('markdown_extension');

      // Get file extension of file. i.e. 'post.md' would give 'md'.
      let fileExtension = path.extname(destinationUrl).replace(/^\./, '');
      let index = markdownExtensions.indexOf(fileExtension);

      // Is this file's extension one of our known markdown extensions?
      if (index > -1) {
        let foundExtension = markdownExtensions[index];
        destinationUrl = destinationUrl.replace(
          new RegExp(`.${foundExtension}$`),
          '.html'
        );
      }
    }

    let fileSystemSafeDestination = Url.makeUrlFileSystemSafe(destinationUrl);

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
    template = isUndefined(this.data.template) ? template : this.data.template;
    let result = this.data.content;

    let templateData = {
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
    // Howeve if the File's frontmatter sets markdown value to false then
    // skip the markdown conversion.
    if (this.data.markdown !== false) {
      result = renderMarkdown(this.data.content);
      this.data.content = result;
    }

    if (!isNil(template) && !(isString(template) && template.length === 0)) {
      try {
        result = renderTemplate(template, templateData);
      } catch (e) {
        if (e.message.includes(TemplateErrorMessage.NO_TEMPLATE)) {
          throw new Error(`File: Template '${template}' not found.\n` +
            `File: ${JSON.stringify(this)}`);
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

    let promises = [];

    for (let collection of this.collections) {
      if (isUndefined(collection.template) && !collection.metadataFiles) {
        log.error('No template found when trying to write file in Collection ' +
          `${collection.id} for ${this.id}`);
        return;
      }

      let promise = renderAndWriteFileWithPlugins(
        this,
        collection.template,
        siteData,
        Plugin.Event.file.beforeRender,
        Plugin.Event.file.afterRender
      );

      promises.push(promise);
    }

    return Promise.all(promises).then(result => {
      // Save checksum to cache for incremental builds.
      cache.put(this.path, this.checksum);

      return result;
    });
  }

}
