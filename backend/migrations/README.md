# Database migration notes

`V1__marketplace_listing_domain.sql` is additive. It does not rename categories,
rewrite listings, backfill rows, or remove the legacy `imageUrl` column.

Local development uses Hibernate `ddl-auto=update`, which creates the two nullable
columns and the `ProductImage` table automatically. For another database, inspect
the schema first and run only the missing statements from the migration file.
Existing null values are read as `GOOD` condition and `ACTIVE` listing status by
the application, so no destructive backfill is required.

`V2__order_item_snapshots.sql` adds four nullable snapshot columns to `OrderItem`:
the listing title and image, and the seller ID and display name at purchase time.
New orders populate these fields; existing order rows remain valid and use their
linked listing as a fallback. No existing row is rewritten. On a database managed
outside local Hibernate `ddl-auto=update`, inspect the table first and run only
statements for columns that are absent. Back up production data before applying
schema changes; this project does not run the SQL files automatically.

## Production procedure

The default application configuration now uses `ddl-auto=validate`; only the
local profile opts into `update`. Demo/admin/category seeding is also disabled by
default and enabled explicitly by the local profile.

Before a production-like deployment:

1. Back up the target database and verify the restore procedure.
2. Compare the current schema with `V1` and `V2` for the selected database engine.
3. Review and apply only missing additive changes in a controlled maintenance window.
4. Leave legacy rows in place. These scripts do not rewrite listing content,
   category names, payment fields, or historic order items.
5. Start with `JPA_DDL_AUTO=validate` and resolve schema mismatches before serving traffic.

Content migration is deliberately not automatic. Null listing condition/status
values and pre-snapshot order items use application-level compatibility fallbacks.
The saved local H2 database must not be used as a production migration mechanism.
