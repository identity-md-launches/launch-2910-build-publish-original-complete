# Squeek Burrow Circuit reference solutions

All coordinates are **row,column**, starting at **1,1 in the top left**. Reset before following a solution. Each × number is a **clockwise 90° rotation**; perform all listed rotations, in any order, then select **Send Squeek**. These align the complete board, including optional paths. They fit both the move and energy budgets in idle and spinning variants.

For the optional solution, use the same rotations and enable **Include bonus detour** before sending. The solver requires both the star seed and the active live stop. Core routes require only the solid caches and a safe return. Only the first visit to the live stop restores energy. Gates start closed; every switch arrival toggles every gate.

The trip is selected deterministically by breadth-first search. It finds the shortest valid trip on your connected board, with north/east/south/west tie-breaking, inventory, direction, switches, energy and one-time refill state. A different legal arrangement may have a shorter route. Stars: one for a safe return, one for at most the par rotations, one for the optional objective.

## 1. A seed of an idea

Par 1; move limit 5; initial energy 8.

**Rotate:** (3,2) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 4 | 4 |
| idle | bonus | 10 | 2 |
| spinning | core | 4 | 4 |
| spinning | bonus | 10 | 1 |

**idle, core:** (3,1) → (3,2) → (3,3) → (3,2) → (3,1).

**idle, bonus:** (3,1) → (3,2) → (2,2) → (3,2) → (3,3) → (3,4) → (2,4) → (3,4) → (3,3) → (3,2) → (3,1).

**spinning, core:** (3,1) → (3,2) → (3,3) → (3,2) → (3,1).

**spinning, bonus:** (3,1) → (3,2) → (3,3) → (3,4) → (2,4) → (2,3) → (2,4) → (3,4) → (3,3) → (3,2) → (3,1).

## 2. Around the root

Par 4; move limit 8; initial energy 12.

**Rotate:** (3,1) × 1; (2,2) × 2; (3,3) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 8 | 4 |
| idle | bonus | 12 | 4 |
| spinning | core | 8 | 4 |
| spinning | bonus | 12 | 3 |

**idle, core:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,2) → (3,2) → (3,1) → (4,1).

**idle, bonus:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (2,3) → (2,2) → (3,2) → (3,3) → (3,2) → (3,1) → (4,1).

**spinning, core:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,2) → (3,2) → (3,1) → (4,1).

**spinning, bonus:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (2,4) → (2,3) → (2,2) → (3,2) → (3,1) → (4,1).

## 3. The fork in the burrow

Par 7; move limit 12; initial energy 16.

**Rotate:** (3,2) × 1; (3,3) × 2; (3,4) × 3; (2,3) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 10 | 6 |
| idle | bonus | 14 | 6 |
| spinning | core | 10 | 6 |
| spinning | bonus | 14 | 5 |

**idle, core:** (3,1) → (3,2) → (3,3) → (2,3) → (3,3) → (3,4) → (3,5) → (3,4) → (3,3) → (3,2) → (3,1).

**idle, bonus:** (3,1) → (3,2) → (3,3) → (2,3) → (3,3) → (3,4) → (3,5) → (3,4) → (4,4) → (3,4) → (3,3) → (3,2) → (4,2) → (3,2) → (3,1).

**spinning, core:** (3,1) → (3,2) → (3,3) → (2,3) → (3,3) → (3,4) → (3,5) → (3,4) → (3,3) → (3,2) → (3,1).

**spinning, bonus:** (3,1) → (3,2) → (3,3) → (2,3) → (3,3) → (3,4) → (3,5) → (3,4) → (4,4) → (4,3) → (4,4) → (3,4) → (3,3) → (3,2) → (3,1).

## 4. The long way home

Par 9; move limit 14; initial energy 16.

**Rotate:** (3,2) × 2; (2,2) × 1; (3,4) × 3; (4,3) × 1; (4,1) × 2.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 10 | 6 |
| idle | bonus | 12 | 8 |
| spinning | core | 10 | 6 |
| spinning | bonus | 12 | 7 |

**idle, core:** (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (3,3) → (4,3) → (4,2) → (4,1) → (3,1).

**idle, bonus:** (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, core:** (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (3,3) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, bonus:** (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

## 5. One-way whiskers

Par 8; move limit 13; initial energy 16.

**Rotate:** (2,1) × 1; (2,3) × 2; (3,4) × 1; (4,3) × 3; (4,5) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 10 | 6 |
| idle | bonus | 14 | 6 |
| spinning | core | 10 | 6 |
| spinning | bonus | 14 | 5 |

**idle, core:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**idle, bonus:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (5,5) → (5,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, core:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, bonus:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (3,5) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

## 6. Two little errands

Par 10; move limit 15; initial energy 20.

**Rotate:** (1,1) × 2; (1,2) × 1; (2,4) × 1; (3,3) × 3; (4,3) × 2; (3,2) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 14 | 6 |
| idle | bonus | 16 | 8 |
| spinning | core | 14 | 6 |
| spinning | bonus | 16 | 7 |

**idle, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (3,3) → (4,3) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**idle, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (2,4) → (2,5) → (3,5) → (4,5) → (4,4) → (4,3) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**spinning, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (3,3) → (4,3) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**spinning, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (2,4) → (2,5) → (3,5) → (4,5) → (4,4) → (4,3) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

## 7. A switch in the soil

Par 10; move limit 15; initial energy 16.

**Rotate:** (2,1) × 1; (2,2) × 2; (2,4) × 1; (3,4) × 3; (4,1) × 2; (4,5) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 10 | 6 |
| idle | bonus | 14 | 6 |
| spinning | core | 10 | 6 |
| spinning | bonus | 14 | 5 |

**idle, core:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**idle, bonus:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (5,5) → (5,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, core:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

**spinning, bonus:** (3,1) → (2,1) → (2,2) → (2,3) → (2,4) → (3,4) → (3,5) → (4,5) → (3,5) → (3,4) → (4,4) → (4,3) → (4,2) → (4,1) → (3,1).

## 8. The sleepy side path

Par 10; move limit 15; initial energy 19.

**Rotate:** (3,1) × 2; (3,2) × 1; (2,2) × 1; (2,4) × 3; (4,4) × 2; (1,3) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 14 | 5 |
| idle | bonus | 16 | 7 |
| spinning | core | 14 | 5 |
| spinning | bonus | 16 | 6 |

**idle, core:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,5) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1).

**idle, bonus:** (4,1) → (3,1) → (3,2) → (2,2) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (4,4) → (4,5) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1).

**spinning, core:** (4,1) → (3,1) → (3,2) → (2,2) → (2,3) → (2,4) → (3,4) → (4,4) → (4,5) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1).

**spinning, bonus:** (4,1) → (3,1) → (3,2) → (2,2) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (4,4) → (4,5) → (3,5) → (4,5) → (4,4) → (4,3) → (4,2) → (4,1).

## 9. Switchback supper

Par 12; move limit 17; initial energy 23.

**Rotate:** (1,1) × 1; (1,2) × 2; (1,5) × 1; (2,5) × 2; (3,3) × 3; (4,3) × 1; (5,5) × 2.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 16 | 11 |
| idle | bonus | 16 | 11 |
| spinning | core | 16 | 10 |
| spinning | bonus | 16 | 10 |

**idle, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**idle, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**spinning, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

**spinning, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (4,3) → (3,3) → (3,2) → (3,1).

## 10. Roots and roundabouts

Par 11; move limit 16; initial energy 22.

**Rotate:** (3,2) × 1; (2,2) × 2; (1,2) × 1; (2,4) × 3; (4,3) × 1; (4,5) × 2; (5,4) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 12 | 10 |
| idle | bonus | 18 | 8 |
| spinning | core | 12 | 10 |
| spinning | bonus | 18 | 7 |

**idle, core:** (3,1) → (3,2) → (2,2) → (1,2) → (1,3) → (1,2) → (2,2) → (2,3) → (2,2) → (3,2) → (4,2) → (3,2) → (3,1).

**idle, bonus:** (3,1) → (3,2) → (2,2) → (2,3) → (2,2) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (3,5) → (4,5) → (5,5) → (5,4) → (4,4) → (4,3) → (4,2) → (3,2) → (3,1).

**spinning, core:** (3,1) → (3,2) → (2,2) → (1,2) → (1,3) → (1,2) → (2,2) → (2,3) → (2,2) → (3,2) → (4,2) → (3,2) → (3,1).

**spinning, bonus:** (3,1) → (3,2) → (2,2) → (2,3) → (2,2) → (1,2) → (1,3) → (1,4) → (2,4) → (3,4) → (3,5) → (4,5) → (3,5) → (3,4) → (4,4) → (4,3) → (4,2) → (3,2) → (3,1).

## 11. The amber vault

Par 14; move limit 19; initial energy 22.

**Rotate:** (2,1) × 2; (2,2) × 1; (2,3) × 3; (1,3) × 1; (2,5) × 2; (3,4) × 1; (4,3) × 3; (5,5) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 14 | 8 |
| idle | bonus | 18 | 8 |
| spinning | core | 14 | 8 |
| spinning | bonus | 18 | 7 |

**idle, core:** (4,1) → (3,1) → (2,1) → (2,2) → (2,3) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (3,4) → (3,3) → (4,3) → (4,2) → (4,1).

**idle, bonus:** (4,1) → (3,1) → (2,1) → (2,2) → (2,3) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (4,3) → (3,3) → (4,3) → (4,2) → (4,1).

**spinning, core:** (4,1) → (3,1) → (2,1) → (2,2) → (2,3) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (3,4) → (3,3) → (4,3) → (4,2) → (4,1).

**spinning, bonus:** (4,1) → (3,1) → (2,1) → (2,2) → (2,3) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (4,5) → (3,5) → (3,4) → (3,3) → (4,3) → (4,2) → (4,1).

## 12. The burrow circuit

Par 16; move limit 21; initial energy 25.

**Rotate:** (1,1) × 1; (1,2) × 2; (1,3) × 3; (1,5) × 1; (2,5) × 2; (5,5) × 1; (5,3) × 3; (4,1) × 2; (3,3) × 1.

| Variant | Objective | Steps | Energy left |
| --- | --- | ---: | ---: |
| idle | core | 16 | 9 |
| idle | bonus | 20 | 9 |
| spinning | core | 16 | 9 |
| spinning | bonus | 20 | 8 |

**idle, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (5,2) → (5,1) → (4,1) → (3,1).

**idle, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (4,5) → (3,5) → (3,4) → (3,3) → (3,2) → (4,2) → (5,2) → (5,1) → (4,1) → (3,1).

**spinning, core:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (5,4) → (5,3) → (5,2) → (5,1) → (4,1) → (3,1).

**spinning, bonus:** (3,1) → (2,1) → (1,1) → (1,2) → (1,3) → (1,4) → (1,5) → (2,5) → (3,5) → (4,5) → (5,5) → (4,5) → (3,5) → (3,4) → (3,3) → (3,2) → (4,2) → (5,2) → (5,1) → (4,1) → (3,1).

The same solutions are available in the game’s Reference solutions dialog. Machine-readable paths and switch states are in [level-solutions.json](level-solutions.json). These are game simulations, not live telemetry.
