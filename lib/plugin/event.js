
const Events = {
  file: {
    beforeRender: 'file:beforeRender',
    afterRender: 'file:afterRender'
  },

  page: {
    beforeRender: 'page:beforeRender',
    afterRender: 'page:afterRender'
  },

  collection: {
    beforeWrite: 'collection:beforeWrite',
    afterWrite: 'collection:afterWrite'
  }
};

module.exports = Events;
