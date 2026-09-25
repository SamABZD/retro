# Retro API

Spring Boot API for Retro. The client uses authentication, categories, listings, seller applications, checkout, order history, fulfillment, and account endpoints.

## Run locally

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

The `local` profile uses a file-backed H2 database, localhost CORS origins, non-Secure localhost cookies, filesystem uploads, and idempotent demo seed data. Swagger UI is available at `http://localhost:8080/swagger-ui/index.html`.

For a local demo, use `-Dspring-boot.run.profiles=local,demo`. That explicit combination enables Retro buyer/seller accounts and their sample orders in an in-memory H2 database. Restart the API to reset the sample data. The public single-service Docker deployment uses the separate `portfolio` profile and requires a unique `JWT_SECRET` environment variable.

## Verify

```powershell
.\mvnw.cmd clean test
.\mvnw.cmd -DskipTests package
```

The integration suite covers public marketplace queries, auth cookies, role-escalation prevention, seller-owned CRUD and image galleries, unsafe remote-image rejection, authoritative checkout, stock/cancellation transitions, buyer/seller isolation, order privacy, JWT invalidation, seller approval, file signatures, and traversal protection.

## Configuration

Production-like configuration is environment-driven; see `.env.example`. Important settings include:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JPA_DDL_AUTO` (`validate` by default; local overrides to `update`)
- `JWT_SECRET`
- `FRONTEND_URL` (the credentialed CORS origin)
- `UPLOAD_DIR` and `REMOTE_IMAGE_STORAGE`
- SMTP and optional Cloudinary credentials
- Admin seed values (used only when seeding is explicitly enabled)

Secure cookies default to true outside the local profile. Demo seeding defaults to false and is enabled only by an explicit local demo or public portfolio profile. The public profile does not seed the local admin account. The internal `PRODUCER` enum is retained for saved-data compatibility; it represents the user-facing Seller role.

## API conventions

- `/api/listings` is the canonical marketplace resource.
- `/api/products` remains a backend compatibility alias; the active frontend does not depend on it.
- Checkout is authenticated and simulated. The server reloads price/stock, locks inventory, and writes purchase-time snapshots.
- Listing uploads accept verified JPEG, PNG, or WebP files. New remote references must be valid HTTPS URLs.
- Error responses use stable `code` and `message` fields without exposing stack traces.

## Migration readiness

The SQL in `migrations/` is manual, additive deployment guidance; the application does not automatically execute it. Review [migrations/README.md](migrations/README.md) before using a non-local database. Back up the database, compare the target schema, apply reviewed missing changes, and start with `JPA_DDL_AUTO=validate`.

See the repository [README](../README.md) for the demo, local setup, limits, and credits.
