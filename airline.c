/*
 * SkyQueue - Airline Reservation System using Queue
 * --------------------------------------------------
 * Main data structure : Queue (linked list) for the waitlist
 * Supporting structure: fixed array of seat pointers
 * Algorithms          : enqueue, dequeue (O(1)), FIFO promotion,
 *                       linear search by ticket ID (O(n))
 *
 * Compile: gcc airline.c -o airline
 * Run    : ./airline
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CAPACITY 5
#define NAME_LEN 50

/* ---------- Data structures ---------- */
typedef struct Passenger {
    int ticketId;
    char name[NAME_LEN];
    int seatNo;                 /* 0 while waitlisted */
    struct Passenger *next;
} Passenger;

typedef struct {
    Passenger *front;
    Passenger *rear;
    int size;
} Queue;

/* ---------- Globals ---------- */
static Passenger *seats[CAPACITY];      /* NULL = free seat */
static Queue waitlist = { NULL, NULL, 0 };
static int nextTicketId = 1001;

/* ---------- Queue operations ---------- */
void enqueue(Queue *q, Passenger *p) {
    p->next = NULL;
    if (q->rear == NULL) {              /* empty queue */
        q->front = q->rear = p;
    } else {
        q->rear->next = p;              /* link at the end */
        q->rear = p;
    }
    q->size++;
}

Passenger *dequeue(Queue *q) {
    if (q->front == NULL)               /* underflow */
        return NULL;

    Passenger *p = q->front;
    q->front = p->next;
    if (q->front == NULL)
        q->rear = NULL;                 /* queue became empty */

    p->next = NULL;
    q->size--;
    return p;
}

/* Remove a specific passenger from anywhere in the queue */
Passenger *removeFromQueue(Queue *q, int ticketId) {
    Passenger *prev = NULL, *cur = q->front;
    while (cur != NULL) {
        if (cur->ticketId == ticketId) {
            if (prev) prev->next = cur->next;
            else      q->front = cur->next;
            if (cur == q->rear) q->rear = prev;
            cur->next = NULL;
            q->size--;
            return cur;
        }
        prev = cur;
        cur = cur->next;
    }
    return NULL;
}

/* ---------- Helpers ---------- */
int firstFreeSeat(void) {
    for (int i = 0; i < CAPACITY; i++)
        if (seats[i] == NULL) return i;
    return -1;
}

int filledSeats(void) {
    int n = 0;
    for (int i = 0; i < CAPACITY; i++)
        if (seats[i] != NULL) n++;
    return n;
}

int readInt(const char *prompt) {
    char buf[64];
    int v;
    printf("%s", prompt);
    if (!fgets(buf, sizeof buf, stdin) || sscanf(buf, "%d", &v) != 1)
        return -1;
    return v;
}

/* ---------- Features ---------- */
void bookTicket(void) {
    char name[NAME_LEN];
    printf("Name: ");
    if (!fgets(name, sizeof name, stdin)) return;
    name[strcspn(name, "\n")] = '\0';
    if (name[0] == '\0') {
        printf("Name cannot be empty.\n");
        return;
    }

    Passenger *p = (Passenger *)malloc(sizeof(Passenger));
    if (!p) { printf("Memory error.\n"); return; }
    p->ticketId = nextTicketId++;
    strncpy(p->name, name, NAME_LEN - 1);
    p->name[NAME_LEN - 1] = '\0';
    p->seatNo = 0;
    p->next = NULL;

    int slot = firstFreeSeat();
    if (slot != -1) {
        p->seatNo = slot + 1;
        seats[slot] = p;
        printf("Booked! Ticket #%d, Seat %d\n", p->ticketId, p->seatNo);
    } else {
        enqueue(&waitlist, p);
        printf("Flight full. Added to waitlist: Ticket #%d, Position %d\n",
               p->ticketId, waitlist.size);
    }
}

void cancelTicket(void) {
    int id = readInt("Ticket ID to cancel: ");

    /* 1) search booked seats (linear search) */
    for (int i = 0; i < CAPACITY; i++) {
        if (seats[i] && seats[i]->ticketId == id) {
            printf("Ticket %d cancelled (seat %d).\n", id, i + 1);
            free(seats[i]);
            seats[i] = NULL;

            Passenger *next = dequeue(&waitlist);   /* FIFO promotion */
            if (next) {
                next->seatNo = i + 1;
                seats[i] = next;
                printf("%s promoted from waitlist to seat %d.\n",
                       next->name, i + 1);
            }
            return;
        }
    }

    /* 2) search the waitlist */
    Passenger *w = removeFromQueue(&waitlist, id);
    if (w) {
        printf("Ticket %d removed from waitlist.\n", id);
        free(w);
        return;
    }
    printf("Ticket %d not found.\n", id);
}

void showPassengers(void) {
    printf("\n%-6s %-10s %-20s\n", "Seat", "Ticket", "Passenger");
    printf("------------------------------------------\n");
    for (int i = 0; i < CAPACITY; i++) {
        if (seats[i])
            printf("%-6d #%-9d %-20s\n", i + 1, seats[i]->ticketId, seats[i]->name);
        else
            printf("%-6d %-10s %-20s\n", i + 1, "-", "(available)");
    }
}

void showWaitlist(void) {
    if (waitlist.front == NULL) {
        printf("Waitlist is empty.\n");
        return;
    }
    printf("\nWaitlist (FRONT -> REAR):\n");
    int pos = 1;
    for (Passenger *p = waitlist.front; p; p = p->next)
        printf("  %d. %s (Ticket #%d)\n", pos++, p->name, p->ticketId);
}

void flightSummary(void) {
    int filled = filledSeats();
    printf("Seats: %d/%d filled | Free: %d | Waiting: %d\n",
           filled, CAPACITY, CAPACITY - filled, waitlist.size);
}

void freeAll(void) {
    for (int i = 0; i < CAPACITY; i++) free(seats[i]);
    Passenger *p;
    while ((p = dequeue(&waitlist)) != NULL) free(p);
}

/* ---------- Main ---------- */
int main(void) {
    int choice;
    do {
        printf("\n=== SKYQUEUE AIRLINE RESERVATION ===\n");
        printf("1. Book Ticket   2. Cancel Ticket   3. Passenger List\n");
        printf("4. Waitlist      5. Flight Summary  6. Exit\n");
        choice = readInt("Enter choice: ");

        switch (choice) {
            case 1: bookTicket();    break;
            case 2: cancelTicket();  break;
            case 3: showPassengers();break;
            case 4: showWaitlist();  break;
            case 5: flightSummary(); break;
            case 6: printf("Goodbye!\n"); break;
            default: printf("Invalid choice.\n");
        }
    } while (choice != 6);

    freeAll();
    return 0;
}
