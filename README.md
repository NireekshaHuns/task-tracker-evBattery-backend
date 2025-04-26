# Task Manager Backend API

## Overview

This is the backend API for the Task Manager application, providing a complete task management system with role-based access control, activity logging, and notifications. The API is built with Express and TypeScript, using a JSON file-based data storage system for simplicity and portability.

## Local Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Docker Setup

For containerized deployment with both frontend and backend, see our [task-tracker-orchestration](https://github.com/NireekshaHuns/EVident-Battery-Orchestration-Service) repository which contains the Docker Compose configuration.

### Local Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The API will be available at http://localhost:5000

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
DATA_PATH=./data
```

## Features

- **Authentication**: JWT-based authentication system
- **Role-based Access Control**: Different endpoints and capabilities for submitters and approvers
- **Task Management**:
  - Create, read, update, and delete tasks
  - Status transitions with role-based permissions
  - Filtering tasks by status
- **Activity Logging**: Complete audit trail of all task activities
- **Notifications**: Real-time notifications for task status changes
- **Rate Limiting**: Protection against abuse with rate limits on key endpoints

## Tech Stack

- **Node.js & TypeScript**: For type-safe JavaScript development
- **Express**: Web framework for building the API endpoints
- **JSON File Storage**: Custom file-based data storage implementation
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing for security
- **uuid**: For generating unique identifiers

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user

  - Request body: `{ name, username, password, role }`
  - Response: `{ message: 'User registered successfully' }`

- `POST /api/auth/login`: Authenticate user and get JWT token
  - Request body: `{ username, password, role }`
  - Response: `{ token, user: { id, name, role } }`

### Tasks

- `GET /api/tasks`: Get all tasks (filtered by role)

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Query parameters: `status` (optional)
  - Response: Array of task objects

- `POST /api/tasks/create`: Create a new task (submitters only)

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Request body: `{ title, description }`
  - Response: Task object

- `GET /api/tasks/:id`: Get task by ID

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Response: Task object

- `PUT /api/tasks/:id`: Update task

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Request body (submitters): `{ title, description }`
  - Request body (approvers): `{ status }`
  - Response: Updated task object

- `DELETE /api/tasks/:id`: Delete a task (submitters only, pending tasks only)
  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Response: `{ message: 'Task deleted successfully' }`

### Logs

- `GET /api/logs`: Get activity logs

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Query parameters: Various filter options
  - Response: `{ logs: Array of log objects, pagination: { ... } }`

- `GET /api/logs/submitters`: Get list of submitters (approvers only)
  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Response: Array of submitter objects

### Notifications

- `GET /api/notifications`: Get notifications for current user

  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Response: Array of notification objects

- `DELETE /api/notifications/clear-all`: Clear all notifications for current user
  - Headers: `{ Authorization: 'Bearer TOKEN' }`
  - Response: `{ message: 'Notifications cleared' }`

## Data Models

### User

```typescript
{
  _id: string;
  name: string;
  role: "submitter" | "approver";
  username: string;
  password: string; // hashed
  createdAt: Date;
  updatedAt: Date;
}
```

### Task

```typescript
{
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "done" | "rejected";
  createdBy: string | { _id: string, name: string };
  updatedBy?: string | { _id: string, name: string };
  createdAt: Date;
  updatedAt: Date;
}
```

### Log

```typescript
{
  _id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: Date;
  action: "create" | "update" | "delete" | "status_change";
}
```

### Notification

```typescript
{
  _id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  message: string;
  createdAt: Date;
  actionType: "task_approved" | "task_rejected" | "task_done";
  actorName: string;
}
```

## Project Structure

```
src/
├── config/               # Configuration files
│   ├── database.ts       # Database connection
│   └── env.ts            # Environment variables
├── controllers/          # Route controllers
│   ├── authController.ts
│   ├── logController.ts
│   ├── notificationController.ts
│   └── taskController.ts
├── database/             # Database implementation
│   └── jsonDB.ts         # JSON file-based database
├── middleware/           # Express middleware
│   ├── auth.ts           # JWT authentication
│   ├── rateLimiter.ts    # Rate limiting
│   └── rbac.ts           # Role-based access control
├── models/               # Data models
│   ├── Log.ts
│   ├── Notification.ts
│   ├── Task.ts
│   └── User.ts
├── routes/               # API routes
│   ├── authRoutes.ts
│   ├── logRoutes.ts
│   ├── notificationRoutes.ts
│   └── taskRoutes.ts
├── services/             # Business logic
│   ├── LogService.ts
│   ├── NotificationService.ts
│   └── TaskService.ts
├── utils/                # Utility functions
│   └── errorHandler.ts
└── server.ts             # Entry point
```

## Testing

```bash
# Run all tests
npm test

# Run specific test groups
npm run test:auth      # Authentication tests
npm run test:tasks     # Task management tests

# Clean test data and run tests
npm run test:clean
```

Tests are implemented using Jest and Supertest.

## Security Features

- **Password Hashing**: User passwords are hashed using bcrypt
- **JWT Authentication**: Secure API access with JSON Web Tokens
- **Role-based Access Control**: Ensures users can only perform authorized actions
- **Rate Limiting**: Prevents abuse and brute force attacks

## Task Status Workflow

1. **Submitter** creates a task with status `pending`
2. **Approver** reviews the task and sets status to `approved` or `rejected`
3. **Approver** can later mark an `approved` task as `done`

Only submitters can:

- Create new tasks
- Edit their own pending tasks
- Delete their own pending tasks

Only approvers can:

- Change task status from `pending` to `approved` or `rejected`
- Change task status from `approved` to `done`

## Error Handling

The API uses a centralized error handling middleware to provide consistent error responses:

```typescript
{
  message: string;
  error?: any;
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
