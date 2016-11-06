import Plugin from './plugin';

/**
 * Write a file to the file system. Calls all plugin events.
 * @param {(File|CollectionPage)} file File or CollectionPage object.
 * @param {Object} siteData Site wide template data.
 * @param {PluginEvents} eventBefore Which event handler to process before
 *   rendering the file.
 * @param {PluginEvents} eventAfter Which event handler to process after
 *   rendering the file.
 * @return {Promise}
 */
// eslint-disable-next-line import/prefer-default-export
export async function renderFileWithPlugins(file, siteData,
  eventBefore, eventAfter) {
  if (eventBefore) {
    await Plugin.eventHandler.processEventHandlers(eventBefore, file);
  }

  let renderedFile = file.render(siteData);

  if (eventAfter) {
    // eslint-disable-next-line no-param-reassign
    [file, renderedFile] = await Plugin.eventHandler.processEventHandlers(
      eventAfter,
      file,
      renderedFile
    );
  }

  return [file, renderedFile];
}
