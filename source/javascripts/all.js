//= require "vendor/jquery"
//= require "vendor/underscore"
//= require "vendor/backbone"
//= require "models/app"
//= require "models/history"
//= require "views/canvas"
//= require "views/editor"

function PaintrController(options) {
  this.model = options.model;
  this.collection = options.collection;

  $(document).on('keydown', _.bind(function(evt) {
    switch (evt.keyCode) {
      case 66: return this.model.set({tool: 'brush'}); // B
      case 69: return this.model.set({tool: 'erase'}); // E
      case 83: return this.model.set({tool: 'sample'}); // S
      case 187: return this.model.brushSize(1); // +
      case 189: return this.model.brushSize(-1); // -
      case 89: if (evt.ctrlKey) return this.collection.redo(); // Ctrl+Y
      case 90: if (evt.ctrlKey) return this.collection.undo(); // Ctrl+Z
    }
  }, this));
}
 
// Instances
var paintModel = new PaintrAppModel();
var paintHistory = new PaintrHistory();
var paintCanvasView = new PaintrCanvasView({model: paintModel, collection: paintHistory});
var paintEditorView = new PaintrEditorView({model: paintModel, collection: paintHistory});
var paintController = new PaintrController({model: paintModel, collection: paintHistory});