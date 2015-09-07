import cloneDeep from 'lodash/lang/cloneDeep';

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
  return cloneDeep(
    [
      {
        id: 'Coffee',
        data: {
          some: 'data',
          [exports.collectionMetadataKey]: 'norman'
        },
        collectionIds: {add: function(){}},
        pageIds: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'All',
        data: {
          good: 'morning',
          [exports.collectionMetadataKey]: ['norman', 'rockwell']
        },
        collectionIds: {add: function(){}},
        pageIds: {add: function(){}},
        destination: './destination/path'
      },
      {
        id: 'Bagels',
        data: {
          happy: 'wednesday',
          [exports.collectionMetadataKey]: null
        },
        collectionIds: {add: function(){}},
        pageIds: {add: function(){}},
        destination: './destination/path'
      }
    ]
  );
};

exports.configDefault = function() {
  return cloneDeep(
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
