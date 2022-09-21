import { context } from "../context";

export const isMaster = () => context.branch === "master";
