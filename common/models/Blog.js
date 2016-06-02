var loopback = require('loopback');
var slugify = require('slugify');

module.exports = function(Blog) {

  Blog.remoteMethod(
    'publish',
    {
      http: {path: '/:id/publish', verb: 'put'},
      accepts: {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
      returns: {root: true, type: 'object'},
      description: 'Marks a Blog as published.'
    }
  );

  Blog.publish = function(id, cb) {
    Blog.findById(id, function(err, record){
      record.updateAttributes({isPublished: true, publishedDate: new Date()}, function(err, instance) {
        if (err) cb(err);
        if (!err) cb(null, instance);
      })
    })
  };
  

  Blog.remoteMethod(
    'upvote',
    {
      http: {path: '/:id/upvote', verb: 'post'},
      accepts: {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
      returns: {root: true, type: 'object'},
      description: 'Marks a Blog as upvoted.'
    }
  );

  Blog.beforeRemote('upvote', function(ctx, user, next) {
    Blog.findById(ctx.req.params.id, function(err, record){
      if (record.authorId === ctx.req.accessToken.userId) {
        var err = new Error("User cannot upvote their own Blog post.");
        err.status = 403;
        next(err);
      } else if (record.upvotes.indexOf(ctx.req.accessToken.userId) != -1) {
        var err = new Error("User has already upvoted the Blog.");
        err.status = 403;
        next(err);
      } else {
        next();
      }
    })
  });

  Blog.upvote = function(id, cb) {
    var ctx = loopback.getCurrentContext();
    Blog.findById(id, function(err, record){
      record.upvotes.push(ctx.active.accessToken.userId);
      record.updateAttributes({upvotes: record.upvotes}, function(err, instance) {
        if (err) cb(err);
        if (!err) cb(null, instance);
      })
    })
  };
  

  Blog.remoteMethod(
    'downvote',
    {
      http: {path: '/:id/downvote', verb: 'post'},
      accepts: {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
      returns: {root: true, type: 'object'},
      description: 'Marks a Blog as downvoted.'
    }
  );

  Blog.beforeRemote('downvote', function(ctx, user, next) {
    Blog.findById(ctx.req.params.id, function(err, record){
      
      if (record.authorId === ctx.req.accessToken.userId) {
        var err = new Error("User cannot downvote their own Blog post.");
        err.status = 403;
        next(err);
      
      } else if (record.downvotes.indexOf(ctx.req.accessToken.userId) != -1) {
        var err = new Error("User has already downvoted the Blog.");
        err.status = 403;
        next(err);
      } else {
        next();
      }
    })
  });

  
  Blog.downvote = function(id, cb) {
   
    var ctx = loopback.getCurrentContext();
    Blog.findById(id, function(err, record){
   
      record.downvotes.push(ctx.active.accessToken.userId);
      record.updateAttributes({ downvote: record.downvotes}, function(err, instance) {
        if (err) cb(err);
        if (!err) cb(null, instance);
      })
    })
  };
  

  
  Blog.observe('before save', function filterProperties(ctx, next) {
    
    if (ctx.instance) {
      
      if (ctx.instance.slug === undefined) {
        ctx.instance.slug = slugify(ctx.instance.title).toLowerCase();
      }
      
      if (ctx.instance.createdDate === undefined) {
        ctx.instance.createdDate = new Date();
      }
      
      if (ctx.instance.upvotes === undefined) ctx.instance.upvotes = [];
      if (ctx.instance.downvotes === undefined) ctx.instance.downvotes = [];
      
    }
    next();
  });

};