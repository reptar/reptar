# yarn

the blogging platform that makes you go *wheeeeeeeeeee*

## todo

- [x] custom permalink structure
- [x] pagination support, with customizable size
- [x] tag page support
- [x] template renderer of all types/collections
  - [ ] support custom tags/filters in nunjucks
  - [x] add highlight.js to template renderer for code highlighting
- [x] allow any values in `site` key in yaml file to be injected into every page under the `site` property
- [ ] asset management
  - [ ] less/sass -> -> autoprefixr -> css
  - [ ] js -> uglify
  - [ ] support for es6 in js via babel
  - [ ] concatenate all assets
  - [ ] html minifier
  - [ ] hash file contents to allow for unique built file  
- [x] option `clean` that allows deleting destination folder before building
- [ ] support auto excerpts of posts for use in index pages
- [ ] word count plugin to allow for estimating time to read a page
- [x] rss feed support
- [ ] plugin support
  - [ ] first plugin is the `json/posts.json` file used in hswolff.com
- [ ] cli
  - [ ] scaffold new blog
  - [ ] new post
  - [ ] build blog
  - [ ] serve mode
  - [ ] watch mode

http://validatejs.org/
https://github.com/Level/levelup