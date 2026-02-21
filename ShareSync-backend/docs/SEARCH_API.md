cat > docs/SEARCH_API.md << 'EOF'
# Search & Filter API Documentation

## Global Search

Search across projects, tasks, and users.

**Endpoint:** `GET /api/search`

**Query Parameters:**
- `q` (required) - Search query (min 2 characters)
- `type` (optional) - Limit to type: `projects`, `tasks`, `users`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20, max: 100)

**Example:**
```bash
GET /api/search?q=design&type=projects&page=1&limit=10
```

**Response:**
```json
{
  "query": "design",
  "results": {
    "projects": [
      {
        "_id": "...",
        "title": "Design System",
        "description": "UI design system",
        "status": "Active",
        "createdAt": "2025-12-01T..."
      }
    ],
    "tasks": [
      {
        "_id": "...",
        "title": "Design mockups",
        "projectId": "...",
        "projectTitle": "Design System"
      }
    ],
    "users": [
      {
        "_id": "...",
        "username": "designer123",
        "firstName": "Jane",
        "profilePicture": "..."
      }
    ]
  },
  "total": 5
}
```

---

## Project Search

Search and filter projects.

**Endpoint:** `GET /api/search/projects`

**Query Parameters:**
- `q` (optional) - Search in title/description
- `status` (optional) - Filter by status: `Active`, `Paused`, `Completed`, `Archived`
- `privacy` (optional) - Filter by privacy: `private`, `public`
- `page` (optional) - Page number
- `limit` (optional) - Results per page
- `sort` (optional) - Sort field (e.g., `createdAt`, `-createdAt`, `title:asc`)

**Examples:**
```bash
# Search active projects
GET /api/search/projects?q=design&status=Active

# Get all projects, sorted by newest
GET /api/search/projects?sort=-createdAt

# Get completed projects
GET /api/search/projects?status=Completed&page=1&limit=10
```

**Response:**
```json
{
  "projects": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Task Filters

Filter tasks within a project.

**Endpoint:** `GET /api/search/projects/:projectId/tasks`

**Query Parameters:**
- `status` (optional) - Filter by status: `todo`, `in-progress`, `done`
- `assignee` (optional) - Filter by assignee user ID
- `completed` (optional) - Filter by completion: `true`, `false`
- `effort` (optional) - Filter by effort: `low`, `medium`, `high`
- `dueBefore` (optional) - Tasks due before date (ISO format)
- `dueAfter` (optional) - Tasks due after date (ISO format)
- `sort` (optional) - Sort field

**Examples:**
```bash
# Get all todo tasks
GET /api/search/projects/abc123/tasks?status=todo

# Get tasks assigned to user
GET /api/search/projects/abc123/tasks?assignee=user123

# Get overdue tasks
GET /api/search/projects/abc123/tasks?dueBefore=2025-12-20&completed=false

# Get high-effort tasks
GET /api/search/projects/abc123/tasks?effort=high
```

**Response:**
```json
{
  "tasks": [...],
  "total": 12,
  "filters": {
    "status": "todo",
    "completed": false
  }
}
```

---

## Ship Filters

Filter ships (activity log) within a project.

**Endpoint:** `GET /api/search/projects/:projectId/ships`

**Query Parameters:**
- `author` (optional) - Filter by author user ID
- `before` (optional) - Ships before date (ISO format)
- `after` (optional) - Ships after date (ISO format)
- `page` (optional) - Page number
- `limit` (optional) - Results per page

**Examples:**
```bash
# Get ships from specific user
GET /api/search/projects/abc123/ships?author=user123

# Get ships from last week
GET /api/search/projects/abc123/ships?after=2025-12-13

# Get ships in date range
GET /api/search/projects/abc123/ships?after=2025-12-01&before=2025-12-31
```

**Response:**
```json
{
  "ships": [
    {
      "_id": "...",
      "description": "Completed authentication system",
      "author": {
        "_id": "...",
        "username": "john",
        "profilePicture": "..."
      },
      "xpAwarded": 50,
      "timestamp": "2025-12-15T..."
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Message Search (Optional)

Search messages within a project.

**Endpoint:** `GET /api/search/projects/:projectId/messages`

**Query Parameters:**
- `q` (optional) - Search in message content
- `sender` (optional) - Filter by sender user ID
- `type` (optional) - Filter by message type
- `before` (optional) - Messages before date
- `after` (optional) - Messages after date
- `page` (optional) - Page number
- `limit` (optional) - Results per page (default: 50)

**Examples:**
```bash
# Search messages
GET /api/search/projects/abc123/messages?q=hello

# Get messages from user
GET /api/search/projects/abc123/messages?sender=user123

# Get recent messages
GET /api/search/projects/abc123/messages?after=2025-12-18
```

---

## Date Shortcuts

For date filters, you can use shortcuts instead of ISO dates:

- `today` - Today's date
- `yesterday` - Yesterday
- `this-week` - From start of this week to now
- `last-week` - Previous week
- `this-month` - From start of this month to now
- `last-30-days` - Last 30 days

**Example:**
```bash
GET /api/search/projects/abc123/messages?date=today
```

---

## Sorting

Sort format: `field:order` or `-field` for descending

**Examples:**
- `createdAt` - Ascending by creation date
- `-createdAt` - Descending (newest first)
- `title:asc` - Ascending by title
- `title:desc` - Descending by title

---

## Performance Tips

1. **Text Search Indexes**: Run `node scripts/add-search-indexes.js` to create indexes
2. **Pagination**: Always use pagination for large result sets
3. **Limit Results**: Keep `limit` under 100 for best performance
4. **Specific Filters**: Use specific filters instead of broad searches
EOF

echo "✅ Search API documentation created!"