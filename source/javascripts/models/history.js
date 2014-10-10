paintr.models.HistoryModel = Backbone.Model.extend({
  canvas: null,
  defaults: {
    active: true,
    data: '',
    tool: '',
    version: 0
  }
});

paintr.models.History = Backbone.Collection.extend({
  max: 5,
  comparator: 'version',

  expireOldVersions: function() {
    // Find all inactive versions:
    var expire = this.where({active: false});

    // Check if we'll still be at max count after removing inactive versions:
    // If so, grab the first (oldest) version record as an expiration.
    if (this.length - expire.length >= this.max) {
      expire.push(this.at(0));
    }

    // Silently remove all expirations:
    this.remove(expire);
    return expire[0];
  },

  getCurrentVersion: function() {
    var current = null;
    this.each(function(model) {
      if (model.get('active')) {
        if (!current || model.get('version') > current.get('version')) {
          current = model;
        }
      }
    });

    return current;
  },

  getCurrentVersionData: function() {
    var current = this.getCurrentVersion();
    return (current && current.get('data')) || '';
  },

  getCurrentVersionNumber: function() {
    var current = this.getCurrentVersion();
    return (current && current.get('version')) || 0;
  },

  record: function(data, tool) {
    this.expireOldVersions();
    this.add({
      active: true,
      data: data,
      tool: tool,
      version: this.getCurrentVersionNumber() + 1
    });
  },

  activate: function(version) {
    version = parseInt(version, 10);
    this.each(function(model) {
      model.set({active: model.get('version') <= version}, {silent: true});
    });
    this.trigger('change:active');
  }
});