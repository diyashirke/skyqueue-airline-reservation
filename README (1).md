# SkyQueue: Airline Reservation System using Queue

A DSA project in C. It books and cancels airline tickets and keeps overflow passengers in a FIFO waitlist built as a linked-list queue. When a ticket is cancelled, the first passenger in the queue is promoted to the freed seat automatically.

## Data Structure
- **Queue (linked list)** for the waitlist
- Fixed array of seat pointers for booked passengers

## Algorithms
- Enqueue and dequeue: O(1)
- FIFO waitlist promotion on cancellation: O(1)
- Linear search by ticket ID: O(n)

## Features
- Book ticket
- Cancel ticket
- Passenger list
- Waitlist view
- Flight summary

## Project Files
| File | Purpose |
|------|---------|
| `airline.c` | Menu-driven C program |
| `index.html`, `style.css`, `script.js` | Report website with a live demo of the queue |

## Run the C Program
```bash
gcc airline.c -o airline
./airline
```

## View the Website
Open `index.html` in a browser, or visit the deployed link on Vercel.

## Author
Your Name · Roll No: 000
