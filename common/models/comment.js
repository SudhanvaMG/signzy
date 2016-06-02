var loopback = require('loopback');

module.exports = function(Comment) {

  Comment.disableRemoteMethod('deleteById', true);

  Comment.remoteMethod(
    'like',
    {
      http: {path: '/:id/like', verb: 'post'},
      accepts: {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
      returns: {root: true, type: 'object'},
      description: 'Marks a comment as liked.'
    }
  );

  Comment.beforeRemote('like', function(ctx, user, next) {
    Comment.findById(ctx.req.params.id, function(err, record){
      if (record.authorId === ctx.req.accessToken.userId) {
        var err = new Error("User cannot like their own comment.");
        err.status = 403;
        next(err);
      } else if (record.likes.indexOf(ctx.req.accessToken.userId) != -1) {
        var err = new Error("User has already liked the comment.");
        err.status = 403;
        next(err);
      } else {
        next();
      }
    })
  });

  Comment.like = function(id, cb) {
    var ctx = loopback.getCurrentContext();
    Comment.findById(id, function(err, record){
      record.likes.push(ctx.active.accessToken.userId);
      record.updateAttributes({likes: record.likes}, function(err, instance) {
        if (err) cb(err);
        if (!err) cb(null, instance);
      })
    })
  };

  
  Comment.observe('before save', function filterProperties(ctx, next) {
    if (ctx.instance) {
      if (ctx.instance.postedDate === undefined) {
        ctx.instance.postedDate = new Date();
      }
      if (ctx.instance.likes === undefined) ctx.instance.likes = [];
      if (ctx.instance.dislikes === undefined) ctx.instance.dislikes = [];
    }
    next();
  });

};