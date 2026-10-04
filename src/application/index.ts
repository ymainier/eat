import type { Database } from "../db/client";
import type { Clock } from "./clock";
import type { EmailSender } from "./email";
import { listDishes } from "./dishes";
import { getCurrentMealWeek } from "./get-current-meal-week";
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
export type { DishView } from "./dishes";
export type { MealView, MealWeekView } from "./meal-weeks";
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
    planMeal: (input: { member: Member; dishName: string }) =>
      planMeal(deps, input),
    removeMeal: (input: { member: Member; mealId: string }) =>
      removeMeal(deps, input),
    markMealEaten: (input: { member: Member; mealId: string }) =>
      markMealEaten(deps, input),
    markMealNotEaten: (input: { member: Member; mealId: string }) =>
      markMealNotEaten(deps, input),

    listDishes: (input: { member: Member }) => listDishes(deps.db, input),
  };
}

export type Application = ReturnType<typeof createApplication>;
