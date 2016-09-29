import _ from 'lodash';

exports.frontmatterString =
`---
title: Stubs Matter
---

What *great* **joy**.`;

exports.frontmatterJSON = {
  orig: exports.frontmatterString,
  data: {
    title: 'Stubs Matter'
  },
  content: '\nWhat *great* **joy**.'
};

exports.collectionMetadataKey = 'soMeta';

exports.collectionFiles = function() {
  return _.cloneDeep(
    [
      {
        id: 'Coffee',
        data: {
          some: 'data',
          [exports.collectionMetadataKey]: 'norman'
        },
        setPermalink: function(val) {
          this.permalink = val;
        },
        collections: {add: function(){}},
        collectionPages: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'All',
        data: {
          good: 'morning',
          [exports.collectionMetadataKey]: ['norman', 'rockwell']
        },
        setPermalink: function(val) {
          this.permalink = val;
        },
        collections: {add: function(){}},
        collectionPages: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'Bagels',
        data: {
          happy: 'wednesday',
          [exports.collectionMetadataKey]: null
        },
        setPermalink: function(val) {
          this.permalink = val;
        },
        collections: {add: function(){}},
        collectionPages: {add: function(){}},
        destination: './destination/path'
      }
    ]
  );
};

exports.configDefault = function() {
  return _.cloneDeep(
    {
      site: {
        title: 'Good Morning GitHub'
      },
      path: {
        source: './source/',
        destination: './destination/',
        plugins: './plugins/',
        themes: './themes/',
      }
    }
  );
};
