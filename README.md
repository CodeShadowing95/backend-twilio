# Backend API Documentation

This backend service provides video chat functionality using Twilio's Video API and TaskRouter services.

## Environment Variables

The following environment variables are required:

- `PORT` - Server port (defaults to 3001)
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_API_KEY` - Twilio API Key
- `TWILIO_API_SECRET` - Twilio API Secret
- `TWILIO_WORKSPACE_SID` - Twilio TaskRouter Workspace SID
- `TWILIO_WORKFLOW_SID` - Twilio TaskRouter Workflow SID

## API Endpoints

### Create Video Task

```http
POST /create-video-task
```

Creates a new video room and task for customer-agent video chat.

#### Request Body

```json
{
  "service": "string",  // Required: Type of service requested
  "customerName": "string" // Optional: Customer's name (defaults to 'Nom client')
}
```

#### Response

##### Success (200)

```json
{
  "taskSid": "string",  // Twilio Task SID
  "token": "string",    // Customer's video token
  "room": {              // Room details
    "uniqueName": "string",
    // Other room properties...
  }
}
```

##### Error (400)

```json
{
  "error": "Missing service or room"
}
```

##### Error (500)

```json
{
  "error": "Erreur lors de la création de la tâche",
  "details": "error message"
}
```

## Features

- Video room creation with unique names
- Task creation for agent assignment
- JWT token generation for video authentication
- Automatic task timeout after 5 minutes
- Error handling and logging

## Technical Details

- Uses Express.js for the server
- Implements CORS for cross-origin requests
- Integrates with Twilio Video and TaskRouter APIs
- Generates secure JWT tokens for video authentication
