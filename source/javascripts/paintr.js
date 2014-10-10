// Paint Model
var PaintModel = Backbone.Model.extend({
  defaults: {
    color: '#000',
    size: 5,
    tool: 'brush'
  }
});

var PaintHistoryModel = Backbone.Model.extend({
  canvas: null,
  defaults: {
    active: true,
    data: '',
    tool: '',
    version: 0
  }
});

var PaintHistory = Backbone.Collection.extend({
  maxVersions: 5,
  comparator: 'version',

  getVersion: function(version) {
    return this.findWhere({version: version});
  },

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

  setVersion: function(version) {
    version = parseInt(version, 10);
    this.each(function(model) {
      model.set({active: model.get('version') <= version}, {silent: true});
    });
    this.trigger('change:active');
  },

  undo: function() {

  },

  redo: function() {
    
  }
});


// Paint Canvas View
var PaintCanvasView = Backbone.View.extend({
  el: '#paint-canvas',

  initialize: function() {
    // Initialize history image data buffer:
    this.buffer = new Image();
    this.buffer.onload = _.bind(function() {
      var ctx = this.el.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, this.el.width, this.el.height);
      ctx.drawImage(this.buffer, 0, 0);
    }, this);

    // Listen for changes to the current tool:
    this.listenTo(this.model, 'change:tool', this.render);
    this.listenTo(this.collection, 'change:active', this.renderHistory);
    this.render();
  },

  render: function() {
    this.$el.css('cursor', 'url(images/cursor-'+this.model.get('tool')+'.png),auto');
  },

  renderHistory: function() {
    this.buffer.src = this.collection.getCurrentVersionData();
  },

  applyTool: function(x, y) {
    var ctx = this.el.getContext('2d');
    var d = this.model.toJSON();

    function rgbToHex(rgb) {
      return "#" + ("000000" + ((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]).toString(16)).slice(-6);
    }

    if (d.tool === 'sample') {
      var rgb = ctx.getImageData(x, y, 1, 1).data;
      this.model.set({color: rgbToHex(rgb)});
    } else {
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, 2 * Math.PI, false);
      ctx.globalCompositeOperation = (d.tool === 'erase') ? 'destination-out' : 'source-over';
      ctx.fillStyle = d.color;
      ctx.fill();
    }
  },

  events: {
    'mousedown': 'onPress'
  },

  onPress: function(evt) {
    var self = this;
    var tool = self.model.get('tool');
    var update = function(evt) {
      evt.preventDefault();
      self.applyTool(evt.offsetX, evt.offsetY);
    };

    var $doc = $(document)
      .on('mousemove.drag', update)
      .on('mouseup.drag', function(evt) {
        update(evt);
        $doc.off('mousemove.drag mouseup.drag');
        if (tool !== 'sample') self.collection.record(self.el.toDataURL(), tool);
      });

    update(evt);
  }
});


// Paint Editor View
var PaintEditView = Backbone.View.extend({
  el: '#paint-editor',

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.collection, 'add change:active', this.renderHistory);
    this.render();
  },

  render: function() {
    this.$('#paint-edit-color').val(this.model.get('color'));
    this.$('#paint-edit-size').val(this.model.get('size'));
    this.$('[name="tool"]').filter('[value="'+this.model.get('tool')+'"]').prop('checked', true);
  },

  renderHistory: function() {
    var html = this.collection.reduce(function(memo, model) {
      return memo += '<li class="'+ model.get('tool') + (model.get('active') ? ' active' : '')+'" data-version="'+ model.get('version') +'"><a href="#">'+ model.get('tool') +'</a></li>';
    }, '');
    
    this.$('#history').html(html);
  },

  events: {
    'change #paint-edit-color': 'onColor',
    'change #paint-edit-size': 'onSize',
    'change [name="tool"]': 'onTool',
    'click #history a': 'onHistory'
  },

  onColor: function(evt) {
    evt.preventDefault();
    this.model.set({color: this.$('#paint-edit-color').val()});
  },

  onSize: function(evt) {
    evt.preventDefault();
    this.model.set({size: this.$('#paint-edit-size').val()});
  },

  onTool: function(evt) {
    evt.preventDefault();
    this.model.set({tool: this.$('[name="tool"]:checked').val()});
  },

  onHistory: function(evt) {
    evt.preventDefault();
    var $li = this.$(evt.target).closest('li');
    this.collection.setVersion($li.data('version'));
  }
});

function PainerController(options) {
  this.model = options.model;
  this.collection = options.collection;

  $(document).on('keydown', _.bind(function(evt) {
    switch (evt.keyCode) {
      case 66: return this.model.set({tool: 'brush'}); // B
      case 69: return this.model.set({tool: 'erase'}); // E
      case 83: return this.model.set({tool: 'sample'}); // S
      case 89: if (evt.ctrlKey) return this.collection.redo(); // Ctrl+Y
      case 90: if (evt.ctrlKey) return this.collection.undo(); // Ctrl+Z
    }
  }, this));
}

// Instances
var paintModel = new PaintModel();
var paintHistory = new PaintHistory();
var paintCanvas = new PaintCanvasView({model: paintModel, collection: paintHistory});
var paintEditView = new PaintEditView({model: paintModel, collection: paintHistory});
var paintController = new PainerController({model: paintModel, collection: paintHistory});