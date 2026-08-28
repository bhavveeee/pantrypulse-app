# Tequila reading protocol

Tested end-to-end on 28 Aug 2026 against Yash & Manik. Follow it exactly — each step exists because the obvious approach fails.

**State file:** `tequila_read_state.json` (in the repo). Claude has no memory between sessions; that file *is* the memory. **Read it first, update it last.**

---

## 0. Before anything

```
read tequila_read_state.json
→ for this household: last_read_at, last_message_seen, orders_booked_through
```
That tells you where to stop scrolling back. Without it you either re-read everything or miss messages.

## 1. Maximise the window

```
resize_window(tabId, width=1512, height=1080)
```
Default is ~1065×1002 and the chat column is then too narrow to read cart text.
**Limit:** Chrome refuses bounds more than 50% off-screen, so 1512×1080 is the practical maximum — true OS full-screen is not reachable from the extension.

## 2. Open the household

```
navigate → https://app.tellm.co/households/<TEQUILA_ID>
wait 10s, then wait 8s more
```
Two waits, not one. The app renders the shell first and hydrates messages after; a single 10s wait often screenshots an empty thread.

## 3. Read the whole thread, not the visible part

```javascript
document.querySelectorAll('[class*=message],[data-message-id]').length   // 193 on YM
```
Scroll the message pane to the top and back down before reading, so lazy-loaded history is in the DOM. Stop scrolling back when you reach `last_message_seen` from the state file.

## 4. Cart and plan images — the important part

**Do not** click the image and screenshot the page. The rendered element is scaled down and often screenshots blank (a loading spinner or a flat green block), which is why quantities were being missed.

Instead, take the source and open it at native resolution:

```javascript
// collect every real image (thumbnails and avatars are small)
var im = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 400);
window.__IMG = im.map(i => i.currentSrc || i.src);
```

These are **signed Google Cloud Storage URLs, valid ~15 minutes** — collect and use them in the same session.

For each one:
```javascript
location.href = window.__IMG[n];      // navigate the same tab
```
then `wait 8s` and **screenshot as a standalone call, not inside browser_batch** — Chrome prompts for permission on `storage.googleapis.com` and batching skips the prompt.

The image renders at native size (1500×1500 on the tested cart) and every quantity is legible.

**Return with an explicit navigate, not history:**
```
navigate → https://app.tellm.co/households/<TEQUILA_ID>
```
`alt+Left` does **not** work from the image page — it stays put. Explicit navigation is the only reliable exit.

## 4b. TRIAGE — decide from the chat text whether an image is worth opening

Opening an image costs a navigation, an 8s wait and a screenshot. Most images do not deserve that.
**Read the surrounding message text first and classify without opening.**

**SKIP — do not open:**
- Meal-plan cards ("Here's the meal plan for tomorrow", "Here's the updated meal plan"). **Emergent is the whole truth for meal plans** — the image can only ever be a copy, and a stale one.
- Recipe or dish photos, food pictures, "how it turned out" images.
- Anything already recorded in `last_cart_read` for that household.

**OPEN — these change the ledger:**
- "Here's the cart" / "cart for tomorrow" / "sharing the cart"
- "These are the items required" / a shortage or requirement list
- "Placing the order" / "order placed" / "ordered" / "booked"
- Delivery confirmations and invoices
- Anything with prices or quantities being discussed

**Cheap pre-check before opening:** the right-hand **Cart** and **Tasks** panels carry the same data as structured text (item · source · pcs · price). If the panel already shows the cart, read it there and skip the image entirely.

## 4c. WAS IT ACTUALLY ORDERED? — cart shared ≠ order placed

A cart image is a **proposal** until something says it was placed. Households often share a cart at night for information and then order a **different** cart in the morning. Booking the night cart is wrong.

**Rules:**
1. **An image alone is never an order.** It needs explicit placement language — "placed", "ordered", "booked", "done", "delivered" — or a delivery confirmation/invoice.
2. **Supersession:** when several carts cover the same ordering window, only the **last one carrying placement confirmation** counts. Earlier ones are info-only, even if they are more detailed.
3. **The order date is the placement day**, not the day the cart image was shared.
4. **Read forward past the cart.** The confirmation usually arrives in a later message, sometimes the next morning. A cart with nothing after it is not an order.
5. **Diffs matter.** If a morning cart replaces a night cart, book only the morning one — and if part of the night cart was already delivered separately, book that part on its own delivery date.
6. **When it is ambiguous, ask.** Say which carts were seen, which looks placed and why, and let Bhavya confirm. Never assume.

Record the outcome per cart in the state file so the next session does not re-litigate it:
```
"carts_seen": [
  {"id":"<date/desc>", "status":"info-only | placed | superseded", "booked_on":"<date or null>"}
]
```

## 5. Itemise the cart

For each line record **item · quantity · unit · pack size · price** — quantity is the field that was being lost, so read it explicitly per row rather than skimming the list.

Also check the right-hand **Cart** and **Tasks** tabs — they carry structured data (item, source, pcs, price) that is easier to read than the image, and the **Copilot** panel often states shortages in words.

## 6. Booking rule (unchanged)

Newest cart **plus an explicit placement/delivery confirmation** = a booked order, dated to the placement day. No confirmation, no order. Staff carts can be delivered after the first read, so re-sweep before closing.

## 7. Proposing cart changes

Never submit a cart edit directly. Build the diff, show it, and get confirmation:

```
Household · item · current → proposed · why (quote the chat line that justifies it)
```
Only act after an explicit yes.

## 8. Close out

Update `tequila_read_state.json`:
```json
"last_read_at": "<ISO now>",
"last_message_seen": "<snippet + timestamp of the newest message>",
"last_cart_read": "<cart id or date>",
"orders_booked_through": "<date>",
"notes": "<anything pending>"
```
Then push it with the build so the next session starts from the right place.

---

## Known limits — say these plainly rather than pretending

- **True OS full-screen** is not available; 1512×1080 is the ceiling.
- **Signed image URLs expire in ~15 minutes** — you cannot save them for later, only re-fetch.
- **Screenshots of `storage.googleapis.com` need a standalone call** so the permission prompt appears.
- **No read-marker exists in Tequila**, so the state file is the only way to track position. If it is not updated, the next session is blind.
