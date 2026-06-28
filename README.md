# Mini Jira (Angular 19)

A small ticket-tracking board built with Angular 19 standalone components and signals: kanban board with drag-and-drop, multiple projects, and a team/resource list for assigning tickets to people.

## Stack

- Angular 19, standalone components (no NgModules)
- Signals (`signal()`, `computed()`, `effect()`) for state, via `TicketStoreService`
- Angular CDK `DragDropModule` for drag-and-drop between columns
- Tailwind CSS for styling
- `localStorage` for persistence (wrapped in the store service)

## Run it locally

Requires [Node.js](https://nodejs.org) 18.19+ and npm.

```bash
npm install
npm start
```

Then open the URL it prints (usually http://localhost:4200).

## Build for production

```bash
npm run build
```

Output goes to `dist/mini-jira-angular/browser` — deploy that folder to any static host.

## Project structure

```
src/app/
  models.ts                 Shared types and constants (Status, Priority, columns, colors)
  utils.ts                  Avatar color/initials/key-generation helpers
  seed.ts                   Example projects/resources/tickets for first run
  ticket-store.service.ts   Signals-based state + localStorage persistence
  icon.component.ts         Small inline-SVG icon component
  ticket-card.component.ts  Ticket-stub styled card
  board.component.ts        Kanban columns + CDK drag-and-drop + quick-add
  ticket-detail.component.ts  Slide-in panel: edit, reassign project, assign resource, delete
  team-panel.component.ts   Manage team members and projects, see workload
  app.component.ts          Header, search, project tabs, hosts the above
```

## Notes

- Data (projects, team members, tickets) is saved to your browser's local storage, so it persists between visits on the same browser/device.
- Click "+ PROJECT" to add a new project — it gets an auto-generated key (e.g. `API`).
- Click "Team" to add/remove people and see each person's open-ticket count.
- Click any ticket to edit it, reassign its project, change its assignee, or delete it.
- Drag a card between columns to change its status.
