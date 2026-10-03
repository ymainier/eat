# Domain core is independent of Next.js

The web app is the first client, but a mobile app and an MCP server are planned. The domain (Household, Meal Week, Meal, Dish, Recipe, Tag and their rules) and the application layer (use cases such as planning a Meal, marking it eaten, Carry Over) therefore live outside `app/` and must not import Next.js, React or any HTTP/framework code. Clients are thin adapters over the application layer: the web app calls it from Server Actions, and a public HTTP API is built only when the mobile app or MCP server needs it, rather than having the web app go through an HTTP API from day one.

## Consequences

- Business rules are tested without Next.js running.
- A future MCP server can call the application layer directly in-process.
- Putting logic in Server Actions or React components is a layering violation, even when it would be quicker.
