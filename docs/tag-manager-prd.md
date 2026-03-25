# PRD: Tag Manager POC

> Status: Draft
> Created: 2026-03-25
> Skill used: /write-a-prd (extended with enterprise sections)

---

## 1. Feature Overview

A lightweight tag management UI that lets users create, edit, and delete advertiser tags. Each advertiser has one tag — a named block of JavaScript code. The system stores advertiser records in a local SQLite database and writes a deployable `.js` file to disk for each advertiser, ready to be placed on their website.

---

## 2. Problem Statement

Advertisers need custom JavaScript tags placed on their websites to track events, fire pixels, and run analytics. Managing these tags manually — editing raw files, keeping track of which advertiser has which code — is error-prone and has no UI. There is no centralised place to create, view, update, or delete advertiser tags.

---

## 3. Solution

A web application with a table view listing all advertisers and their tags. Users can create a new advertiser tag via a form, edit the tag code for an existing advertiser, or delete an advertiser and its associated tag file. On every save, the system writes a self-contained IIFE JavaScript file to a local `./tags/` folder, ready for deployment on the advertiser's website.

---

## 4. Ubiquitous Language

These terms are canonical across the database, API, and UI. Do not substitute synonyms.

| Term           | Definition                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Advertiser** | A company or entity that owns one tag. Identified by a unique name.                              |
| **Tag**        | A named unit of JavaScript code belonging to one advertiser.                                     |
| **Tag File**   | The `.js` output artifact written to `./tags/<advertiser-name>.js` on disk.                      |
| **Tag Code**   | The raw JavaScript string the user writes. Stored in the database and written into the Tag File. |
| **Tag Name**   | The human-readable label for a tag. Displayed in the table and as a comment in the Tag File.     |
| **Create**     | Add a new Advertiser + Tag record to the database and write the Tag File.                        |
| **Edit**       | Update Tag Name or Tag Code for an existing Advertiser; regenerate the Tag File.                 |
| **Delete**     | Remove the Advertiser + Tag record from the database and delete the Tag File from disk.          |

---

## 5. User Stories

1. As a user, I want to see a table of all advertisers and their tags, so that I can get an overview of what tags exist.
2. As a user, I want to see the advertiser name and tag name for each row in the table, so that I can quickly identify which tag belongs to which advertiser.
3. As a user, I want an Edit button on each table row, so that I can navigate to the edit form for that advertiser's tag.
4. As a user, I want a Delete button on each table row, so that I can remove an advertiser and their tag in one click.
5. As a user, I want a Create button on the table page, so that I can navigate to the form for adding a new advertiser tag.
6. As a user, I want to fill in an advertiser name, tag name, and tag code when creating a new tag, so that all necessary information is captured.
7. As a user, I want the advertiser name field to be validated as unique, so that I cannot accidentally create two advertisers with the same name.
8. As a user, I want to see a clear error message if I try to create an advertiser with a name that already exists, so that I understand why the form did not submit.
9. As a user, I want a code editor (not a plain textarea) for the tag code field, so that writing JavaScript is easier and more readable.
10. As a user, I want to hit Save on the create form and be redirected back to the table, so that I can see the new advertiser in the list immediately.
11. As a user, I want to click Edit on a row and see the current tag name and tag code pre-filled in the form, so that I can make targeted changes without re-entering everything.
12. As a user, I want the advertiser name to be read-only on the edit page, so that I cannot accidentally rename an advertiser (which would orphan the tag file on disk).
13. As a user, I want to hit Save on the edit form and be redirected back to the table, so that I can confirm my changes are reflected.
14. As a user, I want clicking Delete to immediately remove the advertiser from the table and delete the tag file from disk, so that stale files do not accumulate.
15. As a user, I want the tag file to be a valid, self-contained JavaScript IIFE, so that it can be dropped onto any website without modification.
16. As a user, I want the tag file to include comments showing the advertiser name and tag name, so that the file is identifiable without opening the database.

---

## 6. Acceptance Criteria

### Table Page

- [ ] All advertisers are listed with their tag name
- [ ] Each row has an Edit button and a Delete button
- [ ] A Create button is visible and navigates to the create form
- [ ] Table is empty state handled (shows a message when no advertisers exist)

### Create Flow

- [ ] Form has three fields: Advertiser Name, Tag Name, Tag Code (CodeMirror editor)
- [ ] Submitting with any field empty shows a validation error
- [ ] Submitting with a duplicate advertiser name shows a uniqueness error
- [ ] Successful submit writes `./tags/<advertiser-name>.js` to disk
- [ ] Successful submit inserts record into SQLite and redirects to table
- [ ] Advertiser name in the filename is slugified (lowercase, hyphens, no spaces)

### Edit Flow

- [ ] Advertiser Name field is read-only
- [ ] Tag Name and Tag Code are pre-filled with current values
- [ ] Saving updates the DB record and overwrites the Tag File on disk
- [ ] Successful save redirects to table

### Delete Flow

- [ ] Clicking Delete removes the DB record
- [ ] Clicking Delete deletes `./tags/<advertiser-name>.js` from disk
- [ ] Table reflects the deletion immediately

### Tag File Format

- [ ] File is a valid IIFE: `(function() { ... })();`
- [ ] File includes a comment header: `// Advertiser: <name>` and `// Tag: <tag name>`
- [ ] File contains the user's raw Tag Code inside the IIFE

---

## 7. Implementation Decisions

### Database (SQLite)

- Single table: `advertisers`
- Columns: `id` (integer PK), `name` (text, unique, not null), `tag_name` (text, not null), `tag_code` (text, not null), `created_at` (datetime), `updated_at` (datetime)
- Enforced unique constraint on `name` at DB level

### File System

- Tag files stored at `./tags/<slug>.js` relative to the backend server root
- Slug = advertiser name lowercased, spaces replaced with hyphens, special chars stripped
- File written/overwritten on every Create or Edit save
- File deleted on Delete

### Tag File Format

```js
// Advertiser: Acme Corp
// Tag: Homepage Pixel
(function() {
  <user tag code here>
})();
```

### API (REST)

| Method | Route                  | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | `/api/advertisers`     | List all advertisers               |
| POST   | `/api/advertisers`     | Create advertiser + write tag file |
| GET    | `/api/advertisers/:id` | Get single advertiser              |
| PUT    | `/api/advertisers/:id` | Update tag; regenerate tag file    |
| DELETE | `/api/advertisers/:id` | Delete record + delete tag file    |

### Modules

- **AdvertiserRepository** — all SQLite read/write operations. Single interface, tested in isolation.
- **TagFileService** — all disk operations (write, overwrite, delete tag files). Single interface, tested in isolation.
- **AdvertiserController** — Express route handlers. Thin — delegates to Repository and TagFileService.
- **ValidationMiddleware** — request body validation (required fields, uniqueness check).

### Frontend

- React Router for navigation (Table → Create → Edit)
- CodeMirror for the tag code editor
- Fetch API for backend calls (no external HTTP library for POC)

---

## 8. Testing Decisions

### What makes a good test

Test external behaviour, not implementation details. A good test asks: "if I call this function/endpoint with X input, do I get Y output and Z side effects?" It does not test which internal functions were called.

### What to test

**AdvertiserRepository** (unit)

- Insert creates a record retrievable by ID
- Insert with duplicate name throws a unique constraint error
- Update changes tag name and tag code
- Delete removes the record

**TagFileService** (unit)

- Write creates a file at the correct path with correct IIFE format
- Write with existing file overwrites it
- Delete removes the file
- Slug generation: spaces → hyphens, lowercase, special chars stripped

**API endpoints** (integration via Supertest)

- `POST /api/advertisers` — 201 on success, 400 on missing fields, 409 on duplicate name
- `GET /api/advertisers` — 200 with array
- `GET /api/advertisers/:id` — 200 with record, 404 if not found
- `PUT /api/advertisers/:id` — 200 on success, 404 if not found
- `DELETE /api/advertisers/:id` — 200 on success, 404 if not found

**Frontend** (manual QA for POC — no automated UI tests)

---

## 9. Tracer Bullet Slices

Each slice is independently demo-able end-to-end. Build in this order.

| Slice       | What it covers                                                          | Done when                                                           |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Slice 1** | DB schema + `GET /api/advertisers` + Table page renders empty state     | Table page loads, API returns `[]`, no errors                       |
| **Slice 2** | `POST /api/advertisers` + TagFileService write + Create form            | Submit form → record in DB → `.js` file on disk → redirect to table |
| **Slice 3** | `GET /api/advertisers/:id` + `PUT /api/advertisers/:id` + Edit form     | Edit form pre-fills → save → DB updated → tag file overwritten      |
| **Slice 4** | `DELETE /api/advertisers/:id` + Delete button                           | Click Delete → record gone → file deleted → table updates           |
| **Slice 5** | Validation layer — uniqueness error, required fields, UI error messages | Duplicate name shows error, empty fields blocked                    |

---

## 10. Out of Scope

- User authentication and authorisation
- Multiple tags per advertiser
- URL pattern fields on tags (conditions written inside raw JS by the user)
- Tag execution or preview
- Editing the advertiser name after creation
- Cloud storage or remote deployment of tag files
- Tag versioning or history
- Bulk operations (bulk delete, bulk export)
- Search or filter on the table

---

## 11. Open Questions

None. All questions resolved during `/grill-me` session.
See: [grill-me-qa-log.md](./grill-me-qa-log.md)

---

## 12. Further Notes

- This is a POC. The goal is to document the full PRD-to-deployment process using Claude Code skills, not to ship production software.
- The `./tags/` folder should be git-ignored so generated JS files are not committed.
- CodeMirror should be configured for JavaScript syntax highlighting at minimum.
- The SQLite database file should also be git-ignored.
