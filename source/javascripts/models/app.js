var PaintrAppModel = Backbone.Model.extend({
  defaults: {
    color: '#000',
    size: 5,
    tool: 'brush'
  },

  brushSize: function(bump) {
    this.set({size: this.get('size') + bump});
  }
});