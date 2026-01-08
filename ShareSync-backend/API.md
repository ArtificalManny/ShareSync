# ShareSync API Documentation

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Projects API

### Get All Projects
```http
GET /api/projects
```
Returns array of all user's projects.

### Get Single Project
```http
GET /api/projects/:id
```
Returns project details including members, tasks, metrics.

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "title": "Project Name",
  "category": "Dev",
  "status": "In Progress",
  "description": "Description"
}
```

### Update Project
```http
PATCH /api/projects/:id
Content-Type: application/json

{
  "title": "Updated Name",
  "status": "Completed"
}
```

## Tasks API

### Get Tasks
```http
GET /api/projects/:id/tasks
```
Returns paginated task list with cursor.

### Create Task
```http
POST /api/projects/:id/tasks
Content-Type: application/json

{
  "title": "Task Name",
  "description": "Description",
  "status": "todo"
}
```

### Update Task
```http
PATCH /api/projects/:id/tasks/:taskId
Content-Type: application/json

{
  "status": "completed"
}
```

## Team Members API

### Update Members
```http
PATCH /api/projects/:id/members
Content-Type: application/json

{
  "members": ["userId1", "userId2"]
}
```

## Invitations API

### Create Invitation
```http
POST /api/projects/:id/invites
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "member"
}
```

### List Invitations
```http
GET /api/projects/:id/invites
```

## Status Codes
- 200: Success
- 201: Created
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
