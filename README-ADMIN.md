# District Basketball Lab Admin

## Apply the patch

Copy the included files into the matching project folders.

## Supabase setup

1. Open Supabase SQL Editor.
2. Run:

   supabase/admin_player_management.sql

3. Create an email/password user under Authentication > Users.
4. At the bottom of the SQL file, replace the sample email and run the
   commented administrator update statement.

## Open the admin page

Start the app and browse to:

/admin

The admin page provides:

- missing-player-data audit
- filters for images, measurements, and statistics
- editing existing players
- adding players
- roster assignment
- current and career statistics
- measurements
- NBA headshot ID and custom image URL
- custom image file upload to Supabase Storage

## Important

Run the SQL migration before opening /admin. The database policies block
all player-data writes unless the signed-in account has profiles.is_admin = true.
