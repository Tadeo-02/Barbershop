---
name: "Preserve checkout form state during search"
overview: "Replace DOM-removal filtering with CSS-based hiding so CheckoutForm instances stay mounted (and retain react-hook-form state) while the search query changes."
todos:
  - id: "css-hide-filter"
    content: "Replace filteredTurnos.map with turnos.map + CSS display:none for non-matching items"
    status: not_started
createdAt: "2026-02-25T02:54:26.555Z"
updatedAt: "2026-02-25T02:54:26.555Z"
---

# Preserve Checkout Form State During Search

## Root Cause

`filteredTurnos.map(...)` unmounts appointments that don't match the search. When a `<li>` unmounts, its `CheckoutForm` unmounts too — react-hook-form state (selected corte, payment method) is lost. This happens even transiently: typing mid-word may briefly filter out the target appointment.

## Fix — CSS hide instead of DOM removal

**File:** `src/FRONT/views/components/Barber/appointments/branchAppointments.tsx`

In the JSX, change from:

```tsx
{filteredTurnos.length === 0 ? (
  <div className={styles.emptyState}>…</div>
) : (
  <ul>
    {filteredTurnos.map((turno) => (
      <li key={turno.codTurno}>…</li>
    ))}
  </ul>
)}
```

To:

```tsx
{filteredTurnos.length === 0 ? (
  <div className={styles.emptyState}>…</div>
) : (
  <ul>
    {(() => {
      const visibleIds = new Set(filteredTurnos.map((t) => t.codTurno));
      return turnos.map((turno) => (
        <li
          key={turno.codTurno}
          className={styles.appointmentItem}
          style={visibleIds.has(turno.codTurno) ? undefined : { display: "none" }}
        >
          …same content…
        </li>
      ));
    })()}
  </ul>
)}
```

- MUST keep the `filteredTurnos.length === 0` guard for the "no matches" empty state  
- MUST use `turnos.map(...)` (not `filteredTurnos.map(...)`) so all items stay mounted  
- MUST use a `Set` for O(1) visibility lookups  
- MUST NOT change any other logic, styles, or component behaviour  
- MUST NOT add comments

## Scope

- IN: the list-rendering block in `BranchAppointments`'s return JSX  
- OUT: `CheckoutForm` internals, search/debounce logic, filter logic, styling
