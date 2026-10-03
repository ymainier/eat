# Meals are an unordered weekly pool

The Household buys groceries once per Meal Week (on delivery day) and decides day by day which of the planned Meals to cook, so a Meal Week is an unordered pool of Meals with no date or time of day (no breakfast/lunch/dinner) attached to any Meal. We rejected a day-by-day calendar of fixed slots because it forces a choice the Household doesn't actually make in advance, and moving Meals between days would be constant busywork.

## Consequences

- The size of the pool is a Household setting (Meal Count, default 14) and is a target, not a cap.
- History records which Meals were eaten, not when within the week; heuristics for future auto-generation can only reason at Meal Week granularity (e.g. "not eaten last Meal Week").
- Uneaten Meals can be carried over into the next Meal Week, which a dated calendar would have made awkward.
