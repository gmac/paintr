var PaintrCanvasView = Backbone.View.extend({
  el: '#paintr-canvas',

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