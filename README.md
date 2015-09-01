# yarn

[![NPM version](https://badge.fury.io/js/yarnjs.svg)](http://badge.fury.io/js/yarnjs)

spin your own yarn

a static site generator.

## status

still WIP. check out #todo section to see progress.

## install

`npm install -g yarnjs`

`yarn`

## todo

- [x] custom permalink structure
- [x] pagination support, with customizable size
- [x] tag page support
- [x] template renderer of all types/collections
  - [x] support custom tags/filters in nunjucks
  - [x] add highlight.js to template renderer for code highlighting
- [x] allow any values in `site` key in yaml file to be injected into every page under the `site` property
- [x] asset management
  - [x] less/sass -> -> autoprefixr -> css
  - [x] js -> uglify
  - [x] support for es6 in js via babel
  - [x] concatenate all assets
  - [x] html minifier
  - [x] hash file contents to allow for unique built file  
- [x] option `clean` that allows deleting destination folder before building
- [x] rss feed support
- [x] break up Collection.js to support multiple type of collections (FileSystemCollection, MetadataCollection, StaticCollection)
- [ ] move to toml instead of yaml
- [ ] refactor utils/ folder to not be a dumping ground. e.g. template.js + markdown.js to FileRenderer.js
- [ ] switch to ES6 modules
- [x] plugin support
  - [x] support auto excerpts of posts for use in index pages
  - [ ] first plugin is the `json/posts.json` file used in hswolff.com
  - [ ] word count plugin to allow for estimating time to read a page
  - [ ] allow for the creation of external asset processors
- [ ] add ability to filter what posts are shown in a collection
  - [ ] configure if drafts should be rendered
  - [ ] configure if future posts should be rendered
- [ ] support caching of files, only re-writing files that were changed
- [ ] cli
  - [ ] scaffold new blog
  - [ ] new post
  - [ ] build blog
  - [ ] serve mode
  - [ ] watch mode
    - [ ] support progressive updates
- [ ] create default theme
- [ ] web interface / dashboard (https://github.com/Level/levelup ?)


# Debug

write to file:
```
require('./utils/log').info(this.data)
```
