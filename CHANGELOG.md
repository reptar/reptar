# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.3.3"></a>
## [2.3.3](https://github.com/reptar/reptar/compare/v2.3.2...v2.3.3) (2017-02-22)


### Bug Fixes

* **esdoc:** Fix esdoc generation. ([9229ebf](https://github.com/reptar/reptar/commit/9229ebf))
* Make serve work on Windows ([67019d9](https://github.com/reptar/reptar/commit/67019d9))



<a name="2.3.2"></a>
## [2.3.2](https://github.com/reptar/reptar/compare/v2.3.1...v2.3.2) (2017-02-19)


### Bug Fixes

* Make scripts work on Windows ([6c6fa1d](https://github.com/reptar/reptar/commit/6c6fa1d))



<a name="2.3.1"></a>
## [2.3.1](https://github.com/reptar/reptar/compare/v2.3.0...v2.3.1) (2016-12-15)


### Bug Fixes

* Disable deprecation warnings when running reptar for better output. ([426596f](https://github.com/reptar/reptar/commit/426596f))
* **watch:** Prevent reptar watch from crashing when rebuilding. ([60a72cf](https://github.com/reptar/reptar/commit/60a72cf)), closes [#62](https://github.com/reptar/reptar/issues/62)



<a name="2.3.0"></a>
# [2.3.0](https://github.com/reptar/reptar/compare/v2.2.0...v2.3.0) (2016-11-06)


### Bug Fixes

* **theme:** Safely access parsed _theme.yml file object. ([77c0e4e](https://github.com/reptar/reptar/commit/77c0e4e)), closes [#55](https://github.com/reptar/reptar/issues/55)


### Features

* **plugin:** Add Plugin.markdown.configure extension point. ([1638e12](https://github.com/reptar/reptar/commit/1638e12)), closes [#54](https://github.com/reptar/reptar/issues/54)



<a name="2.2.0"></a>
# [2.2.0](https://github.com/reptar/reptar/compare/v2.1.0...v2.2.0) (2016-10-29)


### Bug Fixes

* **eslint:** Ignore esdocs folder ([df9cbfd](https://github.com/reptar/reptar/commit/df9cbfd))
* **metadata:** Slugify all metadata values when creating collections. ([1eb51a4](https://github.com/reptar/reptar/commit/1eb51a4))


### Features

* Generate documentation with esdocs. ([7ca3371](https://github.com/reptar/reptar/commit/7ca3371)), closes [#20](https://github.com/reptar/reptar/issues/20)
* **log:** Always log out warn level messages by default. ([b67f170](https://github.com/reptar/reptar/commit/b67f170))
* **template:** Better error message when templates are missing. ([468147e](https://github.com/reptar/reptar/commit/468147e)), closes [#49](https://github.com/reptar/reptar/issues/49)
* Warn when there are two duplicate destination paths being used. ([a33ae95](https://github.com/reptar/reptar/commit/a33ae95)), closes [#53](https://github.com/reptar/reptar/issues/53)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/reptar/reptar/compare/v2.0.0...v2.1.0) (2016-10-21)


### Bug Fixes

* Better handling when we encounter errors building site. ([bddb664](https://github.com/reptar/reptar/commit/bddb664))


### Features

* **cli:** Add ability to pass --clean to reptar build. ([687c965](https://github.com/reptar/reptar/commit/687c965))
* **markdown:** Add prism as an option for highlighting markdown. ([71ac5ea](https://github.com/reptar/reptar/commit/71ac5ea))
* **template:** Add new built-in filter 'groupbydate'. ([ef49ce7](https://github.com/reptar/reptar/commit/ef49ce7))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/reptar/reptar/compare/v1.4.0...v2.0.0) (2016-10-19)


### Bug Fixes

* More robust path handling for data files. ([2a08f4b](https://github.com/reptar/reptar/commit/2a08f4b))
* **cache:** Put all cache .json files in a .reptar-cache folder. ([87c6b28](https://github.com/reptar/reptar/commit/87c6b28))
* **coverage, tests:** Fix babel-plugin-isparta from breaking e2e tests. ([b3d0e4a](https://github.com/reptar/reptar/commit/b3d0e4a))
* **file:** When File is filtered do not write its content to disk. ([7215ada](https://github.com/reptar/reptar/commit/7215ada)), closes [#39](https://github.com/reptar/reptar/issues/39)
* **plugin:** Remove collection events. ([5538dc0](https://github.com/reptar/reptar/commit/5538dc0))
* **sort:** Fix sorting Files by key and when key is a date. ([2589c8c](https://github.com/reptar/reptar/commit/2589c8c))
* **test:** Fix e2e tests fixtures. ([46976cb](https://github.com/reptar/reptar/commit/46976cb))
* **theme:** Add try/catch for theme to fix e2e tests. ([352e18b](https://github.com/reptar/reptar/commit/352e18b))


### Code Refactoring

* Simplify external API. ([001d350](https://github.com/reptar/reptar/commit/001d350))
* **collection:** Change schema for configuring Collections. ([bfb189c](https://github.com/reptar/reptar/commit/bfb189c))
* **config:** Remove unused 'quiet' property. ([74cb0c0](https://github.com/reptar/reptar/commit/74cb0c0))


### Features

* **config:** Implement Config validation ([88290fa](https://github.com/reptar/reptar/commit/88290fa)), closes [#10](https://github.com/reptar/reptar/issues/10)
* Use spinners in console for better feedback. ([48eb97b](https://github.com/reptar/reptar/commit/48eb97b)), closes [#30](https://github.com/reptar/reptar/issues/30)
* **data:** Support data files of .yaml or .json. ([7941441](https://github.com/reptar/reptar/commit/7941441)), closes [#32](https://github.com/reptar/reptar/issues/32)
* **file:** Add support for setting default values on File via config. ([7389309](https://github.com/reptar/reptar/commit/7389309)), closes [#42](https://github.com/reptar/reptar/issues/42)
* **file:** Read all files in source directory, irrespective of type. ([e0ec30a](https://github.com/reptar/reptar/commit/e0ec30a))
* **markdown:** Use markdown-it library to parse markdown. ([9bdbf77](https://github.com/reptar/reptar/commit/9bdbf77)), closes [#34](https://github.com/reptar/reptar/issues/34)
* **serve:** Just use Hapi as our web server. ([b238130](https://github.com/reptar/reptar/commit/b238130))
* **serve:** Use server.baseurl when setting up server path. ([7baed08](https://github.com/reptar/reptar/commit/7baed08))
* **template:** Allow custom date formats. ([6067af3](https://github.com/reptar/reptar/commit/6067af3))
* **watch:** Use web server to implement more durable watch mode. ([492a773](https://github.com/reptar/reptar/commit/492a773)), closes [#43](https://github.com/reptar/reptar/issues/43)


### Performance Improvements

* **file:** Improve time it takes to check if File has frontmatter. ([3e5ea36](https://github.com/reptar/reptar/commit/3e5ea36))


### BREAKING CHANGES

* config: You must remove the 'quiet' property from your
_config.yml. It's no longer supported.
* collection: This creates a more intuitive config schema when
configuring a Collection. It is only a re-structuring of existing
properties.
* markdown: This changes the library used to parse markdown to
markdown-it. This also changes the _config.yml structure when defining
how the markdown parser can be customized.
* file: This moves filter configurations from Collections to
File. This is required as we need to know if a File should be written
to disk, and Collections delegate their behavior depending on how the
File is configured. This is an easy transition, mostly moving the filter configuration
from the Collection to File under the `filters` key.
* plugin: Due to internal re-organizations there are no more
collection before/after write events.
* This changes the external API and makes it simpler.
Now there's only new Yarn(), yarn.update() and yarn.build(). That's
all that's needed to build your Yarn site.
* file: We've removed a StaticCollection. You no longer need
to specify every static file you have in your source directory, Yarn
will now check every file in your source directory and check if it has
frontmatter to decide whether it should process and copy the file,
or just copy the file. This lets you put any file in your source directory and have it be
automatically seen by Yarn and copied over.
* file: This now changes where a File gets its template and
permalink values from. Before a File inherited those values from
the Collection in which it belonged. Now it's set directly on the File,
either via its own frontmatter or from the defaults in the config.
