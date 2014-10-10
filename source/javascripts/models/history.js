var PaintrHistoryModel = Backbone.Model.extend({
  defaults: {
    active: true,
    data: '',
    tool: '',
    version: 0
  }
});

var PaintrHistory = Backbone.Collection.extend({
  model: PaintrHistoryModel,
  comparator: 'version',
  maxVersions: 5,
  
  getCurrentVersion: function() {
    var version = 0;
    var current = null;
    this.each(function(model) {
      if (model.get('active') && model.get('version') >= version) {
        version = model.get('version');
        current = model;
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
    // Find all inactive versions:
    var expire = this.where({active: false});

    // Check if we'll still be at max count after removing inactive versions:
    // If so, grab the first (oldest) version record as an expiration.
    if (this.length - expire.length >= this.maxVersions) {
      expire.push(this.at(0));
    }

    // Remove all expirations:
    this.remove(expire);

    // Add new version history:
    this.add({
      active: true,
      data: data,
      tool: tool,
      version: this.getCurrentVersionNumber() + 1
    });
  },

  getVersion: function(version) {
    return this.findWhere({version: version});
  },

  setVersion: function(version) {
    version = parseInt(version, 10);

    if (this.getVersion(version)) {
      this.each(function(model) {
        model.set({active: model.get('version') <= version}, {silent: true});
      });
      this.trigger('change:active');
    }
  },

  undo: function() {
    this.setVersion(this.getCurrentVersionNumber() - 1);
  },

  redo: function() {
    this.setVersion(this.getCurrentVersionNumber() + 1);
  }
});