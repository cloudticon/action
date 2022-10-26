import { Attribute } from "terraform-generator";
import { Argument } from "terraform-generator/dist/arguments";

export type Input<T> = T | Attribute | Argument;
