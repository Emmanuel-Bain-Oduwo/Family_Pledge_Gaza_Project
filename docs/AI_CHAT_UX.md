# Family Pledge AI Chat UX

The admin AI chat is an internal Family Pledge workspace.

## Session controls

- **New Chat** creates a fresh local chat session.
- **History** opens recent chat sessions and allows switching between them.
- **Delete** removes an individual local chat session.
- **Exit Chat** returns to the main AI draft workspace.

## History storage

Chat session history is stored in the authenticated admin browser's local storage and is limited to the newest 40 sessions. This PR does not add a server-side AI transcript database.

## Backend boundaries

These UX controls do not change the backend AI scope, read-only Family Pledge data context, human-approval requirements, or write permissions implemented in PR G.
