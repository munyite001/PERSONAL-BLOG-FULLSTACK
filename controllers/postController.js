const asyncHandler = require('express-async-handler');
const Post = require('../models/post')
const User = require('../models/user')
const Comment = require('../models/comment')
const Tag = require('../models/tag')

/// POST ROUTES ///


//  Get all posts //
exports.all_posts = asyncHandler(async (req, res, next) => {
    const allPosts = await Post.find({}).populate('comments').exec()
    res.json(allPosts)
})

//  Geta only published posts //
exports.all_posts_published = asyncHandler(async (req, res, next) => {
    const allPosts = await Post.find({published: true}).populate('comments').populate('tags').exec()
    res.json(allPosts)
})
//  Get one post //
exports.post_detail = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate({path: 'comments', populate: { path: 'user', select: 'username' }}).populate('tags').exec()

    if (!post) {
        res.status(404).json({message: 'Post not found' });
    }

    res.json(post)
})
//  Create a post //
exports.post_create = asyncHandler(async (req, res, next) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
        banner_image: req.body.banner_image,
        published: req.body.published,
    })

    try {
        const savedPost = await post.save()
        res.status(201).json({message: 'Post created successfully', post: savedPost})
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({message: 'Error creating post', error: error.message})
    }
})

//  Update a post //
exports.post_update = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec()

    if (!post) {
        res.status(404).json({message: 'Post not found' });
    }

    post.title = req.body.title;
    post.content = req.body.content;
    post.tags = req.body.tags;
    post.banner_image = req.body.banner_image;
    post.published = req.body.published;
    post.updated_at = Date.now();

    await post.save()

    res.json({message: 'Post updated successfully'})
})

//  Delete a apost  //
exports.post_delete = asyncHandler(async (req, res, next) => {
    await Post.findByIdAndDelete(req.params.id).exec()

    // if (!post) {
    //     res.status(404).json({message: 'Post not found' });
    // }

    res.json({message: 'Post deleted successfully'})
})

//  Add a comment to a post //
exports.add_comment = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (!post) {
        res.status(404).json({message: 'Post not found' });
    }

    const comment = new Comment({
        content: req.body.content,
        post: post._id,
        user: req.user.id
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    //  Fetch all new Comments
    const allComments = await Comment.find({post: req.params.id}).populate('user').exec();

    res.json(allComments);

    // res.json({message: 'Comment added successfully'});

});

//  Fetch all comments of a particular post
exports.get_all_post_comments = asyncHandler(async (req, res, next) => {
    try {
        const allPostComments = await Comment.find({post: req.params.id}).populate('user').exec();
        res.json(allPostComments);
    } catch(err) {
        console.log(err)
    }
})


// Stats about the database
exports.get_stats = asyncHandler(async (req, res, next) => {
    try {
        const stats = {
            totalPosts: await Post.countDocuments({}).exec(),
            totalUsers: await User.countDocuments({}).exec(),
            totalComments: await Comment.countDocuments({}).exec()
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


//  Get all tags
exports.get_tags = asyncHandler(async (req, res, next) => {
    try {
        const allTags = await Tag.find({}).exec();

        res.json(allTags)
    } catch (err) {
        res.status(500).json({message: 'Error Fetching tags'})
    }
})

exports.set_featured = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findById(req.params.id).exec();

    try {
        //  Unfeature all posts
        await Post.updateMany({featured: true}, {$set: {featured: false}})

        //  Set the specific post to featured
        const post = await Post.findByIdAndUpdate(id, { $set: { featured: true } }, { new: true });
    
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
    
        res.json(post);

    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})