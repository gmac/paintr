var paintr = {
  models: {},
  views: {},
  controllers: {},

  init: function() {
    var paintModel = new PaintModel();
    var paintHistory = new PaintHistory();
    var paintCanvas = new PaintCanvasView({model: paintModel, collection: paintHistory});
    var paintEditView = new PaintEditView({model: paintModel, collection: paintHistory});
    var paintController = new PainerController({model: paintModel, collection: paintHistory});
  }
};

function PainerController(options) {
  this.model = options.model;

  $(document).on('keydown', _.bind(function(evt) {
    switch(evt.keyCode) {
      case 66: return this.model.set({tool: 'brush'});
      case 69: return this.model.set({tool: 'erase'});
      case 83: return this.model.set({tool: 'sample'});
    }
  }, this));
}