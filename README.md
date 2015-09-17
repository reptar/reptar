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
- [x] refactor utils/ folder to not be a dumping ground. e.g. template.js + markdown.js to FileRenderer.js
- [x] switch to ES6 modules
- [x] plugin support
  - [x] support auto excerpts of posts for use in index pages
  - [ ] first plugin is the `json/posts.json` file used in hswolff.com
  - [ ] word count plugin to allow for estimating time to read a page
  - [ ] allow for the creation of external asset processors
- [x] add ability to filter what posts are shown in a collection
  - [x] configure if drafts should be rendered
  - [x] configure if future posts should be rendered
- [ ] cli
  - [ ] scaffold new blog
  - [ ] new post
  - [x] build blog
  - [x] serve mode
  - [ ] watch mode (progressive updates)
    - [x] handle when a file changes
    - [x] handle when a new file is added
    - [x] handle when a file is removed
    - [ ] handle when theme file changes/added/removed
  - [ ] other? [inspiration from hugo](http://gohugo.io/commands/)
- [ ] add config.yaml validation so people are warned early if their config is wrong
- [ ] create default theme
- [ ] Documentation.
- [ ] support caching of files, only re-writing files that were changed
- [ ] web interface / dashboard (https://github.com/Level/levelup ?)
- [ ] [move to toml instead of yaml...maybe - which looks best?](https://gist.github.com/hswolff/86d92f44e385b302716f)
- [ ] [switch to npm module for slugifying titles?](https://github.com/dodo/node-slug)


# Debug

write to file:
```
require('./utils/log').info(this.data)
```
