
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

exports.collectionFiles = [
  {
    id: 'Coffee',
    data: {
      some: 'data',
      [exports.collectionMetadataKey]: 'norman'
    }
  },
  {
    id: 'All',
    data: {
      good: 'morning',
      [exports.collectionMetadataKey]: ['norman', 'rockwell']
    }
  },
  {
    id: 'Bagels',
    data: {
      happy: 'wednesday',
      [exports.collectionMetadataKey]: null
    }
  }
];
