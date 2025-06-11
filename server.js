const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

console.log('✅ Initializing Twilio client with:', {
  accountSid: process.env.TWILIO_ACCOUNT_SID?.slice(-4),
  workspaceSid: process.env.TWILIO_WORKSPACE_SID?.slice(-4),
  workflowSid: process.env.TWILIO_WORKFLOW_SID?.slice(-4)
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Generate a video token for a participant
const generateToken = (identity, room) => {
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity }
  );

  const videoGrant = new VideoGrant({ room });
  token.addGrant(videoGrant);

  return token.toJwt();
};

// Create task endpoint
app.post('/create-video-task', async (req, res) => {
  console.log('📝 Received request body:', req.body);
  const { service, customerName = 'Nom client' } = req.body;

  const room = await twilioClient.video.v1.rooms.create({
    uniqueName: `room_${Date.now()}`,
    type: 'group'
  });

  if (!service) {
    console.log('❌ Missing fields:', { receivedService: service, receivedRoom: room });
    return res.status(400).json({ error: 'Missing service or room' });
  }

  try {
    const customerIdentity = `customer_${Date.now()}`;

    const attributes = {
      type: 'video',
      name: service,
      serviceInfo: {
        label: service
      },
      customerInfo: {
        displayName: customerName,
      },
      channelType: 'custom', // Important for Flex UI customization
      videoRoom: room.uniqueName,
      conversations: {
        conversation_id: `video-${Date.now()}`,
        conversation_type: 'video',
      }
    };

    console.log("Attributs de la tâche: ", attributes);

    console.log('🔄 Creating task in Twilio...');
    const task = await twilioClient.taskrouter.v1
    .workspaces(process.env.TWILIO_WORKSPACE_SID)
    .tasks
    .create({
      workflowSid: process.env.TWILIO_WORKFLOW_SID,
      attributes: JSON.stringify(attributes),
      taskChannel: 'video',
      timeout: 300 // 5 minutes avant expiration
    });

    const customerToken = generateToken(customerIdentity, room);

    console.log('✅ Task created:', task.sid);
    res.json({
      taskSid: task.sid,
      token: customerToken,
      room
    });
  } catch (err) {
    console.error('❌ Error creating task:', err);
    res.status(500).json({
      error: 'Erreur lors de la création de la tâche',
      details: err.message
    });
  }
});


app.listen(PORT, async () => {
  console.log("Workspace SID:", process.env.TWILIO_WORKSPACE_SID);

  try {
    const workspace = await twilioClient.taskrouter.v1
      .workspaces(process.env.TWILIO_WORKSPACE_SID)
      .fetch();
    console.log(`✅ Connected to Twilio workspace: ${workspace.friendlyName}`);
    console.log(`✅ Server running on port ${PORT}`);
  } catch (err) {
    console.error("❌ Failed to connect to Twilio:", err);
    console.log(`⚠️ Server running on port ${PORT} but Twilio connection failed`);
  }
});

