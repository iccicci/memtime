export const stages = ["dev", "prod", "test", "unknown"] as const;

export type Stage = (typeof stages)[number];

export interface IConfig {
  /** Current development stage. */
  stage: Stage;
}
