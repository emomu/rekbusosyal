const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Event = require('./models/Event');
  const Post = require('./models/Post');
  const Community = require('./models/Community');
  const User = require('./models/User');

  const latestEvent = await Event.findOne().sort({ createdAt: -1 }).populate('community', 'name announcementAccount');

  if (!latestEvent) {
    console.log('No events found');
    process.exit(0);
  }

  console.log('Latest Event:');
  console.log('  Title:', latestEvent.title);
  console.log('  Created:', latestEvent.createdAt);
  console.log('  Community:', latestEvent.community?.name);
  console.log('  Has announcement account:', !!latestEvent.community?.announcementAccount);

  const eventPost = await Post.findOne({ eventReference: latestEvent._id }).populate('author', 'username');

  if (eventPost) {
    console.log('\nEvent HAS an announcement post ✅');
    console.log('  Post ID:', eventPost._id);
    console.log('  Author:', eventPost.author?.username || 'Unknown');
    console.log('  Created:', eventPost.createdAt);
  } else {
    console.log('\nEvent has NO announcement post ❌');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
