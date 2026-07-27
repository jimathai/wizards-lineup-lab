# NBA Bio and Combine Import

This patch expands the Admin NBA import workflow.

It now previews and imports:

- current-season traditional and advanced statistics
- position
- birth date and age
- NBA experience
- college/country
- draft year and overall pick
- official roster height and weight
- NBA Draft Combine height, weight, wingspan, standing reach, and vertical

## Apply

Copy the included files into the matching project folders, then restart Vite:

```cmd
Ctrl + C
npm run dev
```

No SQL migration is required.

## Import behavior

- NBA player IDs are required for exact matching.
- Official combine measurements are preferred when a combine record exists.
- Otherwise, official NBA roster height and weight are imported.
- Existing measurement rows are retained as history but marked not current.
- Archetype, shooting hand, and custom image overrides are not changed.
