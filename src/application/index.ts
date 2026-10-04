import type { Database } from "../db/client";
import type { Clock } from "./clock";
import type { EmailSender } from "./email";
import { carryOver, dismissCarryOver, getCarryOverCandidates } from "./carry-over";
import {
  archiveDish,
  createDish,
  listDishes,
  renameDish,
  unarchiveDish,
} from "./dishes";
import { getCurrentMealWeek, getMealWeek } from "./get-meal-week";
import { listPastMealWeeks } from "./history";
import { planMeal, removeMeal } from "./plan-meals";
import { markMealEaten, markMealNotEaten } from "./meals";
import { findMember, type Member } from "./members";
import {
  isAllowedToSignIn,
  joinHousehold,
  sendSignInLink,
  type AllowList,
} from "./sign-in";

export type { Clock } from "./clock";
export type { Email, EmailSender } from "./email";
export type { CarryOverCandidates } from "./carry-over";
export type { CatalogueDish, DishView } from "./dishes";
export { DishNameTakenError, DishNotFoundError } from "./dishes";
export type { MealWeekSummary } from "./history";
export type { MealView, MealWeekRelation, MealWeekView } from "./meal-weeks";
export { MealWeekNotFoundError } from "./meal-weeks";
export { DishNameRequiredError, MealNotFoundError } from "./plan-meals";
export type { Member } from "./members";
export { NotAllowedToSignInError } from "./sign-in";

export type ApplicationDeps = {
  db: Database;
  clock: Clock;
  emailSender: EmailSender;
  /** Emails allowed to sign in and become Members. */
  allowList: AllowList;
};

export function createApplication(deps: ApplicationDeps) {
  return {
    isAllowedToSignIn: (email: string) =>
      isAllowedToSignIn(deps.allowList, email),
    sendSignInLink: (input: { email: string; url: string }) =>
      sendSignInLink(deps, input),
    joinHousehold: (input: { userId: string; email: string }) =>
      joinHousehold(deps, input),
    findMember: (input: { userId: string }) => findMember(deps.db, input),

    getCurrentMealWeek: (input: { member: Member }) =>
      getCurrentMealWeek(deps, input),
    getMealWeek: (input: { member: Member; startDate: string }) =>
      getMealWeek(deps, input),
    listPastMealWeeks: (input: { member: Member }) => listPastMealWeeks(deps, input),
    planMeal: (input: {
      member: Member;
      dishName: string;
      mealWeekStartDate?: string;
    }) =>
      planMeal(deps, input),
    removeMeal: (input: { member: Member; mealId: string }) =>
      removeMeal(deps, input),
    markMealEaten: (input: { member: Member; mealId: string }) =>
      markMealEaten(deps, input),
    markMealNotEaten: (input: { member: Member; mealId: string }) =>
      markMealNotEaten(deps, input),

    getCarryOverCandidates: (input: { member: Member }) =>
      getCarryOverCandidates(deps, input),
    carryOver: (input: { member: Member; fromStartDate: string; mealIds: string[] }) =>
      carryOver(deps, input),
    dismissCarryOver: (input: { member: Member; fromStartDate: string }) =>
      dismissCarryOver(deps, input),

    listDishes: (input: { member: Member; search?: string; archived?: boolean }) =>
      listDishes(deps.db, input),
    createDish: (input: { member: Member; name: string }) => createDish(deps, input),
    renameDish: (input: { member: Member; dishId: string; name: string }) =>
      renameDish(deps, input),
    archiveDish: (input: { member: Member; dishId: string }) => archiveDish(deps, input),
    unarchiveDish: (input: { member: Member; dishId: string }) =>
      unarchiveDish(deps, input),
  };
}

export type Application = ReturnType<typeof createApplication>;
