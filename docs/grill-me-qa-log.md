# Grill-Me Q&A Log — Tag Manager POC

> This is a verbatim record of the `/grill-me` session run before writing the PRD.
> It shows the kind of questions that surface when you stress-test a feature idea before building.
> Use this as a reference for what a thorough grill-me session looks like.

---

## Feature Being Grilled

"I want to build a tag manager page — frontend, backend, validation, database."

---

## Round 1 — Core Concept

**Q1:** A "tag file" — is it one JS file per container (like GTM containers), where each container holds multiple tags inside it? Or is each tag its own individual JS file?

**A1:** One universal JS file with multiple tags inside it. We place this file on the advertiser's website. The one file has many tags. Inside the file we write if-conditions so different tags can fire on various pages based on URL patterns.

---

**Q2:** What does a "tag" contain? Just a name + raw JS code? Or something more structured (type, trigger, code)?

**A2:** Just a name and raw JS code. Also an advertiser name as a text field for the POC.

---

**Q3:** When a tag file is "saved to local folder" — does running/loading that file execute the tags? Or is the file just storage and execution is separate?

**A3:** Only CRUD operations on the tag file for now. Save to local, don't worry about executing.

---

**Q4:** The UI shows a list of tag files. You click one, see the tags inside, add/edit/delete tags, hit save, and the JS file gets written to disk — is that the core flow?

**A4:** Yes, that's correct.

---

**Q5:** Where is the local folder — hardcoded like `./tags/` or does the user set it?

**A5:** Hardcode it for the POC.

---

## Round 2 — Tag Structure & File Shape

**Q6:** Each tag fires based on a URL pattern — where does that live? Is it a field on the tag itself, or does the user write those conditions manually inside the raw JS code?

**A6:** The conditions can just be inside the file itself. We don't have to worry about writing those patterns in a separate field.

---

**Q7:** The generated JS file — should it look like this?

```js
// Advertiser: Acme Corp
;(function () {
  var url = window.location.href
  // Tag: Homepage Banner
  if (url.match('/')) {
    /* user code */
  }
  // Tag: Checkout Pixel
  if (url.match('/checkout')) {
    /* user code */
  }
})()
```

**A7:** Yes, that's the correct format.

---

**Q8:** One file per advertiser — so 3 advertisers = 3 separate `.js` files on disk, filename based on advertiser name?

**A8:** Yes, correct.

---

**Q9:** The main table — what columns? Advertiser Name + number of tags + Edit button?

**A9:** Advertiser name + tag name + Edit button. Also a Create button on the same page that takes us to the create page.

---

**Q10:** When you click Edit — can you add a new tag, edit an existing one, delete one? All three?

**A10:** There's only one tag per advertiser. You can only edit that one tag. Add a Delete button next to Edit on the table — it wipes out that record.

---

## Round 3 — Edge Cases & Final Clarifications

**Q11:** One tag per advertiser — so the Edit form has: advertiser name + tag name + JS code. That's the whole form?

**A11:** Yes, one tag per advertiser. That's the whole edit form.

---

**Q12:** When you Delete a row — does it delete the `.js` file from disk as well, or just remove from the list?

**A12:** Yes, delete the file too.

---

**Q13:** Create page — same 3 fields: advertiser name, tag name, JS code. Hit Save → writes `./tags/<advertiser-name>.js` → redirects back to the table?

**A13:** Yes, three fields. That's correct.

---

**Q14:** What if someone creates two advertisers with the same name — allow duplicates, block it, or not worry about it for the POC?

**A14:** Add a validation on the advertiser name and make it unique in the database table as well as put a validation on the UI.

---

**Q15:** JS code field in the UI — plain textarea or a code editor like Monaco/CodeMirror?

**A15:** Add CodeMirror. Let's make it a little bit pretty.

---

## Round 4 — Final Blockers

**Q16:** You mentioned "unique in the database table" — so we DO want a database? SQLite for the POC — zero setup, single file. SQLite = source of truth, `./tags/` = output artifact?

**A16:** Yes, let's use SQLite. It can be local.

---

**Q17:** If you edit the advertiser name, the old file needs renaming. Should we handle that, or lock advertiser name after creation (only tag name + code editable)?

**A17:** Don't give the option to edit the advertiser name in the POC. It can be read-only on the edit page.

---

## What This Session Produced

By the end of 17 questions across 4 rounds, every ambiguity was resolved:

| Decision            | Resolved to                                         |
| ------------------- | --------------------------------------------------- |
| Tags per advertiser | 1                                                   |
| Tag fields          | Advertiser name, tag name, JS code                  |
| Storage             | SQLite (records) + `./tags/*.js` (output artifacts) |
| File format         | IIFE wrapping user's raw JS                         |
| URL conditions      | Written inside user's raw JS — no separate field    |
| Table columns       | Advertiser Name, Tag Name, Edit, Delete             |
| Create flow         | 3-field form → save → redirect to table             |
| Edit flow           | Tag name + code editable; advertiser name read-only |
| Delete              | Removes DB record + deletes JS file from disk       |
| Uniqueness          | DB constraint + UI validation on advertiser name    |
| Code editor         | CodeMirror                                          |
| Auth                | None                                                |
| Local folder        | `./tags/` hardcoded                                 |

**Zero open questions entering the PRD phase.**
