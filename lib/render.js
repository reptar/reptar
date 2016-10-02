import fs from 'fs-extra';
import Promise from 'bluebird';
import Plugin from './plugin';

/**
 * Wrapper for writing to the file system.
 * @param {(File|CollectionPage)} file File or CollectionPage object.
 * @param {string} content Content of file.
 * @param {string} encoding What encoding to use when writing file.
 * @return {Promise}
 */
export async function writeToDiskWithPlugins(file, content, encoding = 'utf8') {
  [file, content] = await Plugin.processEventHandlers(
    Plugin.Event.collection.beforeWrite,
    file, content
  );

  const result = await Promise.fromCallback(cb => {
    fs.outputFile(file.destination, content, encoding, cb);
  });

  await Plugin.processEventHandlers(
    Plugin.Event.collection.afterWrite,
    file, content
  );

  return result;
}

/**
 * Write a file to the file system. Calls all plugin events.
 * @param {(File|CollectionPage)} file File or CollectionPage object.
 * @param {string} template Which template template to use.
 * @param {Object} siteData Site wide template data.
 * @param {Plugin.Event} eventBefore Which event handler to process before
 *   rendering the file.
 * @param {Plugin.Event} eventAfter Which event handler to process after
 *   rendering the file.
 * @return {Promise}
 */
export async function renderFileWithPlugins(file, template, siteData,
  eventBefore, eventAfter) {

  if (eventBefore) {
    await Plugin.processEventHandlers(eventBefore, file);
  }

  let renderedFile = file.render(template, siteData);

  if (eventAfter) {
    [file, renderedFile] = await Plugin.processEventHandlers(
      eventAfter,
      file,
      renderedFile
    );
  }

  return [file, renderedFile];
}

/**
 * Combines renderFileWithPlugins and writeToDiskWithPlugins for conveinience.
 * @return {Promise}
 */
export async function renderAndWriteFileWithPlugins(...args) {
  const [file, renderedFile] = await renderFileWithPlugins(...args);
  return writeToDiskWithPlugins(
    file,
    renderedFile
  );
}
