import _ from 'lodash';

exports.frontmatterString =
`---
title: Stubs Matter
draft: true
date: '2016-10-11'
future_date: 2020-2-29
---

What *great* **joy**.`;

exports.frontmatterJSON = {
  orig: exports.frontmatterString,
  data: {
    title: 'Stubs Matter',
    draft: true,
    date: '2016-10-11',
    future_date: '2020-2-29',
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
        collections: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'All',
        data: {
          good: 'morning',
          [exports.collectionMetadataKey]: ['norman', 'rockwell']
        },
        collections: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'Bagels',
        data: {
          happy: 'wednesday',
          [exports.collectionMetadataKey]: null
        },
        collections: {add: function(){}},
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
