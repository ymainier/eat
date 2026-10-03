# Eat

Weekly meal planning for a household: deciding the pool of meals for the week, optionally backed by recipes.

## Language

### People

**Household**:
The group of people who share one set of Meal Weeks, Dishes and settings.
_Avoid_: Family, account, team

**Member**:
A person who belongs to a Household and can edit everything it owns; only people on the Household's allow list can become Members.
_Avoid_: User, account

### Planning

**Meal Week**:
The planning period of seven days starting on the Household's chosen start day in the Household's timezone (by default Saturday, the grocery delivery day), holding an unordered pool of Meals.
_Avoid_: Week, calendar week, plan

**Meal Count**:
The target number of Meals a Household plans per Meal Week (by default 14); a Meal Week may hold fewer or more.

**Meal**:
One planned occurrence of exactly one Dish in a Meal Week's pool, not tied to a day or time of day; it is either eaten or not yet eaten.
_Avoid_: Slot, entry, lunch, dinner

**Carry Over**:
Moving an uneaten Meal, chosen by a Member, from the Meal Week immediately before the current one into the current one; Meals not carried over stay in their Meal Week as not eaten.
_Avoid_: Rollover, postpone

### Cooking

**Dish**:
A named thing the Household eats, kept in the Household's catalogue and reused across Meals, optionally with a Recipe (e.g. "spaghetti bolognese", "leftovers", "eat out"). Its name is unique within the Household, ignoring case.
_Avoid_: Food, item, course

**Archived Dish**:
A Dish withdrawn from the catalogue for future planning but kept in the history of past Meals.
_Avoid_: Deleted dish

**Recipe**:
How to prepare a Dish: free-text ingredients, free-text steps, and an optional source URL. A Dish has at most one Recipe.

**Tag**:
A free-form label a Household attaches to Dishes, such as their base or main ingredient (e.g. pasta, rice, chicken, beef); a Dish can have several. A Tag exists only while at least one Dish carries it.
_Avoid_: Category, label
