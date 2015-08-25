
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
