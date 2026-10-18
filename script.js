/* =========================================================
   SkyQueue - Airline Reservation simulator
   Mirrors the C program: seats[] array + FIFO waitlist queue
   ========================================================= */

const CAPACITY = 6;

/* ---------- Queue (linked-list style: front / rear / size) ---------- */
class Node {
  constructor(data) { this.data = data; this.next = null; }
}
class Queue {
  constructor() { this.front = null; this.rear = null; this.size = 0; }
  enqueue(data) {
    const node = new Node(data);
    if (this.rear === null) { this.front = this.rear = node; }
    else { this.rear.next = node; this.rear = node; }
    this.size++;
  }
  dequeue() {
    if (this.front === null) return null;
    const node = this.front;
    this.front = node.next;
    if (this.front === null) this.rear = null;
    this.size--;
    return node.data;
  }
  removeById(id) {
    let prev = null, cur = this.front;
    while (cur) {
      if (cur.data.ticketId === id) {
        if (prev) prev.next = cur.next; else this.front = cur.next;
        if (cur === this.rear) this.rear = prev;
        this.size--;
        return cur.data;
      }
      prev = cur; cur = cur.next;
    }
    return null;
  }
  toArray() {
    const out = [];
    for (let c = this.front; c; c = c.next) out.push(c.data);
    return out;
  }
}

/* ---------- State ---------- */
let seats, waitlist, nextTicketId, promotedSeat;

function init() {
  seats = new Array(CAPACITY).fill(null);
  waitlist = new Queue();
  nextTicketId = 1001;
  promotedSeat = -1;
}

/* ---------- Core operations ---------- */
function bookTicket(name) {
  const p = { ticketId: nextTicketId++, name: name, seatNo: 0 };
  const free = seats.findIndex(s => s === null);       // linear scan
  if (free !== -1) {
    p.seatNo = free + 1;
    seats[free] = p;
    addLog(`Booked: ${p.name}, Ticket #${p.ticketId}, Seat ${p.seatNo}`, "ok");
  } else {
    waitlist.enqueue(p);                               // O(1)
    addLog(`Flight full. ${p.name} added to waitlist, Ticket #${p.ticketId}, Position ${waitlist.size}`, "warn");
  }
  promotedSeat = -1;
  render();
}

function cancelTicket(id) {
  // 1) search seats
  const idx = seats.findIndex(s => s && s.ticketId === id);
  if (idx !== -1) {
    const gone = seats[idx];
    seats[idx] = null;
    addLog(`Cancelled: ${gone.name}, Ticket #${gone.ticketId} (seat ${idx + 1} freed)`, "bad");
    const next = waitlist.dequeue();                   // O(1) promotion
    if (next) {
      next.seatNo = idx + 1;
      seats[idx] = next;
      promotedSeat = idx;
      addLog(`${next.name} promoted from waitlist to seat ${idx + 1}`, "info");
    } else {
      promotedSeat = -1;
    }
    render();
    return;
  }
  // 2) search waitlist
  const removed = waitlist.removeById(id);
  if (removed) {
    addLog(`Removed from waitlist: ${removed.name}, Ticket #${removed.ticketId}`, "bad");
    promotedSeat = -1;
    render();
    return;
  }
  addLog(`Ticket #${id} not found`, "bad");
}

/* ---------- Rendering ---------- */
const $ = id => document.getElementById(id);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function render() {
  // seats
  const grid = $("seatGrid");
  grid.replaceChildren();
  seats.forEach((p, i) => {
    const seat = el("div", "seat" + (p ? " taken" : "") + (i === promotedSeat ? " promoted" : ""));
    seat.appendChild(el("span", "sno", `Seat ${i + 1}`));
    if (p) {
      seat.appendChild(el("span", "who", p.name));
      seat.appendChild(el("span", "tid", `#${p.ticketId}`));
      const x = el("button", "x", "✕");
      x.title = "Cancel this ticket";
      x.addEventListener("click", () => cancelTicket(p.ticketId));
      seat.appendChild(x);
    } else {
      seat.appendChild(el("span", "who", "Available"));
    }
    grid.appendChild(seat);
  });

  // queue
  const row = $("queueRow");
  row.replaceChildren();
  const list = waitlist.toArray();
  if (list.length === 0) {
    row.appendChild(el("span", "empty-note", "Waitlist is empty (front = rear = NULL)"));
  } else {
    list.forEach((p, i) => {
      const n = el("div", "q-node");
      n.appendChild(el("div", "pos", `Position ${i + 1}`));
      n.appendChild(el("div", "who", p.name));
      n.appendChild(el("div", "tid", `#${p.ticketId}`));
      const x = el("button", "x", "✕");
      x.title = "Remove from waitlist";
      x.addEventListener("click", () => cancelTicket(p.ticketId));
      n.appendChild(x);
      if (i === 0) n.appendChild(el("span", "tagpos", "FRONT"));
      else if (i === list.length - 1) n.appendChild(el("span", "tagpos", "REAR"));
      row.appendChild(n);
      if (i < list.length - 1) row.appendChild(el("span", "q-arrow", "→"));
    });
    row.appendChild(el("span", "q-arrow", "→"));
    row.appendChild(el("span", "empty-note", "NULL"));
  }

  // summary
  const filled = seats.filter(Boolean).length;
  const sum = $("summary");
  sum.replaceChildren();
  [["Filled", `${filled}/${CAPACITY}`], ["Free", CAPACITY - filled], ["Waiting", waitlist.size]].forEach(([label, val]) => {
    const s = el("div", "stat");
    s.appendChild(el("b", "", String(val)));
    s.appendChild(el("span", "", label));
    sum.appendChild(s);
  });
}

function addLog(msg, type) {
  const li = el("li", type || "");
  const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  li.appendChild(el("time", "", t));
  li.appendChild(document.createTextNode(msg));
  const log = $("log");
  log.prepend(li);
  while (log.children.length > 40) log.lastChild.remove();
}

/* ---------- Events ---------- */
$("bookForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = $("nameInput");
  const name = input.value.trim();
  if (!name) return;
  bookTicket(name);
  input.value = "";
  input.focus();
});

$("fillBtn").addEventListener("click", () => {
  ["Rahul", "Priya", "Amit", "Neha", "Karan", "Sneha", "Vikram", "Anjali"].forEach(bookTicket);
});

$("resetBtn").addEventListener("click", () => {
  init();
  $("log").replaceChildren();
  addLog("System reset. New flight, all seats free.", "info");
  render();
});

/* nav + tabs */
$("navToggle").addEventListener("click", () => $("navLinks").classList.toggle("open"));
$("navLinks").addEventListener("click", e => { if (e.target.tagName === "A") $("navLinks").classList.remove("open"); });

document.querySelectorAll("#codeTabs .tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#codeTabs .tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".code-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    $("tab-" + btn.dataset.tab).classList.add("active");
  });
});

/* start */
init();
addLog(`Flight ready: ${CAPACITY} seats available.`, "info");
render();
