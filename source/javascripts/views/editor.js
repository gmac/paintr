paintr.views.EditorView = Backbone.View.extend({
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
    this.collection.activate($li.data('version'));
  }
});