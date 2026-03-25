# Plan: Tag Manager POC

> Source PRD: [tag-manager-prd.md](../tag-manager-prd.md)
> Skill used: /prd-to-plan

---

## Architectural Decisions

Durable decisions that apply across all phases. Do not deviate from these without updating this file.

- **Routes**: `GET /api/advertisers`, `POST /api/advertisers`, `GET /api/advertisers/:id`, `PUT /api/advertisers/:id`, `DELETE /api/advertisers/:id`
- **Schema**: Single table `advertisers` — `id`, `name` (unique), `tag_name`, `tag_code`, `created_at`, `updated_at`
- **Key models**: Advertiser (id, name, tagName, tagCode)
- **File output**: `./tags/<slug>.js` — slug is advertiser name lowercased, spaces → hyphens, special chars stripped
- **Tag file format**: IIFE wrapping user tag code, with comment header
- **Frontend routing**: Table (`/`) → Create (`/create`) → Edit (`/edit/:id`)
- **Code editor**: CodeMirror (JS syntax highlighting)
- **Database**: SQLite via better-sqlite3, local file
- **No auth**: All routes are open for POC

---

## Phase 1: Foundation

**User stories**: 1, 2

### What to build

Wire the full stack end-to-end with read-only data flow. Set up the project structure (backend + frontend), create the SQLite DB and `advertisers` table, implement `GET /api/advertisers`, and render the table page in the UI. The table shows advertiser name and tag name per row. When the DB is empty, show an empty state message.

This phase proves the stack is connected. No writes yet.

### Acceptance criteria

- [ ] Backend server starts and serves `GET /api/advertisers` returning `[]` on empty DB
- [ ] SQLite `advertisers` table exists with correct columns
- [ ] Frontend loads at `localhost` and calls the API
- [ ] Table renders with columns: Advertiser Name, Tag Name, Edit, Delete
- [ ] Empty state message shown when no advertisers exist
- [ ] AdvertiserRepository unit tests pass (list operation)

---

## Phase 2: Create

**User stories**: 5, 6, 9, 10, 15, 16

### What to build

Full create flow end-to-end. Implement `POST /api/advertisers`, TagFileService write operation, and the create form in the UI with CodeMirror for the tag code field. On submit: insert into DB, write the IIFE tag file to `./tags/`, redirect to table. The table should now show the new advertiser.

### Acceptance criteria

- [ ] Create button on table navigates to `/create`
- [ ] Create form has three fields: Advertiser Name, Tag Name, Tag Code (CodeMirror)
- [ ] `POST /api/advertisers` returns 201 and inserts record into DB
- [ ] Tag file written to `./tags/<slug>.js` with correct IIFE format and comment header
- [ ] Successful submit redirects to table and new row is visible
- [ ] TagFileService unit tests pass (write, overwrite, slug generation)
- [ ] API integration tests pass for `POST /api/advertisers` (201 success case)

---

## Phase 3: Edit

**User stories**: 11, 12, 13

### What to build

Full edit flow end-to-end. Implement `GET /api/advertisers/:id` and `PUT /api/advertisers/:id`, and the edit form in the UI. Form pre-fills tag name and tag code from the DB. Advertiser name is displayed but not editable. On save: update DB record, overwrite the tag file on disk, redirect to table.

### Acceptance criteria

- [ ] Edit button on table row navigates to `/edit/:id`
- [ ] Edit form pre-fills Tag Name and Tag Code from the DB
- [ ] Advertiser Name is shown as read-only (not an input)
- [ ] `PUT /api/advertisers/:id` updates DB record and returns 200
- [ ] Tag file is overwritten with updated content on save
- [ ] Successful save redirects to table with updated values visible
- [ ] `GET /api/advertisers/:id` returns 404 for unknown id
- [ ] API integration tests pass for `GET /:id` and `PUT /:id`

---

## Phase 4: Delete

**User stories**: 3, 4, 14

### What to build

Delete flow end-to-end. Implement `DELETE /api/advertisers/:id` and wire the Delete button on the table. On click: call the API, remove DB record, delete the tag file from disk, update the table to remove the row.

### Acceptance criteria

- [ ] Delete button on table row calls `DELETE /api/advertisers/:id`
- [ ] DB record is removed after delete
- [ ] `./tags/<slug>.js` file is deleted from disk after delete
- [ ] Table row disappears immediately after successful delete
- [ ] `DELETE /api/advertisers/:id` returns 404 for unknown id
- [ ] AdvertiserRepository unit tests pass (delete operation)
- [ ] API integration tests pass for `DELETE /:id`

---

## Phase 5: Validation

**User stories**: 7, 8

### What to build

Harden all flows with validation. Add required-field checks on create and edit. Add uniqueness check on advertiser name at both the DB constraint level and the API response level. Show clear error messages in the UI for both cases — duplicate name (409) and missing fields (400).

### Acceptance criteria

- [ ] Submitting create form with empty Advertiser Name shows inline error
- [ ] Submitting create form with empty Tag Name shows inline error
- [ ] Submitting create form with empty Tag Code shows inline error
- [ ] Submitting create form with duplicate Advertiser Name shows uniqueness error message
- [ ] `POST /api/advertisers` returns 400 for missing required fields
- [ ] `POST /api/advertisers` returns 409 for duplicate advertiser name
- [ ] Edit form shows error if Tag Name or Tag Code is cleared and saved
- [ ] API integration tests pass for all validation error cases
